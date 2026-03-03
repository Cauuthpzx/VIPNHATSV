import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { AppError } from "../../errors/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import { decryptSessionCookie, encryptAES, encryptSessionCookie } from "../../utils/crypto.js";
import { fetchUpstream } from "./proxy.client.js";
import { logger } from "../../utils/logger.js";
import type { CreateAgentInput, UpdateAgentInput } from "./proxy.schema.js";

const ACTIVE_AGENTS_CACHE_KEY = "cache:active_agents";
const ACTIVE_AGENTS_CACHE_TTL = 300; // 5 minutes — agent data rarely changes

const RELOGIN_COOLDOWN_SECONDS = 120; // Don't re-login same agent within 2 min
function reloginCooldownKey(agentId: string): string {
  return `proxy:relogin:${agentId}`;
}

export async function getAgentCookie(
  app: FastifyInstance,
  agentId: string,
): Promise<string> {
  const agent = await app.prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new NotFoundError("Agent not found");

  if (!agent.isActive) {
    throw new AppError("Agent is inactive", HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }

  return decryptSessionCookie(agent.sessionCookie);
}

export async function getDefaultAgentCookie(app: FastifyInstance): Promise<string> {
  const agent = await app.prisma.agent.findFirst({
    where: { isActive: true, status: "active" },
    orderBy: { updatedAt: "desc" },
  });

  if (!agent) {
    throw new AppError(
      "No active agent available",
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }

  return decryptSessionCookie(agent.sessionCookie);
}

export async function listAgents(app: FastifyInstance) {
  return app.prisma.agent.findMany({
    select: {
      id: true,
      name: true,
      extUsername: true,
      status: true,
      isActive: true,
      cookieExpires: true,
      lastLoginAt: true,
      loginError: true,
      loginAttempts: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * List active agents with Redis cache (replaces in-memory cache).
 * Falls back to DB query if Redis is unavailable.
 */
export async function listActiveAgents(app: FastifyInstance) {
  // Try Redis cache first
  try {
    const cached = await app.redis.get(ACTIVE_AGENTS_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as Array<{
        id: string;
        name: string;
        extUsername: string;
        sessionCookie: string;
        cookieExpires: Date | null;
      }>;
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  const agents = await app.prisma.agent.findMany({
    where: { isActive: true, status: "active" },
    select: { id: true, name: true, extUsername: true, sessionCookie: true, cookieExpires: true },
    orderBy: { name: "asc" },
  });

  // Store in Redis
  try {
    await app.redis.set(ACTIVE_AGENTS_CACHE_KEY, JSON.stringify(agents), "EX", ACTIVE_AGENTS_CACHE_TTL);
  } catch {
    // Redis write error — ignore
  }

  return agents;
}

/**
 * Check cookie health cho tất cả active agents.
 * Gọi upstream user.html page=1 limit=1 — nếu trả data → cookie OK.
 */
export async function checkCookieHealth(app: FastifyInstance) {
  const agents = await app.prisma.agent.findMany({
    where: { isActive: true, status: "active" },
    select: { id: true, name: true, sessionCookie: true },
    orderBy: { name: "asc" },
  });

  const results: Array<{ id: string; name: string; alive: boolean }> = [];

  await Promise.all(
    agents.map(async (agent) => {
      try {
        const cookie = decryptSessionCookie(agent.sessionCookie);
        await fetchUpstream({
          path: "/agent/user.html",
          cookie,
          params: { page: "1", limit: "1" },
        });
        results.push({ id: agent.id, name: agent.name, alive: true });
      } catch {
        results.push({ id: agent.id, name: agent.name, alive: false });
      }
    }),
  );

  return results;
}

export async function updateAgentCookie(
  app: FastifyInstance,
  agentId: string,
  cookie: string,
  expires?: Date,
) {
  const agent = await app.prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new NotFoundError("Agent not found");

  const result = await app.prisma.agent.update({
    where: { id: agentId },
    data: {
      sessionCookie: cookie,
      cookieExpires: expires,
      status: "active",
    },
  });

  // Invalidate caches when cookie changes
  try { await app.redis.del(ACTIVE_AGENTS_CACHE_KEY); } catch { /* ignore */ }
  await invalidateAgentProxyCache(app, agentId);

  return result;
}

// ---------------------------------------------------------------------------
// Cache invalidation — clear all proxy cache entries for an agent
// ---------------------------------------------------------------------------

/**
 * Delete all proxy cache entries for a specific agent.
 * Uses SCAN (not KEYS) for production safety.
 */
export async function invalidateAgentProxyCache(
  app: FastifyInstance,
  agentId: string,
): Promise<number> {
  try {
    const pattern = `proxy:${agentId}:*`;
    let cursor = "0";
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await app.redis.scan(
        cursor,
        "MATCH", pattern,
        "COUNT", 100,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await app.redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== "0");

    if (deletedCount > 0) {
      logger.info("Invalidated proxy cache", { agentId, deletedCount });
    }
    return deletedCount;
  } catch (err) {
    logger.warn("Failed to invalidate proxy cache", {
      agentId,
      error: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Auto re-login — triggered when session expires during proxy call
// ---------------------------------------------------------------------------

/**
 * Attempt automatic re-login for an agent whose session has expired.
 * Returns the new decrypted cookie on success, null on failure.
 * Uses Redis cooldown to prevent stampede (multiple requests all trying to re-login).
 */
export async function attemptAutoRelogin(
  app: FastifyInstance,
  agentId: string,
): Promise<string | null> {
  // Check cooldown
  try {
    const existing = await app.redis.get(reloginCooldownKey(agentId));
    if (existing) {
      logger.debug("Auto re-login skipped (cooldown)", { agentId });
      return null;
    }
  } catch { /* fail-open */ }

  // Set cooldown BEFORE attempt (prevents parallel re-logins)
  try {
    await app.redis.set(reloginCooldownKey(agentId), "1", "EX", RELOGIN_COOLDOWN_SECONDS);
  } catch { /* fail-open */ }

  try {
    // Dynamic import to avoid circular dependency
    const { loginAgent } = await import("../ee88-auth/login-engine.js");

    logger.info("Auto re-login triggered", { agentId });
    const result = await loginAgent(app, agentId, "auto-relogin");

    if (result.success) {
      // Fetch the new cookie
      const agent = await app.prisma.agent.findUnique({
        where: { id: agentId },
        select: { sessionCookie: true },
      });

      if (agent?.sessionCookie) {
        // Invalidate stale proxy cache
        await invalidateAgentProxyCache(app, agentId);
        return decryptSessionCookie(agent.sessionCookie);
      }
    }

    return null;
  } catch (err) {
    logger.warn("Auto re-login failed", {
      agentId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// --- Agent CRUD ---

/** Select fields safe to return (no extPassword, no sessionCookie) */
const SAFE_SELECT = {
  id: true,
  name: true,
  extUsername: true,
  baseUrl: true,
  status: true,
  isActive: true,
  cookieExpires: true,
  lastLoginAt: true,
  loginError: true,
  loginAttempts: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getAgent(app: FastifyInstance, agentId: string) {
  const agent = await app.prisma.agent.findUnique({
    where: { id: agentId },
    select: SAFE_SELECT,
  });
  if (!agent) throw new NotFoundError("Agent không tồn tại");
  return agent;
}

export async function createAgent(app: FastifyInstance, input: CreateAgentInput) {
  // Check unique ext_username
  const existing = await app.prisma.agent.findUnique({
    where: { extUsername: input.extUsername },
  });
  if (existing) {
    throw new AppError(
      `Username ee88 "${input.extUsername}" đã tồn tại`,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.CONFLICT,
    );
  }

  const agent = await app.prisma.agent.create({
    data: {
      name: input.name,
      extUsername: input.extUsername,
      extPassword: encryptAES(input.extPassword),
      baseUrl: input.baseUrl ?? null,
      sessionCookie: "",
      status: "offline",
    },
    select: SAFE_SELECT,
  });

  logger.info({ agentId: agent.id, name: input.name }, "Agent đã được tạo");
  return agent;
}

export async function updateAgent(app: FastifyInstance, agentId: string, input: UpdateAgentInput) {
  const existing = await app.prisma.agent.findUnique({ where: { id: agentId } });
  if (!existing) throw new NotFoundError("Agent không tồn tại");

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.baseUrl !== undefined) data.baseUrl = input.baseUrl;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.extPassword !== undefined) data.extPassword = encryptAES(input.extPassword);

  if (Object.keys(data).length === 0) {
    return getAgent(app, agentId);
  }

  const agent = await app.prisma.agent.update({
    where: { id: agentId },
    data,
    select: SAFE_SELECT,
  });

  // Invalidate cache
  try { await app.redis.del(ACTIVE_AGENTS_CACHE_KEY); } catch { /* ignore */ }

  logger.info({ agentId }, "Agent đã được cập nhật");
  return agent;
}

export async function deactivateAgent(app: FastifyInstance, agentId: string) {
  const existing = await app.prisma.agent.findUnique({ where: { id: agentId } });
  if (!existing) throw new NotFoundError("Agent không tồn tại");

  await app.prisma.agent.update({
    where: { id: agentId },
    data: { isActive: false, status: "offline" },
  });

  // Invalidate cache
  try { await app.redis.del(ACTIVE_AGENTS_CACHE_KEY); } catch { /* ignore */ }

  logger.info({ agentId }, "Agent đã bị vô hiệu hoá");
}

export async function destroyAgent(app: FastifyInstance, agentId: string) {
  const existing = await app.prisma.agent.findUnique({ where: { id: agentId } });
  if (!existing) throw new NotFoundError("Agent không tồn tại");

  await app.prisma.agent.delete({ where: { id: agentId } });

  // Invalidate cache
  try { await app.redis.del(ACTIVE_AGENTS_CACHE_KEY); } catch { /* ignore */ }

  logger.info({ agentId }, "Agent đã bị xoá vĩnh viễn");
}

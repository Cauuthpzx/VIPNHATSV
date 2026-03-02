import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { AppError } from "../../errors/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import { decryptSessionCookie } from "../../utils/crypto.js";
import { fetchUpstream } from "./proxy.client.js";
import { logger } from "../../utils/logger.js";

const ACTIVE_AGENTS_CACHE_KEY = "cache:active_agents";
const ACTIVE_AGENTS_CACHE_TTL = 30; // 30 seconds

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
        sessionCookie: string;
        cookieExpires: Date | null;
      }>;
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  const agents = await app.prisma.agent.findMany({
    where: { isActive: true, status: "active" },
    select: { id: true, name: true, sessionCookie: true, cookieExpires: true },
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

  // Invalidate cache when agent data changes
  try {
    await app.redis.del(ACTIVE_AGENTS_CACHE_KEY);
  } catch {
    logger.warn("Failed to invalidate agent cache");
  }

  return result;
}

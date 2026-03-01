import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { AppError } from "../../errors/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import { decryptSessionCookie } from "../../utils/crypto.js";

export async function getAgentCookie(
  app: FastifyInstance,
  agentId: string,
): Promise<string> {
  const agent = await app.prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new NotFoundError("Agent not found");

  if (!agent.isActive) {
    throw new AppError("Agent is inactive", HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }

  if (agent.cookieExpires && agent.cookieExpires < new Date()) {
    throw new AppError(
      "Agent session expired",
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AGENT_SESSION_EXPIRED,
    );
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

// In-memory cache for active agents list (avoid DB query per request)
let _activeAgentsCache: {
  data: Array<{ id: string; name: string; sessionCookie: string; cookieExpires: Date | null }>;
  ts: number;
} | null = null;
const ACTIVE_AGENTS_CACHE_MS = 30_000; // 30s

export async function listActiveAgents(app: FastifyInstance) {
  if (_activeAgentsCache && Date.now() - _activeAgentsCache.ts < ACTIVE_AGENTS_CACHE_MS) {
    return _activeAgentsCache.data;
  }
  const agents = await app.prisma.agent.findMany({
    where: { isActive: true, status: "active" },
    select: { id: true, name: true, sessionCookie: true, cookieExpires: true },
    orderBy: { name: "asc" },
  });
  _activeAgentsCache = { data: agents, ts: Date.now() };
  return agents;
}

export async function updateAgentCookie(
  app: FastifyInstance,
  agentId: string,
  cookie: string,
  expires?: Date,
) {
  const agent = await app.prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new NotFoundError("Agent not found");

  return app.prisma.agent.update({
    where: { id: agentId },
    data: {
      sessionCookie: cookie,
      cookieExpires: expires,
      status: "active",
    },
  });
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authorize } from "../../middlewares/authorize.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { sendSuccess } from "../../utils/response.js";
import {
  loginAgent,
  logoutAgent,
  loginAllAgents,
  checkAgentSession,
  getSessionInfo,
  setCookieManual,
} from "./login-engine.js";

export async function ee88AuthRoutes(app: FastifyInstance) {
  // All routes require authentication + sync:write permission
  app.addHook("preHandler", app.authenticate);

  // POST /ee88-auth/:id/login — Login single agent
  app.post(
    "/:id/login",
    { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const ip = request.ip;
      const result = await loginAgent(app, id, "manual", ip);
      return sendSuccess(reply, result);
    },
  );

  // POST /ee88-auth/:id/logout — Logout single agent
  app.post(
    "/:id/logout",
    { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      await logoutAgent(app, id);
      return sendSuccess(reply, null);
    },
  );

  // POST /ee88-auth/login-all — Login all offline/error agents
  app.post(
    "/login-all",
    { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const ip = request.ip;
      const result = await loginAllAgents(app, "manual", ip);
      return sendSuccess(reply, result);
    },
  );

  // POST /ee88-auth/:id/check — Check agent session validity
  app.post(
    "/:id/check",
    { preHandler: [authorize(PERMISSIONS.SYNC_READ)] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const result = await checkAgentSession(app, id);
      return sendSuccess(reply, result);
    },
  );

  // GET /ee88-auth/:id/session — Get session info
  app.get(
    "/:id/session",
    { preHandler: [authorize(PERMISSIONS.SYNC_READ)] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const result = await getSessionInfo(app, id);
      return sendSuccess(reply, result);
    },
  );

  // PATCH /ee88-auth/:id/cookie — Set cookie manually
  app.patch(
    "/:id/cookie",
    { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: { cookie: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const { cookie } = request.body;
      if (!cookie) {
        return reply.status(400).send({ success: false, message: "Cookie is required" });
      }
      await setCookieManual(app, id, cookie);
      return sendSuccess(reply, null);
    },
  );

  // GET /ee88-auth/login-history/:id — Get login history for agent
  app.get(
    "/login-history/:id",
    { preHandler: [authorize(PERMISSIONS.SYNC_READ)] },
    async (
      request: FastifyRequest<{ Params: { id: string }; Querystring: { limit?: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const limit = Math.min(Number(request.query.limit) || 20, 100);
      const history = await app.prisma.agentLoginHistory.findMany({
        where: { agentId: id },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return sendSuccess(reply, history);
    },
  );
}

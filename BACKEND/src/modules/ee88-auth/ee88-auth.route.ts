import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authorize } from "../../middlewares/authorize.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { sendSuccess } from "../../utils/response.js";
import { ValidationError } from "../../errors/ValidationError.js";
import {
  loginAgent,
  logoutAgent,
  loginAllAgents,
  checkAgentSession,
  getSessionInfo,
  setCookieManual,
} from "./login-engine.js";
import {
  agentIdParamsSchema,
  setCookieBodySchema,
  loginHistoryQuerySchema,
} from "./ee88-auth.schema.js";

export async function ee88AuthRoutes(app: FastifyInstance) {
  // All routes require authentication + sync:write permission
  app.addHook("preHandler", app.authenticate);

  // POST /ee88-auth/:id/login — Login single agent
  app.post(
    "/:id/login",
    { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = agentIdParamsSchema.safeParse(request.params);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);
      const { id } = parsed.data;
      const ip = request.ip;
      const result = await loginAgent(app, id, "manual", ip);
      return sendSuccess(reply, result);
    },
  );

  // POST /ee88-auth/:id/logout — Logout single agent
  app.post(
    "/:id/logout",
    { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = agentIdParamsSchema.safeParse(request.params);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);
      const { id } = parsed.data;
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
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = agentIdParamsSchema.safeParse(request.params);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);
      const { id } = parsed.data;
      const result = await checkAgentSession(app, id);
      return sendSuccess(reply, result);
    },
  );

  // GET /ee88-auth/:id/session — Get session info
  app.get(
    "/:id/session",
    { preHandler: [authorize(PERMISSIONS.SYNC_READ)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = agentIdParamsSchema.safeParse(request.params);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);
      const { id } = parsed.data;
      const result = await getSessionInfo(app, id);
      return sendSuccess(reply, result);
    },
  );

  // PATCH /ee88-auth/:id/cookie — Set cookie manually
  app.patch(
    "/:id/cookie",
    { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsParsed = agentIdParamsSchema.safeParse(request.params);
      if (!paramsParsed.success) throw new ValidationError(paramsParsed.error.errors[0].message);
      const bodyParsed = setCookieBodySchema.safeParse(request.body);
      if (!bodyParsed.success) throw new ValidationError(bodyParsed.error.errors[0].message);

      const { id } = paramsParsed.data;
      const { cookie } = bodyParsed.data;
      await setCookieManual(app, id, cookie);
      return sendSuccess(reply, null);
    },
  );

  // GET /ee88-auth/login-history/:id — Get login history for agent
  app.get(
    "/login-history/:id",
    { preHandler: [authorize(PERMISSIONS.SYNC_READ)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsParsed = agentIdParamsSchema.safeParse(request.params);
      if (!paramsParsed.success) throw new ValidationError(paramsParsed.error.errors[0].message);
      const queryParsed = loginHistoryQuerySchema.safeParse(request.query);
      if (!queryParsed.success) throw new ValidationError(queryParsed.error.errors[0].message);

      const { id } = paramsParsed.data;
      const { limit } = queryParsed.data;
      const history = await app.prisma.agentLoginHistory.findMany({
        where: { agentId: id },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return sendSuccess(reply, history);
    },
  );
}

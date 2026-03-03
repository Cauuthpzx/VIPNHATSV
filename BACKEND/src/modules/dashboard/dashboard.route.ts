import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { sendSuccess } from "../../utils/response.js";
import { ValidationError } from "../../errors/ValidationError.js";
import { getDashboardSummary, getOnlineMembers } from "./dashboard.service.js";
import { getActivityFeed, getSettings, saveSettings } from "./dashboard-activity.service.js";

const summaryQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const onlineMembersSchema = z.object({
  agentId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const settingsSchema = z.object({
  pollInterval: z.number().int().min(0).max(600).optional(),
  bigDepositMin: z.number().min(0).optional(),
  bigWithdrawMin: z.number().min(0).optional(),
});

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  // GET /dashboard/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  app.get(
    "/summary",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = summaryQuerySchema.safeParse(request.query);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);
      const userId = (request as any).user.userId;
      const summary = await getDashboardSummary(app, userId, parsed.data.startDate, parsed.data.endDate);
      return sendSuccess(reply, summary);
    },
  );

  // GET /dashboard/online-members?agentId=xxx&date=YYYY-MM-DD
  app.get(
    "/online-members",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = onlineMembersSchema.safeParse(request.query);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);
      const members = await getOnlineMembers(app, parsed.data.agentId, parsed.data.date);
      return sendSuccess(reply, members);
    },
  );

  // GET /dashboard/activity — unified activity feed (separate from bell notifications)
  app.get(
    "/activity",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.userId;
      const feed = await getActivityFeed(app, userId);
      return sendSuccess(reply, feed);
    },
  );

  // GET /dashboard/settings — get user's dashboard preferences
  app.get(
    "/settings",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.userId;
      const settings = await getSettings(app, userId);
      return sendSuccess(reply, settings);
    },
  );

  // PUT /dashboard/settings — save user's dashboard preferences
  app.put(
    "/settings",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = settingsSchema.safeParse(request.body);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

      const userId = (request as any).user.userId;
      const settings = await saveSettings(app, userId, parsed.data);
      return sendSuccess(reply, settings);
    },
  );
}

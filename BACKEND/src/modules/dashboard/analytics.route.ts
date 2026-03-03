import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { sendSuccess } from "../../utils/response.js";
import { ValidationError } from "../../errors/ValidationError.js";
import {
  getFinanceAnalytics,
  getBettingAnalytics,
  getMemberAnalytics,
  getAgentPerformance,
} from "./analytics.service.js";
import { revenueRoutes } from "./revenue.route.js";
import { oldCustomerRoutes } from "./old-customer.route.js";

const daysQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(90).default(30),
});

export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  // GET /analytics/finance?days=30
  app.get(
    "/finance",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = daysQuerySchema.safeParse(request.query);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);
      const data = await getFinanceAnalytics(app, parsed.data.days);
      return sendSuccess(reply, data);
    },
  );

  // GET /analytics/betting?days=30
  app.get(
    "/betting",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = daysQuerySchema.safeParse(request.query);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);
      const data = await getBettingAnalytics(app, parsed.data.days);
      return sendSuccess(reply, data);
    },
  );

  // GET /analytics/members
  app.get(
    "/members",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const data = await getMemberAnalytics(app);
      return sendSuccess(reply, data);
    },
  );

  // GET /analytics/agents?days=30
  app.get(
    "/agents",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = daysQuerySchema.safeParse(request.query);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);
      const data = await getAgentPerformance(app, parsed.data.days);
      return sendSuccess(reply, data);
    },
  );

  // Revenue sub-routes: /analytics/revenue/*
  await app.register(revenueRoutes);

  // Old customer sub-routes: /analytics/old-customers/*
  await app.register(oldCustomerRoutes);
}

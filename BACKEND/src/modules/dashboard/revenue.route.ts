import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { sendSuccess } from "../../utils/response.js";
import { ValidationError } from "../../errors/ValidationError.js";
import {
  processCustomerUpload,
  getRevenueSummary,
  getRevenueExportData,
} from "./revenue.service.js";

const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
});

export async function revenueRoutes(app: FastifyInstance) {
  // POST /revenue/upload-customers — upload Excel file
  app.post(
    "/revenue/upload-customers",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const file = await request.file();
      if (!file) {
        throw new ValidationError("No file uploaded");
      }

      const buffer = await file.toBuffer();
      const result = await processCustomerUpload(app, buffer);
      return sendSuccess(reply, result);
    },
  );

  // GET /revenue?month=2026-02 — summary per employee
  app.get(
    "/revenue",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = monthQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }
      const data = await getRevenueSummary(app, parsed.data.month);
      return sendSuccess(reply, data);
    },
  );

  // GET /revenue/export?month=2026-02 — full data for XLSX generation
  app.get(
    "/revenue/export",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = monthQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }
      const data = await getRevenueExportData(app, parsed.data.month);
      return sendSuccess(reply, data);
    },
  );

  // GET /revenue/employees — list all employees with customer count
  app.get(
    "/revenue/employees",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const employees = await app.prisma.employee.findMany({
        include: { _count: { select: { customers: true } } },
        orderBy: { name: "asc" },
      });
      return sendSuccess(reply, employees);
    },
  );
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { sendSuccess } from "../../utils/response.js";
import { ValidationError } from "../../errors/ValidationError.js";
import {
  processOldCustomerUpload,
  getOldCustomerList,
  getOldCustomerSummary,
  exportOldCustomers,
  addNoteCustomers,
} from "./old-customer.service.js";

const noteCustomerSchema = z.object({
  customers: z.array(
    z.object({
      assignedDate: z.string(),
      employeeName: z.string().default(""),
      agentCode: z.string().default(""),
      username: z.string().min(1),
      contactInfo: z.string().default(""),
      source: z.string().default(""),
      referralAccount: z.string().default(""),
      firstDeposit: z.number().nullable().default(null),
    }),
  ).min(1),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  employee: z.string().optional(),
  agentCode: z.string().optional(),
  source: z.string().optional(),
  search: z.string().optional(),
});

export async function oldCustomerRoutes(app: FastifyInstance) {
  // POST /old-customers/upload — upload KHÁCH HÀNG.xlsx
  app.post(
    "/old-customers/upload",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const file = await request.file();
      if (!file) {
        throw new ValidationError("No file uploaded");
      }
      const buffer = await file.toBuffer();
      const result = await processOldCustomerUpload(app, buffer);
      return sendSuccess(reply, result);
    },
  );

  // POST /old-customers/note — thêm KH từ text paste (note)
  app.post(
    "/old-customers/note",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = noteCustomerSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }
      const result = await addNoteCustomers(app, parsed.data.customers);
      return sendSuccess(reply, result);
    },
  );

  // GET /old-customers?page=1&limit=50&employee=...&search=...
  app.get(
    "/old-customers",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }
      const data = await getOldCustomerList(app, parsed.data);
      return sendSuccess(reply, data);
    },
  );

  // GET /old-customers/summary — thống kê tổng quát
  app.get(
    "/old-customers/summary",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const data = await getOldCustomerSummary(app);
      return sendSuccess(reply, data);
    },
  );

  // GET /old-customers/export — xuất toàn bộ (không phân trang)
  app.get(
    "/old-customers/export",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const q = request.query as Record<string, string>;
      const data = await exportOldCustomers(app, {
        employee: q.employee || undefined,
        agentCode: q.agentCode || undefined,
        search: q.search || undefined,
      });
      return sendSuccess(reply, data);
    },
  );
}

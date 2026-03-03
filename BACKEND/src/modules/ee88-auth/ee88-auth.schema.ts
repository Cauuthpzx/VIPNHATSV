import { z } from "zod";

export const agentIdParamsSchema = z.object({
  id: z.string().min(1, "Agent ID is required"),
});

export const setCookieBodySchema = z.object({
  cookie: z.string().min(1, "Cookie is required"),
});

export const loginHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AgentIdParams = z.infer<typeof agentIdParamsSchema>;
export type SetCookieBody = z.infer<typeof setCookieBodySchema>;
export type LoginHistoryQuery = z.infer<typeof loginHistoryQuerySchema>;

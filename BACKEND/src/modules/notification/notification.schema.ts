import { z } from "zod";

export const listNotificationsSchema = z.object({
  unread: z.enum(["true", "false", "1", "0"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const markAsReadSchema = z.object({
  ids: z.array(z.string().min(1)).optional(),
  all: z.boolean().optional(),
});

export const memberDetailParamsSchema = z.object({
  agentId: z.string().min(1, "agentId is required"),
  username: z.string().min(1, "username is required"),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
export type MarkAsReadBody = z.infer<typeof markAsReadSchema>;
export type MemberDetailParams = z.infer<typeof memberDetailParamsSchema>;

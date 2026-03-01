import { z } from "zod";

const roleTypeEnum = z.enum(["ADMIN", "MANAGER", "VIEWER"]);

export const createRoleSchema = z.object({
  name: z.string().min(1),
  type: roleTypeEnum,
  level: z.number().int().min(0).max(100),
  permissions: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  type: roleTypeEnum.optional(),
  level: z.number().int().min(0).max(100).optional(),
  permissions: z.array(z.string()).optional(),
});

export const roleParamsSchema = z.object({
  id: z.string().min(1),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleParams = z.infer<typeof roleParamsSchema>;

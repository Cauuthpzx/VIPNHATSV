import { z } from "zod";
import { PERMISSIONS, ALL_PERMISSIONS } from "../../constants/permissions.js";

const roleTypeEnum = z.enum(["ADMIN", "MANAGER", "VIEWER"]);

const validPermissions = new Set([
  ALL_PERMISSIONS,
  ...Object.values(PERMISSIONS),
]);

const permissionSchema = z
  .array(z.string())
  .refine(
    (perms) => perms.every((p) => validPermissions.has(p)),
    { message: "Chứa permission không hợp lệ" },
  );

export const createRoleSchema = z.object({
  name: z.string().min(1),
  type: roleTypeEnum,
  level: z.number().int().min(0).max(100),
  permissions: permissionSchema.default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  type: roleTypeEnum.optional(),
  level: z.number().int().min(0).max(100).optional(),
  permissions: permissionSchema.optional(),
});

export const roleParamsSchema = z.object({
  id: z.string().min(1),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleParams = z.infer<typeof roleParamsSchema>;

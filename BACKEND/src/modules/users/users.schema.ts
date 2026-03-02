import { z } from "zod";
import { strongPasswordSchema } from "../auth/auth.schema.js";

export const createUserSchema = z.object({
  username: z
    .string()
    .min(4, "Tài khoản phải có ít nhất 4 ký tự")
    .max(30, "Tài khoản tối đa 30 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Tài khoản chỉ được chứa chữ cái, số và _"),
  email: z.string().email().optional().or(z.literal("")),
  password: strongPasswordSchema,
  name: z.string().min(1),
  roleId: z.string().min(1),
});

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(4)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  email: z.string().email().optional().or(z.literal("")),
  name: z.string().min(1).optional(),
  roleId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const userParamsSchema = z.object({
  id: z.string().min(1),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;

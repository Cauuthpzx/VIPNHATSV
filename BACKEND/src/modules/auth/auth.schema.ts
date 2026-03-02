import { z } from "zod";

// Strong password: min 8 chars, uppercase, lowercase, number, special char
export const strongPasswordSchema = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
  .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
  .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 số")
  .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt");

export const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tài khoản"),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(4, "Tài khoản phải có ít nhất 4 ký tự")
    .max(30, "Tài khoản tối đa 30 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Tài khoản chỉ được chứa chữ cái, số và _"),
  password: strongPasswordSchema,
  name: z.string().min(1, "Tên không được để trống").max(100),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: strongPasswordSchema,
});

export const changeFundPasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: strongPasswordSchema,
});

export const sessionIdParamSchema = z.object({
  id: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangeFundPasswordInput = z.infer<typeof changeFundPasswordSchema>;

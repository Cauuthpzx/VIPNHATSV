import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
  changeFundPasswordSchema,
  sessionIdParamSchema,
  strongPasswordSchema,
} from "../src/modules/auth/auth.schema.js";

// ── strongPasswordSchema ─────────────────────────────────────
describe("strongPasswordSchema", () => {
  it("should accept a strong password", () => {
    expect(strongPasswordSchema.safeParse("Abcdef1!").success).toBe(true);
    expect(strongPasswordSchema.safeParse("MyP@ss1234").success).toBe(true);
  });

  it("should reject password shorter than 8 chars", () => {
    const result = strongPasswordSchema.safeParse("Ab1!xyz");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("8");
  });

  it("should reject password without uppercase", () => {
    const result = strongPasswordSchema.safeParse("abcdef1!");
    expect(result.success).toBe(false);
  });

  it("should reject password without lowercase", () => {
    const result = strongPasswordSchema.safeParse("ABCDEF1!");
    expect(result.success).toBe(false);
  });

  it("should reject password without number", () => {
    const result = strongPasswordSchema.safeParse("Abcdefg!");
    expect(result.success).toBe(false);
  });

  it("should reject password without special char", () => {
    const result = strongPasswordSchema.safeParse("Abcdef12");
    expect(result.success).toBe(false);
  });
});

// ── loginSchema ──────────────────────────────────────────────
describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "pass123" });
    expect(result.success).toBe(true);
  });

  it("should reject empty username", () => {
    const result = loginSchema.safeParse({ username: "", password: "pass123" });
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "" });
    expect(result.success).toBe(false);
  });

  it("should reject missing fields", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
    expect(loginSchema.safeParse({ username: "admin" }).success).toBe(false);
    expect(loginSchema.safeParse({ password: "pass" }).success).toBe(false);
  });
});

// ── registerSchema ───────────────────────────────────────────
describe("registerSchema", () => {
  const validRegister = {
    username: "newuser",
    password: "StrongP@ss1",
    name: "New User",
  };

  it("should accept valid registration", () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });

  it("should accept registration with optional email", () => {
    const result = registerSchema.safeParse({ ...validRegister, email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("should accept empty string email", () => {
    const result = registerSchema.safeParse({ ...validRegister, email: "" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const result = registerSchema.safeParse({ ...validRegister, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("should reject username shorter than 4 chars", () => {
    const result = registerSchema.safeParse({ ...validRegister, username: "abc" });
    expect(result.success).toBe(false);
  });

  it("should reject username longer than 30 chars", () => {
    const result = registerSchema.safeParse({ ...validRegister, username: "a".repeat(31) });
    expect(result.success).toBe(false);
  });

  it("should reject username with special characters", () => {
    expect(registerSchema.safeParse({ ...validRegister, username: "user@name" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegister, username: "user name" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegister, username: "user-name" }).success).toBe(false);
  });

  it("should accept username with underscore", () => {
    expect(registerSchema.safeParse({ ...validRegister, username: "user_name" }).success).toBe(true);
  });

  it("should reject weak password in registration", () => {
    const result = registerSchema.safeParse({ ...validRegister, password: "weak" });
    expect(result.success).toBe(false);
  });

  it("should reject empty name", () => {
    const result = registerSchema.safeParse({ ...validRegister, name: "" });
    expect(result.success).toBe(false);
  });

  it("should reject name longer than 100 chars", () => {
    const result = registerSchema.safeParse({ ...validRegister, name: "x".repeat(101) });
    expect(result.success).toBe(false);
  });
});

// ── refreshSchema ────────────────────────────────────────────
describe("refreshSchema", () => {
  it("should accept valid refresh token", () => {
    expect(refreshSchema.safeParse({ refreshToken: "abc-123" }).success).toBe(true);
  });

  it("should reject empty refresh token", () => {
    expect(refreshSchema.safeParse({ refreshToken: "" }).success).toBe(false);
  });

  it("should reject missing refresh token", () => {
    expect(refreshSchema.safeParse({}).success).toBe(false);
  });
});

// ── updateProfileSchema ──────────────────────────────────────
describe("updateProfileSchema", () => {
  it("should accept valid name", () => {
    expect(updateProfileSchema.safeParse({ name: "John" }).success).toBe(true);
  });

  it("should reject empty name", () => {
    expect(updateProfileSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("should reject name longer than 100 chars", () => {
    expect(updateProfileSchema.safeParse({ name: "x".repeat(101) }).success).toBe(false);
  });
});

// ── changePasswordSchema ─────────────────────────────────────
describe("changePasswordSchema", () => {
  it("should accept valid password change", () => {
    const result = changePasswordSchema.safeParse({
      oldPassword: "OldP@ss1",
      newPassword: "NewP@ss1",
    });
    expect(result.success).toBe(true);
  });

  it("should reject weak new password", () => {
    const result = changePasswordSchema.safeParse({
      oldPassword: "anything",
      newPassword: "weak",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing old password", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "NewP@ss1",
    });
    expect(result.success).toBe(false);
  });
});

// ── changeFundPasswordSchema ─────────────────────────────────
describe("changeFundPasswordSchema", () => {
  it("should accept new fund password without old (first time)", () => {
    const result = changeFundPasswordSchema.safeParse({
      newPassword: "NewP@ss1",
    });
    expect(result.success).toBe(true);
  });

  it("should accept with old password", () => {
    const result = changeFundPasswordSchema.safeParse({
      oldPassword: "OldP@ss1",
      newPassword: "NewP@ss1",
    });
    expect(result.success).toBe(true);
  });

  it("should reject weak fund password", () => {
    const result = changeFundPasswordSchema.safeParse({
      newPassword: "1234",
    });
    expect(result.success).toBe(false);
  });
});

// ── sessionIdParamSchema ─────────────────────────────────────
describe("sessionIdParamSchema", () => {
  it("should accept valid session id", () => {
    expect(sessionIdParamSchema.safeParse({ id: "cuid123" }).success).toBe(true);
  });

  it("should reject empty id", () => {
    expect(sessionIdParamSchema.safeParse({ id: "" }).success).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  createUserSchema,
  updateUserSchema,
  userParamsSchema,
  userQuerySchema,
} from "../src/modules/users/users.schema.js";

// ── createUserSchema ─────────────────────────────────────────
describe("createUserSchema", () => {
  const validInput = {
    username: "newadmin",
    password: "StrongP@ss1",
    name: "New Admin",
    roleId: "role-1",
  };

  it("should accept valid input", () => {
    expect(createUserSchema.safeParse(validInput).success).toBe(true);
  });

  it("should accept with optional email", () => {
    expect(createUserSchema.safeParse({ ...validInput, email: "a@b.com" }).success).toBe(true);
  });

  it("should accept empty string email", () => {
    expect(createUserSchema.safeParse({ ...validInput, email: "" }).success).toBe(true);
  });

  it("should reject username shorter than 4", () => {
    expect(createUserSchema.safeParse({ ...validInput, username: "ab" }).success).toBe(false);
  });

  it("should reject username with special chars", () => {
    expect(createUserSchema.safeParse({ ...validInput, username: "user@name" }).success).toBe(false);
  });

  it("should reject weak password", () => {
    expect(createUserSchema.safeParse({ ...validInput, password: "1234" }).success).toBe(false);
  });

  it("should reject missing roleId", () => {
    const { roleId, ...noRole } = validInput;
    expect(createUserSchema.safeParse(noRole).success).toBe(false);
  });
});

// ── updateUserSchema ─────────────────────────────────────────
describe("updateUserSchema", () => {
  it("should accept partial update (name only)", () => {
    expect(updateUserSchema.safeParse({ name: "New Name" }).success).toBe(true);
  });

  it("should accept partial update (isActive only)", () => {
    expect(updateUserSchema.safeParse({ isActive: false }).success).toBe(true);
  });

  it("should accept empty object", () => {
    expect(updateUserSchema.safeParse({}).success).toBe(true);
  });

  it("should reject invalid username", () => {
    expect(updateUserSchema.safeParse({ username: "ab" }).success).toBe(false);
  });

  it("should reject invalid email format", () => {
    expect(updateUserSchema.safeParse({ email: "not-email" }).success).toBe(false);
  });

  it("should accept empty email string", () => {
    expect(updateUserSchema.safeParse({ email: "" }).success).toBe(true);
  });
});

// ── userParamsSchema ─────────────────────────────────────────
describe("userParamsSchema", () => {
  it("should accept valid id", () => {
    expect(userParamsSchema.safeParse({ id: "cuid123" }).success).toBe(true);
  });

  it("should reject empty id", () => {
    expect(userParamsSchema.safeParse({ id: "" }).success).toBe(false);
  });
});

// ── userQuerySchema ──────────────────────────────────────────
describe("userQuerySchema", () => {
  it("should provide defaults for page and limit", () => {
    const result = userQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("should coerce string numbers", () => {
    const result = userQuerySchema.safeParse({ page: "3", limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("should reject page < 1", () => {
    expect(userQuerySchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it("should reject limit > 100", () => {
    expect(userQuerySchema.safeParse({ limit: 200 }).success).toBe(false);
  });

  it("should accept optional search", () => {
    const result = userQuerySchema.safeParse({ search: "john" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("john");
    }
  });
});

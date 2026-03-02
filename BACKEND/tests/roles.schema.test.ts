import { describe, it, expect } from "vitest";
import {
  createRoleSchema,
  updateRoleSchema,
  roleParamsSchema,
} from "../src/modules/roles/roles.schema.js";

// ── createRoleSchema ─────────────────────────────────────────
describe("createRoleSchema", () => {
  const validInput = {
    name: "Editor",
    type: "MANAGER" as const,
    level: 50,
  };

  it("should accept valid input", () => {
    expect(createRoleSchema.safeParse(validInput).success).toBe(true);
  });

  it("should default permissions to empty array", () => {
    const result = createRoleSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.permissions).toEqual([]);
    }
  });

  it("should accept with permissions", () => {
    const result = createRoleSchema.safeParse({
      ...validInput,
      permissions: ["users:read", "users:write"],
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid type enum", () => {
    expect(createRoleSchema.safeParse({ ...validInput, type: "SUPERADMIN" }).success).toBe(false);
  });

  it("should accept all valid role types", () => {
    for (const type of ["ADMIN", "MANAGER", "VIEWER"] as const) {
      expect(createRoleSchema.safeParse({ ...validInput, type }).success).toBe(true);
    }
  });

  it("should reject empty name", () => {
    expect(createRoleSchema.safeParse({ ...validInput, name: "" }).success).toBe(false);
  });

  it("should reject level < 0", () => {
    expect(createRoleSchema.safeParse({ ...validInput, level: -1 }).success).toBe(false);
  });

  it("should reject level > 100", () => {
    expect(createRoleSchema.safeParse({ ...validInput, level: 101 }).success).toBe(false);
  });

  it("should reject non-integer level", () => {
    expect(createRoleSchema.safeParse({ ...validInput, level: 50.5 }).success).toBe(false);
  });
});

// ── updateRoleSchema ─────────────────────────────────────────
describe("updateRoleSchema", () => {
  it("should accept partial update (name only)", () => {
    expect(updateRoleSchema.safeParse({ name: "Updated" }).success).toBe(true);
  });

  it("should accept partial update (level only)", () => {
    expect(updateRoleSchema.safeParse({ level: 75 }).success).toBe(true);
  });

  it("should accept partial update (permissions only)", () => {
    const result = updateRoleSchema.safeParse({ permissions: ["users:read"] });
    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    expect(updateRoleSchema.safeParse({}).success).toBe(true);
  });

  it("should reject empty name string", () => {
    expect(updateRoleSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("should reject invalid type", () => {
    expect(updateRoleSchema.safeParse({ type: "INVALID" }).success).toBe(false);
  });
});

// ── roleParamsSchema ─────────────────────────────────────────
describe("roleParamsSchema", () => {
  it("should accept valid id", () => {
    expect(roleParamsSchema.safeParse({ id: "role-123" }).success).toBe(true);
  });

  it("should reject empty id", () => {
    expect(roleParamsSchema.safeParse({ id: "" }).success).toBe(false);
  });
});

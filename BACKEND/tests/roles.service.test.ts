import { describe, it, expect, vi, beforeEach } from "vitest";

const { listRoles, getRoleById, createRole, updateRole, deleteRole } = await import(
  "../src/modules/roles/roles.service.js"
);

// ── Helpers ──────────────────────────────────────────────────
function createMockApp() {
  return {
    prisma: {
      role: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        count: vi.fn().mockResolvedValue(0),
      },
    },
  } as any;
}

const mockRole = {
  id: "role-1",
  name: "Admin",
  type: "ADMIN",
  level: 100,
  permissions: ["*"],
};

// ── listRoles ────────────────────────────────────────────────
describe("listRoles", () => {
  it("should return all roles ordered by level desc", async () => {
    const app = createMockApp();
    app.prisma.role.findMany.mockResolvedValue([mockRole]);

    const roles = await listRoles(app);

    expect(roles).toEqual([mockRole]);
    expect(app.prisma.role.findMany).toHaveBeenCalledWith({
      orderBy: { level: "desc" },
    });
  });
});

// ── getRoleById ──────────────────────────────────────────────
describe("getRoleById", () => {
  it("should return role when found", async () => {
    const app = createMockApp();
    app.prisma.role.findUnique.mockResolvedValue(mockRole);

    const role = await getRoleById(app, "role-1");

    expect(role).toEqual(mockRole);
    expect(app.prisma.role.findUnique).toHaveBeenCalledWith({
      where: { id: "role-1" },
    });
  });

  it("should throw NotFoundError when not found", async () => {
    const app = createMockApp();
    app.prisma.role.findUnique.mockResolvedValue(null);

    await expect(getRoleById(app, "nonexistent")).rejects.toThrow("Role not found");
  });
});

// ── createRole ───────────────────────────────────────────────
describe("createRole", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
  });

  it("should create role with valid input", async () => {
    app.prisma.role.findUnique.mockResolvedValue(null); // no conflict
    app.prisma.role.create.mockResolvedValue(mockRole);

    const role = await createRole(app, {
      name: "Admin",
      type: "ADMIN",
      level: 100,
      permissions: ["*"],
    });

    expect(role).toEqual(mockRole);
    expect(app.prisma.role.create).toHaveBeenCalledWith({
      data: {
        name: "Admin",
        type: "ADMIN",
        level: 100,
        permissions: ["*"],
      },
    });
  });

  it("should throw ConflictError when name already exists", async () => {
    app.prisma.role.findUnique.mockResolvedValue(mockRole); // conflict

    await expect(
      createRole(app, { name: "Admin", type: "ADMIN", level: 100, permissions: [] }),
    ).rejects.toThrow("Role name already exists");
  });
});

// ── updateRole ───────────────────────────────────────────────
describe("updateRole", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
  });

  it("should update role fields", async () => {
    app.prisma.role.findUnique.mockResolvedValue(mockRole); // getRoleById
    app.prisma.role.findFirst.mockResolvedValue(null); // no name conflict
    app.prisma.role.update.mockResolvedValue({ ...mockRole, name: "Super Admin" });

    const result = await updateRole(app, "role-1", { name: "Super Admin" });

    expect(result.name).toBe("Super Admin");
  });

  it("should throw ConflictError when new name already taken", async () => {
    app.prisma.role.findUnique.mockResolvedValue(mockRole);
    app.prisma.role.findFirst.mockResolvedValue({ id: "role-2", name: "Manager" }); // conflict

    await expect(
      updateRole(app, "role-1", { name: "Manager" }),
    ).rejects.toThrow("Role name already exists");
  });

  it("should throw NotFoundError when role doesn't exist", async () => {
    app.prisma.role.findUnique.mockResolvedValue(null);

    await expect(
      updateRole(app, "nonexistent", { name: "Test" }),
    ).rejects.toThrow("Role not found");
  });

  it("should skip name uniqueness check when name not in update", async () => {
    app.prisma.role.findUnique.mockResolvedValue(mockRole);
    app.prisma.role.update.mockResolvedValue({ ...mockRole, level: 50 });

    await updateRole(app, "role-1", { level: 50 });

    expect(app.prisma.role.findFirst).not.toHaveBeenCalled();
  });
});

// ── deleteRole ───────────────────────────────────────────────
describe("deleteRole", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
  });

  it("should delete role when no users assigned", async () => {
    app.prisma.role.findUnique.mockResolvedValue(mockRole);
    app.prisma.user.count.mockResolvedValue(0);
    app.prisma.role.delete.mockResolvedValue({});

    await deleteRole(app, "role-1");

    expect(app.prisma.role.delete).toHaveBeenCalledWith({
      where: { id: "role-1" },
    });
  });

  it("should throw ConflictError when users are still assigned", async () => {
    app.prisma.role.findUnique.mockResolvedValue(mockRole);
    app.prisma.user.count.mockResolvedValue(3); // 3 users using this role

    await expect(deleteRole(app, "role-1")).rejects.toThrow("Role is still assigned to users");
  });

  it("should throw NotFoundError when role doesn't exist", async () => {
    app.prisma.role.findUnique.mockResolvedValue(null);

    await expect(deleteRole(app, "nonexistent")).rejects.toThrow("Role not found");
  });
});

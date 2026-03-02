import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock appConfig (required by auth.service import chain)
vi.mock("../src/config/app.js", () => ({
  appConfig: {
    jwt: { accessExpiresIn: "15m", refreshExpiresIn: "7d" },
  },
}));

const { listUsers, getUserById, createUser, updateUser, deleteUser } = await import(
  "../src/modules/users/users.service.js"
);

// ── Helpers ──────────────────────────────────────────────────
function createMockApp() {
  return {
    prisma: {
      user: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  } as any;
}

const mockUser = {
  id: "user-1",
  username: "testuser",
  email: "test@example.com",
  name: "Test User",
  isActive: true,
  roleId: "role-1",
  role: { id: "role-1", type: "ADMIN" },
  lastLoginAt: null,
  lastLoginIp: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── listUsers ────────────────────────────────────────────────
describe("listUsers", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
  });

  it("should return paginated users", async () => {
    app.prisma.user.findMany.mockResolvedValue([mockUser]);
    app.prisma.user.count.mockResolvedValue(1);

    const result = await listUsers(app, { page: 1, limit: 20 });

    expect(result).toEqual({
      users: [mockUser],
      total: 1,
      page: 1,
      limit: 20,
    });
  });

  it("should calculate correct skip offset", async () => {
    app.prisma.user.findMany.mockResolvedValue([]);
    app.prisma.user.count.mockResolvedValue(0);

    await listUsers(app, { page: 3, limit: 10 });

    expect(app.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20, // (3-1) * 10
        take: 10,
      }),
    );
  });

  it("should search by username, name, or email", async () => {
    app.prisma.user.findMany.mockResolvedValue([]);
    app.prisma.user.count.mockResolvedValue(0);

    await listUsers(app, { page: 1, limit: 20, search: "john" });

    const call = app.prisma.user.findMany.mock.calls[0][0];
    expect(call.where).toHaveProperty("OR");
    expect(call.where.OR).toHaveLength(3);

    // Verify search covers username, name, email
    const searchFields = call.where.OR.map((c: any) => Object.keys(c)[0]);
    expect(searchFields).toContain("username");
    expect(searchFields).toContain("name");
    expect(searchFields).toContain("email");
  });

  it("should not apply search filter when no search provided", async () => {
    app.prisma.user.findMany.mockResolvedValue([]);
    app.prisma.user.count.mockResolvedValue(0);

    await listUsers(app, { page: 1, limit: 20 });

    const call = app.prisma.user.findMany.mock.calls[0][0];
    expect(call.where).toEqual({});
  });

  it("should order by createdAt desc", async () => {
    app.prisma.user.findMany.mockResolvedValue([]);
    app.prisma.user.count.mockResolvedValue(0);

    await listUsers(app, { page: 1, limit: 20 });

    expect(app.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
      }),
    );
  });
});

// ── getUserById ──────────────────────────────────────────────
describe("getUserById", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
  });

  it("should return user when found", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser);

    const user = await getUserById(app, "user-1");

    expect(user).toEqual(mockUser);
    expect(app.prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } }),
    );
  });

  it("should throw NotFoundError when user not found", async () => {
    app.prisma.user.findUnique.mockResolvedValue(null);

    await expect(getUserById(app, "nonexistent")).rejects.toThrow("User not found");
  });
});

// ── createUser ───────────────────────────────────────────────
describe("createUser", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
  });

  it("should create user with hashed password", async () => {
    app.prisma.user.findUnique.mockResolvedValue(null); // no conflict
    app.prisma.user.create.mockResolvedValue(mockUser);

    await createUser(app, {
      username: "newadmin",
      email: "new@example.com",
      password: "StrongP@ss1",
      name: "New Admin",
      roleId: "role-1",
    });

    const createCall = app.prisma.user.create.mock.calls[0][0];
    // Password should be hashed
    expect(createCall.data.password).toMatch(/^\$2[aby]?\$/);
    expect(createCall.data.password).not.toBe("StrongP@ss1");
  });

  it("should throw ConflictError when username exists", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser); // conflict!

    await expect(
      createUser(app, {
        username: "testuser",
        password: "StrongP@ss1",
        name: "Dup",
        roleId: "role-1",
      }),
    ).rejects.toThrow("Tài khoản đã tồn tại");
  });

  it("should store null for empty email", async () => {
    app.prisma.user.findUnique.mockResolvedValue(null);
    app.prisma.user.create.mockResolvedValue(mockUser);

    await createUser(app, {
      username: "noemail",
      email: "",
      password: "StrongP@ss1",
      name: "No Email",
      roleId: "role-1",
    });

    const createCall = app.prisma.user.create.mock.calls[0][0];
    expect(createCall.data.email).toBeNull();
  });
});

// ── updateUser ───────────────────────────────────────────────
describe("updateUser", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
  });

  it("should update user fields", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser); // getUserById
    app.prisma.user.update.mockResolvedValue({ ...mockUser, name: "Updated" });

    const result = await updateUser(app, "user-1", { name: "Updated" });

    expect(result.name).toBe("Updated");
    expect(app.prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({ name: "Updated" }),
      }),
    );
  });

  it("should check username uniqueness on update", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser); // getUserById
    app.prisma.user.findFirst.mockResolvedValue({ id: "other-user" }); // conflict!

    await expect(
      updateUser(app, "user-1", { username: "taken_name" }),
    ).rejects.toThrow("Tài khoản đã tồn tại");
  });

  it("should allow same username on same user", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser);
    app.prisma.user.findFirst.mockResolvedValue(null); // no conflict
    app.prisma.user.update.mockResolvedValue(mockUser);

    await updateUser(app, "user-1", { username: "newname" });

    expect(app.prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { username: "newname", NOT: { id: "user-1" } },
      }),
    );
  });

  it("should convert empty email to null", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser);
    app.prisma.user.update.mockResolvedValue({ ...mockUser, email: null });

    await updateUser(app, "user-1", { email: "" });

    expect(app.prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: null }),
      }),
    );
  });

  it("should throw NotFoundError when user doesn't exist", async () => {
    app.prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      updateUser(app, "nonexistent", { name: "Test" }),
    ).rejects.toThrow("User not found");
  });
});

// ── deleteUser ───────────────────────────────────────────────
describe("deleteUser", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
  });

  it("should delete user when found", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser);
    app.prisma.user.delete.mockResolvedValue({});

    await deleteUser(app, "user-1");

    expect(app.prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
  });

  it("should throw NotFoundError when user doesn't exist", async () => {
    app.prisma.user.findUnique.mockResolvedValue(null);

    await expect(deleteUser(app, "nonexistent")).rejects.toThrow("User not found");
  });
});

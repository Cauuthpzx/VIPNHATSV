import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";

// Mock appConfig before importing modules that use it
vi.mock("../src/config/app.js", () => ({
  appConfig: {
    jwt: {
      accessExpiresIn: "15m",
      refreshExpiresIn: "7d",
    },
  },
}));

const { register } = await import("../src/modules/auth/auth.service.js");

// ── Helpers ──────────────────────────────────────────────────
function createMockApp() {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      role: {
        findFirst: vi.fn(),
      },
      refreshToken: {
        create: vi.fn().mockResolvedValue({}),
      },
    },
    jwt: {
      sign: vi.fn().mockReturnValue("mock-access-token"),
    },
    redis: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue("OK"),
      del: vi.fn().mockResolvedValue(1),
      incr: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(1),
    },
  } as any;
}

const viewerRole = { id: "role-viewer", name: "Viewer", type: "VIEWER", level: 10, permissions: [] };

// ── Tests ────────────────────────────────────────────────────
describe("register", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
    app.prisma.role.findFirst.mockResolvedValue(viewerRole);
  });

  it("should create user and auto-login on valid registration", async () => {
    // findUnique for username check returns null (no conflict)
    app.prisma.user.findUnique
      .mockResolvedValueOnce(null) // register: check username unique
      .mockResolvedValueOnce({    // login: find user by username
        id: "new-user-1",
        username: "newuser",
        email: null,
        password: await bcrypt.hash("StrongP@ss1", 12),
        name: "New User",
        isActive: true,
        roleId: viewerRole.id,
        tokenVersion: 0,
        role: viewerRole,
      });
    app.prisma.user.create.mockResolvedValue({});

    const result = await register(app, {
      username: "newuser",
      password: "StrongP@ss1",
      name: "New User",
    });

    // Should create user
    expect(app.prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          username: "newuser",
          name: "New User",
          roleId: viewerRole.id,
        }),
      }),
    );

    // Should return tokens (auto-login)
    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result).toHaveProperty("user");
  });

  it("should store email when provided", async () => {
    app.prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "new-user-2",
        username: "emailuser",
        email: "test@example.com",
        password: await bcrypt.hash("StrongP@ss1", 12),
        name: "Email User",
        isActive: true,
        roleId: viewerRole.id,
        tokenVersion: 0,
        role: viewerRole,
      });
    app.prisma.user.create.mockResolvedValue({});

    await register(app, {
      username: "emailuser",
      password: "StrongP@ss1",
      name: "Email User",
      email: "test@example.com",
    });

    expect(app.prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "test@example.com",
        }),
      }),
    );
  });

  it("should store null email when empty string provided", async () => {
    app.prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "new-user-3",
        username: "noemail",
        email: null,
        password: await bcrypt.hash("StrongP@ss1", 12),
        name: "No Email",
        isActive: true,
        roleId: viewerRole.id,
        tokenVersion: 0,
        role: viewerRole,
      });
    app.prisma.user.create.mockResolvedValue({});

    await register(app, {
      username: "noemail",
      password: "StrongP@ss1",
      name: "No Email",
      email: "",
    });

    expect(app.prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: null }),
      }),
    );
  });

  it("should throw ConflictError when username already exists", async () => {
    app.prisma.user.findUnique.mockResolvedValueOnce({ id: "existing" }); // username exists

    await expect(
      register(app, {
        username: "existing_user",
        password: "StrongP@ss1",
        name: "Duplicate",
      }),
    ).rejects.toThrow("Tài khoản đã tồn tại");
  });

  it("should throw ValidationError when no VIEWER role exists", async () => {
    app.prisma.user.findUnique.mockResolvedValueOnce(null);
    app.prisma.role.findFirst.mockResolvedValueOnce(null); // no viewer role

    await expect(
      register(app, {
        username: "newuser",
        password: "StrongP@ss1",
        name: "New User",
      }),
    ).rejects.toThrow(/role/i);
  });

  it("should hash the password before storing", async () => {
    app.prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "new-user-4",
        username: "hashtest",
        email: null,
        password: await bcrypt.hash("StrongP@ss1", 12),
        name: "Hash Test",
        isActive: true,
        roleId: viewerRole.id,
        tokenVersion: 0,
        role: viewerRole,
      });
    app.prisma.user.create.mockResolvedValue({});

    await register(app, {
      username: "hashtest",
      password: "StrongP@ss1",
      name: "Hash Test",
    });

    const createCall = app.prisma.user.create.mock.calls[0][0];
    const storedPassword = createCall.data.password;
    // Password should be hashed (bcrypt format)
    expect(storedPassword).toMatch(/^\$2[aby]?\$/);
    expect(storedPassword).not.toBe("StrongP@ss1");
  });

  it("should pass meta (ip, userAgent) to login after registration", async () => {
    app.prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "new-user-5",
        username: "metauser",
        email: null,
        password: await bcrypt.hash("StrongP@ss1", 12),
        name: "Meta User",
        isActive: true,
        roleId: viewerRole.id,
        tokenVersion: 0,
        role: viewerRole,
      });
    app.prisma.user.create.mockResolvedValue({});

    await register(
      app,
      { username: "metauser", password: "StrongP@ss1", name: "Meta User" },
      { ip: "10.0.0.1", userAgent: "TestAgent/1.0" },
    );

    // Refresh token should contain session meta from auto-login
    expect(app.prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userAgent: "TestAgent/1.0",
          ipAddress: "10.0.0.1",
        }),
      }),
    );
  });
});

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

// Import after mocking
const { hashPassword, login, refresh, logout } = await import(
  "../src/modules/auth/auth.service.js"
);

// ── Helpers ──────────────────────────────────────────────────
function createMockApp(overrides: Record<string, any> = {}) {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      refreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
    jwt: {
      sign: vi.fn().mockReturnValue("mock-access-token"),
      decode: vi.fn().mockReturnValue(null),
    },
    redis: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue("OK"),
      del: vi.fn().mockResolvedValue(1),
      incr: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(1),
      ttl: vi.fn().mockResolvedValue(900),
    },
    ...overrides,
  } as any;
}

const mockUser = {
  id: "user-1",
  username: "testuser",
  email: "test@example.com",
  password: "", // Will be set in beforeEach
  name: "Test User",
  isActive: true,
  roleId: "role-1",
  tokenVersion: 0,
  role: { id: "role-1", type: "ADMIN", permissions: ["*"] },
};

// ── Tests ────────────────────────────────────────────────────
describe("hashPassword", () => {
  it("should return a bcrypt hash", async () => {
    const hash = await hashPassword("my-password");
    expect(hash).toBeDefined();
    expect(hash).not.toBe("my-password");
    expect(hash.startsWith("$2")).toBe(true); // bcrypt prefix
  });

  it("should produce verifiable hash", async () => {
    const hash = await hashPassword("secret123");
    const matches = await bcrypt.compare("secret123", hash);
    expect(matches).toBe(true);
  });

  it("should NOT match wrong password", async () => {
    const hash = await hashPassword("correct-password");
    const matches = await bcrypt.compare("wrong-password", hash);
    expect(matches).toBe(false);
  });
});

describe("login", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(async () => {
    app = createMockApp();
    mockUser.password = await bcrypt.hash("admin123", 12);
  });

  it("should return tokens on valid credentials", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser);
    app.prisma.refreshToken.create.mockResolvedValue({});

    const result = await login(app, {
      username: "testuser",
      password: "admin123",
    });

    expect(result).toHaveProperty("accessToken", "mock-access-token");
    expect(result).toHaveProperty("refreshToken");
    expect(result.user).toEqual({
      id: "user-1",
      username: "testuser",
      email: "test@example.com",
      name: "Test User",
      role: "ADMIN",
    });
    expect(app.jwt.sign).toHaveBeenCalledOnce();
    expect(app.prisma.refreshToken.create).toHaveBeenCalledOnce();
  });

  it("should include jti and tokenVersion in JWT payload", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser);
    app.prisma.refreshToken.create.mockResolvedValue({});

    await login(app, { username: "testuser", password: "admin123" });

    const signCall = app.jwt.sign.mock.calls[0];
    expect(signCall[0]).toHaveProperty("jti");
    expect(signCall[0]).toHaveProperty("userId", "user-1");
    expect(signCall[0]).toHaveProperty("tokenVersion", 0);
    expect(signCall[0]).toHaveProperty("permissions", ["*"]);
  });

  it("should update lastLoginAt on success", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser);
    app.prisma.refreshToken.create.mockResolvedValue({});

    await login(app, { username: "testuser", password: "admin123" }, { ip: "1.2.3.4" });

    expect(app.prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({ lastLoginIp: "1.2.3.4" }),
      }),
    );
  });

  it("should throw on wrong password", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      login(app, { username: "testuser", password: "wrong" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("should throw on unknown username", async () => {
    app.prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      login(app, { username: "nonexistent", password: "admin123" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("should throw on inactive user", async () => {
    app.prisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      isActive: false,
    });

    await expect(
      login(app, { username: "testuser", password: "admin123" }),
    ).rejects.toThrow("User is inactive");
  });

  it("should record failed attempt on wrong password", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      login(app, { username: "testuser", password: "wrong" }),
    ).rejects.toThrow();

    expect(app.redis.incr).toHaveBeenCalledWith(`auth:login_attempts:${mockUser.id}`);
  });

  it("should clear login attempts on success", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser);
    app.prisma.refreshToken.create.mockResolvedValue({});

    await login(app, { username: "testuser", password: "admin123" });

    expect(app.redis.del).toHaveBeenCalledWith(`auth:login_attempts:${mockUser.id}`);
  });

  it("should throw when account is locked", async () => {
    app.redis.get.mockResolvedValue("1"); // account locked
    app.prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      login(app, { username: "testuser", password: "admin123" }),
    ).rejects.toThrow(/Tài khoản bị khóa/);
  });

  it("should store session meta (userAgent, ip) in refresh token", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser);
    app.prisma.refreshToken.create.mockResolvedValue({});

    await login(
      app,
      { username: "testuser", password: "admin123" },
      { ip: "10.0.0.1", userAgent: "Mozilla/5.0" },
    );

    expect(app.prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userAgent: "Mozilla/5.0",
          ipAddress: "10.0.0.1",
        }),
      }),
    );
  });
});

describe("refresh", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
  });

  it("should rotate tokens on valid refresh token", async () => {
    const stored = {
      id: "rt-1",
      token: "valid-refresh-token",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 86_400_000), // tomorrow
      userAgent: "Chrome",
      ipAddress: "1.2.3.4",
      user: mockUser,
    };
    app.prisma.refreshToken.findUnique.mockResolvedValue(stored);
    app.prisma.refreshToken.delete.mockResolvedValue({});
    app.prisma.refreshToken.create.mockResolvedValue({});

    const result = await refresh(app, "valid-refresh-token");

    expect(result).toHaveProperty("accessToken", "mock-access-token");
    expect(result).toHaveProperty("refreshToken");
    // Old token should be deleted
    expect(app.prisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { id: "rt-1" },
    });
    // New token should be created
    expect(app.prisma.refreshToken.create).toHaveBeenCalledOnce();
  });

  it("should preserve session meta in rotated token", async () => {
    const stored = {
      id: "rt-1",
      token: "valid-refresh-token",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 86_400_000),
      userAgent: "Firefox/120",
      ipAddress: "192.168.1.1",
      user: mockUser,
    };
    app.prisma.refreshToken.findUnique.mockResolvedValue(stored);
    app.prisma.refreshToken.delete.mockResolvedValue({});
    app.prisma.refreshToken.create.mockResolvedValue({});

    await refresh(app, "valid-refresh-token");

    expect(app.prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userAgent: "Firefox/120",
          ipAddress: "192.168.1.1",
        }),
      }),
    );
  });

  it("should throw on expired refresh token", async () => {
    const stored = {
      id: "rt-2",
      token: "expired-token",
      userId: "user-1",
      expiresAt: new Date(Date.now() - 86_400_000), // yesterday
      user: mockUser,
    };
    app.prisma.refreshToken.findUnique.mockResolvedValue(stored);
    app.prisma.refreshToken.delete.mockResolvedValue({});

    await expect(refresh(app, "expired-token")).rejects.toThrow(
      "Refresh token expired or invalid",
    );
    // Expired token should be cleaned up
    expect(app.prisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { id: "rt-2" },
    });
  });

  it("should throw on unknown refresh token", async () => {
    app.prisma.refreshToken.findUnique.mockResolvedValue(null);

    await expect(refresh(app, "unknown-token")).rejects.toThrow(
      "Refresh token expired or invalid",
    );
  });
});

describe("logout", () => {
  it("should delete refresh token and blacklist access token", async () => {
    const app = createMockApp();
    app.prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
    app.jwt.decode.mockReturnValue({ jti: "test-jti", exp: Math.floor(Date.now() / 1000) + 900 });

    await logout(app, "some-refresh-token", "some-access-token");

    expect(app.prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { token: "some-refresh-token" },
    });
    // Should attempt to blacklist access token in Redis
    expect(app.redis.set).toHaveBeenCalled();
  });
});

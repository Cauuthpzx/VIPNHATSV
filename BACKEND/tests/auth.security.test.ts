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

const {
  blacklistAccessToken,
  logoutAll,
  changePassword,
  changeFundPassword,
  listSessions,
  revokeSession,
  updateProfile,
} = await import("../src/modules/auth/auth.service.js");

// ── Helpers ──────────────────────────────────────────────────
function createMockApp() {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({ tokenVersion: 1 }),
      },
      refreshToken: {
        create: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: vi.fn(),
    },
    jwt: {
      sign: vi.fn().mockReturnValue("mock-access-token"),
      decode: vi.fn(),
    },
    redis: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue("OK"),
      del: vi.fn().mockResolvedValue(1),
    },
  } as any;
}

// ── blacklistAccessToken ─────────────────────────────────────
describe("blacklistAccessToken", () => {
  it("should store jti in Redis with TTL", async () => {
    const app = createMockApp();
    app.jwt.decode.mockReturnValue({
      jti: "test-jti-123",
      exp: Math.floor(Date.now() / 1000) + 600, // 10 min remaining
    });

    await blacklistAccessToken(app, "access-token-here");

    expect(app.redis.set).toHaveBeenCalledWith(
      "auth:blacklist:test-jti-123",
      "1",
      "EX",
      expect.any(Number),
    );
    // TTL should be ~600s
    const ttlArg = app.redis.set.mock.calls[0][3];
    expect(ttlArg).toBeGreaterThan(0);
    expect(ttlArg).toBeLessThanOrEqual(600);
  });

  it("should not store if token has no jti", async () => {
    const app = createMockApp();
    app.jwt.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 600 });

    await blacklistAccessToken(app, "token-no-jti");

    expect(app.redis.set).not.toHaveBeenCalled();
  });

  it("should not store if token is already expired", async () => {
    const app = createMockApp();
    app.jwt.decode.mockReturnValue({
      jti: "expired-jti",
      exp: Math.floor(Date.now() / 1000) - 60, // expired 1 min ago
    });

    await blacklistAccessToken(app, "expired-token");

    expect(app.redis.set).not.toHaveBeenCalled();
  });

  it("should handle empty token gracefully", async () => {
    const app = createMockApp();

    await expect(blacklistAccessToken(app, "")).resolves.toBeUndefined();
    expect(app.jwt.decode).not.toHaveBeenCalled();
  });

  it("should handle decode failure gracefully", async () => {
    const app = createMockApp();
    app.jwt.decode.mockImplementation(() => { throw new Error("Invalid"); });

    await expect(blacklistAccessToken(app, "bad-token")).resolves.toBeUndefined();
  });
});

// ── logoutAll ────────────────────────────────────────────────
describe("logoutAll", () => {
  it("should delete all refresh tokens and increment tokenVersion", async () => {
    const app = createMockApp();
    app.prisma.user.update.mockResolvedValue({ tokenVersion: 2 });
    app.jwt.decode.mockReturnValue({ jti: "jti-1", exp: Math.floor(Date.now() / 1000) + 900 });

    await logoutAll(app, "user-1", "access-token");

    expect(app.prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(app.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { tokenVersion: { increment: 1 } },
      select: { tokenVersion: true },
    });
  });

  it("should update Redis token version", async () => {
    const app = createMockApp();
    app.prisma.user.update.mockResolvedValue({ tokenVersion: 5 });
    app.jwt.decode.mockReturnValue(null);

    await logoutAll(app, "user-1", "");

    expect(app.redis.set).toHaveBeenCalledWith("auth:token_version:user-1", "5");
  });

  it("should blacklist the current access token", async () => {
    const app = createMockApp();
    app.prisma.user.update.mockResolvedValue({ tokenVersion: 1 });
    app.jwt.decode.mockReturnValue({
      jti: "current-jti",
      exp: Math.floor(Date.now() / 1000) + 300,
    });

    await logoutAll(app, "user-1", "current-access-token");

    // Should attempt blacklisting
    expect(app.jwt.decode).toHaveBeenCalledWith("current-access-token");
  });
});

// ── changePassword ───────────────────────────────────────────
describe("changePassword", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
  });

  it("should change password, increment tokenVersion, and blacklist token", async () => {
    const hashedOld = await bcrypt.hash("OldP@ss1", 12);
    app.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      password: hashedOld,
    });
    app.prisma.$transaction.mockResolvedValue([{ tokenVersion: 2 }, { count: 3 }]);
    app.jwt.decode.mockReturnValue({ jti: "jti-1", exp: Math.floor(Date.now() / 1000) + 600 });

    await changePassword(app, "user-1", { oldPassword: "OldP@ss1", newPassword: "NewP@ss1" }, "access-token");

    // Transaction should update password + delete refresh tokens
    expect(app.prisma.$transaction).toHaveBeenCalledOnce();
    // Redis tokenVersion update
    expect(app.redis.set).toHaveBeenCalledWith("auth:token_version:user-1", "2");
  });

  it("should throw when old password is wrong", async () => {
    const hashedOld = await bcrypt.hash("CorrectPass1!", 12);
    app.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      password: hashedOld,
    });

    await expect(
      changePassword(app, "user-1", { oldPassword: "WrongP@ss1", newPassword: "NewP@ss1" }, "token"),
    ).rejects.toThrow("Mật khẩu cũ không đúng");
  });

  it("should throw when user not found", async () => {
    app.prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      changePassword(app, "nonexistent", { oldPassword: "any", newPassword: "NewP@ss1" }, "token"),
    ).rejects.toThrow("User not found");
  });
});

// ── changeFundPassword ───────────────────────────────────────
describe("changeFundPassword", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
  });

  it("should set fund password for first time (no old password required)", async () => {
    app.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      fundPassword: null, // not set yet
    });

    await changeFundPassword(app, "user-1", { newPassword: "NewFund1!" });

    expect(app.prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({ fundPassword: expect.any(String) }),
      }),
    );
  });

  it("should require old password when fund password already set", async () => {
    const hashedFund = await bcrypt.hash("OldFund1!", 12);
    app.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      fundPassword: hashedFund,
    });

    await expect(
      changeFundPassword(app, "user-1", { newPassword: "NewFund1!" }),
    ).rejects.toThrow("Vui lòng nhập mật khẩu giao dịch cũ");
  });

  it("should throw when old fund password is wrong", async () => {
    const hashedFund = await bcrypt.hash("CorrectFund1!", 12);
    app.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      fundPassword: hashedFund,
    });

    await expect(
      changeFundPassword(app, "user-1", { oldPassword: "WrongFund1!", newPassword: "NewFund1!" }),
    ).rejects.toThrow("Mật khẩu giao dịch cũ không đúng");
  });

  it("should accept correct old fund password", async () => {
    const hashedFund = await bcrypt.hash("OldFund1!", 12);
    app.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      fundPassword: hashedFund,
    });

    await changeFundPassword(app, "user-1", {
      oldPassword: "OldFund1!",
      newPassword: "NewFund1!",
    });

    expect(app.prisma.user.update).toHaveBeenCalled();
  });
});

// ── listSessions ─────────────────────────────────────────────
describe("listSessions", () => {
  it("should return active sessions for user", async () => {
    const app = createMockApp();
    const mockSessions = [
      { id: "s1", userAgent: "Chrome", ipAddress: "1.1.1.1", createdAt: new Date(), expiresAt: new Date() },
      { id: "s2", userAgent: "Firefox", ipAddress: "2.2.2.2", createdAt: new Date(), expiresAt: new Date() },
    ];
    app.prisma.refreshToken.findMany.mockResolvedValue(mockSessions);

    const sessions = await listSessions(app, "user-1");

    expect(sessions).toHaveLength(2);
    expect(app.prisma.refreshToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1" }),
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("should filter out expired sessions", async () => {
    const app = createMockApp();
    app.prisma.refreshToken.findMany.mockResolvedValue([]);

    await listSessions(app, "user-1");

    expect(app.prisma.refreshToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          expiresAt: { gt: expect.any(Date) },
        }),
      }),
    );
  });
});

// ── revokeSession ────────────────────────────────────────────
describe("revokeSession", () => {
  it("should delete a specific session", async () => {
    const app = createMockApp();
    app.prisma.refreshToken.findFirst.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
    });

    await revokeSession(app, "user-1", "session-1");

    expect(app.prisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { id: "session-1" },
    });
  });

  it("should throw NotFoundError if session doesn't belong to user", async () => {
    const app = createMockApp();
    app.prisma.refreshToken.findFirst.mockResolvedValue(null);

    await expect(
      revokeSession(app, "user-1", "other-session"),
    ).rejects.toThrow("Session not found");
  });
});

// ── updateProfile ────────────────────────────────────────────
describe("updateProfile", () => {
  it("should update user name", async () => {
    const app = createMockApp();
    app.prisma.user.update.mockResolvedValue({
      id: "user-1",
      username: "testuser",
      email: null,
      name: "Updated Name",
      isActive: true,
      role: { id: "r1", type: "VIEWER" },
    });

    const result = await updateProfile(app, "user-1", { name: "Updated Name" });

    expect(app.prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { name: "Updated Name" },
      }),
    );
    expect(result.name).toBe("Updated Name");
  });
});

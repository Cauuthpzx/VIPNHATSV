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
    },
    ...overrides,
  } as any;
}

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  password: "", // Will be set in beforeEach
  name: "Test User",
  isActive: true,
  roleId: "role-1",
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
      email: "test@example.com",
      password: "admin123",
    });

    expect(result).toHaveProperty("accessToken", "mock-access-token");
    expect(result).toHaveProperty("refreshToken");
    expect(result.user).toEqual({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      role: "ADMIN",
    });
    expect(app.jwt.sign).toHaveBeenCalledOnce();
    expect(app.prisma.refreshToken.create).toHaveBeenCalledOnce();
  });

  it("should throw on wrong password", async () => {
    app.prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      login(app, { email: "test@example.com", password: "wrong" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("should throw on unknown email", async () => {
    app.prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      login(app, { email: "unknown@example.com", password: "admin123" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("should throw on inactive user", async () => {
    app.prisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      isActive: false,
    });

    await expect(
      login(app, { email: "test@example.com", password: "admin123" }),
    ).rejects.toThrow("User is inactive");
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
  it("should delete refresh token", async () => {
    const app = createMockApp();
    app.prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

    await logout(app, "some-refresh-token");

    expect(app.prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { token: "some-refresh-token" },
    });
  });
});

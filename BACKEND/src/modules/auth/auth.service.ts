import type { FastifyInstance } from "fastify";
import { randomUUID, createHash } from "node:crypto";
import bcrypt from "bcrypt";
import { UnauthorizedError } from "../../errors/UnauthorizedError.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import { appConfig } from "../../config/app.js";
import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  ChangePasswordInput,
  ChangeFundPasswordInput,
} from "./auth.schema.js";
import { ValidationError } from "../../errors/ValidationError.js";
import { ConflictError } from "../../errors/ConflictError.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_SECONDS = 900; // 15 minutes
const ATTEMPT_WINDOW_SECONDS = 900; // 15 minutes

// ─── Password helpers ────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Token helpers ───────────────────────────────────────────────────────────

/** SHA-256 hash for refresh token storage (deterministic, fast lookup) */
function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function parseExpiresIn(value: string): Date {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const num = parseInt(match[1], 10);
  const unit = match[2];
  const ms: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return new Date(Date.now() + num * (ms[unit] ?? 86_400_000));
}

/**
 * Blacklist an access token in Redis until it naturally expires.
 * Decodes the token to extract jti + exp, then stores in Redis with TTL = remaining lifetime.
 */
export async function blacklistAccessToken(app: FastifyInstance, token: string): Promise<void> {
  try {
    if (!token) return;
    const payload = app.jwt.decode<{ jti?: string; exp?: number }>(token);
    if (!payload?.jti || !payload?.exp) return;

    const now = Math.floor(Date.now() / 1000);
    const ttl = payload.exp - now;
    if (ttl <= 0) return; // Already expired

    await app.redis.set(`auth:blacklist:${payload.jti}`, "1", "EX", ttl);
  } catch {
    // Token decode failed — already unusable
  }
}

// ─── Login throttling / Account lockout ──────────────────────────────────────

async function checkAccountLock(app: FastifyInstance, userId: string): Promise<void> {
  try {
    const locked = await app.redis.get(`auth:account_lock:${userId}`);
    if (locked) {
      const ttl = await app.redis.ttl(`auth:account_lock:${userId}`);
      throw new UnauthorizedError(
        `Tài khoản bị khóa. Thử lại sau ${Math.ceil(ttl / 60)} phút.`,
        ERROR_CODES.ACCOUNT_LOCKED,
      );
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    // Redis error — fail open
  }
}

async function recordFailedAttempt(app: FastifyInstance, userId: string): Promise<void> {
  try {
    const key = `auth:login_attempts:${userId}`;
    const attempts = await app.redis.incr(key);

    if (attempts === 1) {
      await app.redis.expire(key, ATTEMPT_WINDOW_SECONDS);
    }

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await app.redis.set(`auth:account_lock:${userId}`, "1", "EX", LOCK_DURATION_SECONDS);
      await app.redis.del(key);
    }
  } catch {
    // Redis error — fail open
  }
}

async function clearLoginAttempts(app: FastifyInstance, userId: string): Promise<void> {
  try {
    await app.redis.del(`auth:login_attempts:${userId}`);
  } catch {
    // Redis error — ignore
  }
}

// ─── Auth operations ─────────────────────────────────────────────────────────

export async function login(
  app: FastifyInstance,
  input: LoginInput,
  meta?: { ip?: string; userAgent?: string },
) {
  const user = await app.prisma.user.findUnique({
    where: { username: input.username },
    include: { role: true },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid credentials", ERROR_CODES.INVALID_CREDENTIALS);
  }

  // Check account lock before password verification
  await checkAccountLock(app, user.id);

  if (!(await verifyPassword(input.password, user.password))) {
    await recordFailedAttempt(app, user.id);
    throw new UnauthorizedError("Invalid credentials", ERROR_CODES.INVALID_CREDENTIALS);
  }

  if (!user.isActive) {
    throw new UnauthorizedError("User is inactive", ERROR_CODES.USER_INACTIVE);
  }

  // Success — clear failed attempts
  await clearLoginAttempts(app, user.id);

  // Update last login tracking
  await app.prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastLoginIp: meta?.ip || null },
  });

  const jti = randomUUID();
  const tokenPayload = {
    jti,
    userId: user.id,
    roleId: user.roleId,
    permissions: user.role.permissions,
    tokenVersion: user.tokenVersion,
  };

  const accessToken = app.jwt.sign(tokenPayload, {
    expiresIn: appConfig.jwt.accessExpiresIn,
  });

  const refreshTokenValue = randomUUID();
  await app.prisma.refreshToken.create({
    data: {
      token: hashRefreshToken(refreshTokenValue),
      userId: user.id,
      expiresAt: parseExpiresIn(appConfig.jwt.refreshExpiresIn),
      userAgent: meta?.userAgent || null,
      ipAddress: meta?.ip || null,
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue, // raw value sent via httpOnly cookie
    user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role.type },
  };
}

export async function refresh(
  app: FastifyInstance,
  refreshToken: string,
) {
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await app.prisma.refreshToken.findUnique({
    where: { token: tokenHash },
    include: { user: { include: { role: true } } },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) {
      await app.prisma.refreshToken.delete({ where: { id: stored.id } });
    }
    throw new UnauthorizedError("Refresh token expired or invalid", ERROR_CODES.TOKEN_EXPIRED);
  }

  // Rotate refresh token
  await app.prisma.refreshToken.delete({ where: { id: stored.id } });

  const jti = randomUUID();
  const tokenPayload = {
    jti,
    userId: stored.user.id,
    roleId: stored.user.roleId,
    permissions: stored.user.role.permissions,
    tokenVersion: stored.user.tokenVersion,
  };

  const accessToken = app.jwt.sign(tokenPayload, {
    expiresIn: appConfig.jwt.accessExpiresIn,
  });

  const newRefreshTokenValue = randomUUID();
  await app.prisma.refreshToken.create({
    data: {
      token: hashRefreshToken(newRefreshTokenValue),
      userId: stored.user.id,
      expiresAt: parseExpiresIn(appConfig.jwt.refreshExpiresIn),
      userAgent: stored.userAgent,
      ipAddress: stored.ipAddress,
    },
  });

  return { accessToken, refreshToken: newRefreshTokenValue };
}

export async function logout(app: FastifyInstance, refreshToken: string, accessToken: string) {
  if (refreshToken) {
    await app.prisma.refreshToken.deleteMany({ where: { token: hashRefreshToken(refreshToken) } });
  }
  await blacklistAccessToken(app, accessToken);
}

export async function logoutAll(app: FastifyInstance, userId: string, accessToken: string) {
  // Delete all refresh tokens for this user
  await app.prisma.refreshToken.deleteMany({ where: { userId } });

  // Increment tokenVersion to invalidate all access tokens via middleware check
  const updated = await app.prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });

  // Update Redis for fast middleware lookup
  try {
    await app.redis.set(`auth:token_version:${userId}`, String(updated.tokenVersion));
  } catch {
    // Redis error — tokens will expire naturally
  }

  // Also blacklist the current access token
  await blacklistAccessToken(app, accessToken);
}

export async function register(
  app: FastifyInstance,
  input: RegisterInput,
  meta?: { ip?: string; userAgent?: string },
) {
  // Check username uniqueness
  const existing = await app.prisma.user.findUnique({ where: { username: input.username } });
  if (existing) {
    throw new ConflictError("Tài khoản đã tồn tại", ERROR_CODES.USERNAME_EXISTS);
  }

  // Find default VIEWER role
  const viewerRole = await app.prisma.role.findFirst({ where: { type: "VIEWER" } });
  if (!viewerRole) {
    throw new ValidationError("Hệ thống chưa có role mặc định, vui lòng liên hệ admin");
  }

  // Create user
  const hashed = await hashPassword(input.password);
  await app.prisma.user.create({
    data: {
      username: input.username,
      email: input.email || null,
      password: hashed,
      name: input.name,
      roleId: viewerRole.id,
    },
  });

  // Auto-login after registration
  return login(app, { username: input.username, password: input.password }, meta);
}

export async function updateProfile(app: FastifyInstance, userId: string, input: UpdateProfileInput) {
  return app.prisma.user.update({
    where: { id: userId },
    data: { name: input.name },
    select: { id: true, username: true, email: true, name: true, isActive: true, role: true },
  });
}

export async function changePassword(
  app: FastifyInstance,
  userId: string,
  input: ChangePasswordInput,
  accessToken: string,
) {
  const user = await app.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError("User not found", ERROR_CODES.INVALID_CREDENTIALS);

  const valid = await verifyPassword(input.oldPassword, user.password);
  if (!valid) throw new ValidationError("Mật khẩu cũ không đúng");

  const hashed = await hashPassword(input.newPassword);

  // Atomic: update password + increment tokenVersion + delete all refresh tokens
  const [updated] = await app.prisma.$transaction([
    app.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, tokenVersion: { increment: 1 } },
      select: { tokenVersion: true },
    }),
    app.prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);

  // Update Redis token version for fast middleware check
  try {
    await app.redis.set(`auth:token_version:${userId}`, String(updated.tokenVersion));
  } catch {
    // Redis error — tokens will expire naturally
  }

  // Blacklist current access token
  await blacklistAccessToken(app, accessToken);
}

export async function changeFundPassword(app: FastifyInstance, userId: string, input: ChangeFundPasswordInput) {
  const user = await app.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError("User not found", ERROR_CODES.INVALID_CREDENTIALS);

  // If fund password already set, validate old password
  if (user.fundPassword) {
    if (!input.oldPassword) throw new ValidationError("Vui lòng nhập mật khẩu giao dịch cũ");
    const valid = await verifyPassword(input.oldPassword, user.fundPassword);
    if (!valid) throw new ValidationError("Mật khẩu giao dịch cũ không đúng");
  }

  const hashed = await hashPassword(input.newPassword);
  await app.prisma.user.update({ where: { id: userId }, data: { fundPassword: hashed } });
}

// ─── Session management ──────────────────────────────────────────────────────

export async function listSessions(app: FastifyInstance, userId: string) {
  return app.prisma.refreshToken.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeSession(app: FastifyInstance, userId: string, sessionId: string) {
  const session = await app.prisma.refreshToken.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new NotFoundError("Session not found");
  await app.prisma.refreshToken.delete({ where: { id: sessionId } });
}

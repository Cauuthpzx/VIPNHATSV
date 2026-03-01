import type { FastifyInstance } from "fastify";
import { createHash, randomUUID } from "node:crypto";
import { UnauthorizedError } from "../../errors/UnauthorizedError.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import { appConfig } from "../../config/app.js";
import type { LoginInput } from "./auth.schema.js";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function parseExpiresIn(value: string): Date {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const num = parseInt(match[1], 10);
  const unit = match[2];
  const ms: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return new Date(Date.now() + num * (ms[unit] ?? 86_400_000));
}

export async function login(app: FastifyInstance, input: LoginInput) {
  const user = await app.prisma.user.findUnique({
    where: { email: input.email },
    include: { role: true },
  });

  if (!user || hashPassword(input.password) !== user.password) {
    throw new UnauthorizedError("Invalid credentials", ERROR_CODES.INVALID_CREDENTIALS);
  }

  if (!user.isActive) {
    throw new UnauthorizedError("User is inactive", ERROR_CODES.USER_INACTIVE);
  }

  const tokenPayload = {
    userId: user.id,
    roleId: user.roleId,
    permissions: user.role.permissions,
  };

  const accessToken = app.jwt.sign(tokenPayload, {
    expiresIn: appConfig.jwt.accessExpiresIn,
  });

  const refreshTokenValue = randomUUID();
  await app.prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: parseExpiresIn(appConfig.jwt.refreshExpiresIn),
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    user: { id: user.id, email: user.email, name: user.name, role: user.role.type },
  };
}

export async function refresh(app: FastifyInstance, refreshToken: string) {
  const stored = await app.prisma.refreshToken.findUnique({
    where: { token: refreshToken },
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

  const tokenPayload = {
    userId: stored.user.id,
    roleId: stored.user.roleId,
    permissions: stored.user.role.permissions,
  };

  const accessToken = app.jwt.sign(tokenPayload, {
    expiresIn: appConfig.jwt.accessExpiresIn,
  });

  const newRefreshTokenValue = randomUUID();
  await app.prisma.refreshToken.create({
    data: {
      token: newRefreshTokenValue,
      userId: stored.user.id,
      expiresAt: parseExpiresIn(appConfig.jwt.refreshExpiresIn),
    },
  });

  return { accessToken, refreshToken: newRefreshTokenValue };
}

export async function logout(app: FastifyInstance, refreshToken: string) {
  await app.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

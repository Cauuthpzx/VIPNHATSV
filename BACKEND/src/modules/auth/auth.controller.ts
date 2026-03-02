import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  loginSchema,
  registerSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
  changeFundPasswordSchema,
  sessionIdParamSchema,
} from "./auth.schema.js";
import * as authService from "./auth.service.js";
import * as usersService from "../users/users.service.js";
import { sendSuccess } from "../../utils/response.js";
import { ValidationError } from "../../errors/ValidationError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { audit } from "../../utils/auditLog.js";

const REFRESH_COOKIE_NAME = "refreshToken";

function extractAccessToken(request: FastifyRequest): string {
  return request.headers.authorization?.slice(7) || "";
}

function extractClientIp(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return request.ip;
}

function extractRefreshToken(request: FastifyRequest): string {
  // Try httpOnly cookie first, fall back to request body for backward compat
  return (request.cookies as Record<string, string>)?.[REFRESH_COOKIE_NAME] || "";
}

function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
  });
}

export async function loginHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    request.log.warn({ errors: parsed.error.errors, body: request.body }, "LOGIN_VALIDATION_FAILED");
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const result = await authService.login(this, parsed.data, {
    ip: extractClientIp(request),
    userAgent: request.headers["user-agent"] || undefined,
  });
  setRefreshCookie(reply, result.refreshToken);
  audit({ action: "LOGIN", userId: result.user.id, ip: extractClientIp(request) });
  return sendSuccess(reply, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken, // also in body for backward compat
    user: result.user,
  }, HTTP_STATUS.OK);
}

export async function registerHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const result = await authService.register(this, parsed.data, {
    ip: extractClientIp(request),
    userAgent: request.headers["user-agent"] || undefined,
  });
  setRefreshCookie(reply, result.refreshToken);
  audit({ action: "REGISTER", userId: result.user.id, ip: extractClientIp(request) });
  return sendSuccess(reply, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  }, HTTP_STATUS.CREATED);
}

export async function refreshHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Try cookie first, then body
  let refreshToken = extractRefreshToken(request);
  if (!refreshToken) {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError("Refresh token is required");
    refreshToken = parsed.data.refreshToken;
  }

  const result = await authService.refresh(this, refreshToken);
  setRefreshCookie(reply, result.refreshToken);
  return sendSuccess(reply, result, HTTP_STATUS.OK);
}

export async function logoutHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Try cookie first, then body
  let refreshToken = extractRefreshToken(request);
  if (!refreshToken) {
    const parsed = refreshSchema.safeParse(request.body);
    if (parsed.success) refreshToken = parsed.data.refreshToken;
  }

  await authService.logout(this, refreshToken || "", extractAccessToken(request));
  clearRefreshCookie(reply);
  audit({ action: "LOGOUT", userId: request.user.userId, ip: extractClientIp(request) });
  return sendSuccess(reply, null, HTTP_STATUS.OK);
}

export async function logoutAllHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await authService.logoutAll(this, request.user.userId, extractAccessToken(request));
  clearRefreshCookie(reply);
  audit({ action: "LOGOUT_ALL", userId: request.user.userId, ip: extractClientIp(request) });
  return sendSuccess(reply, null, HTTP_STATUS.OK);
}

export async function meHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = await usersService.getUserById(this, request.user.userId);
  return sendSuccess(reply, user, HTTP_STATUS.OK);
}

export async function updateProfileHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = updateProfileSchema.safeParse(request.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

  const user = await authService.updateProfile(this, request.user.userId, parsed.data);
  return sendSuccess(reply, user, HTTP_STATUS.OK);
}

export async function changePasswordHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = changePasswordSchema.safeParse(request.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

  await authService.changePassword(this, request.user.userId, parsed.data, extractAccessToken(request));
  audit({ action: "CHANGE_PASSWORD", userId: request.user.userId, ip: extractClientIp(request) });
  return sendSuccess(reply, null, HTTP_STATUS.OK);
}

export async function changeFundPasswordHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = changeFundPasswordSchema.safeParse(request.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

  await authService.changeFundPassword(this, request.user.userId, parsed.data);
  audit({ action: "CHANGE_FUND_PASSWORD", userId: request.user.userId, ip: extractClientIp(request) });
  return sendSuccess(reply, null, HTTP_STATUS.OK);
}

export async function listSessionsHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const sessions = await authService.listSessions(this, request.user.userId);
  return sendSuccess(reply, sessions, HTTP_STATUS.OK);
}

export async function revokeSessionHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = sessionIdParamSchema.safeParse(request.params);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

  await authService.revokeSession(this, request.user.userId, parsed.data.id);
  return sendSuccess(reply, null, HTTP_STATUS.OK);
}

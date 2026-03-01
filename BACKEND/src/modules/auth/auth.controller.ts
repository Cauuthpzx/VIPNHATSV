import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { loginSchema, refreshSchema, updateProfileSchema, changePasswordSchema, changeFundPasswordSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";
import * as usersService from "../users/users.service.js";
import { sendSuccess } from "../../utils/response.js";
import { ValidationError } from "../../errors/ValidationError.js";
import { HTTP_STATUS } from "../../constants/http.js";

export async function loginHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  request.log.info({ body: request.body, contentType: request.headers["content-type"] }, "LOGIN_DEBUG");
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    request.log.warn({ errors: parsed.error.errors, body: request.body }, "LOGIN_VALIDATION_FAILED");
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const result = await authService.login(this, parsed.data);
  return sendSuccess(reply, result, HTTP_STATUS.OK);
}

export async function refreshHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = refreshSchema.safeParse(request.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

  const result = await authService.refresh(this, parsed.data.refreshToken);
  return sendSuccess(reply, result, HTTP_STATUS.OK);
}

export async function logoutHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = refreshSchema.safeParse(request.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

  await authService.logout(this, parsed.data.refreshToken);
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

  await authService.changePassword(this, request.user.userId, parsed.data);
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
  return sendSuccess(reply, null, HTTP_STATUS.OK);
}

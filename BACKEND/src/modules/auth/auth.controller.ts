import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { loginSchema, refreshSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";
import { sendSuccess } from "../../utils/response.js";
import { ValidationError } from "../../errors/ValidationError.js";
import { HTTP_STATUS } from "../../constants/http.js";

export async function loginHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

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
  const user = await this.prisma.user.findUnique({
    where: { id: request.user.userId },
    select: { id: true, email: true, name: true, isActive: true, role: true },
  });
  return sendSuccess(reply, user, HTTP_STATUS.OK);
}

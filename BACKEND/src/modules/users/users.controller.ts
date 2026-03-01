import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  createUserSchema,
  updateUserSchema,
  userParamsSchema,
  userQuerySchema,
} from "./users.schema.js";
import * as usersService from "./users.service.js";
import { sendSuccess } from "../../utils/response.js";
import { ValidationError } from "../../errors/ValidationError.js";
import { HTTP_STATUS } from "../../constants/http.js";

export async function listHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = userQuerySchema.safeParse(request.query);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

  const result = await usersService.listUsers(this, parsed.data);
  return sendSuccess(reply, result);
}

export async function getHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = userParamsSchema.safeParse(request.params);
  if (!params.success) throw new ValidationError(params.error.errors[0].message);

  const user = await usersService.getUserById(this, params.data.id);
  return sendSuccess(reply, user);
}

export async function createHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = createUserSchema.safeParse(request.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

  const user = await usersService.createUser(this, parsed.data);
  return sendSuccess(reply, user, HTTP_STATUS.CREATED);
}

export async function updateHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = userParamsSchema.safeParse(request.params);
  if (!params.success) throw new ValidationError(params.error.errors[0].message);

  const body = updateUserSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.errors[0].message);

  const user = await usersService.updateUser(this, params.data.id, body.data);
  return sendSuccess(reply, user);
}

export async function deleteHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = userParamsSchema.safeParse(request.params);
  if (!params.success) throw new ValidationError(params.error.errors[0].message);

  await usersService.deleteUser(this, params.data.id);
  return sendSuccess(reply, null, HTTP_STATUS.OK);
}

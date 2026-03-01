import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createRoleSchema, updateRoleSchema, roleParamsSchema } from "./roles.schema.js";
import * as rolesService from "./roles.service.js";
import { sendSuccess } from "../../utils/response.js";
import { ValidationError } from "../../errors/ValidationError.js";
import { HTTP_STATUS } from "../../constants/http.js";

export async function listHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const roles = await rolesService.listRoles(this);
  return sendSuccess(reply, roles);
}

export async function getHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = roleParamsSchema.safeParse(request.params);
  if (!params.success) throw new ValidationError(params.error.errors[0].message);

  const role = await rolesService.getRoleById(this, params.data.id);
  return sendSuccess(reply, role);
}

export async function createHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = createRoleSchema.safeParse(request.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

  const role = await rolesService.createRole(this, parsed.data);
  return sendSuccess(reply, role, HTTP_STATUS.CREATED);
}

export async function updateHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = roleParamsSchema.safeParse(request.params);
  if (!params.success) throw new ValidationError(params.error.errors[0].message);

  const body = updateRoleSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.errors[0].message);

  const role = await rolesService.updateRole(this, params.data.id, body.data);
  return sendSuccess(reply, role);
}

export async function deleteHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = roleParamsSchema.safeParse(request.params);
  if (!params.success) throw new ValidationError(params.error.errors[0].message);

  await rolesService.deleteRole(this, params.data.id);
  return sendSuccess(reply, null);
}

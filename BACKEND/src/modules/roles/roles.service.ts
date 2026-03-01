import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import type { CreateRoleInput, UpdateRoleInput } from "./roles.schema.js";

export async function listRoles(app: FastifyInstance) {
  return app.prisma.role.findMany({ orderBy: { level: "desc" } });
}

export async function getRoleById(app: FastifyInstance, id: string) {
  const role = await app.prisma.role.findUnique({ where: { id } });
  if (!role) throw new NotFoundError("Role not found");
  return role;
}

export async function createRole(app: FastifyInstance, input: CreateRoleInput) {
  const existing = await app.prisma.role.findUnique({ where: { name: input.name } });
  if (existing) throw new ConflictError("Role name already exists", ERROR_CODES.CONFLICT);

  return app.prisma.role.create({ data: input });
}

export async function updateRole(app: FastifyInstance, id: string, input: UpdateRoleInput) {
  await getRoleById(app, id);

  if (input.name) {
    const existing = await app.prisma.role.findFirst({
      where: { name: input.name, NOT: { id } },
    });
    if (existing) throw new ConflictError("Role name already exists", ERROR_CODES.CONFLICT);
  }

  return app.prisma.role.update({ where: { id }, data: input });
}

export async function deleteRole(app: FastifyInstance, id: string) {
  await getRoleById(app, id);

  const usersCount = await app.prisma.user.count({ where: { roleId: id } });
  if (usersCount > 0) {
    throw new ConflictError("Role is still assigned to users", ERROR_CODES.ROLE_IN_USE);
  }

  await app.prisma.role.delete({ where: { id } });
}

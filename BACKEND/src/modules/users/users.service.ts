import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import { hashPassword } from "../auth/auth.service.js";
import type { CreateUserInput, UpdateUserInput, UserQuery } from "./users.schema.js";

const userSelect = {
  id: true,
  email: true,
  name: true,
  isActive: true,
  roleId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listUsers(app: FastifyInstance, query: UserQuery) {
  const where = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: "insensitive" as const } },
          { email: { contains: query.search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    app.prisma.user.findMany({
      where,
      select: userSelect,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: "desc" },
    }),
    app.prisma.user.count({ where }),
  ]);

  return { users, total, page: query.page, limit: query.limit };
}

export async function getUserById(app: FastifyInstance, id: string) {
  const user = await app.prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function createUser(app: FastifyInstance, input: CreateUserInput) {
  const existing = await app.prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("Email already exists", ERROR_CODES.EMAIL_EXISTS);

  return app.prisma.user.create({
    data: { ...input, password: await hashPassword(input.password) },
    select: userSelect,
  });
}

export async function updateUser(app: FastifyInstance, id: string, input: UpdateUserInput) {
  await getUserById(app, id);

  if (input.email) {
    const existing = await app.prisma.user.findFirst({
      where: { email: input.email, NOT: { id } },
    });
    if (existing) throw new ConflictError("Email already exists", ERROR_CODES.EMAIL_EXISTS);
  }

  return app.prisma.user.update({
    where: { id },
    data: input,
    select: userSelect,
  });
}

export async function deleteUser(app: FastifyInstance, id: string) {
  await getUserById(app, id);
  await app.prisma.user.delete({ where: { id } });
}

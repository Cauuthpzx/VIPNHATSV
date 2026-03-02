import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import { hashPassword } from "../auth/auth.service.js";
import type { CreateUserInput, UpdateUserInput, UserQuery } from "./users.schema.js";

const userSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
  isActive: true,
  roleId: true,
  role: true,
  lastLoginAt: true,
  lastLoginIp: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listUsers(app: FastifyInstance, query: UserQuery) {
  const where = query.search
    ? {
        OR: [
          { username: { contains: query.search, mode: "insensitive" as const } },
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
  const existing = await app.prisma.user.findUnique({ where: { username: input.username } });
  if (existing) throw new ConflictError("Tài khoản đã tồn tại", ERROR_CODES.USERNAME_EXISTS);

  return app.prisma.user.create({
    data: { ...input, email: input.email || null, password: await hashPassword(input.password) },
    select: userSelect,
  });
}

export async function updateUser(app: FastifyInstance, id: string, input: UpdateUserInput) {
  // Check username uniqueness in parallel with existence check (avoids N+1)
  const checks: Promise<unknown>[] = [
    app.prisma.user.findUnique({ where: { id }, select: { id: true } }),
  ];

  if (input.username) {
    checks.push(
      app.prisma.user.findFirst({
        where: { username: input.username, NOT: { id } },
        select: { id: true },
      }),
    );
  }

  const [user, duplicate] = await Promise.all(checks);
  if (!user) throw new NotFoundError("User not found");
  if (duplicate) throw new ConflictError("Tài khoản đã tồn tại", ERROR_CODES.USERNAME_EXISTS);

  return app.prisma.user.update({
    where: { id },
    data: { ...input, email: input.email === "" ? null : input.email },
    select: userSelect,
  });
}

export async function deleteUser(app: FastifyInstance, id: string) {
  await getUserById(app, id);
  await app.prisma.user.delete({ where: { id } });
}

import { PrismaClient, RoleType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      type: RoleType.ADMIN,
      level: 100,
      permissions: ["*"],
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "Manager" },
    update: {},
    create: {
      name: "Manager",
      type: RoleType.MANAGER,
      level: 50,
      permissions: [
        "users:read", "users:write", "roles:read",
        "member:read", "member:write", "invite:read", "invite:write",
        "report:read", "finance:read", "finance:write",
        "bet:read", "password:write", "rebate:read",
      ],
    },
  });

  await prisma.role.upsert({
    where: { name: "Viewer" },
    update: {},
    create: {
      name: "Viewer",
      type: RoleType.VIEWER,
      level: 10,
      permissions: [
        "users:read", "roles:read",
        "member:read", "invite:read", "report:read",
        "finance:read", "bet:read", "rebate:read",
      ],
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { password: await hashPassword("admin123") },
    create: {
      email: "admin@example.com",
      password: await hashPassword("admin123"),
      name: "Admin",
      roleId: adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: { password: await hashPassword("manager123") },
    create: {
      email: "manager@example.com",
      password: await hashPassword("manager123"),
      name: "Manager",
      roleId: managerRole.id,
    },
  });

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

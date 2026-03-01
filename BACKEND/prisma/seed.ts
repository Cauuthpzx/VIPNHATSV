import { PrismaClient, RoleType } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
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
      permissions: ["users:read", "users:write", "roles:read"],
    },
  });

  await prisma.role.upsert({
    where: { name: "Viewer" },
    update: {},
    create: {
      name: "Viewer",
      type: RoleType.VIEWER,
      level: 10,
      permissions: ["users:read", "roles:read"],
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashPassword("admin123"),
      name: "Admin",
      roleId: adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      password: hashPassword("manager123"),
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

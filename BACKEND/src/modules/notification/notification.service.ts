import type { PrismaClient } from "@prisma/client";

export async function getUnreadCount(prisma: PrismaClient): Promise<number> {
  return prisma.notification.count({ where: { isRead: false } });
}

export async function listNotifications(
  prisma: PrismaClient,
  opts: { unreadOnly?: boolean; limit?: number; offset?: number } = {},
) {
  const { unreadOnly = false, limit = 50, offset = 0 } = opts;

  const where = unreadOnly ? { isRead: false } : {};

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
      skip: offset,
      include: { agent: { select: { id: true, name: true } } },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    items: items.map((n) => ({
      id: n.id,
      agentId: n.agentId,
      agentName: n.agent.name,
      type: n.type,
      username: n.username,
      money: n.money,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    total,
  };
}

export async function markAsRead(prisma: PrismaClient, ids: string[]): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { id: { in: ids }, isRead: false },
    data: { isRead: true },
  });
  return result.count;
}

export async function markAllAsRead(prisma: PrismaClient): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });
  return result.count;
}

export async function deleteRead(prisma: PrismaClient): Promise<number> {
  const result = await prisma.notification.deleteMany({
    where: { isRead: true },
  });
  return result.count;
}

/**
 * Get member detail from proxy_users table.
 * Used by notification detail view to show member info.
 */
export async function getMemberDetail(
  prisma: PrismaClient,
  agentId: string,
  username: string,
) {
  const member = await prisma.proxyUser.findUnique({
    where: { uq_proxy_user: { agentId, username } },
  });

  if (!member) return null;

  return {
    username: member.username,
    typeFormat: member.typeFormat,
    parentUser: member.parentUser,
    money: member.money?.toString() ?? null,
    depositCount: member.depositCount ?? 0,
    withdrawalCount: member.withdrawalCount ?? 0,
    depositAmount: member.depositAmount?.toString() ?? "0",
    withdrawalAmount: member.withdrawalAmount?.toString() ?? "0",
    loginTime: member.loginTime,
    registerTime: member.registerTime,
    statusFormat: member.statusFormat,
    syncedAt: member.syncedAt.toISOString(),
  };
}

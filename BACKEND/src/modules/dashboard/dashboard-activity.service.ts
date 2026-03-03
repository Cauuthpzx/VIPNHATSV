import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";

/**
 * Dashboard Activity Feed — unified feed combining:
 * 1. New/lost members (from notifications table)
 * 2. Big deposits (>= threshold from proxy_deposits)
 * 3. Big withdrawals (>= threshold from proxy_withdrawals)
 *
 * This is SEPARATE from the bell notification system.
 */

export interface ActivityItem {
  id: string;
  type: "member_new" | "member_lost" | "big_deposit" | "big_withdrawal";
  agentId: string;
  agentName: string;
  username: string;
  money: string | null;
  createdAt: string;
}

export interface DashboardSettings {
  pollInterval: number;
  bigDepositMin: number;
  bigWithdrawMin: number;
}

const DEFAULT_SETTINGS: DashboardSettings = {
  pollInterval: 300,
  bigDepositMin: 10_000_000,
  bigWithdrawMin: 10_000_000,
};

/**
 * Get user's dashboard settings, falling back to defaults.
 */
export async function getSettings(
  app: FastifyInstance,
  userId: string,
): Promise<DashboardSettings> {
  const row = await app.prisma.dashboardSetting.findUnique({
    where: { userId },
  });
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    pollInterval: row.pollInterval,
    bigDepositMin: Number(row.bigDepositMin),
    bigWithdrawMin: Number(row.bigWithdrawMin),
  };
}

/**
 * Save user's dashboard settings (upsert).
 */
export async function saveSettings(
  app: FastifyInstance,
  userId: string,
  data: Partial<DashboardSettings>,
): Promise<DashboardSettings> {
  const row = await app.prisma.dashboardSetting.upsert({
    where: { userId },
    create: {
      userId,
      pollInterval: data.pollInterval ?? DEFAULT_SETTINGS.pollInterval,
      bigDepositMin: data.bigDepositMin ?? DEFAULT_SETTINGS.bigDepositMin,
      bigWithdrawMin: data.bigWithdrawMin ?? DEFAULT_SETTINGS.bigWithdrawMin,
    },
    update: {
      ...(data.pollInterval !== undefined && { pollInterval: data.pollInterval }),
      ...(data.bigDepositMin !== undefined && { bigDepositMin: data.bigDepositMin }),
      ...(data.bigWithdrawMin !== undefined && { bigWithdrawMin: data.bigWithdrawMin }),
    },
  });
  return {
    pollInterval: row.pollInterval,
    bigDepositMin: Number(row.bigDepositMin),
    bigWithdrawMin: Number(row.bigWithdrawMin),
  };
}

/**
 * Get unified activity feed for dashboard.
 * Combines member changes + big transactions from the last 24h.
 */
export async function getActivityFeed(
  app: FastifyInstance,
  userId: string,
  limit = 30,
): Promise<ActivityItem[]> {
  const settings = await getSettings(app, userId);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Agent name map
  const agents = await app.prisma.agent.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });
  const agentMap = new Map(agents.map((a) => [a.id, a.name]));

  // 1. Member new/lost from notifications (last 24h)
  const memberNotifs = await app.prisma.notification.findMany({
    where: {
      createdAt: { gte: cutoff },
      type: { in: ["member_new", "member_lost"] },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { agent: { select: { name: true } } },
  });

  const items: ActivityItem[] = memberNotifs.map((n) => ({
    id: n.id,
    type: n.type as ActivityItem["type"],
    agentId: n.agentId,
    agentName: n.agent.name,
    username: n.username,
    money: n.money,
    createdAt: n.createdAt.toISOString(),
  }));

  // 2. Big deposits (>= threshold) from proxy_deposits last 24h
  const bigDepositMin = new Prisma.Decimal(settings.bigDepositMin);
  const bigDeposits = await app.prisma.proxyDeposit.findMany({
    where: {
      amount: { gte: bigDepositMin },
      syncedAt: { gte: cutoff },
    },
    orderBy: { syncedAt: "desc" },
    take: limit,
    select: {
      id: true,
      agentId: true,
      username: true,
      amount: true,
      syncedAt: true,
    },
  });

  for (const d of bigDeposits) {
    items.push({
      id: `dep_${d.id}`,
      type: "big_deposit",
      agentId: d.agentId,
      agentName: agentMap.get(d.agentId) ?? d.agentId,
      username: d.username,
      money: d.amount?.toString() ?? null,
      createdAt: d.syncedAt.toISOString(),
    });
  }

  // 3. Big withdrawals (>= threshold) from proxy_withdrawals last 24h
  const bigWithdrawMin = new Prisma.Decimal(settings.bigWithdrawMin);
  const bigWithdrawals = await app.prisma.proxyWithdrawal.findMany({
    where: {
      amount: { gte: bigWithdrawMin },
      syncedAt: { gte: cutoff },
    },
    orderBy: { syncedAt: "desc" },
    take: limit,
    select: {
      id: true,
      agentId: true,
      username: true,
      amount: true,
      syncedAt: true,
    },
  });

  for (const w of bigWithdrawals) {
    items.push({
      id: `wdr_${w.id}`,
      type: "big_withdrawal",
      agentId: w.agentId,
      agentName: agentMap.get(w.agentId) ?? w.agentId,
      username: w.username,
      money: w.amount?.toString() ?? null,
      createdAt: w.syncedAt.toISOString(),
    });
  }

  // Sort by createdAt desc and limit
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items.slice(0, limit);
}

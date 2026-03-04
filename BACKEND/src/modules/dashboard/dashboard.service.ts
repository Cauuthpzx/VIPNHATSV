import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { LRUCache } from "../../utils/lruCache.js";

// Dashboard L1 cache — 10s TTL, avoids re-querying DB on rapid refreshes
const dashboardL1 = new LRUCache<string>(50, 10);

/** Cleanup L1 cache timers on shutdown */
export function destroyDashboardL1Cache(): void {
  dashboardL1.destroy();
}

/**
 * Dashboard summary — aggregate data from local DB (synced proxy tables).
 * All date strings use YYYY-MM-DD format matching proxy sync data.
 */

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function last7Days(): string[] {
  return lastNDays(7);
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(toDateStr(d));
  }
  return days;
}

function firstOfMonth(today: string): string {
  return today.slice(0, 7) + "-01";
}

interface KpiCard {
  label: string;
  value: number;
  count: number;
  yesterdayValue: number;
  yesterdayCount: number;
}

interface AgentOverviewRow {
  id: string;
  name: string;
  status: string;
  onlineCounts: Record<string, number>;
  newAccountsToday: number;
  betLotteryToday: number;
  betThirdToday: number;
  depositToday: number;
  totalDepositMonth: number;
  totalBetLotteryMonth: number;
  totalBetThirdMonth: number;
  winLoseLotteryMonth: number;
}

interface TrendPoint {
  date: string;
  deposit: number;
  withdrawal: number;
}

interface PlatformShare {
  name: string;
  value: number;
}

interface RecentNotification {
  id: string;
  agentName: string;
  type: string;
  username: string;
  money: string | null;
  createdAt: Date;
}

interface UserLoginRecord {
  id: string;
  username: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface DashboardSummary {
  kpi: {
    deposit: KpiCard;
    withdrawal: KpiCard;
    betLottery: KpiCard;
    betThirdGame: KpiCard;
    winLoseLottery: KpiCard;
    winLoseThirdGame: KpiCard;
    newMembers: KpiCard;
    lostMembers: KpiCard;
  };
  trend7d: TrendPoint[];
  platformShare: PlatformShare[];
  lotteryShare: PlatformShare[];
  agents: AgentOverviewRow[];
  agentDates: string[];
  notifications: RecentNotification[];
  loginInfo: {
    lastLoginAt: Date | null;
    lastLoginIp: string | null;
  };
  agentSessionSummary: {
    total: number;
    active: number;
    error: number;
    offline: number;
  };
  userLoginHistory: UserLoginRecord[];
}

/** Generate list of dates between start and end (inclusive) */
function dateRange(start: string, end: string): string[] {
  const days: string[] = [];
  const d = new Date(start + "T00:00:00Z");
  const endD = new Date(end + "T00:00:00Z");
  while (d <= endD) {
    days.push(toDateStr(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

/** Compute "previous period" of same length ending the day before start */
function prevPeriod(start: string, end: string): [string, string] {
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  const len = Math.round((e.getTime() - s.getTime()) / 86400000) + 1; // inclusive days
  const prevEnd = new Date(s);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - len + 1);
  return [toDateStr(prevStart), toDateStr(prevEnd)];
}

export async function getDashboardSummary(
  app: FastifyInstance,
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<DashboardSummary> {
  const today = toDateStr(new Date());

  // Date range: defaults to today only
  const rangeStart = startDate || today;
  const rangeEnd = endDate || today;

  // L1 cache — avoid re-computing on rapid dashboard refreshes
  const cacheKey = `dashboard:${userId}:${rangeStart}:${rangeEnd}`;
  const cached = dashboardL1.get(cacheKey);
  if (cached) return JSON.parse(cached);
  const rangeDays = dateRange(rangeStart, rangeEnd);
  const [prevStart, prevEnd] = prevPeriod(rangeStart, rangeEnd);

  // Date objects for notification queries
  const rangeStartDT = new Date(rangeStart + "T00:00:00.000Z");
  const rangeEndDT = new Date(rangeEnd + "T23:59:59.999Z");
  const prevStartDT = new Date(prevStart + "T00:00:00.000Z");
  const prevEndDT = new Date(prevEnd + "T23:59:59.999Z");

  // For trend chart: always show at least 7 days for meaningful chart
  const trendDays = rangeDays.length >= 7 ? rangeDays : last7Days();
  // For online counts: use last 10 days (always, not filtered by range)
  const days10 = lastNDays(10);
  const monthStart = firstOfMonth(today);

  // Run all queries in parallel — OPTIMIZED: combined aggregates (34 → 22 queries)
  const [
    // Combined: funds range (deposit+withdrawal in 1 query, was 2)
    fundsRange,
    // Combined: funds prev (deposit+withdrawal in 1 query, was 2)
    fundsPrev,
    // Combined: lottery range (bet+winLose in 1 query, was 2)
    lotteryRange,
    // Combined: lottery prev (bet+winLose in 1 query, was 2)
    lotteryPrev,
    // Combined: third range (bet+winLose in 1 query, was 2)
    thirdRange,
    // Combined: third prev (bet+winLose in 1 query, was 2)
    thirdPrev,
    // Combined: trend deposit+withdrawal (1 query, was 2)
    trendData,
    platformData,
    lotteryData,
    agentList,
    // Combined: agent funds range — deposit+withdrawal (1 query, was 2)
    agentFundsRange,
    _agentWinLose,
    recentNotifs,
    userInfo,
    agentStatuses,
    loginHistoryRaw,
    onlineCountsRaw,
    newAccountsRaw,
    agentBetLotteryToday,
    agentBetThirdToday,
    agentDepositMonth,
    agentLotteryMonth,
    agentThirdMonth,
    // Combined: notification counts (1 query for all 4 counters, was 4)
    notifCounts,
  ] = await Promise.all([
    // KPI: Funds (deposit+withdrawal) in selected range — COMBINED
    app.prisma.proxyReportFunds.aggregate({
      where: { reportDate: { in: rangeDays } },
      _sum: { depositAmount: true, depositCount: true, withdrawalAmount: true, withdrawalCount: true },
    }),
    // KPI: Funds (deposit+withdrawal) in previous period — COMBINED
    app.prisma.proxyReportFunds.aggregate({
      where: { reportDate: { gte: prevStart, lte: prevEnd } },
      _sum: { depositAmount: true, depositCount: true, withdrawalAmount: true, withdrawalCount: true },
    }),
    // KPI: Lottery (bet+winLose) in selected range — COMBINED
    app.prisma.proxyReportLottery.aggregate({
      where: { reportDate: { in: rangeDays } },
      _sum: { betAmount: true, betCount: true, winLose: true },
      _count: { _all: true },
    }),
    // KPI: Lottery (bet+winLose) in previous period — COMBINED
    app.prisma.proxyReportLottery.aggregate({
      where: { reportDate: { gte: prevStart, lte: prevEnd } },
      _sum: { betAmount: true, betCount: true, winLose: true },
      _count: { _all: true },
    }),
    // KPI: Third game (bet+winLose) in selected range — COMBINED
    app.prisma.proxyReportThirdGame.aggregate({
      where: { reportDate: { in: rangeDays } },
      _sum: { tBetAmount: true, tBetTimes: true, tWinLose: true },
      _count: { _all: true },
    }),
    // KPI: Third game (bet+winLose) in previous period — COMBINED
    app.prisma.proxyReportThirdGame.aggregate({
      where: { reportDate: { gte: prevStart, lte: prevEnd } },
      _sum: { tBetAmount: true, tBetTimes: true, tWinLose: true },
      _count: { _all: true },
    }),
    // Trend: deposit+withdrawal COMBINED (1 query, was 2)
    app.prisma.proxyReportFunds.groupBy({
      by: ["reportDate"],
      where: { reportDate: { in: trendDays } },
      _sum: { depositAmount: true, withdrawalAmount: true },
    }),
    // Platform share (3rd party)
    app.prisma.proxyReportThirdGame.groupBy({
      by: ["platformIdName"],
      where: { reportDate: { in: rangeDays } },
      _sum: { tBetAmount: true },
    }),
    // Lottery share
    app.prisma.proxyReportLottery.groupBy({
      by: ["lotteryName"],
      where: { reportDate: { in: rangeDays } },
      _sum: { betAmount: true },
    }),
    // Agent list
    app.prisma.agent.findMany({
      where: { isActive: true },
      select: { id: true, name: true, status: true },
      orderBy: { name: "asc" },
    }),
    // Agent funds range COMBINED — deposit+withdrawal (1 query, was 2)
    app.prisma.proxyReportFunds.groupBy({
      by: ["agentId"],
      where: { reportDate: { in: rangeDays } },
      _sum: { depositAmount: true, withdrawalAmount: true },
    }),
    // Agent win/lose in range
    app.prisma.proxyReportLottery.groupBy({
      by: ["agentId"],
      where: { reportDate: { in: rangeDays } },
      _sum: { winLose: true },
    }),
    // Recent notifications (last 10)
    app.prisma.notification.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { agent: { select: { name: true } } },
    }),
    // User login info
    app.prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginAt: true, lastLoginIp: true },
    }),
    // Agent session summary
    app.prisma.agent.groupBy({
      by: ["status"],
      where: { isActive: true },
      _count: true,
    }),
    // User login history
    app.prisma.refreshToken.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    }),
    // Online member counts (10 days)
    app.prisma.$queryRaw<{ agent_id: string; report_date: string; cnt: bigint }[]>`
      SELECT agent_id, report_date, COUNT(DISTINCT username)::bigint as cnt
      FROM (
        SELECT agent_id, report_date, username FROM proxy_report_lottery WHERE report_date = ANY(${days10})
        UNION
        SELECT agent_id, report_date, username FROM proxy_report_third_game WHERE report_date = ANY(${days10})
      ) combined
      GROUP BY agent_id, report_date
    `,
    // New accounts per agent
    app.prisma.$queryRaw<{ agent_id: string; cnt: bigint }[]>`
      SELECT agent_id, COUNT(DISTINCT username)::bigint AS cnt
      FROM notifications
      WHERE type = 'member_new'
        AND created_at >= ${rangeStart + "T00:00:00.000Z"}::timestamptz
        AND created_at < ${rangeEnd + "T23:59:59.999Z"}::timestamptz
      GROUP BY agent_id
    `,
    // Agent bet lottery in range (per agent)
    app.prisma.proxyReportLottery.groupBy({
      by: ["agentId"],
      where: { reportDate: { in: rangeDays } },
      _sum: { betAmount: true },
    }),
    // Agent bet 3rd in range (per agent)
    app.prisma.proxyReportThirdGame.groupBy({
      by: ["agentId"],
      where: { reportDate: { in: rangeDays } },
      _sum: { tBetAmount: true },
    }),
    // Monthly deposit (per agent)
    app.prisma.proxyReportFunds.groupBy({
      by: ["agentId"],
      where: { reportDate: { gte: monthStart, lte: today } },
      _sum: { depositAmount: true },
    }),
    // Monthly lottery bet + winLose (per agent)
    app.prisma.proxyReportLottery.groupBy({
      by: ["agentId"],
      where: { reportDate: { gte: monthStart, lte: today } },
      _sum: { betAmount: true, winLose: true },
    }),
    // Monthly 3rd game bet (per agent)
    app.prisma.proxyReportThirdGame.groupBy({
      by: ["agentId"],
      where: { reportDate: { gte: monthStart, lte: today } },
      _sum: { tBetAmount: true },
    }),
    // Notification counts COMBINED (1 query, was 4)
    app.prisma.$queryRaw<{ type: string; period: string; cnt: bigint }[]>`
      SELECT type, period, COUNT(*)::bigint as cnt FROM (
        SELECT type, 'range' as period FROM notifications
        WHERE type IN ('member_new', 'member_lost')
          AND created_at >= ${rangeStartDT}::timestamptz AND created_at <= ${rangeEndDT}::timestamptz
        UNION ALL
        SELECT type, 'prev' as period FROM notifications
        WHERE type IN ('member_new', 'member_lost')
          AND created_at >= ${prevStartDT}::timestamptz AND created_at <= ${prevEndDT}::timestamptz
      ) t GROUP BY type, period
    `,
  ]);

  // Build KPI cards — using combined query results
  const toNum = (v: Prisma.Decimal | null | undefined): number => (v ? Number(v) : 0);
  const toInt = (v: number | null | undefined): number => v ?? 0;

  // Parse combined notification counts
  const notifCountMap = new Map<string, number>();
  for (const row of notifCounts) {
    notifCountMap.set(`${row.type}:${row.period}`, Number(row.cnt));
  }
  const newMembersRange = notifCountMap.get("member_new:range") ?? 0;
  const newMembersPrev = notifCountMap.get("member_new:prev") ?? 0;
  const lostMembersRange = notifCountMap.get("member_lost:range") ?? 0;
  const lostMembersPrev = notifCountMap.get("member_lost:prev") ?? 0;

  // Dynamic label based on range
  const isToday = rangeStart === today && rangeEnd === today;
  const kpiSuffix = isToday ? "hôm nay" : `${rangeStart.slice(5)} → ${rangeEnd.slice(5)}`;

  const kpi = {
    deposit: {
      label: `Tổng Nạp ${kpiSuffix}`,
      value: toNum(fundsRange._sum.depositAmount),
      count: toInt(fundsRange._sum.depositCount),
      yesterdayValue: toNum(fundsPrev._sum.depositAmount),
      yesterdayCount: toInt(fundsPrev._sum.depositCount),
    },
    withdrawal: {
      label: `Tổng Rút ${kpiSuffix}`,
      value: toNum(fundsRange._sum.withdrawalAmount),
      count: toInt(fundsRange._sum.withdrawalCount),
      yesterdayValue: toNum(fundsPrev._sum.withdrawalAmount),
      yesterdayCount: toInt(fundsPrev._sum.withdrawalCount),
    },
    betLottery: {
      label: `Cược Xổ Số ${kpiSuffix}`,
      value: toNum(lotteryRange._sum.betAmount),
      count: toInt(lotteryRange._sum.betCount),
      yesterdayValue: toNum(lotteryPrev._sum.betAmount),
      yesterdayCount: toInt(lotteryPrev._sum.betCount),
    },
    betThirdGame: {
      label: `Cược 3rd Party ${kpiSuffix}`,
      value: toNum(thirdRange._sum.tBetAmount),
      count: toInt(thirdRange._sum.tBetTimes),
      yesterdayValue: toNum(thirdPrev._sum.tBetAmount),
      yesterdayCount: toInt(thirdPrev._sum.tBetTimes),
    },
    winLoseLottery: {
      label: `Thắng/Thua XS ${kpiSuffix}`,
      value: toNum(lotteryRange._sum.winLose),
      count: lotteryRange._count._all,
      yesterdayValue: toNum(lotteryPrev._sum.winLose),
      yesterdayCount: lotteryPrev._count._all,
    },
    winLoseThirdGame: {
      label: `Thắng/Thua 3rd ${kpiSuffix}`,
      value: toNum(thirdRange._sum.tWinLose),
      count: thirdRange._count._all,
      yesterdayValue: toNum(thirdPrev._sum.tWinLose),
      yesterdayCount: thirdPrev._count._all,
    },
    newMembers: {
      label: `Khách mới ${kpiSuffix}`,
      value: newMembersRange,
      count: newMembersRange,
      yesterdayValue: newMembersPrev,
      yesterdayCount: newMembersPrev,
    },
    lostMembers: {
      label: `Khách mất ${kpiSuffix}`,
      value: lostMembersRange,
      count: lostMembersRange,
      yesterdayValue: lostMembersPrev,
      yesterdayCount: lostMembersPrev,
    },
  };

  // Build trend (range days) — from combined trendData query
  const trendDepositMap = new Map(trendData.map((d) => [d.reportDate, toNum(d._sum.depositAmount)]));
  const trendWithdrawalMap = new Map(trendData.map((d) => [d.reportDate, toNum(d._sum.withdrawalAmount)]));
  const trend7d: TrendPoint[] = trendDays.map((date) => ({
    date,
    deposit: trendDepositMap.get(date) ?? 0,
    withdrawal: trendWithdrawalMap.get(date) ?? 0,
  }));

  // Build platform share (3rd party)
  const platformShare: PlatformShare[] = platformData
    .map((p) => ({ name: p.platformIdName, value: toNum(p._sum.tBetAmount) }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value);

  // Build lottery share
  const lotteryShare: PlatformShare[] = lotteryData
    .map((l) => ({ name: l.lotteryName, value: toNum(l._sum.betAmount) }))
    .filter((l) => l.value > 0)
    .sort((a, b) => b.value - a.value);

  // Build agent overview table — from combined agentFundsRange query
  const depMap = new Map(agentFundsRange.map((d) => [d.agentId, toNum(d._sum.depositAmount)]));
  const newAccMap = new Map(newAccountsRaw.map((d) => [d.agent_id, Number(d.cnt)]));
  const betLotTodayMap = new Map(agentBetLotteryToday.map((d) => [d.agentId, toNum(d._sum.betAmount)]));
  const betThirdTodayMap = new Map(agentBetThirdToday.map((d) => [d.agentId, toNum(d._sum.tBetAmount)]));
  const depMonthMap = new Map(agentDepositMonth.map((d) => [d.agentId, toNum(d._sum.depositAmount)]));
  const betLotMonthMap = new Map(agentLotteryMonth.map((d) => [d.agentId, toNum(d._sum.betAmount)]));
  const betThirdMonthMap = new Map(agentThirdMonth.map((d) => [d.agentId, toNum(d._sum.tBetAmount)]));
  const wlMonthMap = new Map(agentLotteryMonth.map((d) => [d.agentId, toNum(d._sum.winLose)]));

  // Build online counts: Map<agentId, Record<date, count>>
  const onlineMap = new Map<string, Record<string, number>>();
  for (const row of onlineCountsRaw) {
    const agentCounts = onlineMap.get(row.agent_id) ?? {};
    agentCounts[row.report_date] = Number(row.cnt);
    onlineMap.set(row.agent_id, agentCounts);
  }

  const agents: AgentOverviewRow[] = agentList.map((a) => ({
    id: a.id,
    name: a.name,
    status: a.status,
    onlineCounts: onlineMap.get(a.id) ?? {},
    newAccountsToday: newAccMap.get(a.id) ?? 0,
    betLotteryToday: betLotTodayMap.get(a.id) ?? 0,
    betThirdToday: betThirdTodayMap.get(a.id) ?? 0,
    depositToday: depMap.get(a.id) ?? 0,
    totalDepositMonth: depMonthMap.get(a.id) ?? 0,
    totalBetLotteryMonth: betLotMonthMap.get(a.id) ?? 0,
    totalBetThirdMonth: betThirdMonthMap.get(a.id) ?? 0,
    winLoseLotteryMonth: wlMonthMap.get(a.id) ?? 0,
  }));

  // Build notifications
  const notifications: RecentNotification[] = recentNotifs.map((n) => ({
    id: n.id,
    agentName: n.agent.name,
    type: n.type,
    username: n.username,
    money: n.money,
    createdAt: n.createdAt,
  }));

  // Agent session summary
  const statusMap = new Map(agentStatuses.map((s) => [s.status, s._count]));
  const totalAgents = agentList.length;
  const agentSessionSummary = {
    total: totalAgents,
    active: statusMap.get("active") ?? 0,
    error: statusMap.get("error") ?? 0,
    offline: totalAgents - (statusMap.get("active") ?? 0) - (statusMap.get("error") ?? 0),
  };

  // Build user login history
  const userLoginHistory: UserLoginRecord[] = loginHistoryRaw.map((h) => ({
    id: h.id,
    username: h.user.username,
    ipAddress: h.ipAddress,
    userAgent: h.userAgent,
    createdAt: h.createdAt,
  }));

  const result: DashboardSummary = {
    kpi,
    trend7d,
    platformShare,
    lotteryShare,
    agents,
    agentDates: days10,
    notifications,
    loginInfo: {
      lastLoginAt: userInfo?.lastLoginAt ?? null,
      lastLoginIp: userInfo?.lastLoginIp ?? null,
    },
    agentSessionSummary,
    userLoginHistory,
  };

  // Store in L1 cache (10s TTL) — prevents re-computation on rapid refreshes
  dashboardL1.set(cacheKey, JSON.stringify(result), 10);

  return result;
}

/**
 * Get list of online member usernames for a specific agent and date.
 * "Online" = had bets in lottery or 3rd party reports on that date.
 */
export async function getOnlineMembers(
  app: FastifyInstance,
  agentId: string,
  date: string,
): Promise<string[]> {
  const rows = await app.prisma.$queryRaw<{ username: string }[]>`
    SELECT DISTINCT username FROM (
      SELECT username FROM proxy_report_lottery WHERE agent_id = ${agentId} AND report_date = ${date}
      UNION
      SELECT username FROM proxy_report_third_game WHERE agent_id = ${agentId} AND report_date = ${date}
    ) combined
    ORDER BY username
  `;
  return rows.map((r) => r.username);
}

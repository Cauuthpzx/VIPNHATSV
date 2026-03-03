import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";

const toNum = (v: Prisma.Decimal | null | undefined): number => v ? Number(v) : 0;
const toInt = (v: number | null | undefined): number => v ?? 0;

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
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

// ===================================================================
// 1. FINANCE ANALYTICS — Nạp / Rút chi tiết
// ===================================================================

export interface FinanceAnalytics {
  trend30d: { date: string; deposit: number; withdrawal: number; net: number }[];
  depositByAgent: { agentName: string; value: number }[];
  withdrawalByAgent: { agentName: string; value: number }[];
  dailyFees: { date: string; chargeFee: number; commission: number; promotion: number; thirdRebate: number }[];
  depositStatusBreakdown: { status: string; count: number; amount: number }[];
  withdrawalStatusBreakdown: { status: string; count: number; amount: number }[];
  topDepositors: { username: string; agentName: string; totalAmount: number; count: number }[];
  topWithdrawers: { username: string; agentName: string; totalAmount: number; count: number }[];
}

export async function getFinanceAnalytics(
  app: FastifyInstance,
  days: number = 30,
): Promise<FinanceAnalytics> {
  const dateRange = lastNDays(days);
  const dateSet = new Set(dateRange);

  const [
    depositTrend,
    withdrawalTrend,
    depByAgent,
    wdByAgent,
    feeTrend,
    depositStatus,
    withdrawalStatus,
    topDep,
    topWd,
    agents,
  ] = await Promise.all([
    app.prisma.proxyReportFunds.groupBy({
      by: ["reportDate"],
      where: { reportDate: { in: dateRange } },
      _sum: { depositAmount: true },
    }),
    app.prisma.proxyReportFunds.groupBy({
      by: ["reportDate"],
      where: { reportDate: { in: dateRange } },
      _sum: { withdrawalAmount: true },
    }),
    app.prisma.proxyReportFunds.groupBy({
      by: ["agentId"],
      where: { reportDate: { in: dateRange } },
      _sum: { depositAmount: true },
    }),
    app.prisma.proxyReportFunds.groupBy({
      by: ["agentId"],
      where: { reportDate: { in: dateRange } },
      _sum: { withdrawalAmount: true },
    }),
    app.prisma.proxyReportFunds.groupBy({
      by: ["reportDate"],
      where: { reportDate: { in: dateRange } },
      _sum: { chargeFee: true, agentCommission: true, promotion: true, thirdRebate: true },
    }),
    app.prisma.proxyDeposit.groupBy({
      by: ["status"],
      where: { syncDate: { in: dateRange } },
      _count: true,
      _sum: { amount: true },
    }),
    app.prisma.proxyWithdrawal.groupBy({
      by: ["statusFormat"],
      where: { syncDate: { in: dateRange } },
      _count: true,
      _sum: { amount: true },
    }),
    app.prisma.proxyReportFunds.groupBy({
      by: ["username", "agentId"],
      where: { reportDate: { in: dateRange } },
      _sum: { depositAmount: true, depositCount: true },
      orderBy: { _sum: { depositAmount: "desc" } },
      take: 10,
    }),
    app.prisma.proxyReportFunds.groupBy({
      by: ["username", "agentId"],
      where: { reportDate: { in: dateRange } },
      _sum: { withdrawalAmount: true, withdrawalCount: true },
      orderBy: { _sum: { withdrawalAmount: "desc" } },
      take: 10,
    }),
    app.prisma.agent.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  const agentMap = new Map(agents.map((a) => [a.id, a.name]));
  const depMap = new Map(depositTrend.map((d) => [d.reportDate, toNum(d._sum.depositAmount)]));
  const wdMap = new Map(withdrawalTrend.map((d) => [d.reportDate, toNum(d._sum.withdrawalAmount)]));

  const trend30d = dateRange.map((date) => {
    const dep = depMap.get(date) ?? 0;
    const wd = wdMap.get(date) ?? 0;
    return { date, deposit: dep, withdrawal: wd, net: dep - wd };
  });

  const feeMap = new Map(feeTrend.map((f) => [f.reportDate, f._sum]));
  const dailyFees = dateRange.map((date) => {
    const s = feeMap.get(date);
    return {
      date,
      chargeFee: s ? toNum(s.chargeFee) : 0,
      commission: s ? toNum(s.agentCommission) : 0,
      promotion: s ? toNum(s.promotion) : 0,
      thirdRebate: s ? toNum(s.thirdRebate) : 0,
    };
  });

  return {
    trend30d,
    depositByAgent: depByAgent
      .map((d) => ({ agentName: agentMap.get(d.agentId) ?? d.agentId, value: toNum(d._sum.depositAmount) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value),
    withdrawalByAgent: wdByAgent
      .map((d) => ({ agentName: agentMap.get(d.agentId) ?? d.agentId, value: toNum(d._sum.withdrawalAmount) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value),
    dailyFees,
    depositStatusBreakdown: depositStatus
      .map((d) => ({ status: d.status ?? "N/A", count: d._count, amount: toNum(d._sum.amount) }))
      .sort((a, b) => b.amount - a.amount),
    withdrawalStatusBreakdown: withdrawalStatus
      .map((d) => ({ status: d.statusFormat ?? "N/A", count: d._count, amount: toNum(d._sum.amount) }))
      .sort((a, b) => b.amount - a.amount),
    topDepositors: topDep.map((d) => ({
      username: d.username,
      agentName: agentMap.get(d.agentId) ?? d.agentId,
      totalAmount: toNum(d._sum.depositAmount),
      count: toInt(d._sum.depositCount),
    })),
    topWithdrawers: topWd.map((d) => ({
      username: d.username,
      agentName: agentMap.get(d.agentId) ?? d.agentId,
      totalAmount: toNum(d._sum.withdrawalAmount),
      count: toInt(d._sum.withdrawalCount),
    })),
  };
}

// ===================================================================
// 2. BETTING ANALYTICS — Phân tích cược
// ===================================================================

export interface BettingAnalytics {
  lotteryTrend: { date: string; betAmount: number; winLose: number; betCount: number }[];
  thirdGameTrend: { date: string; betAmount: number; winLose: number; betTimes: number }[];
  lotteryByType: { name: string; betAmount: number; winLose: number; betCount: number }[];
  platformRanking: { name: string; betAmount: number; turnover: number; winLose: number; betTimes: number }[];
  profitByDay: { date: string; lotteryProfit: number; thirdGameProfit: number; totalProfit: number }[];
  topBettors: { username: string; agentName: string; betAmount: number; winLose: number }[];
}

export async function getBettingAnalytics(
  app: FastifyInstance,
  days: number = 30,
): Promise<BettingAnalytics> {
  const dateRange = lastNDays(days);

  const [
    lotteryByDate,
    thirdByDate,
    lotteryByName,
    platformRank,
    topBetRaw,
    agents,
  ] = await Promise.all([
    app.prisma.proxyReportLottery.groupBy({
      by: ["reportDate"],
      where: { reportDate: { in: dateRange } },
      _sum: { betAmount: true, winLose: true, betCount: true },
    }),
    app.prisma.proxyReportThirdGame.groupBy({
      by: ["reportDate"],
      where: { reportDate: { in: dateRange } },
      _sum: { tBetAmount: true, tWinLose: true, tBetTimes: true },
    }),
    app.prisma.proxyReportLottery.groupBy({
      by: ["lotteryName"],
      where: { reportDate: { in: dateRange } },
      _sum: { betAmount: true, winLose: true, betCount: true },
      orderBy: { _sum: { betAmount: "desc" } },
      take: 15,
    }),
    app.prisma.proxyReportThirdGame.groupBy({
      by: ["platformIdName"],
      where: { reportDate: { in: dateRange } },
      _sum: { tBetAmount: true, tTurnover: true, tWinLose: true, tBetTimes: true },
      orderBy: { _sum: { tBetAmount: "desc" } },
      take: 15,
    }),
    app.prisma.proxyReportLottery.groupBy({
      by: ["username", "agentId"],
      where: { reportDate: { in: dateRange } },
      _sum: { betAmount: true, winLose: true },
      orderBy: { _sum: { betAmount: "desc" } },
      take: 10,
    }),
    app.prisma.agent.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  const agentMap = new Map(agents.map((a) => [a.id, a.name]));

  const lotteryMap = new Map(lotteryByDate.map((d) => [d.reportDate, d._sum]));
  const thirdMap = new Map(thirdByDate.map((d) => [d.reportDate, d._sum]));

  const lotteryTrend = dateRange.map((date) => {
    const s = lotteryMap.get(date);
    return {
      date,
      betAmount: s ? toNum(s.betAmount) : 0,
      winLose: s ? toNum(s.winLose) : 0,
      betCount: s ? toInt(s.betCount) : 0,
    };
  });

  const thirdGameTrend = dateRange.map((date) => {
    const s = thirdMap.get(date);
    return {
      date,
      betAmount: s ? toNum(s.tBetAmount) : 0,
      winLose: s ? toNum(s.tWinLose) : 0,
      betTimes: s ? toInt(s.tBetTimes) : 0,
    };
  });

  const profitByDay = dateRange.map((date) => {
    const l = lotteryMap.get(date);
    const t = thirdMap.get(date);
    const lp = l ? -toNum(l.winLose) : 0; // winLose từ player perspective, profit = -winLose
    const tp = t ? -toNum(t.tWinLose) : 0;
    return { date, lotteryProfit: lp, thirdGameProfit: tp, totalProfit: lp + tp };
  });

  return {
    lotteryTrend,
    thirdGameTrend,
    lotteryByType: lotteryByName.map((d) => ({
      name: d.lotteryName,
      betAmount: toNum(d._sum.betAmount),
      winLose: toNum(d._sum.winLose),
      betCount: toInt(d._sum.betCount),
    })),
    platformRanking: platformRank.map((d) => ({
      name: d.platformIdName,
      betAmount: toNum(d._sum.tBetAmount),
      turnover: toNum(d._sum.tTurnover),
      winLose: toNum(d._sum.tWinLose),
      betTimes: toInt(d._sum.tBetTimes),
    })),
    profitByDay,
    topBettors: topBetRaw.map((d) => ({
      username: d.username,
      agentName: agentMap.get(d.agentId) ?? d.agentId,
      betAmount: toNum(d._sum.betAmount),
      winLose: toNum(d._sum.winLose),
    })),
  };
}

// ===================================================================
// 3. MEMBER ANALYTICS — Phân tích hội viên
// ===================================================================

export interface MemberAnalytics {
  totalMembers: number;
  membersByAgent: { agentName: string; count: number }[];
  memberStatusDistribution: { status: string; count: number }[];
  memberTypeDistribution: { type: string; count: number }[];
  churnTrend: { date: string; newMembers: number; lostMembers: number; net: number }[];
  topMembersByBalance: { username: string; agentName: string; money: number }[];
  topMembersByDeposit: { username: string; agentName: string; depositAmount: number; depositCount: number }[];
  registrationByMonth: { month: string; count: number }[];
}

export async function getMemberAnalytics(app: FastifyInstance): Promise<MemberAnalytics> {
  const last30 = lastNDays(30);

  const [
    totalMembers,
    membersByAgent,
    statusDist,
    typeDist,
    churnData,
    topBalance,
    topDep,
    agents,
  ] = await Promise.all([
    app.prisma.proxyUser.count(),
    app.prisma.proxyUser.groupBy({
      by: ["agentId"],
      _count: true,
    }),
    app.prisma.proxyUser.groupBy({
      by: ["statusFormat"],
      _count: true,
    }),
    app.prisma.proxyUser.groupBy({
      by: ["typeFormat"],
      _count: true,
    }),
    // Notification churn: new vs lost over 30 days
    app.prisma.notification.groupBy({
      by: ["type"],
      where: {
        createdAt: { gte: new Date(last30[0] + "T00:00:00Z") },
      },
      _count: true,
    }),
    app.prisma.proxyUser.findMany({
      orderBy: { money: "desc" },
      where: { money: { not: null } },
      take: 10,
      select: { username: true, agentId: true, money: true },
    }),
    app.prisma.proxyUser.findMany({
      orderBy: { depositAmount: "desc" },
      where: { depositAmount: { not: null, gt: 0 } },
      take: 10,
      select: { username: true, agentId: true, depositAmount: true, depositCount: true },
    }),
    app.prisma.agent.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  const agentMap = new Map(agents.map((a) => [a.id, a.name]));

  // Churn by day (raw SQL for date grouping on timestamp)
  const churnByDay = await app.prisma.$queryRaw<
    { dt: string; type: string; cnt: bigint }[]
  >`
    SELECT to_char(created_at, 'YYYY-MM-DD') as dt, type, COUNT(*)::bigint as cnt
    FROM notifications
    WHERE created_at >= ${new Date(last30[0] + "T00:00:00Z")}
    GROUP BY dt, type
    ORDER BY dt
  `;

  const churnMap = new Map<string, { newMembers: number; lostMembers: number }>();
  for (const r of churnByDay) {
    const entry = churnMap.get(r.dt) ?? { newMembers: 0, lostMembers: 0 };
    if (r.type === "member_new") entry.newMembers = Number(r.cnt);
    else if (r.type === "member_lost") entry.lostMembers = Number(r.cnt);
    churnMap.set(r.dt, entry);
  }

  const churnTrend = last30.map((date) => {
    const e = churnMap.get(date) ?? { newMembers: 0, lostMembers: 0 };
    return { date, ...e, net: e.newMembers - e.lostMembers };
  });

  // Registration by month (from registerTime string "YYYY-MM-DD HH:mm:ss")
  const regByMonth = await app.prisma.$queryRaw<
    { month: string; cnt: bigint }[]
  >`
    SELECT LEFT(register_time, 7) as month, COUNT(*)::bigint as cnt
    FROM proxy_users
    WHERE register_time IS NOT NULL AND register_time != ''
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `;

  return {
    totalMembers,
    membersByAgent: membersByAgent
      .map((d) => ({ agentName: agentMap.get(d.agentId) ?? d.agentId, count: d._count }))
      .sort((a, b) => b.count - a.count),
    memberStatusDistribution: statusDist
      .map((d) => ({ status: d.statusFormat ?? "N/A", count: d._count }))
      .sort((a, b) => b.count - a.count),
    memberTypeDistribution: typeDist
      .map((d) => ({ type: d.typeFormat ?? "N/A", count: d._count }))
      .sort((a, b) => b.count - a.count),
    churnTrend,
    topMembersByBalance: topBalance.map((d) => ({
      username: d.username,
      agentName: agentMap.get(d.agentId) ?? d.agentId,
      money: toNum(d.money),
    })),
    topMembersByDeposit: topDep.map((d) => ({
      username: d.username,
      agentName: agentMap.get(d.agentId) ?? d.agentId,
      depositAmount: toNum(d.depositAmount),
      depositCount: d.depositCount ?? 0,
    })),
    registrationByMonth: regByMonth.reverse().map((r) => ({
      month: r.month,
      count: Number(r.cnt),
    })),
  };
}

// ===================================================================
// 4. AGENT PERFORMANCE — Hiệu suất Agent
// ===================================================================

export interface AgentPerformance {
  agentOverview: {
    name: string;
    status: string;
    userCount: number;
    totalDeposit: number;
    totalWithdrawal: number;
    lotteryBet: number;
    lotteryWinLose: number;
    thirdBet: number;
    thirdWinLose: number;
    commission: number;
  }[];
  agentTrend: {
    date: string;
    agents: { name: string; deposit: number; withdrawal: number }[];
  }[];
  loginHistory: {
    agentName: string;
    successCount: number;
    failCount: number;
    avgCaptchaAttempts: number;
    lastLogin: string | null;
  }[];
  agentCommissionTrend: { date: string; commission: number; promotion: number }[];
}

export async function getAgentPerformance(
  app: FastifyInstance,
  days: number = 30,
): Promise<AgentPerformance> {
  const dateRange = lastNDays(days);

  const [
    agents,
    userCounts,
    depByAgent,
    wdByAgent,
    lotteryByAgent,
    thirdByAgent,
    commByAgent,
    depTrend,
    loginStats,
    commTrend,
  ] = await Promise.all([
    app.prisma.agent.findMany({
      where: { isActive: true },
      select: { id: true, name: true, status: true, lastLoginAt: true },
      orderBy: { name: "asc" },
    }),
    app.prisma.proxyUser.groupBy({ by: ["agentId"], _count: true }),
    app.prisma.proxyReportFunds.groupBy({
      by: ["agentId"],
      where: { reportDate: { in: dateRange } },
      _sum: { depositAmount: true },
    }),
    app.prisma.proxyReportFunds.groupBy({
      by: ["agentId"],
      where: { reportDate: { in: dateRange } },
      _sum: { withdrawalAmount: true },
    }),
    app.prisma.proxyReportLottery.groupBy({
      by: ["agentId"],
      where: { reportDate: { in: dateRange } },
      _sum: { betAmount: true, winLose: true },
    }),
    app.prisma.proxyReportThirdGame.groupBy({
      by: ["agentId"],
      where: { reportDate: { in: dateRange } },
      _sum: { tBetAmount: true, tWinLose: true },
    }),
    app.prisma.proxyReportFunds.groupBy({
      by: ["agentId"],
      where: { reportDate: { in: dateRange } },
      _sum: { agentCommission: true },
    }),
    // Deposit trend by agent per day (last 7 days for readability)
    app.prisma.proxyReportFunds.groupBy({
      by: ["agentId", "reportDate"],
      where: { reportDate: { in: lastNDays(7) } },
      _sum: { depositAmount: true, withdrawalAmount: true },
    }),
    // Login stats per agent
    app.prisma.agentLoginHistory.groupBy({
      by: ["agentId", "success"],
      where: {
        createdAt: { gte: new Date(dateRange[0] + "T00:00:00Z") },
      },
      _count: true,
      _avg: { captchaAttempts: true },
    }),
    app.prisma.proxyReportFunds.groupBy({
      by: ["reportDate"],
      where: { reportDate: { in: dateRange } },
      _sum: { agentCommission: true, promotion: true },
    }),
  ]);

  const ucMap = new Map(userCounts.map((d) => [d.agentId, d._count]));
  const depMap = new Map(depByAgent.map((d) => [d.agentId, toNum(d._sum.depositAmount)]));
  const wdMap = new Map(wdByAgent.map((d) => [d.agentId, toNum(d._sum.withdrawalAmount)]));
  const lotBetMap = new Map(lotteryByAgent.map((d) => [d.agentId, { bet: toNum(d._sum.betAmount), wl: toNum(d._sum.winLose) }]));
  const thirdBetMap = new Map(thirdByAgent.map((d) => [d.agentId, { bet: toNum(d._sum.tBetAmount), wl: toNum(d._sum.tWinLose) }]));
  const commMap = new Map(commByAgent.map((d) => [d.agentId, toNum(d._sum.agentCommission)]));

  const agentOverview = agents.map((a) => {
    const lot = lotBetMap.get(a.id) ?? { bet: 0, wl: 0 };
    const third = thirdBetMap.get(a.id) ?? { bet: 0, wl: 0 };
    return {
      name: a.name,
      status: a.status,
      userCount: ucMap.get(a.id) ?? 0,
      totalDeposit: depMap.get(a.id) ?? 0,
      totalWithdrawal: wdMap.get(a.id) ?? 0,
      lotteryBet: lot.bet,
      lotteryWinLose: lot.wl,
      thirdBet: third.bet,
      thirdWinLose: third.wl,
      commission: commMap.get(a.id) ?? 0,
    };
  });

  // Agent deposit trend (7d)
  const agentNames = new Map(agents.map((a) => [a.id, a.name]));
  const days7 = lastNDays(7);
  const trendGrouped = new Map<string, Map<string, { deposit: number; withdrawal: number }>>();
  for (const r of depTrend) {
    if (!trendGrouped.has(r.reportDate)) trendGrouped.set(r.reportDate, new Map());
    trendGrouped.get(r.reportDate)!.set(r.agentId, {
      deposit: toNum(r._sum.depositAmount),
      withdrawal: toNum(r._sum.withdrawalAmount),
    });
  }
  const agentTrend = days7.map((date) => {
    const dayData = trendGrouped.get(date) ?? new Map();
    return {
      date,
      agents: agents.map((a) => ({
        name: a.name,
        deposit: dayData.get(a.id)?.deposit ?? 0,
        withdrawal: dayData.get(a.id)?.withdrawal ?? 0,
      })),
    };
  });

  // Login stats
  const loginMap = new Map<string, { success: number; fail: number; avgCaptcha: number }>();
  for (const r of loginStats) {
    const entry = loginMap.get(r.agentId) ?? { success: 0, fail: 0, avgCaptcha: 0 };
    if (r.success) {
      entry.success = r._count;
      entry.avgCaptcha = r._avg.captchaAttempts ?? 0;
    } else {
      entry.fail = r._count;
    }
    loginMap.set(r.agentId, entry);
  }

  const loginHistory = agents.map((a) => {
    const stats = loginMap.get(a.id) ?? { success: 0, fail: 0, avgCaptcha: 0 };
    return {
      agentName: a.name,
      successCount: stats.success,
      failCount: stats.fail,
      avgCaptchaAttempts: Math.round(stats.avgCaptcha * 10) / 10,
      lastLogin: a.lastLoginAt?.toISOString() ?? null,
    };
  });

  const commTrendMap = new Map(commTrend.map((d) => [d.reportDate, d._sum]));
  const agentCommissionTrend = dateRange.map((date) => {
    const s = commTrendMap.get(date);
    return {
      date,
      commission: s ? toNum(s.agentCommission) : 0,
      promotion: s ? toNum(s.promotion) : 0,
    };
  });

  return {
    agentOverview,
    agentTrend,
    loginHistory,
    agentCommissionTrend,
  };
}

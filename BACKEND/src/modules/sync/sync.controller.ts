import type { FastifyRequest, FastifyReply } from "fastify";
import { getIsSyncing, runFullSync } from "./sync.service.js";
import {
  SYNC_ENDPOINTS,
  SYNC_INTERVAL_MS,
  SYNC_AGENT_CONCURRENCY,
  SYNC_PAGE_CONCURRENCY,
} from "./sync.config.js";
import { logger } from "../../utils/logger.js";

const TABLE_LABELS: Record<string, string> = {
  proxy_users: "Hội viên",
  proxy_invites: "Mã giới thiệu",
  proxy_deposits: "Nạp tiền",
  proxy_withdrawals: "Rút tiền",
  proxy_bets: "Đơn cược xổ số",
  proxy_bet_orders: "Đơn cược bên thứ 3",
  proxy_report_lottery: "Báo cáo xổ số",
  proxy_report_funds: "Sao kê giao dịch",
  proxy_report_third_game: "Báo cáo nhà cung cấp",
  proxy_banks: "Ngân hàng",
};

const TABLE_ICONS: Record<string, string> = {
  proxy_users: "layui-icon-username",
  proxy_invites: "layui-icon-vercode",
  proxy_deposits: "layui-icon-upload-circle",
  proxy_withdrawals: "layui-icon-download-circle",
  proxy_bets: "layui-icon-note",
  proxy_bet_orders: "layui-icon-template",
  proxy_report_lottery: "layui-icon-chart",
  proxy_report_funds: "layui-icon-tabs",
  proxy_report_third_game: "layui-icon-chart-screen",
  proxy_banks: "layui-icon-dollar",
};

// Map Prisma model names to actual table names
const MODEL_TO_TABLE: Record<string, string> = {
  proxyUser: "proxy_users",
  proxyInvite: "proxy_invites",
  proxyDeposit: "proxy_deposits",
  proxyWithdrawal: "proxy_withdrawals",
  proxyBet: "proxy_bets",
  proxyBetOrder: "proxy_bet_orders",
  proxyReportLottery: "proxy_report_lottery",
  proxyReportFunds: "proxy_report_funds",
  proxyReportThirdGame: "proxy_report_third_game",
  proxyBank: "proxy_banks",
};

// All tables that have agent_id column
const TABLES_WITH_AGENT = Object.values(MODEL_TO_TABLE);

/**
 * GET /sync/status — Full sync dashboard data:
 * - Per-table totals + per-agent breakdown (tree structure)
 * - Agent overview with cookie status
 * - Global stats
 */
export async function syncStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const prisma = request.server.prisma;

  // 1. Per-table totals
  const tableNames = Object.values(MODEL_TO_TABLE);
  const unionParts = tableNames.map(
    (t) => `SELECT '${t}' as table_name, count(*)::int as row_count, max("synced_at") as last_synced_at FROM "${t}"`,
  );
  const tableStats: Array<{ table_name: string; row_count: number; last_synced_at: Date | null }> =
    await prisma.$queryRawUnsafe(unionParts.join(" UNION ALL "));

  // 2. Per-agent-per-table breakdown
  const breakdownParts = TABLES_WITH_AGENT.map(
    (t) => `SELECT '${t}' as table_name, "agent_id", count(*)::int as row_count, max("synced_at") as last_synced_at FROM "${t}" GROUP BY "agent_id"`,
  );
  const breakdown: Array<{
    table_name: string;
    agent_id: string;
    row_count: number;
    last_synced_at: Date | null;
  }> = await prisma.$queryRawUnsafe(breakdownParts.join(" UNION ALL "));

  // 3. All agents
  const agentsRaw: Array<{
    id: string;
    name: string;
    ext_username: string;
    is_active: boolean;
    status: string;
    cookie_expires: Date | null;
  }> = await prisma.$queryRawUnsafe(`
    SELECT a.id, a.name, a."ext_username", a."is_active", a.status, a."cookie_expires"
    FROM agents a ORDER BY a.name
  `);

  const agentMap = new Map(agentsRaw.map((a) => [a.id, a]));

  // Build breakdown map: table_name -> agent_id -> { row_count, last_synced_at }
  const breakdownMap = new Map<string, Map<string, { row_count: number; last_synced_at: Date | null }>>();
  for (const b of breakdown) {
    if (!breakdownMap.has(b.table_name)) breakdownMap.set(b.table_name, new Map());
    breakdownMap.get(b.table_name)!.set(b.agent_id, { row_count: b.row_count, last_synced_at: b.last_synced_at });
  }

  // 4. Build tree data: each table is a parent, agents are children
  const tables = tableStats.map((row) => {
    const agentBreakdown = breakdownMap.get(row.table_name);
    const children = agentsRaw
      .filter((a) => a.is_active && a.status === "active")
      .map((a) => {
        const stats = agentBreakdown?.get(a.id);
        return {
          id: `${row.table_name}__${a.id}`,
          name: a.name,
          extUsername: a.ext_username,
          rowCount: stats?.row_count ?? 0,
          lastSyncedAt: stats?.last_synced_at ?? null,
        };
      })
      .filter((c) => c.rowCount > 0); // Only show agents that have data

    return {
      id: row.table_name,
      table: row.table_name,
      label: TABLE_LABELS[row.table_name] ?? row.table_name,
      icon: TABLE_ICONS[row.table_name] ?? "layui-icon-file",
      rowCount: row.row_count,
      lastSyncedAt: row.last_synced_at,
      agentCount: children.length,
      children,
    };
  });

  // 5. Agent list with per-table row counts
  const agentList = agentsRaw.map((a) => {
    // Count total rows across all tables for this agent
    let totalUserRows = 0;
    for (const [, agMap] of breakdownMap) {
      const stats = agMap.get(a.id);
      if (stats) totalUserRows += stats.row_count;
    }

    return {
      id: a.id,
      name: a.name,
      extUsername: a.ext_username,
      isActive: a.is_active,
      status: a.status,
      cookieExpires: a.cookie_expires,
      totalRows: totalUserRows,
    };
  });

  const totalRows = tableStats.reduce((sum, t) => sum + t.row_count, 0);
  const activeAgents = agentList.filter((a) => a.isActive && a.status === "active").length;

  return reply.send({
    success: true,
    data: {
      totalRows,
      activeAgents,
      totalAgents: agentList.length,
      isSyncing: getIsSyncing(),
      intervalMs: SYNC_INTERVAL_MS,
      tables,
      agents: agentList,
    },
  });
}

/**
 * GET /sync/config — Return sync endpoint configuration
 */
export async function syncConfigHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({
    success: true,
    data: {
      endpoints: SYNC_ENDPOINTS.map((ep) => ({
        ...ep,
        tableName: MODEL_TO_TABLE[ep.table] ?? ep.table,
        label: TABLE_LABELS[MODEL_TO_TABLE[ep.table] ?? ""] ?? ep.table,
      })),
      intervalMs: SYNC_INTERVAL_MS,
      agentConcurrency: SYNC_AGENT_CONCURRENCY,
      pageConcurrency: SYNC_PAGE_CONCURRENCY,
    },
  });
}

/**
 * POST /sync/trigger — Trigger a manual sync (non-blocking)
 */
export async function syncTriggerHandler(request: FastifyRequest, reply: FastifyReply) {
  if (getIsSyncing()) {
    return reply.status(409).send({
      success: false,
      message: "Đang đồng bộ, vui lòng đợi",
    });
  }

  // Fire and forget — don't await
  runFullSync(request.server).catch((err) => {
    logger.error("[Sync] Manual trigger failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return reply.send({
    success: true,
    message: "Đã bắt đầu đồng bộ",
  });
}

import type { FastifyInstance } from "fastify";
import { logger } from "../../utils/logger.js";

// ---------------------------------------------------------------------------
// DB-first resolution — serve synced data from PostgreSQL for locked dates
// ---------------------------------------------------------------------------

/**
 * Endpoint config for DB-first resolution.
 * Only date-range endpoints are supported (we can verify all dates are locked).
 * User endpoint uses "always" mode (no date range, always try DB first).
 */
interface DbFirstConfig {
  table: string; // SQL table name (for raw queries)
  prismaModel: string; // Prisma model key
  dateColumn: string; // Column storing the sync/report date
  sortColumn: string; // Column to sort by (DESC)
  mode: "locked" | "always"; // "locked" = date-based check, "always" = try DB first
  /** Build search filters from upstream params → Prisma where */
  buildFilters: (params: Record<string, string>) => Record<string, unknown>;
}

const DB_FIRST_ENDPOINTS: Record<string, DbFirstConfig> = {
  "/agent/user.html": {
    table: "proxy_users",
    prismaModel: "proxyUser",
    dateColumn: "",
    sortColumn: "register_time",
    mode: "always",
    buildFilters: (params) => ({
      ...(params.username ? { username: { contains: params.username, mode: "insensitive" } } : {}),
      ...(params.status ? { statusFormat: params.status } : {}),
    }),
  },
  "/agent/depositAndWithdrawal.html": {
    table: "proxy_deposits",
    prismaModel: "proxyDeposit",
    dateColumn: "sync_date",
    sortColumn: "create_time",
    mode: "locked",
    buildFilters: (params) => ({
      ...(params.username ? { username: { contains: params.username, mode: "insensitive" } } : {}),
      ...(params.status ? { status: params.status } : {}),
    }),
  },
  "/agent/withdrawalsRecord.html": {
    table: "proxy_withdrawals",
    prismaModel: "proxyWithdrawal",
    dateColumn: "sync_date",
    sortColumn: "create_time",
    mode: "locked",
    buildFilters: (params) => ({
      ...(params.username ? { username: { contains: params.username, mode: "insensitive" } } : {}),
      ...(params.status ? { statusFormat: params.status } : {}),
    }),
  },
  "/agent/bet.html": {
    table: "proxy_bets",
    prismaModel: "proxyBet",
    dateColumn: "sync_date",
    sortColumn: "create_time",
    mode: "locked",
    buildFilters: (params) => ({
      ...(params.username ? { username: { contains: params.username, mode: "insensitive" } } : {}),
      ...(params.serial_no ? { serialNo: params.serial_no } : {}),
      ...(params.lottery_id ? { raw: { path: ["lottery_id"], equals: params.lottery_id } } : {}),
    }),
  },
  "/agent/betOrder.html": {
    table: "proxy_bet_orders",
    prismaModel: "proxyBetOrder",
    dateColumn: "sync_date",
    sortColumn: "bet_time",
    mode: "locked",
    buildFilters: (params) => ({
      ...(params.serial_no ? { serialNo: params.serial_no } : {}),
      ...(params.platform_username ? { platformUsername: { contains: params.platform_username, mode: "insensitive" } } : {}),
    }),
  },
  "/agent/reportLottery.html": {
    table: "proxy_report_lottery",
    prismaModel: "proxyReportLottery",
    dateColumn: "report_date",
    sortColumn: "report_date",
    mode: "locked",
    buildFilters: (params) => ({
      ...(params.username ? { username: { contains: params.username, mode: "insensitive" } } : {}),
    }),
  },
  "/agent/reportFunds.html": {
    table: "proxy_report_funds",
    prismaModel: "proxyReportFunds",
    dateColumn: "report_date",
    sortColumn: "report_date",
    mode: "locked",
    buildFilters: (params) => ({
      ...(params.username ? { username: { contains: params.username, mode: "insensitive" } } : {}),
    }),
  },
  "/agent/reportThirdGame.html": {
    table: "proxy_report_third_game",
    prismaModel: "proxyReportThirdGame",
    dateColumn: "report_date",
    sortColumn: "report_date",
    mode: "locked",
    buildFilters: (params) => ({
      ...(params.username ? { username: { contains: params.username, mode: "insensitive" } } : {}),
    }),
  },
};

// ---------------------------------------------------------------------------
// Date range helpers
// ---------------------------------------------------------------------------

function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// ---------------------------------------------------------------------------
// Core — try to resolve from DB
// ---------------------------------------------------------------------------

/**
 * Try to serve data from DB. Returns null if cannot (caller should fallback to upstream).
 *
 * @param app FastifyInstance
 * @param path Upstream path (e.g., "/agent/user.html")
 * @param params Upstream params (already processed by buildUpstreamParams)
 * @param agentIds List of active agent IDs
 * @param page Page number (1-based)
 * @param limit Page size
 * @param requestId Optional request ID for logging
 */
export async function tryDbFirst<T>(
  app: FastifyInstance,
  path: string,
  params: Record<string, string>,
  agentIds: string[],
  page: number,
  limit: number,
  requestId?: string,
): Promise<{ items: T[]; total: number; totalData?: Record<string, unknown> } | null> {
  const config = DB_FIRST_ENDPOINTS[path];
  if (!config) return null;

  // "always" mode (user endpoint) — always try DB if data exists
  if (config.mode === "always") {
    return queryDb<T>(app, config, params, agentIds, page, limit, requestId);
  }

  // "locked" mode — check date range is fully locked
  const startDate = params.start_date;
  const endDate = params.end_date;
  if (!startDate || !endDate) return null;

  // Don't serve today from DB — it's still being synced
  const today = new Date().toISOString().slice(0, 10);
  if (endDate >= today) return null;

  // Check all dates in range are locked
  const allDates = generateDateRange(startDate, endDate);
  const lockTable = config.prismaModel;

  const locks = await app.prisma.syncDateLock.findMany({
    where: {
      tableName: lockTable,
      syncDate: { in: allDates },
    },
    select: { syncDate: true },
  });

  if (locks.length < allDates.length) {
    // Not all dates locked — fallback to upstream
    return null;
  }

  return queryDb<T>(app, config, params, agentIds, page, limit, requestId, startDate, endDate);
}

/**
 * Query DB with pagination, filters, and sorting.
 * Returns items as upstream-compatible format (using the `raw` JSON column).
 */
async function queryDb<T>(
  app: FastifyInstance,
  config: DbFirstConfig,
  params: Record<string, string>,
  agentIds: string[],
  page: number,
  limit: number,
  requestId?: string,
  startDate?: string,
  endDate?: string,
): Promise<{ items: T[]; total: number; totalData?: Record<string, unknown> } | null> {
  try {
    const prismaModel = (app.prisma as any)[config.prismaModel];
    if (!prismaModel) return null;

    // Build where clause
    const where: Record<string, unknown> = {
      agentId: agentIds.length === 1 ? agentIds[0] : { in: agentIds },
      ...config.buildFilters(params),
    };

    // Add date filter for "locked" mode
    if (startDate && endDate && config.dateColumn) {
      const dateField = config.dateColumn === "sync_date" ? "syncDate" : "reportDate";
      where[dateField] = { gte: startDate, lte: endDate };
    }

    // Query DB with pagination
    const [rows, total] = await Promise.all([
      prismaModel.findMany({
        where,
        orderBy: { [toPrismaField(config.sortColumn)]: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: { raw: true, agentId: true },
      }),
      prismaModel.count({ where }),
    ]);

    if (total === 0) {
      // 0 results — data might not be synced yet, fallback to upstream
      return null;
    }

    // Build agent name map
    const agents = await app.prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true },
    });
    const agentNameMap = new Map(agents.map((a) => [a.id, a.name]));

    // Map to upstream format using `raw` column + inject _agentName
    const items = rows.map((row: any) => ({
      _agentName: agentNameMap.get(row.agentId) ?? "",
      ...(typeof row.raw === "object" ? row.raw : {}),
    })) as T[];

    logger.debug("DB-first hit", { table: config.table, total, page, requestId });

    return { items, total };
  } catch (err) {
    logger.warn("DB-first query failed, falling back to upstream", {
      table: config.table,
      requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/** Convert SQL column name to Prisma field name. */
function toPrismaField(sqlColumn: string): string {
  // snake_case → camelCase
  return sqlColumn.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

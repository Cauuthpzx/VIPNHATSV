export interface SyncEndpointConfig {
  /** Prisma model key used in UPSERT_REGISTRY */
  table: string;
  /** Upstream path */
  path: string;
  /** Whether this endpoint needs start_date / end_date params */
  needsDateRange: boolean;
  /** How many days back to fetch (only used when needsDateRange=true) */
  dateRangeDays: number;
  /** Max items per page (upstream max = 200) */
  pageSize: number;
}

/**
 * Endpoints to sync. Order matters — users first (reference), then transactions.
 * Reference-only endpoints (getLottery, getRebateOddsPanel) are NOT synced.
 */
export const SYNC_ENDPOINTS: SyncEndpointConfig[] = [
  { table: "proxyUser",            path: "/agent/user.html",                 needsDateRange: false, dateRangeDays: 0,  pageSize: 200 },
  { table: "proxyInvite",          path: "/agent/inviteList.html",           needsDateRange: false, dateRangeDays: 0,  pageSize: 200 },
  { table: "proxyBank",            path: "/agent/bankList.html",             needsDateRange: false, dateRangeDays: 0,  pageSize: 200 },
  { table: "proxyDeposit",         path: "/agent/depositAndWithdrawal.html", needsDateRange: true,  dateRangeDays: 7,  pageSize: 200 },
  { table: "proxyWithdrawal",      path: "/agent/withdrawalsRecord.html",    needsDateRange: true,  dateRangeDays: 7,  pageSize: 200 },
  { table: "proxyBet",             path: "/agent/bet.html",                  needsDateRange: true,  dateRangeDays: 7,  pageSize: 200 },
  { table: "proxyBetOrder",        path: "/agent/betOrder.html",             needsDateRange: true,  dateRangeDays: 7,  pageSize: 200 },
  { table: "proxyReportLottery",   path: "/agent/reportLottery.html",        needsDateRange: true,  dateRangeDays: 7,  pageSize: 200 },
  { table: "proxyReportFunds",     path: "/agent/reportFunds.html",          needsDateRange: true,  dateRangeDays: 7,  pageSize: 200 },
  { table: "proxyReportThirdGame", path: "/agent/reportThirdGame.html",      needsDateRange: true,  dateRangeDays: 7,  pageSize: 200 },
];

/** Interval between sync runs (ms). Override via SYNC_INTERVAL_MS env var. */
export const SYNC_INTERVAL_MS = Number(process.env.SYNC_INTERVAL_MS) || 5 * 60 * 1000;

/** Max agents fetched concurrently per endpoint */
export const SYNC_AGENT_CONCURRENCY = 4;

/** Max pages fetched concurrently per agent */
export const SYNC_PAGE_CONCURRENCY = 3;

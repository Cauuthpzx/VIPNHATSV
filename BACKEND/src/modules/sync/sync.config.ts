export interface SyncEndpointConfig {
  /** Prisma model key used in UPSERT_REGISTRY */
  table: string;
  /** Upstream path */
  path: string;
  /** Whether this endpoint needs start_date / end_date params */
  needsDateRange: boolean;
  /** Max items per page (upstream max = 200) */
  pageSize: number;
  /**
   * Sync chỉ 1 lần duy nhất (invite).
   * Khi syncOnce=true, recurring sync sẽ bỏ qua endpoint này.
   */
  syncOnce: boolean;
}

/**
 * Ngày bắt đầu đồng bộ — tất cả dữ liệu date-range sẽ sync từ ngày này.
 * Override qua env SYNC_DATE_START (format: YYYY-MM-DD).
 */
export const SYNC_DATE_START = process.env.SYNC_DATE_START || "2026-01-01";

/**
 * Endpoints to sync. Order matters — users first (reference), then transactions.
 * Reference-only endpoints (getLottery, getRebateOddsPanel) are NOT synced.
 *
 * Quy tắc sync:
 * - syncOnce=true  → chỉ sync lần đầu (invite)
 * - needsDateRange → sync từng ngày từ SYNC_DATE_START đến hôm nay
 *                     ngày cũ đã sync → skip, ngày hôm nay → luôn sync (cộng dồn)
 * - user, bank     → không có date range, sync mỗi lần (dữ liệu thay đổi bất kỳ lúc nào)
 */
export const SYNC_ENDPOINTS: SyncEndpointConfig[] = [
  { table: "proxyUser",            path: "/agent/user.html",                 needsDateRange: false, pageSize: 200, syncOnce: false },
  { table: "proxyInvite",          path: "/agent/inviteList.html",           needsDateRange: false, pageSize: 200, syncOnce: true },
  { table: "proxyBank",            path: "/agent/bankList.html",             needsDateRange: false, pageSize: 200, syncOnce: false },
  { table: "proxyDeposit",         path: "/agent/depositAndWithdrawal.html", needsDateRange: true,  pageSize: 200, syncOnce: false },
  { table: "proxyWithdrawal",      path: "/agent/withdrawalsRecord.html",    needsDateRange: true,  pageSize: 200, syncOnce: false },
  { table: "proxyBet",             path: "/agent/bet.html",                  needsDateRange: true,  pageSize: 200, syncOnce: false },
  { table: "proxyBetOrder",        path: "/agent/betOrder.html",             needsDateRange: true,  pageSize: 200, syncOnce: false },
  { table: "proxyReportLottery",   path: "/agent/reportLottery.html",        needsDateRange: true,  pageSize: 200, syncOnce: false },
  { table: "proxyReportFunds",     path: "/agent/reportFunds.html",          needsDateRange: true,  pageSize: 200, syncOnce: false },
  { table: "proxyReportThirdGame", path: "/agent/reportThirdGame.html",      needsDateRange: true,  pageSize: 200, syncOnce: false },
];

/** Interval between sync runs (ms). Override via SYNC_INTERVAL_MS env var. */
export const SYNC_INTERVAL_MS = Number(process.env.SYNC_INTERVAL_MS) || 5 * 60 * 1000;

/** Max agents fetched concurrently per endpoint */
export const SYNC_AGENT_CONCURRENCY = 4;

/** Max pages fetched concurrently per agent */
export const SYNC_PAGE_CONCURRENCY = 3;

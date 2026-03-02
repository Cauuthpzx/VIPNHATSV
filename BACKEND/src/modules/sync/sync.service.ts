import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { listActiveAgents } from "../proxy/agent.service.js";
import { decryptSessionCookie } from "../../utils/crypto.js";
import { promisePool } from "../../utils/concurrency.js";
import { fetchAllPages } from "./sync.fetcher.js";
import { UPSERT_REGISTRY } from "./sync.upsert.js";
import {
  SYNC_ENDPOINTS,
  SYNC_DATE_START,
  SYNC_AGENT_CONCURRENCY,
  SYNC_PAGE_CONCURRENCY,
  type SyncEndpointConfig,
} from "./sync.config.js";
import { logger } from "../../utils/logger.js";

let isSyncing = false;

/** Check if a sync is currently in progress. */
export function getIsSyncing(): boolean {
  return isSyncing;
}

// All proxy tables that have agent_id column
const PROXY_TABLES = [
  "proxy_users",
  "proxy_invites",
  "proxy_deposits",
  "proxy_withdrawals",
  "proxy_bets",
  "proxy_bet_orders",
  "proxy_report_lottery",
  "proxy_report_funds",
  "proxy_report_third_game",
  "proxy_banks",
] as const;

// ---------------------------------------------------------------------------
// Sync date tracking — dual-write: DB (durable) + Redis (fast cache)
// ---------------------------------------------------------------------------

/** Redis key: marks that a past date for a given endpoint has been fully synced. */
function syncedDateKey(table: string, date: string): string {
  return `sync:date_done:${table}:${date}`;
}

/** Redis key: marks that a syncOnce endpoint has been synced at all. */
function syncOnceKey(table: string): string {
  return `sync:once_done:${table}`;
}

const REDIS_DATE_TTL = 90 * 86400; // 90 days

/** Check if a date has been synced — Redis first, DB fallback. */
async function isDateDone(app: FastifyInstance, table: string, date: string): Promise<boolean> {
  // Redis first (fast)
  try {
    const cached = await app.redis.get(syncedDateKey(table, date));
    if (cached) return true;
  } catch { /* fall through */ }

  // DB fallback (durable)
  const lock = await app.prisma.syncDateLock.findUnique({
    where: { uq_sync_date_lock: { tableName: table, syncDate: date } },
  });

  if (lock) {
    // Re-populate Redis cache
    try { await app.redis.set(syncedDateKey(table, date), "1", "EX", REDIS_DATE_TTL); } catch { /* ignore */ }
    return true;
  }

  return false;
}

/** Mark a date as synced — write to DB (primary) + Redis (cache). */
async function markDateDone(app: FastifyInstance, table: string, date: string, itemCount: number): Promise<void> {
  // DB primary (durable)
  try {
    await app.prisma.syncDateLock.upsert({
      where: { uq_sync_date_lock: { tableName: table, syncDate: date } },
      create: { tableName: table, syncDate: date, itemCount },
      update: { itemCount, lockedAt: new Date() },
    });
  } catch (err) {
    logger.warn("[Sync] Failed to write SyncDateLock", { table, date, error: (err as Error).message });
  }

  // Redis cache
  try { await app.redis.set(syncedDateKey(table, date), "1", "EX", REDIS_DATE_TTL); } catch { /* ignore */ }
}

/** Check if a syncOnce endpoint has been done — Redis first, DB fallback. */
async function isSyncOnceDone(app: FastifyInstance, table: string): Promise<boolean> {
  try {
    const cached = await app.redis.get(syncOnceKey(table));
    if (cached) return true;
  } catch { /* fall through */ }

  const lock = await app.prisma.syncDateLock.findUnique({
    where: { uq_sync_date_lock: { tableName: table, syncDate: "__once__" } },
  });

  if (lock) {
    try { await app.redis.set(syncOnceKey(table), "1"); } catch { /* ignore */ }
    return true;
  }

  return false;
}

/** Mark a syncOnce endpoint as done. */
async function markSyncOnceDone(app: FastifyInstance, table: string): Promise<void> {
  try {
    await app.prisma.syncDateLock.upsert({
      where: { uq_sync_date_lock: { tableName: table, syncDate: "__once__" } },
      create: { tableName: table, syncDate: "__once__", itemCount: 0 },
      update: { lockedAt: new Date() },
    });
  } catch (err) {
    logger.warn("[Sync] Failed to write SyncDateLock (once)", { table, error: (err as Error).message });
  }

  try { await app.redis.set(syncOnceKey(table), "1"); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Core sync
// ---------------------------------------------------------------------------

/**
 * Sync mode:
 * - "full"      : Lần đầu hoặc manual trigger.
 *                 syncOnce endpoints → sync nếu chưa từng sync.
 *                 date-range endpoints → sync từng ngày từ SYNC_DATE_START đến today:
 *                   skip nếu ngày cũ đã done.
 * - "recurring" : Scheduler tự động.
 *                 syncOnce endpoints → BỎ QUA hoàn toàn.
 *                 date-range endpoints → chỉ sync ngày hôm nay (cộng dồn).
 *                 no-date endpoints (user, bank) → sync bình thường.
 */
export type SyncMode = "full" | "recurring";

export async function runFullSync(app: FastifyInstance, mode: SyncMode = "full"): Promise<void> {
  if (isSyncing) {
    logger.warn("[Sync] Already in progress, skipping");
    return;
  }
  isSyncing = true;
  const startTime = Date.now();

  try {
    logger.info(`[Sync] Started (mode: ${mode})`);
    const agents = await listActiveAgents(app);

    if (agents.length === 0) {
      logger.warn("[Sync] No active agents, skipping");
      return;
    }

    logger.info(`[Sync] ${agents.length} active agents`);

    for (const endpoint of SYNC_ENDPOINTS) {
      // --- syncOnce: invite ---
      if (endpoint.syncOnce) {
        if (mode === "recurring") {
          // Recurring → bỏ qua hoàn toàn
          continue;
        }
        // Full → kiểm tra đã sync lần nào chưa (DB + Redis)
        const done = await isSyncOnceDone(app, endpoint.table);
        if (done) {
          logger.debug(`[Sync] Skip syncOnce (already done): ${endpoint.table}`);
          continue;
        }
      }

      const upsertFn = UPSERT_REGISTRY[endpoint.table];
      if (!upsertFn) {
        logger.warn("[Sync] No upsert function", { table: endpoint.table });
        continue;
      }

      const endpointStart = Date.now();

      if (endpoint.needsDateRange) {
        // === Date-range endpoint: sync từng ngày ===
        await syncEndpointByDay(app, endpoint, upsertFn, agents, mode);
      } else {
        // === No date range (user, bank, or syncOnce first time) ===
        await syncEndpointAll(app, endpoint, upsertFn, agents);

        // Mark syncOnce as done (DB + Redis)
        if (endpoint.syncOnce) {
          await markSyncOnceDone(app, endpoint.table);
        }
      }

      logger.info(`[Sync] ${endpoint.table} done`, {
        durationMs: Date.now() - endpointStart,
      });
    }

    logger.info(`[Sync] Completed (${mode}) in ${Date.now() - startTime}ms`);
  } catch (err) {
    logger.error("[Sync] Fatal error", {
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    isSyncing = false;
  }
}

// ---------------------------------------------------------------------------
// Sync endpoint by day — chỉ sync ngày chưa done
// ---------------------------------------------------------------------------

type Agent = Awaited<ReturnType<typeof listActiveAgents>>[number];
type UpsertFn = (typeof UPSERT_REGISTRY)[string];

async function syncEndpointByDay(
  app: FastifyInstance,
  endpoint: SyncEndpointConfig,
  upsertFn: UpsertFn,
  agents: Agent[],
  mode: SyncMode,
) {
  const today = formatDate(new Date());

  if (mode === "recurring") {
    // Recurring → chỉ sync ngày hôm nay
    logger.debug(`[Sync] ${endpoint.table}: recurring → only today (${today})`);
    await syncSingleDay(app, endpoint, upsertFn, agents, today);
    return;
  }

  // Full mode → sync từng ngày từ SYNC_DATE_START đến today
  const dates = generateDateRange(SYNC_DATE_START, today);
  logger.info(`[Sync] ${endpoint.table}: full → ${dates.length} days (${SYNC_DATE_START} → ${today})`);

  for (const date of dates) {
    const isToday = date === today;

    if (!isToday) {
      // Ngày cũ: kiểm tra đã sync chưa (DB + Redis)
      const done = await isDateDone(app, endpoint.table, date);
      if (done) continue;
    }

    const dayItemCount = await syncSingleDay(app, endpoint, upsertFn, agents, date);

    // Đánh dấu ngày cũ đã done — CHỈ khi có dữ liệu (tránh đánh dấu false-done khi upstream lỗi)
    if (!isToday && dayItemCount > 0) {
      await markDateDone(app, endpoint.table, date, dayItemCount);
    }
  }
}

/** Sync a single day across all agents for one endpoint. Returns total items fetched. */
async function syncSingleDay(
  app: FastifyInstance,
  endpoint: SyncEndpointConfig,
  upsertFn: UpsertFn,
  agents: Agent[],
  date: string,
): Promise<number> {
  const params = { ...buildDateParams(endpoint.path, date, date), ...endpoint.extraParams };
  let totalItems = 0;

  await promisePool(agents, SYNC_AGENT_CONCURRENCY, async (agent) => {
    try {
      const cookie = decryptSessionCookie(agent.sessionCookie);

      const items = await fetchAllPages({
        path: endpoint.path,
        cookie,
        params,
        pageSize: endpoint.pageSize,
        pageConcurrency: SYNC_PAGE_CONCURRENCY,
      });

      if (items.length === 0) return;
      totalItems += items.length;

      // Pass syncDate so upsert can store it as metadata
      const upserted = await upsertFn(app.prisma, agent.id, items, date);

      logger.debug("[Sync] Upserted", {
        agent: agent.name,
        table: endpoint.table,
        date,
        fetched: items.length,
        upserted,
      });
    } catch (err) {
      logger.error("[Sync] Agent failed", {
        agent: agent.name,
        path: endpoint.path,
        date,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return totalItems;
}

// ---------------------------------------------------------------------------
// Sync endpoint all (no date range) — user, invite, bank
// ---------------------------------------------------------------------------

async function syncEndpointAll(
  app: FastifyInstance,
  endpoint: SyncEndpointConfig,
  upsertFn: UpsertFn,
  agents: Agent[],
) {
  await promisePool(agents, SYNC_AGENT_CONCURRENCY, async (agent) => {
    try {
      const cookie = decryptSessionCookie(agent.sessionCookie);

      const items = await fetchAllPages({
        path: endpoint.path,
        cookie,
        params: { ...endpoint.extraParams },
        pageSize: endpoint.pageSize,
        pageConcurrency: SYNC_PAGE_CONCURRENCY,
      });

      if (items.length === 0) return;

      const upserted = await upsertFn(app.prisma, agent.id, items);

      logger.debug("[Sync] Upserted", {
        agent: agent.name,
        table: endpoint.table,
        fetched: items.length,
        upserted,
      });
    } catch (err) {
      logger.error("[Sync] Agent failed", {
        agent: agent.name,
        path: endpoint.path,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Date param name per endpoint path.
 * Report endpoints use "date" with " | " (pipe + spaces).
 * Non-report endpoints use their own param name with "|" (pipe, no spaces).
 * betOrder uses "bet_time", bets uses "date" (same as deposit/withdrawal).
 */
const DATE_PARAM_MAP: Record<string, { param: string; isReport: boolean }> = {
  "/agent/bet.html":                  { param: "date",        isReport: false },
  "/agent/depositAndWithdrawal.html": { param: "date",        isReport: false },
  "/agent/withdrawalsRecord.html":    { param: "date",        isReport: false },
  "/agent/betOrder.html":             { param: "bet_time",    isReport: false },
  "/agent/reportLottery.html":        { param: "date",        isReport: true },
  "/agent/reportFunds.html":          { param: "date",        isReport: true },
  "/agent/reportThirdGame.html":      { param: "date",        isReport: true },
};

/** Build date params for a single day (start = end = date). */
function buildDateParams(path: string, start: string, end: string): Record<string, string> {
  const config = DATE_PARAM_MAP[path];
  if (!config) {
    // Fallback: pipe with spaces
    return { date: `${start} | ${end}` };
  }
  // Report: "YYYY-MM-DD | YYYY-MM-DD" (pipe + spaces)
  // Non-report: "YYYY-MM-DD|YYYY-MM-DD" (pipe, no spaces)
  const separator = config.isReport ? " | " : "|";
  return { [config.param]: `${start}${separator}${end}` };
}

/**
 * Generate array of date strings from startDate to endDate, inclusive.
 * Both params are "YYYY-MM-DD" strings.
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(formatDate(d));
  }
  return dates;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Sync single agent
// ---------------------------------------------------------------------------

/**
 * Run sync for a single agent across ALL endpoints.
 * Always runs in "full" mode (smart day-by-day with skip).
 */
export async function runAgentSync(app: FastifyInstance, agentId: string): Promise<void> {
  if (isSyncing) {
    logger.warn("[Sync] Already in progress, skipping single-agent sync");
    return;
  }
  isSyncing = true;
  const startTime = Date.now();

  try {
    const agent = await app.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || !agent.isActive || agent.status !== "active") {
      logger.warn("[Sync] Agent not found or inactive", { agentId });
      return;
    }

    logger.info(`[Sync] Single-agent sync started: ${agent.name}`);
    const cookie = decryptSessionCookie(agent.sessionCookie);
    const today = formatDate(new Date());

    for (const endpoint of SYNC_ENDPOINTS) {
      const upsertFn = UPSERT_REGISTRY[endpoint.table];
      if (!upsertFn) continue;

      try {
        if (endpoint.needsDateRange) {
          // Sync từng ngày từ SYNC_DATE_START đến today, skip ngày cũ đã done
          const dates = generateDateRange(SYNC_DATE_START, today);

          for (const date of dates) {
            const isToday = date === today;

            if (!isToday) {
              const done = await isDateDone(app, endpoint.table, date);
              if (done) continue;
            }

            const params = { ...buildDateParams(endpoint.path, date, date), ...endpoint.extraParams };
            const items = await fetchAllPages({
              path: endpoint.path,
              cookie,
              params,
              pageSize: endpoint.pageSize,
              pageConcurrency: SYNC_PAGE_CONCURRENCY,
            });

            if (items.length > 0) {
              await upsertFn(app.prisma, agent.id, items, date);
            }

            // Ngày cũ đánh dấu done (DB + Redis)
            if (!isToday && items.length > 0) {
              await markDateDone(app, endpoint.table, date, items.length);
            }
          }
        } else {
          // No date range (user, invite, bank)
          const items = await fetchAllPages({
            path: endpoint.path,
            cookie,
            params: { ...endpoint.extraParams },
            pageSize: endpoint.pageSize,
            pageConcurrency: SYNC_PAGE_CONCURRENCY,
          });

          if (items.length > 0) {
            const upserted = await upsertFn(app.prisma, agent.id, items);
            logger.debug("[Sync] Upserted (single-agent)", {
              agent: agent.name,
              table: endpoint.table,
              fetched: items.length,
              upserted,
            });
          }
        }
      } catch (err) {
        logger.error("[Sync] Single-agent endpoint failed", {
          agent: agent.name,
          path: endpoint.path,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    logger.info(`[Sync] Single-agent sync completed: ${agent.name} in ${Date.now() - startTime}ms`);
  } catch (err) {
    logger.error("[Sync] Single-agent sync fatal error", {
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    isSyncing = false;
  }
}

// ---------------------------------------------------------------------------
// Purge data
// ---------------------------------------------------------------------------

/**
 * Delete ALL proxy data from all 10 tables.
 * Uses TRUNCATE for speed (no row-by-row delete).
 * Also clears Redis sync markers so next sync will re-fetch everything.
 */
export async function purgeAllData(app: FastifyInstance): Promise<Record<string, number>> {
  logger.info("[Sync] Purging ALL proxy data");
  const prisma = app.prisma;
  const result: Record<string, number> = {};

  for (const table of PROXY_TABLES) {
    const countResult: Array<{ count: number }> = await prisma.$queryRawUnsafe(
      `SELECT count(*)::int as count FROM "${table}"`,
    );
    result[table] = countResult[0]?.count ?? 0;
  }

  // TRUNCATE all proxy tables + sync_date_locks in a single statement
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${PROXY_TABLES.map((t) => `"${t}"`).join(", ")}, "sync_date_locks" CASCADE`,
  );

  // Clear Redis sync markers using SCAN (safe for production, no blocking)
  try {
    for (const pattern of ["sync:date_done:*", "sync:once_done:*"]) {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await app.redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await app.redis.del(...keys);
        }
      } while (cursor !== "0");
    }
  } catch { /* Redis fail-open */ }

  const totalDeleted = Object.values(result).reduce((a, b) => a + b, 0);
  logger.info(`[Sync] Purged ALL data: ${totalDeleted} rows across ${PROXY_TABLES.length} tables`);
  return result;
}

/**
 * Delete all proxy data for a specific agent.
 */
export async function purgeAgentData(prisma: PrismaClient, agentId: string): Promise<Record<string, number>> {
  logger.info("[Sync] Purging agent data", { agentId });
  const result: Record<string, number> = {};

  for (const table of PROXY_TABLES) {
    const deleteResult: Array<{ count: number }> = await prisma.$queryRawUnsafe(
      `WITH deleted AS (DELETE FROM "${table}" WHERE "agent_id" = $1 RETURNING 1) SELECT count(*)::int as count FROM deleted`,
      agentId,
    );
    result[table] = deleteResult[0]?.count ?? 0;
  }

  const totalDeleted = Object.values(result).reduce((a, b) => a + b, 0);
  logger.info(`[Sync] Purged agent data: ${totalDeleted} rows`, { agentId });
  return result;
}

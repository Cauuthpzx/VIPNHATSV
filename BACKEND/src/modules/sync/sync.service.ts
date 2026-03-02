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
// Redis keys for tracking synced dates
// ---------------------------------------------------------------------------

/** Redis key: marks that a past date for a given endpoint has been fully synced. */
function syncedDateKey(table: string, date: string): string {
  return `sync:date_done:${table}:${date}`;
}

/** Redis key: marks that a syncOnce endpoint has been synced at all. */
function syncOnceKey(table: string): string {
  return `sync:once_done:${table}`;
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
        // Full → kiểm tra đã sync lần nào chưa
        const doneKey = syncOnceKey(endpoint.table);
        try {
          const done = await app.redis.get(doneKey);
          if (done) {
            logger.debug(`[Sync] Skip syncOnce (already done): ${endpoint.table}`);
            continue;
          }
        } catch {
          // Redis fail → sync anyway (fail-open)
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

        // Mark syncOnce as done
        if (endpoint.syncOnce) {
          try {
            // No TTL — permanent marker
            await app.redis.set(syncOnceKey(endpoint.table), "1");
          } catch { /* Redis fail-open */ }
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
      // Ngày cũ: kiểm tra đã sync chưa
      try {
        const done = await app.redis.get(syncedDateKey(endpoint.table, date));
        if (done) {
          continue; // Skip silently — quá nhiều ngày để log từng cái
        }
      } catch {
        // Redis fail → sync anyway
      }
    }

    await syncSingleDay(app, endpoint, upsertFn, agents, date);

    // Đánh dấu ngày cũ đã done (ngày hôm nay KHÔNG đánh dấu vì dữ liệu còn cộng dồn)
    if (!isToday) {
      try {
        // TTL 90 ngày — sau 90 ngày key hết hạn, nếu sync lại sẽ re-fetch
        await app.redis.set(syncedDateKey(endpoint.table, date), "1", "EX", 90 * 86400);
      } catch { /* Redis fail-open */ }
    }
  }
}

/** Sync a single day across all agents for one endpoint. */
async function syncSingleDay(
  app: FastifyInstance,
  endpoint: SyncEndpointConfig,
  upsertFn: UpsertFn,
  agents: Agent[],
  date: string,
) {
  const params = buildDateParams(endpoint.path, date, date);

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
        params: {},
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

const SPLIT_DATE_PATHS = new Set([
  "/agent/reportLottery.html",
  "/agent/reportFunds.html",
  "/agent/reportThirdGame.html",
  "/agent/betOrder.html",
]);

/** Build date params for a single day (start = end = date). */
function buildDateParams(path: string, start: string, end: string): Record<string, string> {
  if (SPLIT_DATE_PATHS.has(path)) {
    return { start_date: start, end_date: end };
  }
  return { date: `${start} - ${end}` };
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
              try {
                const done = await app.redis.get(syncedDateKey(endpoint.table, date));
                if (done) continue;
              } catch { /* fail-open */ }
            }

            const params = buildDateParams(endpoint.path, date, date);
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

            // Ngày cũ đánh dấu done
            if (!isToday && items.length > 0) {
              try {
                await app.redis.set(syncedDateKey(endpoint.table, date), "1", "EX", 90 * 86400);
              } catch { /* fail-open */ }
            }
          }
        } else {
          // No date range (user, invite, bank)
          const items = await fetchAllPages({
            path: endpoint.path,
            cookie,
            params: {},
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

  // TRUNCATE all tables in a single statement
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${PROXY_TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`,
  );

  // Clear Redis sync markers
  try {
    const keys = await app.redis.keys("sync:date_done:*");
    const onceKeys = await app.redis.keys("sync:once_done:*");
    const allKeys = [...keys, ...onceKeys];
    if (allKeys.length > 0) {
      await app.redis.del(...allKeys);
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

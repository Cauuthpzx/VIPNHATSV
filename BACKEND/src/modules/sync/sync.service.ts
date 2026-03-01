import type { FastifyInstance } from "fastify";
import { listActiveAgents } from "../proxy/agent.service.js";
import { decryptSessionCookie } from "../../utils/crypto.js";
import { promisePool } from "../../utils/concurrency.js";
import { fetchAllPages } from "./sync.fetcher.js";
import { UPSERT_REGISTRY } from "./sync.upsert.js";
import {
  SYNC_ENDPOINTS,
  SYNC_AGENT_CONCURRENCY,
  SYNC_PAGE_CONCURRENCY,
} from "./sync.config.js";
import { logger } from "../../utils/logger.js";

let isSyncing = false;

/** Check if a sync is currently in progress. */
export function getIsSyncing(): boolean {
  return isSyncing;
}

/**
 * Run a full sync cycle: for each endpoint, fetch ALL pages from ALL agents,
 * then UPSERT into PostgreSQL.
 */
export async function runFullSync(app: FastifyInstance): Promise<void> {
  if (isSyncing) {
    logger.warn("[Sync] Already in progress, skipping");
    return;
  }
  isSyncing = true;
  const startTime = Date.now();

  try {
    logger.info("[Sync] Started");
    const agents = await listActiveAgents(app);

    if (agents.length === 0) {
      logger.warn("[Sync] No active agents, skipping");
      return;
    }

    logger.info(`[Sync] ${agents.length} active agents`);

    for (const endpoint of SYNC_ENDPOINTS) {
      const upsertFn = UPSERT_REGISTRY[endpoint.table];
      if (!upsertFn) {
        logger.warn("[Sync] No upsert function", { table: endpoint.table });
        continue;
      }

      const endpointStart = Date.now();

      await promisePool(agents, SYNC_AGENT_CONCURRENCY, async (agent) => {
        try {
          const cookie = decryptSessionCookie(agent.sessionCookie);
          const params = buildSyncParams(endpoint.needsDateRange, endpoint.dateRangeDays, endpoint.path);

          const items = await fetchAllPages({
            path: endpoint.path,
            cookie,
            params,
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

      logger.info(`[Sync] ${endpoint.table} done`, {
        durationMs: Date.now() - endpointStart,
      });
    }

    logger.info(`[Sync] Completed in ${Date.now() - startTime}ms`);
  } catch (err) {
    logger.error("[Sync] Fatal error", {
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    isSyncing = false;
  }
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

function buildSyncParams(
  needsDateRange: boolean,
  dateRangeDays: number,
  path: string,
): Record<string, string> {
  const params: Record<string, string> = {};

  if (needsDateRange && dateRangeDays > 0) {
    const now = new Date();
    const end = formatDate(now);
    const start = formatDate(new Date(now.getTime() - dateRangeDays * 86_400_000));

    if (SPLIT_DATE_PATHS.has(path)) {
      params.start_date = start;
      params.end_date = end;
    } else {
      // depositAndWithdrawal.html, withdrawalsRecord.html, bet.html use "date" param
      params.date = `${start} - ${end}`;
    }
  }

  return params;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

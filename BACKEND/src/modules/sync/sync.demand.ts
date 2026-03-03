/**
 * sync.demand.ts — Demand-based sync coordinator
 *
 * Khi user search hit upstream fallback → signal demand sync cho endpoint đó.
 * Debounce 2s + cooldown 30s → trigger sync endpoint cho tất cả agents.
 * Per-endpoint lock ngăn demand sync và scheduled sync chạy đồng thời trên cùng endpoint.
 */

import type { FastifyInstance } from "fastify";
import { listActiveAgents } from "../proxy/agent.service.js";
import { decryptSessionCookie } from "../../utils/crypto.js";
import { SYNC_ENDPOINTS, type SyncEndpointConfig } from "./sync.config.js";
import { UPSERT_REGISTRY } from "./sync.upsert.js";
import { markEndpointRan } from "./sync.scheduler.js";
import { logger } from "../../utils/logger.js";

// Re-export từ sync.service.ts (sẽ import sau khi export)
// Import lazy để tránh circular dependency
let _syncAgentEndpoint: typeof import("./sync.service.js").syncAgentEndpoint | null = null;
let _syncAgentSingleDay: typeof import("./sync.service.js").syncAgentSingleDay | null = null;

async function getSyncFns() {
  if (!_syncAgentEndpoint || !_syncAgentSingleDay) {
    const mod = await import("./sync.service.js");
    _syncAgentEndpoint = mod.syncAgentEndpoint;
    _syncAgentSingleDay = mod.syncAgentSingleDay;
  }
  return { syncAgentEndpoint: _syncAgentEndpoint, syncAgentSingleDay: _syncAgentSingleDay };
}

// ---------------------------------------------------------------------------
// Path → Table mapping
// ---------------------------------------------------------------------------

const PATH_TO_TABLE: Record<string, string> = {};
for (const ep of SYNC_ENDPOINTS) {
  PATH_TO_TABLE[ep.path] = ep.table;
}

// ---------------------------------------------------------------------------
// Per-endpoint lock — ngăn 2 sync (demand hoặc scheduled) chạy cùng endpoint
// ---------------------------------------------------------------------------

const endpointLocks = new Map<string, boolean>();

export function isEndpointLocked(table: string): boolean {
  return endpointLocks.get(table) === true;
}

export function lockEndpoint(table: string): boolean {
  if (endpointLocks.get(table)) return false;
  endpointLocks.set(table, true);
  return true;
}

export function unlockEndpoint(table: string): void {
  endpointLocks.set(table, false);
}

// ---------------------------------------------------------------------------
// Demand signal — debounced per endpoint
// ---------------------------------------------------------------------------

const DEMAND_COOLDOWN_MS = 30_000; // 30s cooldown per endpoint
const DEMAND_DEBOUNCE_MS = 2_000;  // 2s debounce window

const lastDemandAt = new Map<string, number>();
const pendingDemands = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Cho scheduler biết demand sync gần đây nhất cho endpoint nào.
 * Scheduler dùng để skip endpoint vừa demand sync.
 */
export function getLastDemandAt(table: string): number {
  return lastDemandAt.get(table) ?? 0;
}

/**
 * Signal demand sync cho 1 endpoint.
 * Fire-and-forget — gọi từ proxy.service sau khi upstream fallback.
 */
export function signalDemandSync(app: FastifyInstance, path: string): void {
  const table = PATH_TO_TABLE[path];
  if (!table) return; // Reference endpoints — skip

  // Skip syncOnce endpoints (invite)
  const epConfig = SYNC_ENDPOINTS.find((e) => e.table === table);
  if (!epConfig || epConfig.syncOnce) return;

  const now = Date.now();
  const lastSignal = lastDemandAt.get(table) ?? 0;

  // Cooldown check
  if (now - lastSignal < DEMAND_COOLDOWN_MS) {
    logger.debug("[DemandSync] Skipped (cooldown)", { table });
    return;
  }

  // Already locked (scheduled sync hoặc demand khác đang chạy)
  if (isEndpointLocked(table)) {
    logger.debug("[DemandSync] Skipped (endpoint locked)", { table });
    return;
  }

  lastDemandAt.set(table, now);

  // Debounce: chờ 2s để gom các request gần nhau, rồi fire
  if (pendingDemands.has(table)) {
    clearTimeout(pendingDemands.get(table)!);
  }

  pendingDemands.set(
    table,
    setTimeout(() => {
      pendingDemands.delete(table);
      executeDemandSync(app, table).catch((err) => {
        logger.error("[DemandSync] Failed", {
          table,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }, DEMAND_DEBOUNCE_MS),
  );
}

// ---------------------------------------------------------------------------
// Execute demand sync
// ---------------------------------------------------------------------------

async function executeDemandSync(app: FastifyInstance, table: string): Promise<void> {
  if (!lockEndpoint(table)) {
    logger.debug("[DemandSync] Lock failed (concurrent)", { table });
    return;
  }

  const startTime = Date.now();
  try {
    logger.info(`[DemandSync] Started: ${table}`);

    // Báo scheduler "endpoint vừa chạy" → skip lần scheduled tiếp
    markEndpointRan(table);

    const endpoint = SYNC_ENDPOINTS.find((ep) => ep.table === table);
    if (!endpoint) return;

    const agents = await listActiveAgents(app);
    if (agents.length === 0) return;

    const upsertFn = UPSERT_REGISTRY[endpoint.table];
    if (!upsertFn) return;

    const { syncAgentEndpoint, syncAgentSingleDay } = await getSyncFns();

    // Chạy song song cho tất cả agents
    await Promise.all(
      agents.map(async (agent) => {
        try {
          const cookie = decryptSessionCookie(agent.sessionCookie);
          const today = new Date().toISOString().slice(0, 10);

          if (endpoint.needsDateRange) {
            // Date-range: chỉ sync ngày hôm nay (demand = dữ liệu hiện tại)
            await syncAgentSingleDay(app, agent, cookie, endpoint, upsertFn, today, false);
          } else {
            // Non-date (user): sync full
            await syncAgentEndpoint(app, agent, cookie, endpoint, upsertFn);
          }
        } catch (err) {
          logger.warn(`[DemandSync] Agent ${agent.name} failed on ${table}`, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }),
    );

    logger.info(`[DemandSync] Completed: ${table} in ${Date.now() - startTime}ms`);
  } finally {
    unlockEndpoint(table);
  }
}

import type { FastifyInstance } from "fastify";
import { runFullSync, getIsSyncing } from "./sync.service.js";
import { SYNC_ENDPOINTS } from "./sync.config.js";
import { getLastDemandAt } from "./sync.demand.js";
import { logger } from "../../utils/logger.js";

// ---------------------------------------------------------------------------
// Redis keys
// ---------------------------------------------------------------------------
const REDIS_INTERVAL_PREFIX = "sync:interval:"; // per-endpoint: sync:interval:proxyDeposit
const REDIS_GLOBAL_INTERVAL_KEY = "sync:interval_ms"; // legacy global (fallback)
const MIN_INTERVAL_MS = 30000; // 30 giây tối thiểu
const DEFAULT_GLOBAL_INTERVAL_MS = 60000; // 1 phút — scheduler tick frequency

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let initialTimer: ReturnType<typeof setTimeout> | null = null;
let appRef: FastifyInstance | null = null;
let schedulerRunning = false;

// Per-endpoint: lần chạy gần nhất (epoch ms)
const lastRunAt = new Map<string, number>();

// Per-endpoint: interval hiện tại (ms) — cache in-memory
const endpointIntervals = new Map<string, number>();

// ---------------------------------------------------------------------------
// Interval management — per-endpoint
// ---------------------------------------------------------------------------

/** Đọc interval cho 1 endpoint từ Redis, fallback config default. */
async function getEndpointIntervalMs(app: FastifyInstance, table: string): Promise<number> {
  try {
    const cached = await app.redis.get(REDIS_INTERVAL_PREFIX + table);
    if (cached) {
      const n = parseInt(cached, 10);
      if (!isNaN(n) && n >= MIN_INTERVAL_MS) return n;
    }
  } catch { /* ignore */ }

  // Fallback: config default
  const ep = SYNC_ENDPOINTS.find((e) => e.table === table);
  return ep?.defaultIntervalMs || DEFAULT_GLOBAL_INTERVAL_MS;
}

/** Load all per-endpoint intervals from Redis vào memory cache. */
async function loadAllIntervals(app: FastifyInstance): Promise<void> {
  for (const ep of SYNC_ENDPOINTS) {
    if (ep.syncOnce) continue; // syncOnce không cần interval
    const ms = await getEndpointIntervalMs(app, ep.table);
    endpointIntervals.set(ep.table, ms);
  }
}

/** Set interval cho 1 endpoint — lưu Redis + update memory. */
export async function setEndpointInterval(app: FastifyInstance, table: string, ms: number): Promise<void> {
  const clamped = Math.max(MIN_INTERVAL_MS, ms);
  try {
    await app.redis.set(REDIS_INTERVAL_PREFIX + table, String(clamped));
  } catch { /* ignore */ }

  endpointIntervals.set(table, clamped);
  logger.info(`[Sync] Interval updated: ${table} = ${clamped / 1000}s`);
}

/** Set interval cho nhiều endpoints cùng lúc. */
export async function setEndpointIntervals(
  app: FastifyInstance,
  intervals: Record<string, number>,
): Promise<void> {
  for (const [table, ms] of Object.entries(intervals)) {
    await setEndpointInterval(app, table, ms);
  }
}

/** Get all current intervals (per-endpoint). */
export function getAllIntervals(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const ep of SYNC_ENDPOINTS) {
    if (ep.syncOnce) continue;
    result[ep.table] = endpointIntervals.get(ep.table) ?? ep.defaultIntervalMs;
  }
  return result;
}

/** Get interval for a specific endpoint. */
export function getEndpointInterval(table: string): number {
  return endpointIntervals.get(table) ?? DEFAULT_GLOBAL_INTERVAL_MS;
}

/**
 * Check xem endpoint có nên chạy trong lần sync này không.
 * So sánh thời gian hiện tại với max(lastRunAt, lastDemandAt) + intervalMs.
 * Nếu demand sync vừa chạy → scheduler skip cho đến interval tiếp theo.
 */
export function shouldRunEndpoint(table: string): boolean {
  const interval = endpointIntervals.get(table);
  if (!interval || interval <= 0) return false; // interval = 0 → disabled

  const lastRun = lastRunAt.get(table) ?? 0;
  const lastDemand = getLastDemandAt(table);
  const effectiveLastRun = Math.max(lastRun, lastDemand);
  return Date.now() - effectiveLastRun >= interval;
}

/** Đánh dấu endpoint vừa chạy xong. */
export function markEndpointRan(table: string): void {
  lastRunAt.set(table, Date.now());
}

// ---------------------------------------------------------------------------
// Backward compat: global interval (dùng cho scheduler tick frequency)
// ---------------------------------------------------------------------------

/** Tính scheduler tick frequency = min(all endpoint intervals), min 30s. */
function getSchedulerTickMs(): number {
  let minMs = DEFAULT_GLOBAL_INTERVAL_MS;
  for (const ms of endpointIntervals.values()) {
    if (ms > 0 && ms < minMs) minMs = ms;
  }
  return Math.max(MIN_INTERVAL_MS, minMs);
}

/**
 * Legacy compat: getSyncIntervalMs returns scheduler tick frequency.
 * Frontend overview card có thể dùng hoặc hiện "Tuỳ chỉnh".
 */
export function getSyncIntervalMs(): number {
  return getSchedulerTickMs();
}

/**
 * Legacy compat: setSyncInterval updates all endpoints to same value.
 * Nếu frontend gọi API cũ (PUT /sync/interval { intervalMs }),
 * sẽ set tất cả recurring endpoints cùng 1 giá trị.
 */
export async function setSyncInterval(app: FastifyInstance, ms: number): Promise<void> {
  const clamped = Math.max(MIN_INTERVAL_MS, ms);

  // Lưu global key (legacy)
  try { await app.redis.set(REDIS_GLOBAL_INTERVAL_KEY, String(clamped)); } catch { /* ignore */ }

  // Set tất cả recurring endpoints
  for (const ep of SYNC_ENDPOINTS) {
    if (ep.syncOnce) continue;
    await setEndpointInterval(app, ep.table, clamped);
  }

  // Restart timer
  if (schedulerRunning) scheduleNextRun();
}

// ---------------------------------------------------------------------------
// Scheduler — single timer, checks per-endpoint intervals
// ---------------------------------------------------------------------------

function scheduleNextRun(): void {
  if (syncTimer) clearTimeout(syncTimer);
  const tickMs = getSchedulerTickMs();

  syncTimer = setTimeout(async () => {
    if (!appRef || !schedulerRunning) return;

    if (!getIsSyncing()) {
      try {
        await runFullSync(appRef);
      } catch (err) {
        logger.error("[Sync] Scheduled run failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    } else {
      logger.debug("[Sync] Skipping scheduled run — sync already in progress");
    }

    if (schedulerRunning) scheduleNextRun();
  }, tickMs);
}

/**
 * Start the background sync scheduler.
 * Loads per-endpoint intervals, first sync 10s after startup, then recurring.
 */
export async function startSyncScheduler(app: FastifyInstance): Promise<void> {
  appRef = app;
  schedulerRunning = true;

  await loadAllIntervals(app);

  const tickMs = getSchedulerTickMs();
  logger.info(`[Sync] Scheduler started (interval: ${tickMs / 1000}s)`);

  initialTimer = setTimeout(() => {
    runFullSync(app).catch((err) => {
      logger.error("[Sync] Initial run failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }).finally(() => {
      if (schedulerRunning) scheduleNextRun();
    });
  }, 10_000);
}

/** Stop the scheduler — called during graceful shutdown. */
export function stopSyncScheduler(): void {
  logger.info("[Sync] Scheduler stopping");
  schedulerRunning = false;
  if (initialTimer) clearTimeout(initialTimer);
  if (syncTimer) clearTimeout(syncTimer);
  initialTimer = null;
  syncTimer = null;
  appRef = null;
}

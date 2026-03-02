import type { FastifyInstance } from "fastify";
import { runFullSync, getIsSyncing } from "./sync.service.js";
import { logger } from "../../utils/logger.js";

const REDIS_INTERVAL_KEY = "sync:interval_ms";
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 phút mặc định

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let initialTimer: ReturnType<typeof setTimeout> | null = null;
let appRef: FastifyInstance | null = null;
let currentIntervalMs = DEFAULT_INTERVAL_MS;
let schedulerRunning = false;

/** Đọc interval từ Redis, fallback env, fallback default. */
async function getIntervalMs(app: FastifyInstance): Promise<number> {
  try {
    const cached = await app.redis.get(REDIS_INTERVAL_KEY);
    if (cached) {
      const n = parseInt(cached, 10);
      if (!isNaN(n) && n >= 30000) return n; // min 30s
    }
  } catch { /* ignore */ }

  const envVal = Number(process.env.SYNC_INTERVAL_MS);
  if (!isNaN(envVal) && envVal >= 30000) return envVal;

  return DEFAULT_INTERVAL_MS;
}

/** Set interval — lưu Redis + restart timer. */
export async function setSyncInterval(app: FastifyInstance, ms: number): Promise<void> {
  const clampedMs = Math.max(30000, ms); // min 30s
  try {
    await app.redis.set(REDIS_INTERVAL_KEY, String(clampedMs));
  } catch { /* ignore */ }

  currentIntervalMs = clampedMs;
  logger.info(`[Sync] Interval updated: ${clampedMs / 1000}s`);

  // Restart timer nếu scheduler đang chạy
  if (schedulerRunning) {
    scheduleNextRun();
  }
}

/** Get current interval. */
export function getSyncIntervalMs(): number {
  return currentIntervalMs;
}

/** Schedule next recurring run using setTimeout (not setInterval). */
function scheduleNextRun(): void {
  if (syncTimer) clearTimeout(syncTimer);

  syncTimer = setTimeout(async () => {
    if (!appRef || !schedulerRunning) return;

    // Đọc interval mới nhất từ Redis (có thể đã thay đổi qua GUI)
    currentIntervalMs = await getIntervalMs(appRef);

    if (!getIsSyncing()) {
      try {
        await runFullSync(appRef, "recurring");
      } catch (err) {
        logger.error("[Sync] Scheduled run failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    } else {
      logger.debug("[Sync] Skipping scheduled run — sync already in progress");
    }

    // Schedule lại với interval mới nhất
    if (schedulerRunning) {
      scheduleNextRun();
    }
  }, currentIntervalMs);
}

/**
 * Start the background sync scheduler.
 * Runs first sync 10s after startup (full mode), then recurring every interval.
 */
export async function startSyncScheduler(app: FastifyInstance): Promise<void> {
  appRef = app;
  schedulerRunning = true;

  // Đọc interval từ Redis
  currentIntervalMs = await getIntervalMs(app);

  logger.info(`[Sync] Scheduler started (interval: ${currentIntervalMs / 1000}s)`);

  // First sync after 10s — full mode (backfill past days + syncOnce)
  initialTimer = setTimeout(() => {
    runFullSync(app, "full").catch((err) => {
      logger.error("[Sync] Initial run failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }).finally(() => {
      // Sau full sync xong → bắt đầu recurring
      if (schedulerRunning) {
        scheduleNextRun();
      }
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

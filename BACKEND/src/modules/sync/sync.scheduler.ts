import type { FastifyInstance } from "fastify";
import { runFullSync } from "./sync.service.js";
import { SYNC_INTERVAL_MS } from "./sync.config.js";
import { logger } from "../../utils/logger.js";

let syncTimer: ReturnType<typeof setInterval> | null = null;
let initialTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Start the background sync scheduler.
 * Runs first sync 10s after startup, then repeats every SYNC_INTERVAL_MS.
 */
export function startSyncScheduler(app: FastifyInstance): void {
  logger.info(`[Sync] Scheduler started (interval: ${SYNC_INTERVAL_MS / 1000}s)`);

  // First sync after 10s — let server fully boot
  initialTimer = setTimeout(() => {
    runFullSync(app).catch((err) => {
      logger.error("[Sync] Initial run failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }, 10_000);

  // Recurring sync
  syncTimer = setInterval(() => {
    runFullSync(app).catch((err) => {
      logger.error("[Sync] Scheduled run failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }, SYNC_INTERVAL_MS);
}

/** Stop the scheduler — called during graceful shutdown. */
export function stopSyncScheduler(): void {
  logger.info("[Sync] Scheduler stopping");
  if (initialTimer) clearTimeout(initialTimer);
  if (syncTimer) clearInterval(syncTimer);
  initialTimer = null;
  syncTimer = null;
}

import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { listActiveAgents } from "../proxy/agent.service.js";
import { decryptSessionCookie } from "../../utils/crypto.js";
import { fetchAllPages } from "./sync.fetcher.js";
import { UPSERT_REGISTRY } from "./sync.upsert.js";
import {
  SYNC_ENDPOINTS,
  SYNC_DATE_START,
  SYNC_PAGE_CONCURRENCY,
  type SyncEndpointConfig,
} from "./sync.config.js";
import { logger } from "../../utils/logger.js";
import { wsManager } from "../../websocket/ws.manager.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/error-codes.js";

const MAX_TIMEOUT_STRIKES = 3; // Timeout quá 3 lần → tự dừng tiến trình đó

let isSyncing = false;
let abortRequested = false;

/** Check if a sync is currently in progress. */
export function getIsSyncing(): boolean {
  return isSyncing;
}

/** Request abort of current sync. Returns true if sync was running. */
export function requestSyncAbort(): boolean {
  if (!isSyncing) return false;
  abortRequested = true;
  logger.info("[Sync] Abort requested");
  return true;
}

/** Check if abort was requested (used internally by sync loops). */
export function isAbortRequested(): boolean {
  return abortRequested;
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
// Hash — md5 của sorted JSON items, dùng để verify sau upsert
// ---------------------------------------------------------------------------

/** Tính hash md5 của mảng items (sorted by JSON string để ổn định). */
function computeHash(items: Record<string, unknown>[]): string {
  const sorted = items.map((i) => JSON.stringify(i)).sort();
  return createHash("md5").update(sorted.join("|")).digest("hex");
}

// ---------------------------------------------------------------------------
// Sync date tracking — dual-write: DB (durable) + Redis (fast cache)
// Mỗi lock bây giờ là PER AGENT + PER TABLE + PER DATE
// ---------------------------------------------------------------------------

/** Redis key: marks that a past date for a given endpoint+agent has been fully synced. */
function syncedDateKey(table: string, agentId: string, date: string): string {
  return `sync:date_done:${table}:${agentId}:${date}`;
}

/** Redis key: marks that a syncOnce endpoint has been synced for a specific agent. */
function syncOnceKey(table: string, agentId: string): string {
  return `sync:once_done:${table}:${agentId}`;
}

const REDIS_DATE_TTL = 90 * 86400; // 90 days

/** Check if a date has been synced for a specific agent — Redis first, DB fallback. */
async function isDateDone(app: FastifyInstance, table: string, agentId: string, date: string): Promise<boolean> {
  // Redis first (fast)
  try {
    const cached = await app.redis.get(syncedDateKey(table, agentId, date));
    if (cached) return true;
  } catch { /* fall through */ }

  // DB fallback (durable)
  const lock = await app.prisma.syncDateLock.findUnique({
    where: { uq_sync_date_lock: { tableName: table, syncDate: date, agentId } },
  });

  if (lock?.hash) {
    // Có hash = verified done → re-populate Redis cache
    try { await app.redis.set(syncedDateKey(table, agentId, date), "1", "EX", REDIS_DATE_TTL); } catch { /* ignore */ }
    return true;
  }

  return false;
}

/** Mark a date as verified done — write hash to DB + Redis. */
async function markDateDone(
  app: FastifyInstance,
  table: string,
  agentId: string,
  date: string,
  itemCount: number,
  hash: string,
): Promise<void> {
  // DB primary (durable)
  try {
    await app.prisma.syncDateLock.upsert({
      where: { uq_sync_date_lock: { tableName: table, syncDate: date, agentId } },
      create: { tableName: table, syncDate: date, agentId, itemCount, hash },
      update: { itemCount, hash, lockedAt: new Date() },
    });
  } catch (err) {
    logger.warn("[Sync] Failed to write SyncDateLock", { table, agentId, date, error: (err as Error).message });
  }

  // Redis cache
  try { await app.redis.set(syncedDateKey(table, agentId, date), "1", "EX", REDIS_DATE_TTL); } catch { /* ignore */ }
}

/** Check if a syncOnce endpoint has been done for a specific agent. */
async function isSyncOnceDone(app: FastifyInstance, table: string, agentId: string): Promise<boolean> {
  try {
    const cached = await app.redis.get(syncOnceKey(table, agentId));
    if (cached) return true;
  } catch { /* fall through */ }

  const lock = await app.prisma.syncDateLock.findUnique({
    where: { uq_sync_date_lock: { tableName: table, syncDate: "__once__", agentId } },
  });

  if (lock) {
    try { await app.redis.set(syncOnceKey(table, agentId), "1"); } catch { /* ignore */ }
    return true;
  }

  return false;
}

/** Mark a syncOnce endpoint as done for a specific agent. */
async function markSyncOnceDone(app: FastifyInstance, table: string, agentId: string): Promise<void> {
  try {
    await app.prisma.syncDateLock.upsert({
      where: { uq_sync_date_lock: { tableName: table, syncDate: "__once__", agentId } },
      create: { tableName: table, syncDate: "__once__", agentId, itemCount: 0 },
      update: { lockedAt: new Date() },
    });
  } catch (err) {
    logger.warn("[Sync] Failed to write SyncDateLock (once)", { table, agentId, error: (err as Error).message });
  }

  try { await app.redis.set(syncOnceKey(table, agentId), "1"); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// DB table name mapping (for verification queries)
// ---------------------------------------------------------------------------

const TABLE_DB_MAP: Record<string, string> = {
  proxyUser: "proxy_users",
  proxyInvite: "proxy_invites",
  proxyDeposit: "proxy_deposits",
  proxyWithdrawal: "proxy_withdrawals",
  proxyBet: "proxy_bets",
  proxyBetOrder: "proxy_bet_orders",
  proxyReportLottery: "proxy_report_lottery",
  proxyReportFunds: "proxy_report_funds",
  proxyReportThirdGame: "proxy_report_third_game",
  proxyBank: "proxy_banks",
};

// ---------------------------------------------------------------------------
// Verification — so sánh fetched count vs DB count sau upsert
// ---------------------------------------------------------------------------

/**
 * Verify after upsert: count rows in DB for this agent+date and compare to fetched count.
 * Returns true if counts match.
 */
async function verifyUpsert(
  prisma: PrismaClient,
  table: string,
  agentId: string,
  syncDate: string | undefined,
  expectedCount: number,
): Promise<{ verified: boolean; dbCount: number }> {
  const dbTable = TABLE_DB_MAP[table];
  if (!dbTable) return { verified: true, dbCount: expectedCount };

  let sql: string;
  let params: unknown[];

  if (syncDate) {
    // Date-range tables have sync_date column
    sql = `SELECT count(*)::int as cnt FROM "${dbTable}" WHERE "agent_id" = $1 AND "sync_date" = $2`;
    params = [agentId, syncDate];
  } else {
    // Non-date tables (user, invite, bank) — count all for agent
    sql = `SELECT count(*)::int as cnt FROM "${dbTable}" WHERE "agent_id" = $1`;
    params = [agentId];
  }

  const result: Array<{ cnt: number }> = await prisma.$queryRawUnsafe(sql, ...params);
  const dbCount = result[0]?.cnt ?? 0;

  return { verified: dbCount >= expectedCount, dbCount };
}

// ---------------------------------------------------------------------------
// Core sync — Agent-centric architecture
// ---------------------------------------------------------------------------

/**
 * Sync mode:
 * - "full"      : Lần đầu hoặc manual trigger.
 *                 syncOnce endpoints → sync nếu chưa từng sync.
 *                 date-range endpoints → sync từng ngày từ SYNC_DATE_START đến today:
 *                   skip nếu ngày đã có hash (verified done).
 * - "recurring" : Auto sync.
 *                 syncOnce endpoints → BỎ QUA hoàn toàn.
 *                 date-range endpoints → chỉ sync ngày hôm nay.
 *                 no-date endpoints (user) → sync bình thường.
 */
export type SyncMode = "full" | "recurring";

type Agent = Awaited<ReturnType<typeof listActiveAgents>>[number];
type UpsertFn = (typeof UPSERT_REGISTRY)[string];

export async function runFullSync(app: FastifyInstance, mode: SyncMode = "full"): Promise<void> {
  if (isSyncing) {
    logger.warn("[Sync] Already in progress, skipping");
    return;
  }
  isSyncing = true;
  abortRequested = false;
  const startTime = Date.now();

  try {
    logger.info(`[Sync] Started (mode: ${mode})`);
    wsManager.broadcast({ type: "sync_status", status: "started", mode });
    const agents = await listActiveAgents(app);

    if (agents.length === 0) {
      logger.warn("[Sync] No active agents, skipping");
      return;
    }

    logger.info(`[Sync] ${agents.length} active agents — launching ${agents.length} independent streams`);

    // Mỗi agent là 1 stream độc lập, chạy song song tất cả
    const agentPromises = agents.map((agent) =>
      runAgentStream(app, agent, mode).catch((err) => {
        logger.error(`[Sync] Agent stream fatal error: ${agent.name}`, {
          agentId: agent.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }),
    );

    await Promise.all(agentPromises);

    const finalStatus = abortRequested ? "aborted" : "completed";
    logger.info(`[Sync] ${finalStatus} (${mode}) in ${Date.now() - startTime}ms`);
    wsManager.broadcast({ type: "sync_status", status: finalStatus, mode, durationMs: Date.now() - startTime });
  } catch (err) {
    logger.error("[Sync] Fatal error", {
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    isSyncing = false;
    abortRequested = false;
  }
}

// ---------------------------------------------------------------------------
// Agent stream — 1 agent = 1 luồng
// Trong luồng: Invite → Member → rồi TẤT CẢ date-range SONG SONG (luồng trong luồng)
// ---------------------------------------------------------------------------

/**
 * Mỗi agent chạy 1 luồng độc lập.
 * Trong luồng đó, fetch theo nhóm tuần tự:
 *   1. Invite (syncOnce) — chờ xong
 *   2. Member/User (no date-range) — chờ xong
 *   3. Tất cả date-range endpoints — mỗi endpoint = 1 luồng con, chạy SONG SONG
 *
 * "Luồng trong luồng": 12 agent song song, mỗi agent lại có 7 date-range luồng con song song.
 * Lỗi ở 1 agent KHÔNG ảnh hưởng agent khác.
 * Lỗi ở 1 endpoint KHÔNG ảnh hưởng endpoint khác.
 */
async function runAgentStream(app: FastifyInstance, agent: Agent, mode: SyncMode): Promise<void> {
  const cookie = decryptSessionCookie(agent.sessionCookie);
  const today = formatDate(new Date());

  logger.info(`[Sync] Agent stream started: ${agent.name} (${agent.extUsername})`);
  const agentStart = Date.now();

  // Phân nhóm endpoints
  const syncOnceEndpoints = SYNC_ENDPOINTS.filter((ep) => ep.syncOnce);
  const noDateEndpoints = SYNC_ENDPOINTS.filter((ep) => !ep.syncOnce && !ep.needsDateRange);
  const dateRangeEndpoints = SYNC_ENDPOINTS.filter((ep) => ep.needsDateRange);

  // ── Nhóm 1: Invite (syncOnce) — tuần tự, chờ xong ──
  for (const endpoint of syncOnceEndpoints) {
    if (abortRequested) break;
    if (mode === "recurring") continue; // recurring bỏ qua invite

    const upsertFn = UPSERT_REGISTRY[endpoint.table];
    if (!upsertFn) continue;

    try {
      const done = await isSyncOnceDone(app, endpoint.table, agent.id);
      if (done) continue;
      await syncAgentEndpoint(app, agent, cookie, endpoint, upsertFn);
      await markSyncOnceDone(app, endpoint.table, agent.id);
      logger.info(`[Sync] ${agent.name} → ${endpoint.table} done (syncOnce)`);
    } catch (err) {
      logger.error(`[Sync] ${agent.name} failed on ${endpoint.table}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ── Nhóm 2: Member/User (no date-range) — tuần tự, chờ xong ──
  for (const endpoint of noDateEndpoints) {
    if (abortRequested) break;

    const upsertFn = UPSERT_REGISTRY[endpoint.table];
    if (!upsertFn) continue;

    try {
      await syncAgentEndpoint(app, agent, cookie, endpoint, upsertFn);
      logger.info(`[Sync] ${agent.name} → ${endpoint.table} done (no-date)`);
    } catch (err) {
      logger.error(`[Sync] ${agent.name} failed on ${endpoint.table}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ── Nhóm 3: Date-range — mỗi endpoint = 1 luồng con, TẤT CẢ song song ──
  // Mỗi luồng con tự đếm timeout strikes, quá 3 lần → tự dừng luồng đó
  if (!abortRequested && dateRangeEndpoints.length > 0) {
    const dateRangeTasks = dateRangeEndpoints.map(async (endpoint) => {
      if (abortRequested) return;

      const upsertFn = UPSERT_REGISTRY[endpoint.table];
      if (!upsertFn) return;

      try {
        await syncAgentDateRange(app, agent, cookie, endpoint, upsertFn, mode, today);
        logger.info(`[Sync] ${agent.name} → ${endpoint.table} done (date-range)`);
      } catch (err) {
        logger.error(`[Sync] ${agent.name} failed on ${endpoint.table}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });

    await Promise.all(dateRangeTasks);
  }

  logger.info(`[Sync] Agent stream completed: ${agent.name} in ${Date.now() - agentStart}ms`);
  wsManager.broadcast({
    type: "sync_agent_done",
    agent: agent.name,
    agentId: agent.id,
    durationMs: Date.now() - agentStart,
  });
}

// ---------------------------------------------------------------------------
// Sync single agent + single endpoint (no date range)
// ---------------------------------------------------------------------------

async function syncAgentEndpoint(
  app: FastifyInstance,
  agent: Agent,
  cookie: string,
  endpoint: SyncEndpointConfig,
  upsertFn: UpsertFn,
): Promise<void> {
  const items = await fetchAllPages({
    path: endpoint.path,
    cookie,
    params: { ...endpoint.extraParams },
    pageSize: endpoint.pageSize,
    pageConcurrency: SYNC_PAGE_CONCURRENCY,
  });

  if (items.length === 0) return;

  const upserted = await upsertFn(app.prisma, agent.id, items);

  // Verify
  const { verified, dbCount } = await verifyUpsert(app.prisma, endpoint.table, agent.id, undefined, items.length);

  logger.debug("[Sync] Upserted", {
    agent: agent.name,
    table: endpoint.table,
    fetched: items.length,
    upserted,
    dbCount,
    verified,
  });

  wsManager.broadcast({
    type: "sync_progress",
    table: endpoint.table,
    agent: agent.name,
    agentId: agent.id,
    fetched: items.length,
    upserted,
    dbCount,
    verified,
  });
}

// ---------------------------------------------------------------------------
// Sync agent date-range — fetch ngày → upsert → verify → hash done → next
// ---------------------------------------------------------------------------

async function syncAgentDateRange(
  app: FastifyInstance,
  agent: Agent,
  cookie: string,
  endpoint: SyncEndpointConfig,
  upsertFn: UpsertFn,
  mode: SyncMode,
  today: string,
): Promise<void> {
  let timeoutStrikes = 0;

  if (mode === "recurring") {
    // Recurring → chỉ sync ngày hôm nay (không hash)
    await syncAgentSingleDay(app, agent, cookie, endpoint, upsertFn, today, false);
    return;
  }

  // Full mode → từng ngày từ SYNC_DATE_START → today
  const dates = generateDateRange(SYNC_DATE_START, today);
  logger.debug(`[Sync] ${agent.name} → ${endpoint.table}: ${dates.length} days`);

  for (const date of dates) {
    if (abortRequested) break;

    const isToday = date === today;

    if (!isToday) {
      // Check hash — có rồi thì skip
      const done = await isDateDone(app, endpoint.table, agent.id, date);
      if (done) continue;
    }

    try {
      await syncAgentSingleDay(app, agent, cookie, endpoint, upsertFn, date, !isToday);
      // Reset strikes khi thành công
      timeoutStrikes = 0;
    } catch (err) {
      if (err instanceof AppError && err.code === ERROR_CODES.UPSTREAM_TIMEOUT) {
        timeoutStrikes++;
        logger.warn(`[Sync] Timeout strike ${timeoutStrikes}/${MAX_TIMEOUT_STRIKES}`, {
          agent: agent.name, table: endpoint.table, date,
        });
        if (timeoutStrikes >= MAX_TIMEOUT_STRIKES) {
          logger.error(`[Sync] ${agent.name} → ${endpoint.table}: ${MAX_TIMEOUT_STRIKES} timeouts liên tiếp, DỪNG tiến trình này`, {
            agent: agent.name, table: endpoint.table,
          });
          wsManager.broadcast({
            type: "sync_progress",
            table: endpoint.table,
            agent: agent.name,
            agentId: agent.id,
            error: `Dừng do timeout ${MAX_TIMEOUT_STRIKES} lần liên tiếp`,
          });
          return; // Dừng luồng endpoint này, các luồng khác vẫn chạy
        }
      } else {
        // Non-timeout error → log but continue to next date
        logger.error(`[Sync] ${agent.name} → ${endpoint.table} error on ${date}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}

/**
 * Sync 1 ngày cho 1 agent + 1 endpoint:
 * fetch → upsert → verify → hash done (nếu markDone=true và verify OK)
 */
async function syncAgentSingleDay(
  app: FastifyInstance,
  agent: Agent,
  cookie: string,
  endpoint: SyncEndpointConfig,
  upsertFn: UpsertFn,
  date: string,
  markDone: boolean,
): Promise<void> {
  const params = { ...buildDateParams(endpoint.path, date, date), ...endpoint.extraParams };

  const items = await fetchAllPages({
    path: endpoint.path,
    cookie,
    params,
    pageSize: endpoint.pageSize,
    pageConcurrency: SYNC_PAGE_CONCURRENCY,
  });

  if (items.length === 0) {
    // Ngày không có data → vẫn đánh dấu done (empty hash) để skip lần sau
    if (markDone) {
      await markDateDone(app, endpoint.table, agent.id, date, 0, "empty");
    }
    return;
  }

  // Upsert
  const upserted = await upsertFn(app.prisma, agent.id, items, date);

  // Verify: so sánh count fetched vs DB
  const { verified, dbCount } = await verifyUpsert(app.prisma, endpoint.table, agent.id, date, items.length);

  if (verified && markDone) {
    // Match → tính hash và đánh dấu done
    const hash = computeHash(items);
    await markDateDone(app, endpoint.table, agent.id, date, items.length, hash);

    logger.debug("[Sync] Verified & marked done", {
      agent: agent.name,
      table: endpoint.table,
      date,
      fetched: items.length,
      dbCount,
      hash: hash.slice(0, 8),
    });
  } else if (!verified) {
    // Mismatch → log warning, KHÔNG đánh dấu done (sẽ retry lần sau)
    logger.warn("[Sync] Verification FAILED — count mismatch", {
      agent: agent.name,
      table: endpoint.table,
      date,
      fetched: items.length,
      dbCount,
    });
  }

  // Emit progress
  wsManager.broadcast({
    type: "sync_progress",
    table: endpoint.table,
    agent: agent.name,
    agentId: agent.id,
    date,
    fetched: items.length,
    upserted,
    dbCount,
    verified,
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
    return { date: `${start} | ${end}` };
  }
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
// Sync single agent (manual trigger from API)
// ---------------------------------------------------------------------------

/**
 * Run sync for a single agent across ALL endpoints.
 * Always runs in "full" mode.
 */
export async function runAgentSync(app: FastifyInstance, agentId: string): Promise<void> {
  if (isSyncing) {
    logger.warn("[Sync] Already in progress, skipping single-agent sync");
    return;
  }
  isSyncing = true;
  abortRequested = false;
  const startTime = Date.now();

  try {
    const agent = await app.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || !agent.isActive || agent.status !== "active") {
      logger.warn("[Sync] Agent not found or inactive", { agentId });
      return;
    }

    logger.info(`[Sync] Single-agent sync started: ${agent.name}`);
    wsManager.broadcast({ type: "sync_status", status: "started", mode: "full" });

    // Reuse the stream logic for a single agent
    await runAgentStream(app, agent as Agent, "full");

    logger.info(`[Sync] Single-agent sync completed: ${agent.name} in ${Date.now() - startTime}ms`);
    wsManager.broadcast({ type: "sync_status", status: "completed", mode: "full", durationMs: Date.now() - startTime });
  } catch (err) {
    logger.error("[Sync] Single-agent sync fatal error", {
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    isSyncing = false;
    abortRequested = false;
  }
}

// ---------------------------------------------------------------------------
// Sync single agent + single endpoint (manual trigger from API)
// ---------------------------------------------------------------------------

export async function runAgentEndpointSync(
  app: FastifyInstance,
  agentId: string,
  endpointTable: string,
): Promise<void> {
  if (isSyncing) {
    logger.warn("[Sync] Already in progress, skipping single-agent-endpoint sync");
    return;
  }
  isSyncing = true;
  abortRequested = false;
  const startTime = Date.now();

  try {
    const agent = await app.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || !agent.isActive || agent.status !== "active") {
      logger.warn("[Sync] Agent not found or inactive", { agentId });
      return;
    }

    const endpoint = SYNC_ENDPOINTS.find((ep) => ep.table === endpointTable);
    if (!endpoint) {
      logger.warn("[Sync] Unknown endpoint table", { endpointTable });
      return;
    }

    const upsertFn = UPSERT_REGISTRY[endpoint.table];
    if (!upsertFn) {
      logger.warn("[Sync] No upsert function", { table: endpoint.table });
      return;
    }

    logger.info(`[Sync] Single-agent-endpoint sync started: ${agent.name} → ${endpoint.table}`);
    wsManager.broadcast({ type: "sync_status", status: "started", mode: "full" });

    const cookie = decryptSessionCookie(agent.sessionCookie);
    const today = formatDate(new Date());

    if (endpoint.syncOnce) {
      await syncAgentEndpoint(app, agent as Agent, cookie, endpoint, upsertFn);
      await markSyncOnceDone(app, endpoint.table, agent.id);
    } else if (!endpoint.needsDateRange) {
      await syncAgentEndpoint(app, agent as Agent, cookie, endpoint, upsertFn);
    } else {
      await syncAgentDateRange(app, agent as Agent, cookie, endpoint, upsertFn, "full", today);
    }

    logger.info(`[Sync] Single-agent-endpoint sync completed: ${agent.name} → ${endpoint.table} in ${Date.now() - startTime}ms`);
    wsManager.broadcast({ type: "sync_status", status: "completed", mode: "full", durationMs: Date.now() - startTime });
  } catch (err) {
    logger.error("[Sync] Single-agent-endpoint sync fatal error", {
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    isSyncing = false;
    abortRequested = false;
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

  // Also clear sync locks for this agent
  await prisma.syncDateLock.deleteMany({ where: { agentId } });

  const totalDeleted = Object.values(result).reduce((a, b) => a + b, 0);
  logger.info(`[Sync] Purged agent data: ${totalDeleted} rows`, { agentId });
  return result;
}

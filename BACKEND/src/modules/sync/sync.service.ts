import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { listActiveAgents } from "../proxy/agent.service.js";
import { decryptSessionCookie } from "../../utils/crypto.js";
import { fetchAllPages } from "./sync.fetcher.js";
import { fetchUpstream } from "../proxy/proxy.client.js";
import { UPSERT_REGISTRY } from "./sync.upsert.js";
import {
  SYNC_ENDPOINTS,
  SYNC_DATE_START,
  SYNC_PAGE_CONCURRENCY,
  type SyncEndpointConfig,
} from "./sync.config.js";
import { shouldRunEndpoint, markEndpointRan } from "./sync.scheduler.js";
import { isEndpointLocked } from "./sync.demand.js";
import { logger } from "../../utils/logger.js";
import { wsManager } from "../../websocket/ws.manager.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/error-codes.js";

/** Custom error to signal session expired → abort entire agent stream */
class AgentSessionExpiredError extends Error {
  constructor(agentName: string) {
    super(`Agent session expired: ${agentName}`);
    this.name = "AgentSessionExpiredError";
  }
}

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
 * Date column name mapping for verification queries.
 * Report tables use "report_date", transaction tables use "sync_date".
 */
const DATE_COLUMN_MAP: Record<string, string> = {
  proxy_report_lottery: "report_date",
  proxy_report_funds: "report_date",
  proxy_report_third_game: "report_date",
};

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
    // Use correct date column name (report_date for reports, sync_date for others)
    const dateCol = DATE_COLUMN_MAP[dbTable] ?? "sync_date";
    sql = `SELECT count(*)::int as cnt FROM "${dbTable}" WHERE "agent_id" = $1 AND "${dateCol}" = $2`;
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
// Catch-up detection — check xem tất cả date-range đã sync hết tới hôm nay chưa
// ---------------------------------------------------------------------------

/**
 * Check xem agent đã caught up chưa: ngày hôm qua phải done cho TẤT CẢ date-range endpoints.
 * Nếu hôm qua done → tất cả ngày trước đó cũng done (sync tuần tự từ cũ → mới).
 * Chỉ cần 7 Redis GETs (1 per date-range endpoint) — rất nhanh.
 */
async function isAgentCaughtUp(app: FastifyInstance, agentId: string, today: string): Promise<boolean> {
  const yesterday = formatDate(new Date(new Date(today + "T00:00:00").getTime() - 86400000));
  const dateRangeEndpoints = SYNC_ENDPOINTS.filter((ep) => ep.needsDateRange);

  for (const ep of dateRangeEndpoints) {
    const done = await isDateDone(app, ep.table, agentId, yesterday);
    if (!done) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Core sync — Agent-centric architecture
// ---------------------------------------------------------------------------

type Agent = Awaited<ReturnType<typeof listActiveAgents>>[number];
type UpsertFn = (typeof UPSERT_REGISTRY)[string];

/**
 * Full sync — luôn sync từ SYNC_DATE_START đến hôm nay.
 * isDateDone skip ngày đã xong (Redis GET nhanh) → hiệu quả như recurring.
 * Đảm bảo phải sync hết tới hôm nay, không bỏ sót ngày nào.
 */
export async function runFullSync(app: FastifyInstance): Promise<void> {
  if (isSyncing) {
    logger.warn("[Sync] Already in progress, skipping");
    return;
  }
  isSyncing = true;
  abortRequested = false;
  const startTime = Date.now();

  try {
    logger.info("[Sync] Started");
    wsManager.broadcast({ type: "sync_status", status: "started" });
    const agents = await listActiveAgents(app);

    if (agents.length === 0) {
      logger.warn("[Sync] No active agents, skipping");
      return;
    }

    logger.info(`[Sync] ${agents.length} active agents — launching ${agents.length} independent streams`);

    // Xác định endpoint nào cần chạy lần này (per-endpoint interval)
    const endpointsToRun = new Set<string>();
    for (const ep of SYNC_ENDPOINTS) {
      if (ep.syncOnce) {
        endpointsToRun.add(ep.table); // syncOnce luôn check (đã có isSyncOnceDone guard)
      } else if (shouldRunEndpoint(ep.table)) {
        endpointsToRun.add(ep.table);
        markEndpointRan(ep.table);
      }
    }

    if (endpointsToRun.size === 0) {
      logger.debug("[Sync] No endpoints due this cycle, skipping");
      return;
    }

    logger.info(`[Sync] Endpoints this cycle: ${[...endpointsToRun].join(", ")}`);

    // Mỗi agent là 1 stream độc lập, chạy song song tất cả
    const agentPromises = agents.map((agent) =>
      runAgentStream(app, agent, endpointsToRun).catch((err) => {
        logger.error(`[Sync] Agent stream fatal error: ${agent.name}`, {
          agentId: agent.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }),
    );

    await Promise.all(agentPromises);

    const finalStatus = abortRequested ? "aborted" : "completed";
    logger.info(`[Sync] ${finalStatus} in ${Date.now() - startTime}ms`);
    wsManager.broadcast({ type: "sync_status", status: finalStatus, durationMs: Date.now() - startTime });
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
async function runAgentStream(
  app: FastifyInstance,
  agent: Agent,
  endpointsToRun?: Set<string>,
): Promise<void> {
  const cookie = decryptSessionCookie(agent.sessionCookie);
  const today = formatDate(new Date());

  logger.info(`[Sync] Agent stream started: ${agent.name} (${agent.extUsername})`);
  const agentStart = Date.now();

  // Phân nhóm endpoints — filter theo endpointsToRun nếu có
  const shouldInclude = (ep: SyncEndpointConfig) =>
    !endpointsToRun || endpointsToRun.has(ep.table);

  const syncOnceEndpoints = SYNC_ENDPOINTS.filter((ep) => ep.syncOnce && shouldInclude(ep));
  const noDateEndpoints = SYNC_ENDPOINTS.filter((ep) => !ep.syncOnce && !ep.needsDateRange && shouldInclude(ep));
  const dateRangeEndpoints = SYNC_ENDPOINTS.filter((ep) => ep.needsDateRange && shouldInclude(ep));

  // Helper: nếu lỗi là session expired → throw AgentSessionExpiredError để dừng agent ngay
  const rethrowIfSessionExpired = (err: unknown) => {
    if (err instanceof AppError && err.code === ERROR_CODES.AGENT_SESSION_EXPIRED) {
      throw new AgentSessionExpiredError(agent.name);
    }
    if (err instanceof AgentSessionExpiredError) throw err;
  };

  try {
    // ── Nhóm 1: Invite (syncOnce) — tuần tự, chờ xong ──
    for (const endpoint of syncOnceEndpoints) {
      if (abortRequested) break;

      const upsertFn = UPSERT_REGISTRY[endpoint.table];
      if (!upsertFn) continue;

      try {
        const done = await isSyncOnceDone(app, endpoint.table, agent.id);
        if (done) continue;
        await syncAgentEndpoint(app, agent, cookie, endpoint, upsertFn);
        await markSyncOnceDone(app, endpoint.table, agent.id);
        logger.info(`[Sync] ${agent.name} → ${endpoint.table} done (syncOnce)`);
      } catch (err) {
        rethrowIfSessionExpired(err);
        logger.error(`[Sync] ${agent.name} failed on ${endpoint.table}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // ── Nhóm 2: Member/User (no date-range) ──
    // Catch-up phase: member chỉ sync 1 lần đầu (chưa có data).
    // Sau khi tất cả date-range đã sync hết tới hôm nay → sync member mỗi chu kỳ.
    const memberHasData = await app.prisma.proxyUser.count({ where: { agentId: agent.id } }) > 0;
    const caughtUp = memberHasData ? await isAgentCaughtUp(app, agent.id, today) : true;

    if (caughtUp) {
      for (const endpoint of noDateEndpoints) {
        if (abortRequested) break;
        if (isEndpointLocked(endpoint.table)) {
          logger.debug(`[Sync] ${agent.name} → skip ${endpoint.table} (demand sync đang chạy)`);
          continue;
        }

        const upsertFn = UPSERT_REGISTRY[endpoint.table];
        if (!upsertFn) continue;

        try {
          await syncAgentEndpoint(app, agent, cookie, endpoint, upsertFn);
          logger.info(`[Sync] ${agent.name} → ${endpoint.table} done (no-date)`);
        } catch (err) {
          rethrowIfSessionExpired(err);
          logger.error(`[Sync] ${agent.name} failed on ${endpoint.table}`, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } else {
      logger.debug(`[Sync] ${agent.name} → skip member (đang catch-up date-range)`);
    }

    // ── Nhóm 3: Date-range — mỗi endpoint = 1 luồng con, TẤT CẢ song song ──
    // Mỗi luồng con tự đếm timeout strikes, quá 3 lần → tự dừng luồng đó
    if (!abortRequested && dateRangeEndpoints.length > 0) {
      const dateRangeTasks = dateRangeEndpoints.map(async (endpoint) => {
        if (abortRequested) return;
        if (isEndpointLocked(endpoint.table)) {
          logger.debug(`[Sync] ${agent.name} → skip ${endpoint.table} (demand sync đang chạy)`);
          return;
        }

        const upsertFn = UPSERT_REGISTRY[endpoint.table];
        if (!upsertFn) return;

        try {
          await syncAgentDateRange(app, agent, cookie, endpoint, upsertFn, today);
          logger.info(`[Sync] ${agent.name} → ${endpoint.table} done (date-range)`);
        } catch (err) {
          // Session expired → let it propagate to abort agent
          if (err instanceof AgentSessionExpiredError) throw err;
          logger.error(`[Sync] ${agent.name} failed on ${endpoint.table}`, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });

      await Promise.all(dateRangeTasks);
    }
  } catch (err) {
    if (err instanceof AgentSessionExpiredError) {
      logger.warn(`[Sync] ${agent.name} — session expired, DỪNG agent stream`);
      wsManager.broadcast({
        type: "sync_progress",
        agent: agent.name,
        agentId: agent.id,
        error: "Session expired — agent stream stopped",
      });
    } else {
      throw err; // Unexpected error, propagate
    }
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

export async function syncAgentEndpoint(
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
  today: string,
): Promise<void> {
  let timeoutStrikes = 0;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 10; // Dừng endpoint nếu lỗi liên tục 10 ngày

  // Từng ngày từ SYNC_DATE_START → today (isDateDone skip ngày đã xong)
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
      consecutiveErrors = 0;
    } catch (err) {
      // Session expired → abort toàn bộ agent stream (throw lên trên)
      if (err instanceof AppError && err.code === ERROR_CODES.AGENT_SESSION_EXPIRED) {
        throw new AgentSessionExpiredError(agent.name);
      }

      if (err instanceof AppError && err.code === ERROR_CODES.UPSTREAM_TIMEOUT) {
        timeoutStrikes++;
        logger.warn(`[Sync] Timeout strike ${timeoutStrikes}/${MAX_TIMEOUT_STRIKES}`, {
          agent: agent.name, table: endpoint.table, date,
        });
        if (timeoutStrikes >= MAX_TIMEOUT_STRIKES) {
          logger.error(`[Sync] ${agent.name} → ${endpoint.table}: ${MAX_TIMEOUT_STRIKES} timeouts liên tiếp, DỪNG`, {
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
        consecutiveErrors++;
        logger.error(`[Sync] ${agent.name} → ${endpoint.table} error on ${date} (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`, {
          error: err instanceof Error ? err.message : String(err),
        });

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          logger.error(`[Sync] ${agent.name} → ${endpoint.table}: ${MAX_CONSECUTIVE_ERRORS} lỗi liên tiếp, DỪNG`, {
            agent: agent.name, table: endpoint.table,
          });
          return;
        }
      }
    }
  }
}

/**
 * Sync 1 ngày cho 1 agent + 1 endpoint.
 * Streaming mode: fetch page → upsert ngay → không tích luỹ trong memory.
 * Quan trọng cho betOrder/bet (400k+ items/ngày/agent).
 */
export async function syncAgentSingleDay(
  app: FastifyInstance,
  agent: Agent,
  cookie: string,
  endpoint: SyncEndpointConfig,
  upsertFn: UpsertFn,
  date: string,
  markDone: boolean,
): Promise<void> {
  const params = { ...buildDateParams(endpoint.path, date, date), ...endpoint.extraParams };

  // ── Page 1: lấy total count ──
  const firstParams = { ...params, page: "1", limit: String(endpoint.pageSize) };
  const first = await fetchUpstream({ path: endpoint.path, cookie, params: firstParams });

  const firstItems = Array.isArray(first.data)
    ? (first.data as Record<string, unknown>[])
    : [];
  const totalCount = first.count ?? firstItems.length;
  const totalPages = Math.ceil(totalCount / endpoint.pageSize);

  if (totalCount === 0 && firstItems.length === 0) {
    // Ngày không có data → vẫn đánh dấu done (empty hash) để skip lần sau
    if (markDone) {
      await markDateDone(app, endpoint.table, agent.id, date, 0, "empty");
    }
    return;
  }

  // ── Streaming: fetch page → upsert ngay → giải phóng memory ──
  let totalFetched = firstItems.length;
  let totalUpserted = 0;

  // Upsert page 1
  if (firstItems.length > 0) {
    totalUpserted += await upsertFn(app.prisma, agent.id, firstItems, date);
  }

  // Fetch + upsert remaining pages (tuần tự để tránh memory spike)
  if (totalPages > 1) {
    for (let page = 2; page <= totalPages; page++) {
      if (abortRequested) break;

      try {
        const pageParams = { ...params, page: String(page), limit: String(endpoint.pageSize) };
        const res = await fetchUpstream({ path: endpoint.path, cookie, params: pageParams });
        const pageItems = Array.isArray(res.data)
          ? (res.data as Record<string, unknown>[])
          : [];

        if (pageItems.length > 0) {
          totalUpserted += await upsertFn(app.prisma, agent.id, pageItems, date);
        }
        totalFetched += pageItems.length;
      } catch (err) {
        // Session expired / timeout → bubble up
        if (err instanceof AppError && (
          err.code === ERROR_CODES.AGENT_SESSION_EXPIRED ||
          err.code === ERROR_CODES.UPSTREAM_TIMEOUT
        )) {
          throw err;
        }
        // Non-critical page error → log, continue
        logger.warn(`[Sync] ${agent.name} → ${endpoint.table} page ${page} failed`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // ── Verify: so sánh upserted count vs DB ──
  // Dùng totalUpserted (sau dedup) thay vì totalFetched (trước dedup) vì upstream có thể trả duplicate serial_no
  const { verified, dbCount } = await verifyUpsert(app.prisma, endpoint.table, agent.id, date, totalUpserted);

  if (verified && markDone) {
    // Match → đánh dấu done
    const hash = `count:${totalUpserted}`;
    await markDateDone(app, endpoint.table, agent.id, date, totalUpserted, hash);

    logger.debug("[Sync] Verified & marked done", {
      agent: agent.name,
      table: endpoint.table,
      date,
      fetched: totalFetched,
      upserted: totalUpserted,
      dbCount,
    });
  } else if (!verified) {
    // Mismatch → log warning, KHÔNG đánh dấu done (sẽ retry lần sau)
    logger.warn("[Sync] Verification FAILED — count mismatch", {
      agent: agent.name,
      table: endpoint.table,
      date,
      fetched: totalFetched,
      upserted: totalUpserted,
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
    fetched: totalFetched,
    upserted: totalUpserted,
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
    wsManager.broadcast({ type: "sync_status", status: "started" });

    // Reuse the stream logic for a single agent
    await runAgentStream(app, agent as Agent);

    logger.info(`[Sync] Single-agent sync completed: ${agent.name} in ${Date.now() - startTime}ms`);
    wsManager.broadcast({ type: "sync_status", status: "completed", durationMs: Date.now() - startTime });
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
    wsManager.broadcast({ type: "sync_status", status: "started" });

    const cookie = decryptSessionCookie(agent.sessionCookie);
    const today = formatDate(new Date());

    if (endpoint.syncOnce) {
      await syncAgentEndpoint(app, agent as Agent, cookie, endpoint, upsertFn);
      await markSyncOnceDone(app, endpoint.table, agent.id);
    } else if (!endpoint.needsDateRange) {
      await syncAgentEndpoint(app, agent as Agent, cookie, endpoint, upsertFn);
    } else {
      await syncAgentDateRange(app, agent as Agent, cookie, endpoint, upsertFn, today);
    }

    logger.info(`[Sync] Single-agent-endpoint sync completed: ${agent.name} → ${endpoint.table} in ${Date.now() - startTime}ms`);
    wsManager.broadcast({ type: "sync_status", status: "completed", durationMs: Date.now() - startTime });
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

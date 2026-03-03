import type { FastifyInstance } from "fastify";
import { fetchUpstream } from "./proxy.client.js";
import * as agentService from "./agent.service.js";
import { decryptSessionCookie } from "../../utils/crypto.js";
import { promisePool } from "../../utils/concurrency.js";
import { logger } from "../../utils/logger.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import { tryDbFirst } from "./db-first.service.js";
import { SYNC_ENDPOINTS } from "../sync/sync.config.js";
import { UPSERT_REGISTRY, upsertUsersSimple } from "../sync/sync.upsert.js";
import { signalDemandSync } from "../sync/sync.demand.js";

// ---------------------------------------------------------------------------
// Cache TTL (seconds)
// ---------------------------------------------------------------------------
const CACHE_TTL: Record<string, number> = {
  "/agent/user.html": 60,
  "/agent/inviteList.html": 180,
  "/agent/reportLottery.html": 120,
  "/agent/reportFunds.html": 120,
  "/agent/reportThirdGame.html": 120,
  "/agent/bankList.html": 300,
  "/agent/depositAndWithdrawal.html": 30,
  "/agent/withdrawalsRecord.html": 30,
  "/agent/bet.html": 30,
  "/agent/betOrder.html": 30,
  "/agent/getRebateOddsPanel.html": 600,
  "/agent/getLottery": 600,
};


// ---------------------------------------------------------------------------
// Natural sort keys
// ---------------------------------------------------------------------------
const NATURAL_SORT_KEY: Record<string, string> = {
  "/agent/user.html": "register_time",
  "/agent/inviteList.html": "create_time",
  "/agent/reportFunds.html": "date",
  "/agent/depositAndWithdrawal.html": "create_time",
  "/agent/withdrawalsRecord.html": "create_time",
  "/agent/bet.html": "create_time",
  "/agent/betOrder.html": "bet_time",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simple deterministic cache key — no MD5 hashing overhead.
 * Params are sorted and joined, then used directly as key suffix.
 */
function buildCacheKey(path: string, params: Record<string, string>, agentId: string): string {
  const keys = Object.keys(params).sort();
  const parts: string[] = [];
  for (const k of keys) {
    const v = params[k];
    if (v !== "" && v !== undefined) parts.push(`${k}=${v}`);
  }
  return `proxy:${agentId}:${path}:${parts.join("&")}`;
}

/**
 * Date param config per endpoint:
 * - param: tên param upstream nhận (date hoặc bet_time)
 * - separator: format upstream cần ("|" hoặc " | ")
 * - split: true = tách thành start_date/end_date (cho DB-first), false = gộp thành 1 param
 *
 * Report endpoints: upstream nhận date = "YYYY-MM-DD | YYYY-MM-DD" (pipe + spaces)
 * Non-report endpoints: upstream nhận date = "YYYY-MM-DD|YYYY-MM-DD" (pipe, no spaces)
 * betOrder: upstream nhận bet_time = "YYYY-MM-DD|YYYY-MM-DD"
 */
const DATE_UPSTREAM_FORMAT: Record<string, { param: string; separator: string }> = {
  "/agent/depositAndWithdrawal.html": { param: "date", separator: "|" },
  "/agent/withdrawalsRecord.html":    { param: "date", separator: "|" },
  "/agent/bet.html":                  { param: "date", separator: "|" },
  "/agent/betOrder.html":             { param: "bet_time", separator: "|" },
  "/agent/reportLottery.html":        { param: "date", separator: " | " },
  "/agent/reportFunds.html":          { param: "date", separator: " | " },
  "/agent/reportThirdGame.html":      { param: "date", separator: " | " },
};

function buildUpstreamParams(input: Record<string, unknown>, path: string): Record<string, string> {
  const params: Record<string, string> = {};
  const dateFmt = DATE_UPSTREAM_FORMAT[path];

  for (const [key, value] of Object.entries(input)) {
    if (key === "agentId" || key === "_requestId") continue;
    if (value === undefined || value === null || value === "") continue;

    // Convert frontend date format ("YYYY-MM-DD - YYYY-MM-DD") to upstream format
    if ((key === "date" || key === "bet_time") && dateFmt) {
      const parts = String(value).split(" - ");
      if (parts.length === 2) {
        const start = parts[0].trim();
        const end = parts[1].trim();
        // Store as start_date/end_date for DB-first resolution
        params["start_date"] = start;
        params["end_date"] = end;
        // Also store in upstream format for proxy call
        params[dateFmt.param] = `${start}${dateFmt.separator}${end}`;
      }
      continue;
    }

    params[key] = String(value);
  }
  return params;
}

/**
 * Reference-only requests that should always use a single agent
 * (dropdown data, cascading selects — same data across all agents).
 */
function isReferenceRequest(path: string, input: Record<string, unknown>): boolean {
  if (path === "/agent/getLottery") return true;
  if (path === "/agent/getRebateOddsPanel.html") return true;
  if (path === "/agent/bet.html" && input.play_type) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SingleResult<T> {
  items: T[];
  total: number;
  totalData?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Sort merged items
// ---------------------------------------------------------------------------

function sortMergedItems<T>(items: T[], path: string): T[] {
  const sortKey = NATURAL_SORT_KEY[path];
  if (!sortKey || items.length === 0) return items;

  return items.sort((a: any, b: any) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return String(vb).localeCompare(String(va));
  });
}

// ---------------------------------------------------------------------------
// Compute totalData from merged items — guarantees accuracy for multi-agent
// ---------------------------------------------------------------------------

/**
 * Mapping: endpoint → { totalDataKey: itemFieldKey }
 * Defines how to compute each total field by summing the corresponding
 * item field across all merged items. "count" fields count occurrences.
 */
const TOTAL_DATA_FIELDS: Record<string, Record<string, string | "COUNT_DISTINCT">> = {
  "/agent/reportThirdGame.html": {
    total_bet_times: "t_bet_times",
    total_bet_amount: "t_bet_amount",
    total_turnover: "t_turnover",
    total_prize: "t_prize",
    total_win_lose: "t_win_lose",
    total_bet_number: "COUNT_DISTINCT",   // count distinct usernames
  },
  "/agent/reportLottery.html": {
    total_bet_count: "bet_count",
    total_bet_amount: "bet_amount",
    total_valid_amount: "valid_amount",
    total_rebate_amount: "rebate_amount",
    total_result: "result",
    total_win_lose: "win_lose",
    total_prize: "prize",
    total_bet_number: "COUNT_DISTINCT",
  },
  "/agent/reportFunds.html": {
    total_deposit_count: "deposit_count",
    total_deposit_amount: "deposit_amount",
    total_withdrawal_count: "withdrawal_count",
    total_withdrawal_amount: "withdrawal_amount",
    total_charge_fee: "charge_fee",
    total_agent_commission: "agent_commission",
    total_promotion: "promotion",
    total_third_rebate: "third_rebate",
    total_third_activity_amount: "third_activity_amount",
    total_user_count: "COUNT_DISTINCT",
  },
  "/agent/bet.html": {
    total_money: "money",
    total_rebate_amount: "rebate_amount",
    total_result: "result",
  },
};

function computeTotalFromItems<T>(
  items: T[],
  path: string,
  upstreamTotalData?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const fieldMap = TOTAL_DATA_FIELDS[path];

  // If no field mapping defined, fall back to upstream totalData (single-agent)
  if (!fieldMap) return upstreamTotalData;
  if (items.length === 0) return undefined;

  const result: Record<string, unknown> = {};
  const distinctUsers = new Set<string>();

  for (const item of items) {
    const row = item as Record<string, unknown>;
    if (row.username) distinctUsers.add(String(row.username));
  }

  for (const [totalKey, itemKey] of Object.entries(fieldMap)) {
    if (itemKey === "COUNT_DISTINCT") {
      result[totalKey] = distinctUsers.size;
      continue;
    }

    let sum = 0;
    for (const item of items) {
      const val = (item as Record<string, unknown>)[itemKey];
      if (val != null && val !== "") {
        const n = parseFloat(String(val));
        if (!isNaN(n)) sum += n;
      }
    }
    result[totalKey] = sum.toFixed(4);
  }

  return result;
}

/**
 * Fallback: sum totalData from multiple upstream responses.
 * Used for endpoints without explicit field mapping.
 */
function mergeTotalData(
  results: Array<{ totalData?: Record<string, unknown> }>,
): Record<string, unknown> | undefined {
  const allTotals = results.map((r) => r.totalData).filter(Boolean) as Record<string, unknown>[];
  if (allTotals.length === 0) return undefined;

  const merged: Record<string, unknown> = {};
  for (const td of allTotals) {
    for (const [key, val] of Object.entries(td)) {
      const num = parseFloat(String(val));
      if (!isNaN(num)) {
        merged[key] = ((merged[key] as number) || 0) + num;
      } else {
        merged[key] = val;
      }
    }
  }

  for (const [key, val] of Object.entries(merged)) {
    if (typeof val === "number") {
      merged[key] = val.toFixed(4);
    }
  }
  return merged;
}

// ---------------------------------------------------------------------------
// fetchSingleAgent — fetch one agent with Redis cache
// ---------------------------------------------------------------------------

async function fetchSingleAgent<T = unknown>(
  app: FastifyInstance,
  path: string,
  params: Record<string, string>,
  agentId: string,
  agentName: string,
  cookie: string,
  ttl: number,
  requestId?: string,
): Promise<SingleResult<T>> {
  const cacheKey = buildCacheKey(path, params, agentId);

  // 1. Check Redis cache
  try {
    const cached = await app.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Redis error — continue without cache
  }

  // 2. Fetch from upstream (with auto re-login on session expired)
  let activeCookie = cookie;
  let upstream;
  try {
    upstream = await fetchUpstream<T>({ path, cookie: activeCookie, params, requestId });
  } catch (err) {
    if (err instanceof AppError && err.code === ERROR_CODES.AGENT_SESSION_EXPIRED) {
      const newCookie = await agentService.attemptAutoRelogin(app, agentId);
      if (newCookie) {
        activeCookie = newCookie;
        upstream = await fetchUpstream<T>({ path, cookie: activeCookie, params, requestId });
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

  let result: SingleResult<T>;

  if (Array.isArray(upstream.data)) {
    const items = upstream.data.map((item: any) => ({ _agentName: agentName, ...item }));
    result = {
      items: items as T[],
      total: upstream.count ?? 0,
      totalData: upstream.total_data,
    };
  } else {
    result = {
      items: upstream.data as T[],
      total: upstream.count ?? 0,
      totalData: upstream.total_data,
    };
  }

  // 3. Store in Redis (fire-and-forget — don't await)
  app.redis.set(cacheKey, JSON.stringify(result), "EX", ttl).catch(() => {});

  // 4. Write-through to DB (fire-and-forget)
  if (Array.isArray(result.items)) {
    writeThroughToDb(app, path, agentId, result.items as Record<string, unknown>[]).catch(() => {});
  }

  return result;
}

// ---------------------------------------------------------------------------
// Multi-agent batch cache check via Redis MGET
// ---------------------------------------------------------------------------

async function fetchMultiAgentWithPipeline<T = unknown>(
  app: FastifyInstance,
  path: string,
  params: Record<string, string>,
  agents: Array<{ id: string; name: string; sessionCookie: string }>,
  ttl: number,
  requestId?: string,
): Promise<SingleResult<T>[]> {
  // Pre-compute cache keys and decrypt cookies BEFORE any I/O
  const agentMeta = agents.map((agent) => ({
    agent,
    cacheKey: buildCacheKey(path, params, agent.id),
    cookie: decryptSessionCookie(agent.sessionCookie),
  }));

  // 1. Batch cache check with MGET (single Redis round-trip)
  let cached: (string | null)[] = [];
  try {
    cached = await app.redis.mget(...agentMeta.map((m) => m.cacheKey));
  } catch {
    cached = new Array(agents.length).fill(null);
  }

  // 2. Determine which agents need upstream fetch
  const results: SingleResult<T>[] = new Array(agents.length);
  const toFetch: Array<{ idx: number; meta: (typeof agentMeta)[0] }> = [];

  for (let i = 0; i < agentMeta.length; i++) {
    if (cached[i]) {
      try {
        results[i] = JSON.parse(cached[i]!);
        continue;
      } catch {
        // Corrupt cache — re-fetch
      }
    }
    toFetch.push({ idx: i, meta: agentMeta[i] });
  }

  // 3. Fetch only missing agents — ALL in parallel (no concurrency cap)
  if (toFetch.length > 0) {
    const fetched = await promisePool(
      toFetch,
      toFetch.length,
      async ({ idx, meta }) => {
        try {
          const upstream = await fetchUpstream<T>({ path, cookie: meta.cookie, params, requestId });
          let result: SingleResult<T>;
          if (Array.isArray(upstream.data)) {
            const items = upstream.data.map((item: any) => ({
              _agentName: meta.agent.name,
              ...item,
            }));
            result = { items: items as T[], total: upstream.count ?? 0, totalData: upstream.total_data };
          } else {
            result = { items: upstream.data as T[], total: upstream.count ?? 0, totalData: upstream.total_data };
          }
          return { idx, result, cacheKey: meta.cacheKey };
        } catch (err) {
          // Auto re-login on session expired
          if (err instanceof AppError && err.code === ERROR_CODES.AGENT_SESSION_EXPIRED) {
            try {
              const newCookie = await agentService.attemptAutoRelogin(app, meta.agent.id);
              if (newCookie) {
                const retryUpstream = await fetchUpstream<T>({ path, cookie: newCookie, params, requestId });
                let retryResult: SingleResult<T>;
                if (Array.isArray(retryUpstream.data)) {
                  const items = retryUpstream.data.map((item: any) => ({
                    _agentName: meta.agent.name,
                    ...item,
                  }));
                  retryResult = { items: items as T[], total: retryUpstream.count ?? 0, totalData: retryUpstream.total_data };
                } else {
                  retryResult = { items: retryUpstream.data as T[], total: retryUpstream.count ?? 0, totalData: retryUpstream.total_data };
                }
                return { idx, result: retryResult, cacheKey: meta.cacheKey };
              }
            } catch (reloginErr) {
              logger.warn("Agent re-login retry also failed", {
                agentId: meta.agent.id,
                error: reloginErr instanceof Error ? reloginErr.message : String(reloginErr),
              });
            }
          }

          logger.warn("Agent fetch failed, skipping", {
            agentId: meta.agent.id,
            name: meta.agent.name,
            requestId,
            error: err instanceof Error ? err.message : String(err),
          });
          return { idx, result: { items: [] as T[], total: 0 } as SingleResult<T>, cacheKey: null };
        }
      },
    );

    // 4. Batch cache write via pipeline (single Redis round-trip)
    const pipeline = app.redis.pipeline();
    for (const { idx, result, cacheKey } of fetched) {
      results[idx] = result;
      if (cacheKey && result.items.length > 0) {
        pipeline.set(cacheKey, JSON.stringify(result), "EX", ttl);
        // 5. Write-through to DB (fire-and-forget)
        writeThroughToDb(app, path, agents[idx].id, result.items as Record<string, unknown>[]).catch(() => {});
      }
    }
    pipeline.exec().catch(() => {});
  }

  return results;
}

// ---------------------------------------------------------------------------
// cachedProxyCall — main entry point
// ---------------------------------------------------------------------------

async function cachedProxyCall<T = unknown>(
  app: FastifyInstance,
  path: string,
  input: Record<string, unknown>,
): Promise<{ items: T[] | T; total: number; totalData?: Record<string, unknown> }> {
  const requestId = input._requestId as string | undefined;
  const params = buildUpstreamParams(input, path);
  const ttl = CACHE_TTL[path] ?? 60;
  const explicitAgentId = input.agentId as string | undefined;

  // -----------------------------------------------------------------------
  // DB-first: serve locked past dates from DB, skip upstream entirely
  // -----------------------------------------------------------------------
  if (!explicitAgentId && !isReferenceRequest(path, input)) {
    const agents = await agentService.listActiveAgents(app);
    if (agents.length > 0) {
      const agentIds = agents.map((a) => a.id);
      const page = Math.max(1, Number(input.page) || 1);
      const limit = Math.max(1, Number(input.limit) || 10);
      const dbResult = await tryDbFirst<T>(app, path, params, agentIds, page, limit, requestId);
      if (dbResult) {
        logger.debug("DB-first served response", { path, total: dbResult.total, page, requestId });
        return dbResult as { items: T[] | T; total: number; totalData?: Record<string, unknown> };
      }
    }
  }

  // -----------------------------------------------------------------------
  // Single-agent mode: explicit agentId OR reference/dropdown request
  // -----------------------------------------------------------------------
  if (explicitAgentId || isReferenceRequest(path, input)) {
    // Fetch agents list once (Redis-cached) and reuse
    const agents = await agentService.listActiveAgents(app);
    if (agents.length === 0) {
      return { items: [] as unknown as T[], total: 0 };
    }

    let agentId: string;
    let agentName: string;
    let cookie: string;

    if (explicitAgentId) {
      const found = agents.find((a) => a.id === explicitAgentId);
      agentId = explicitAgentId;
      agentName = found?.name ?? "";
      // getAgentCookie falls through to DB if not in list
      cookie = found
        ? decryptSessionCookie(found.sessionCookie)
        : await agentService.getAgentCookie(app, explicitAgentId);
    } else {
      const agent = agents[0];
      agentId = agent.id;
      agentName = agent.name;
      cookie = decryptSessionCookie(agent.sessionCookie);
    }

    // start_date/end_date are for DB-first only, remove before sending to upstream
    const upstreamParams = { ...params };
    delete upstreamParams.start_date;
    delete upstreamParams.end_date;
    const result = await fetchSingleAgent<T>(app, path, upstreamParams, agentId, agentName, cookie, ttl, requestId);

    // Signal demand sync (non-reference, non-explicitAgent)
    if (!isReferenceRequest(path, input) && !explicitAgentId) {
      signalDemandSync(app, path);
    }

    return result;
  }

  // -----------------------------------------------------------------------
  // Multi-agent mode: fetch ALL active agents in parallel, paginate locally
  // -----------------------------------------------------------------------
  const agents = await agentService.listActiveAgents(app);
  if (agents.length === 0) {
    return { items: [] as unknown as T[], total: 0 };
  }

  const requestedPage = Math.max(1, Number(input.page) || 1);
  const requestedLimit = Math.max(1, Number(input.limit) || 10);

  // Build upstream params — fetch all items from each agent for merge+sort
  const allParams = { ...params };
  delete allParams.page;
  delete allParams.limit;
  // start_date/end_date are for DB-first only, upstream doesn't use them
  delete allParams.start_date;
  delete allParams.end_date;
  allParams.limit = "5000";
  allParams.page = "1";

  // Use pipeline-based multi-agent fetch (MGET + batch SET)
  const results = await fetchMultiAgentWithPipeline<T>(app, path, allParams, agents, ttl, requestId);

  // Merge all items, sort naturally, then paginate
  const allItems = sortMergedItems(
    results.flatMap((r) => (Array.isArray(r.items) ? r.items : [])),
    path,
  );
  const mergedTotal = allItems.length;
  // Compute totals from the actual merged items (accurate across agents)
  // Falls back to mergeTotalData for endpoints without field mapping
  const mergedTotalData = computeTotalFromItems(allItems, path, mergeTotalData(results));

  // Server-side pagination on the merged dataset
  const start = (requestedPage - 1) * requestedLimit;
  const pageItems = allItems.slice(start, start + requestedLimit);

  // Signal demand sync — upstream vừa được gọi
  signalDemandSync(app, path);

  return {
    items: pageItems as T[] | T,
    total: mergedTotal,
    totalData: mergedTotalData,
  };
}

// ---------------------------------------------------------------------------
// Write-through: lưu upstream items vào DB ngay (fire-and-forget)
// ---------------------------------------------------------------------------

const PATH_TO_SYNC_TABLE: Record<string, string> = {};
for (const ep of SYNC_ENDPOINTS) {
  PATH_TO_SYNC_TABLE[ep.path] = ep.table;
}

/**
 * Lưu items từ upstream vào DB ngay lập tức.
 * Fire-and-forget — lỗi được log, không block response.
 * Tái sử dụng upsert functions từ sync.upsert.ts.
 */
async function writeThroughToDb(
  app: FastifyInstance,
  path: string,
  agentId: string,
  items: Record<string, unknown>[],
): Promise<void> {
  if (items.length === 0) return;

  const table = PATH_TO_SYNC_TABLE[path];
  if (!table) return; // Reference/dropdown endpoints — không có DB table

  // proxyUser: dùng upsertUsersSimple (bỏ qua change detection)
  const upsertFn = table === "proxyUser" ? upsertUsersSimple : UPSERT_REGISTRY[table];
  if (!upsertFn) return;

  try {
    const count = await upsertFn(app.prisma, agentId, items);
    logger.debug("[WriteThrough] Saved to DB", { path, table, agentId, items: items.length, upserted: count });
  } catch (err) {
    logger.warn("[WriteThrough] Failed (non-blocking)", {
      path, table, agentId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ---------------------------------------------------------------------------
// Per-endpoint proxy functions (public API)
// ---------------------------------------------------------------------------

export function fetchUserList(app: FastifyInstance, input: Record<string, unknown>) {
  return cachedProxyCall(app, "/agent/user.html", input);
}

export function fetchInviteList(app: FastifyInstance, input: Record<string, unknown>) {
  return cachedProxyCall(app, "/agent/inviteList.html", input);
}

export function fetchReportLottery(app: FastifyInstance, input: Record<string, unknown>) {
  return cachedProxyCall(app, "/agent/reportLottery.html", input);
}

export function fetchReportFunds(app: FastifyInstance, input: Record<string, unknown>) {
  return cachedProxyCall(app, "/agent/reportFunds.html", input);
}

export function fetchReportThirdGame(app: FastifyInstance, input: Record<string, unknown>) {
  return cachedProxyCall(app, "/agent/reportThirdGame.html", input);
}

export function fetchBankList(app: FastifyInstance, input: Record<string, unknown>) {
  return cachedProxyCall(app, "/agent/bankList.html", input);
}

export function fetchDepositList(app: FastifyInstance, input: Record<string, unknown>) {
  return cachedProxyCall(app, "/agent/depositAndWithdrawal.html", input);
}

export function fetchWithdrawalsRecord(app: FastifyInstance, input: Record<string, unknown>) {
  return cachedProxyCall(app, "/agent/withdrawalsRecord.html", input);
}

export function fetchBetList(app: FastifyInstance, input: Record<string, unknown>) {
  return cachedProxyCall(app, "/agent/bet.html", input);
}

export function fetchBetOrder(app: FastifyInstance, input: Record<string, unknown>) {
  return cachedProxyCall(app, "/agent/betOrder.html", input);
}

export function fetchRebateOdds(app: FastifyInstance, input: Record<string, unknown>) {
  return cachedProxyCall(app, "/agent/getRebateOddsPanel.html", input);
}

export function fetchLotteryDropdown(app: FastifyInstance, input: Record<string, unknown>) {
  return cachedProxyCall(app, "/agent/getLottery", input);
}

// ---------------------------------------------------------------------------
// Action endpoints — forward to upstream without caching (write operations)
// ---------------------------------------------------------------------------

async function actionProxyCall(
  app: FastifyInstance,
  path: string,
  input: Record<string, unknown>,
) {
  const agentId = input.agentId as string;
  const requestId = input._requestId as string | undefined;
  const cookie = await agentService.getAgentCookie(app, agentId);
  const params = buildUpstreamParams(input, path);
  return fetchUpstream({ path, cookie, params, requestId });
}

export function editPasswordUpstream(app: FastifyInstance, input: Record<string, unknown>) {
  return actionProxyCall(app, "/agent/editPassword.html", input);
}

export function editFundPasswordUpstream(app: FastifyInstance, input: Record<string, unknown>) {
  return actionProxyCall(app, "/agent/editFundPassword.html", input);
}

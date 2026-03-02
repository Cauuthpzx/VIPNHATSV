import type { FastifyInstance } from "fastify";
import { fetchUpstream } from "./proxy.client.js";
import * as agentService from "./agent.service.js";
import { decryptSessionCookie } from "../../utils/crypto.js";
import { promisePool } from "../../utils/concurrency.js";
import { logger } from "../../utils/logger.js";

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

const SPLIT_DATE_ENDPOINTS = new Set([
  "/agent/reportLottery.html",
  "/agent/reportFunds.html",
  "/agent/reportThirdGame.html",
  "/agent/betOrder.html",
]);

function buildUpstreamParams(input: Record<string, unknown>, path: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "agentId") continue;
    if (value === undefined || value === null || value === "") continue;

    if ((key === "date" || key === "bet_time") && SPLIT_DATE_ENDPOINTS.has(path)) {
      const parts = String(value).split(" - ");
      if (parts.length === 2) {
        params["start_date"] = parts[0].trim();
        params["end_date"] = parts[1].trim();
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

  // 2. Fetch from upstream
  const upstream = await fetchUpstream<T>({ path, cookie, params });

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
          const upstream = await fetchUpstream<T>({ path, cookie: meta.cookie, params });
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
          logger.warn("Agent fetch failed, skipping", {
            agentId: meta.agent.id,
            name: meta.agent.name,
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
  const params = buildUpstreamParams(input, path);
  const ttl = CACHE_TTL[path] ?? 60;
  const explicitAgentId = input.agentId as string | undefined;

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

    const result = await fetchSingleAgent<T>(app, path, params, agentId, agentName, cookie, ttl);
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
  allParams.limit = "200";
  allParams.page = "1";

  // Use pipeline-based multi-agent fetch (MGET + batch SET)
  const results = await fetchMultiAgentWithPipeline<T>(app, path, allParams, agents, ttl);

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

  return {
    items: pageItems as T[] | T,
    total: mergedTotal,
    totalData: mergedTotalData,
  };
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
  const cookie = await agentService.getAgentCookie(app, agentId);
  const params = buildUpstreamParams(input, path);
  return fetchUpstream({ path, cookie, params });
}

export function editPasswordUpstream(app: FastifyInstance, input: Record<string, unknown>) {
  return actionProxyCall(app, "/agent/editPassword.html", input);
}

export function editFundPasswordUpstream(app: FastifyInstance, input: Record<string, unknown>) {
  return actionProxyCall(app, "/agent/editFundPassword.html", input);
}

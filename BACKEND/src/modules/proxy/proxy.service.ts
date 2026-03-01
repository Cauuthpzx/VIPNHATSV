import type { FastifyInstance } from "fastify";
import { createHash } from "node:crypto";
import { fetchUpstream } from "./proxy.client.js";
import * as agentService from "./agent.service.js";
import { decryptSessionCookie } from "../../utils/crypto.js";
import { wsManager } from "../../websocket/ws.manager.js";
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

// Max concurrent upstream requests to avoid overwhelming the upstream server
const MAX_CONCURRENCY = 6;

// ---------------------------------------------------------------------------
// Natural sort keys — the field each endpoint uses for default ordering.
// After merging multi-agent results we sort by this field so the combined
// dataset looks exactly like it came from a single source.
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

function buildCacheKey(path: string, params: Record<string, string>, agentId: string): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== "" && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const hash = createHash("md5").update(sorted).digest("hex").slice(0, 12);
  return `proxy:agent:${agentId}:${path}:${hash}`;
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
      const parts = String(value).split(/\s*-\s*/);
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
// Worker pool — run N async tasks with bounded concurrency
// ---------------------------------------------------------------------------

interface SingleResult<T> {
  items: T[];
  total: number;
  totalData?: Record<string, unknown>;
}

async function promisePool<TItem, TResult>(
  items: TItem[],
  concurrency: number,
  fn: (item: TItem) => Promise<TResult>,
): Promise<TResult[]> {
  const results: TResult[] = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

// ---------------------------------------------------------------------------
// Sort merged items — unified natural ordering across agents
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
    // Descending (newest first) — matches upstream default
    return String(vb).localeCompare(String(va));
  });
}

// ---------------------------------------------------------------------------
// Merge totalData — sum numeric fields across agents
// ---------------------------------------------------------------------------

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

  // Format to 4 decimals (matches upstream format)
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
      logger.debug("Cache hit", { cacheKey });
      return JSON.parse(cached);
    }
  } catch {
    // Redis error — continue without cache
  }

  // 2. Fetch from upstream
  const upstream = await fetchUpstream<T>({ path, cookie, params });

  const rawItems = Array.isArray(upstream.data) ? upstream.data : [];

  // Stamp each item with agent name
  const items = rawItems.map((item: any) => ({ _agentName: agentName, ...item }));

  const result: SingleResult<T> = {
    items: items as T[],
    total: upstream.count ?? 0,
    totalData: upstream.total_data,
  };

  // 3. Store in Redis
  try {
    await app.redis.set(cacheKey, JSON.stringify(result), "EX", ttl);
  } catch {
    // Redis write error — ignore
  }

  return result;
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
    let cookie: string;
    let agentName: string;

    if (explicitAgentId) {
      cookie = await agentService.getAgentCookie(app, explicitAgentId);
      const agents = await agentService.listActiveAgents(app);
      const found = agents.find((a) => a.id === explicitAgentId);
      agentName = found?.name ?? "";
    } else {
      const agents = await agentService.listActiveAgents(app);
      if (agents.length === 0) {
        return { items: [] as unknown as T[], total: 0 };
      }
      const agent = agents[0];
      cookie = decryptSessionCookie(agent.sessionCookie);
      agentName = agent.name;
    }

    const agentId = explicitAgentId || (await agentService.listActiveAgents(app))[0]?.id || "default";
    const result = await fetchSingleAgent<T>(app, path, params, agentId, agentName, cookie, ttl);

    wsManager.broadcast({ type: "data_update", endpoint: path, timestamp: Date.now() });
    return result;
  }

  // -----------------------------------------------------------------------
  // Multi-agent mode: fetch ALL active agents in parallel, paginate locally
  // -----------------------------------------------------------------------
  const agents = await agentService.listActiveAgents(app);
  if (agents.length === 0) {
    return { items: [] as unknown as T[], total: 0 };
  }

  // Extract page/limit from the original request — we'll paginate after merge
  const requestedPage = Math.max(1, Number(input.page) || 1);
  const requestedLimit = Math.max(1, Number(input.limit) || 10);

  // Build upstream params WITHOUT page/limit — fetch all items from each agent
  // so we can merge, sort, and paginate the unified dataset ourselves
  const allParams = { ...params };
  delete allParams.page;
  delete allParams.limit;
  // Request max items from upstream to get the full dataset per agent
  allParams.limit = "200";
  allParams.page = "1";

  const results = await promisePool(
    agents,
    MAX_CONCURRENCY,
    async (agent) => {
      try {
        if (agent.cookieExpires && agent.cookieExpires < new Date()) {
          logger.warn("Skipping agent with expired cookie", { agentId: agent.id, name: agent.name });
          return { items: [] as T[], total: 0 } as SingleResult<T>;
        }

        const cookie = decryptSessionCookie(agent.sessionCookie);
        return await fetchSingleAgent<T>(app, path, allParams, agent.id, agent.name, cookie, ttl);
      } catch (err) {
        logger.warn("Agent fetch failed, skipping", {
          agentId: agent.id,
          name: agent.name,
          error: err instanceof Error ? err.message : String(err),
        });
        return { items: [] as T[], total: 0 } as SingleResult<T>;
      }
    },
  );

  // Merge all items, sort naturally, then paginate
  const allItems = sortMergedItems(
    results.flatMap((r) => (Array.isArray(r.items) ? r.items : [])),
    path,
  );
  const mergedTotal = allItems.length;
  const mergedTotalData = mergeTotalData(results);

  // Server-side pagination on the merged dataset
  const start = (requestedPage - 1) * requestedLimit;
  const pageItems = allItems.slice(start, start + requestedLimit);

  wsManager.broadcast({ type: "data_update", endpoint: path, timestamp: Date.now() });

  return {
    items: pageItems as T[] | T,
    total: mergedTotal,
    totalData: mergedTotalData,
  };
}

// ---------------------------------------------------------------------------
// Per-endpoint proxy functions (public API — unchanged signatures)
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

import type { FastifyInstance } from "fastify";
import { createHash } from "node:crypto";
import { fetchUpstream } from "./proxy.client.js";
import * as agentService from "./agent.service.js";
import { wsManager } from "../../websocket/ws.manager.js";
import { logger } from "../../utils/logger.js";

// Cache TTL in seconds per endpoint
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

function buildCacheKey(path: string, params: Record<string, string>): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== "" && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const hash = createHash("md5").update(sorted).digest("hex").slice(0, 12);
  return `proxy:${path}:${hash}`;
}

// Endpoints that use start_date + end_date instead of a single date range string
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

    // Split "date" or "bet_time" range into "start_date" + "end_date" for endpoints that require it
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

async function cachedProxyCall<T = unknown>(
  app: FastifyInstance,
  path: string,
  input: Record<string, unknown>,
): Promise<{ items: T[] | T; total: number; totalData?: Record<string, unknown> }> {
  const params = buildUpstreamParams(input, path);
  const cacheKey = buildCacheKey(path, params);
  const ttl = CACHE_TTL[path] ?? 60;

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
  const agentId = input.agentId as string | undefined;
  const cookie = agentId
    ? await agentService.getAgentCookie(app, agentId)
    : await agentService.getDefaultAgentCookie(app);

  const upstream = await fetchUpstream<T>({ path, cookie, params });

  const result = {
    items: Array.isArray(upstream.data) ? upstream.data : (upstream.data ?? []),
    total: upstream.count ?? 0,
    totalData: upstream.total_data,
  };

  // 3. Store in Redis
  try {
    await app.redis.set(cacheKey, JSON.stringify(result), "EX", ttl);
  } catch {
    // Redis write error — ignore
  }

  // 4. Notify WS clients
  wsManager.broadcast({
    type: "data_update",
    endpoint: path,
    timestamp: Date.now(),
  });

  return result;
}

// --- Per-endpoint proxy functions ---

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

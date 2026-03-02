import { Agent } from "undici";
import { appConfig } from "../../config/app.js";
import { logger } from "../../utils/logger.js";
import { AppError } from "../../errors/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import { CircuitBreaker } from "../../utils/circuitBreaker.js";
import { withRetry } from "../../utils/retry.js";

// ---------------------------------------------------------------------------
// Persistent HTTP Agent — keep-alive + connection pooling for upstream
// ---------------------------------------------------------------------------
const upstreamAgent = new Agent({
  keepAliveTimeout: 30_000,
  keepAliveMaxTimeout: 60_000,
  connections: 50,       // max concurrent sockets (increased for parallel sync)
  pipelining: 1,
});

const upstreamBreaker = new CircuitBreaker({
  name: "upstream",
  failureThreshold: 5,
  resetTimeout: 30_000,
  successThreshold: 2,
});

// ---------------------------------------------------------------------------
// Response code classification
// ---------------------------------------------------------------------------
const SUCCESS_CODES = new Set([0, 1]);
const EMPTY_CODES = new Set([2]); // "no data" — return empty array, not error

export interface UpstreamRequest {
  path: string;
  cookie: string;
  params: Record<string, string>;
  requestId?: string;
}

export interface UpstreamResponse<T = unknown> {
  data: T[] | T;
  count: number;
  code: number;
  total_data?: Record<string, unknown>;
  msg?: string;
}

/** Non-retryable errors — need re-login, not retry */
function shouldRetryUpstream(err: unknown): boolean {
  if (err instanceof AppError && err.code === ERROR_CODES.AGENT_SESSION_EXPIRED) {
    return false;
  }
  return true;
}

export async function fetchUpstream<T = unknown>(
  req: UpstreamRequest,
): Promise<UpstreamResponse<T>> {
  return upstreamBreaker.execute(() =>
    withRetry(() => _fetchUpstream<T>(req), {
      maxRetries: 2,
      shouldRetry: shouldRetryUpstream,
    }),
  );
}

async function _fetchUpstream<T = unknown>(
  req: UpstreamRequest,
): Promise<UpstreamResponse<T>> {
  const url = `${appConfig.upstream.baseUrl}${req.path}`;
  const body = new URLSearchParams(req.params).toString();

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Cookie": `PHPSESSID=${req.cookie}`,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": appConfig.upstream.baseUrl,
    "Origin": appConfig.upstream.baseUrl,
  };

  logger.debug("Upstream request", { url, requestId: req.requestId, paramsKeys: Object.keys(req.params) });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), appConfig.upstream.timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
      redirect: "manual",
      // @ts-expect-error Node-specific undici dispatcher
      dispatcher: upstreamAgent,
    });

    // Detect session expiry (redirect to login page)
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get("location") || "";
      if (location.includes("login") || location.includes("index")) {
        throw new AppError(
          "Agent session expired",
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.AGENT_SESSION_EXPIRED,
        );
      }
    }

    if (!response.ok) {
      throw new AppError(
        `Upstream returned ${response.status}`,
        HTTP_STATUS.BAD_GATEWAY,
        ERROR_CODES.UPSTREAM_ERROR,
      );
    }

    const text = await response.text();

    // Some endpoints return HTML when session expired
    const textTrimmed = text.trimStart();
    if (
      textTrimmed.startsWith("<!") ||
      textTrimmed.startsWith("<html") ||
      textTrimmed.startsWith("<HTML") ||
      textTrimmed.startsWith("<?xml") ||
      textTrimmed.startsWith("<head")
    ) {
      throw new AppError(
        "Agent session expired (HTML response)",
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AGENT_SESSION_EXPIRED,
      );
    }

    const json = JSON.parse(text) as UpstreamResponse<T>;

    // code 0 = success (list endpoints), code 1 = success (getLottery, rebateOdds)
    // Nhưng code 0 + msg chứa "đăng nhập" = session expired (upstream trả code 0 kèm redirect)
    if (SUCCESS_CODES.has(json.code)) {
      const msg = (json.msg || "").toLowerCase();
      if (msg.includes("đăng nhập") || msg.includes("login")) {
        throw new AppError(
          "Agent session expired (code 0 but login required)",
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.AGENT_SESSION_EXPIRED,
        );
      }
      return json;
    }

    // code 2 = "no data" — not an error, return empty result
    if (EMPTY_CODES.has(json.code)) {
      logger.debug("Upstream returned empty code", { url, code: json.code, msg: json.msg });
      return { data: [] as unknown as T, count: 0, code: json.code, msg: json.msg };
    }

    // Session expired via response code (302 or msg contains "login")
    if (json.code === 302 || json.msg?.toLowerCase().includes("login")) {
      throw new AppError(
        "Agent session expired (code response)",
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AGENT_SESSION_EXPIRED,
      );
    }

    // Real upstream error
    logger.warn("Upstream non-success code", { url, code: json.code, msg: json.msg });
    throw new AppError(
      json.msg || `Upstream error (code: ${json.code})`,
      HTTP_STATUS.BAD_GATEWAY,
      ERROR_CODES.UPSTREAM_ERROR,
    );

  } catch (err) {
    if (err instanceof AppError) throw err;

    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("abort")) {
      throw new AppError(
        "Upstream timeout",
        HTTP_STATUS.BAD_GATEWAY,
        ERROR_CODES.UPSTREAM_TIMEOUT,
      );
    }

    logger.error("Upstream fetch failed", { url, error: message });
    throw new AppError(
      "Failed to fetch from upstream",
      HTTP_STATUS.BAD_GATEWAY,
      ERROR_CODES.UPSTREAM_ERROR,
    );
  } finally {
    clearTimeout(timeout);
  }
}

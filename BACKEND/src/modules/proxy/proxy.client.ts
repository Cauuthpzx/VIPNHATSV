import { appConfig } from "../../config/app.js";
import { logger } from "../../utils/logger.js";
import { AppError } from "../../errors/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { ERROR_CODES } from "../../constants/error-codes.js";

export interface UpstreamRequest {
  path: string;
  cookie: string;
  params: Record<string, string>;
}

export interface UpstreamResponse<T = unknown> {
  data: T[] | T;
  count: number;
  code: number;
  total_data?: Record<string, unknown>;
  msg?: string;
}

export async function fetchUpstream<T = unknown>(
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

  logger.debug("Upstream request", { url, paramsKeys: Object.keys(req.params) });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), appConfig.upstream.timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
      redirect: "manual",
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
    if (text.trimStart().startsWith("<!") || text.trimStart().startsWith("<html")) {
      throw new AppError(
        "Agent session expired (HTML response)",
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AGENT_SESSION_EXPIRED,
      );
    }

    const json = JSON.parse(text) as UpstreamResponse<T>;

    // Original site uses code: 0 for success on list endpoints
    // and code: 1 for success on some special endpoints (getLottery, rebateOdds)
    if (json.code !== 0 && json.code !== 1) {
      logger.warn("Upstream non-success code", { url, code: json.code, msg: json.msg });
      throw new AppError(
        json.msg || "Upstream error",
        HTTP_STATUS.BAD_GATEWAY,
        ERROR_CODES.UPSTREAM_ERROR,
      );
    }

    return json;
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

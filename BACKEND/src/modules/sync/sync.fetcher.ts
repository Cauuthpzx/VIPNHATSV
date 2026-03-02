import { fetchUpstream } from "../proxy/proxy.client.js";
import { promisePool } from "../../utils/concurrency.js";
import { logger } from "../../utils/logger.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/error-codes.js";

interface FetchAllOptions {
  path: string;
  cookie: string;
  params: Record<string, string>;
  pageSize: number;
  pageConcurrency: number;
}

/**
 * Fetch ALL pages from upstream for a single (agent + endpoint).
 * Bypasses Redis — goes directly to upstream for fresh data.
 */
export async function fetchAllPages(
  opts: FetchAllOptions,
): Promise<Record<string, unknown>[]> {
  const { path, cookie, params, pageSize, pageConcurrency } = opts;

  // Page 1 — also tells us the total count
  const firstParams = { ...params, page: "1", limit: String(pageSize) };
  const first = await fetchUpstream({ path, cookie, params: firstParams });

  const firstItems = Array.isArray(first.data)
    ? (first.data as Record<string, unknown>[])
    : [];
  const totalCount = first.count ?? firstItems.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return firstItems;

  // Pages 2..N in parallel with bounded concurrency
  const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

  const pageResults = await promisePool(
    remainingPages,
    pageConcurrency,
    async (pageNum) => {
      try {
        const pageParams = { ...params, page: String(pageNum), limit: String(pageSize) };
        const res = await fetchUpstream({ path, cookie, params: pageParams });
        return Array.isArray(res.data)
          ? (res.data as Record<string, unknown>[])
          : [];
      } catch (err) {
        // Timeout error → bubble up cho sync service đếm strikes
        if (err instanceof AppError && err.code === ERROR_CODES.UPSTREAM_TIMEOUT) {
          throw err;
        }
        logger.warn("Sync page fetch failed", {
          path,
          page: pageNum,
          error: err instanceof Error ? err.message : String(err),
        });
        return [];
      }
    },
  );

  const allItems = [...firstItems];
  for (const items of pageResults) {
    allItems.push(...items);
  }
  return allItems;
}

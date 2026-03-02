import { logger } from "./logger.js";

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterMs: number;
  shouldRetry: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 2,
  baseDelayMs: 500,
  maxDelayMs: 5_000,
  jitterMs: 200,
  shouldRetry: () => true,
};

/**
 * Generic retry with exponential backoff + jitter.
 * Total attempts = 1 + maxRetries (default 3).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: Partial<RetryOptions> = {},
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs, jitterMs, shouldRetry } = {
    ...DEFAULT_OPTIONS,
    ...opts,
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === maxRetries || !shouldRetry(err)) {
        throw err;
      }

      const delay =
        Math.min(baseDelayMs * 2 ** attempt, maxDelayMs) +
        Math.random() * jitterMs;

      logger.debug("Retry scheduled", {
        attempt: attempt + 1,
        maxRetries,
        delayMs: Math.round(delay),
        error: err instanceof Error ? err.message : String(err),
      });

      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

/**
 * In-process LRU cache with TTL — Layer 1 (fastest, ~0ms latency).
 *
 * Features:
 * - O(1) get/set via Map insertion order
 * - Automatic TTL expiry
 * - Max entries eviction (LRU)
 * - Request deduplication (concurrent identical requests share 1 Promise)
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LRUCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;
  private readonly defaultTTL: number; // ms
  private purgeTimer: ReturnType<typeof setInterval> | null = null;

  constructor(maxEntries = 500, defaultTTLSeconds = 5) {
    this.maxEntries = maxEntries;
    this.defaultTTL = defaultTTLSeconds * 1000;

    // Periodic purge every 60s — remove expired entries to prevent memory buildup
    this.purgeTimer = setInterval(() => this.purgeExpired(), 60_000);
    // Don't keep the process alive just for cache cleanup
    if (this.purgeTimer && typeof this.purgeTimer === "object" && "unref" in this.purgeTimer) {
      this.purgeTimer.unref();
    }
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL),
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /** Delete all entries matching a prefix. */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
  }

  /** Remove all expired entries — called periodically by internal timer. */
  purgeExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /** Stop periodic purge timer — call on shutdown. */
  destroy(): void {
    if (this.purgeTimer) {
      clearInterval(this.purgeTimer);
      this.purgeTimer = null;
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Request deduplication — concurrent identical requests share 1 Promise.
 * When multiple requests for the same key arrive before the first completes,
 * they all await the same Promise instead of firing N upstream fetches.
 */
const inflightMap = new Map<string, Promise<unknown>>();
const INFLIGHT_MAX = 500;

export async function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflightMap.get(key);
  if (existing) return existing as Promise<T>;

  // Safety bound — if too many concurrent unique requests, skip dedup and call directly
  if (inflightMap.size >= INFLIGHT_MAX) {
    return fn();
  }

  const promise = fn().finally(() => {
    inflightMap.delete(key);
  });

  inflightMap.set(key, promise);
  return promise;
}

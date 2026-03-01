/**
 * Run N async tasks with bounded concurrency.
 * Workers pull from a shared index counter — order is preserved in results.
 */
export async function promisePool<TItem, TResult>(
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

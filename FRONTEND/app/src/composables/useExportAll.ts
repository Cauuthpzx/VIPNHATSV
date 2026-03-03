/**
 * createExportAllFn — tạo hàm fetch toàn bộ data để xuất xlsx.
 *
 * Dùng cho :export-all-fn trên lay-table.
 * Tự động phân trang cho đến khi lấy đủ tổng số bản ghi.
 *
 * @param fetchFn  Hàm nhận (page, limit) → Promise<{ items, total }>
 * @returns        () => Promise<Record[]> — truyền thẳng vào :export-all-fn
 *
 * @example
 * const exportAllFn = createExportAllFn((page, limit) =>
 *   fetchDepositList({ page, limit, ...filters }).then(r => r.data.data)
 * );
 */
export function createExportAllFn<T = Record<string, unknown>>(
  fetchFn: (page: number, limit: number) => Promise<{ items: T[]; total: number }>,
): () => Promise<T[]> {
  return async () => {
    const EXPORT_LIMIT = 1000;
    let currentPage = 1;
    const allItems: T[] = [];

    while (true) {
      const { items, total } = await fetchFn(currentPage, EXPORT_LIMIT);
      allItems.push(...items);
      if (allItems.length >= total || items.length === 0) break;
      currentPage++;
    }

    return allItems;
  };
}

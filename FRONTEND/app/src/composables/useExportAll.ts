import { layer } from "@layui/layer-vue";

/**
 * Wrapper hiện loading shade trong khi fetch data.
 */
async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
  const loadingId = layer.load(0, { shade: true });
  try {
    return await fn();
  } finally {
    layer.close(loadingId);
  }
}

/**
 * createExportAllFn — tạo hàm fetch toàn bộ data từ ee88 (phân trang).
 */
export function createExportAllFn<T = Record<string, unknown>>(
  fetchFn: (page: number, limit: number) => Promise<{ items: T[]; total: number }>,
): () => Promise<T[]> {
  return () => withLoading(async () => {
    const EXPORT_LIMIT = 1000;
    const DELAY_MS = 500;
    let currentPage = 1;
    const allItems: T[] = [];

    while (true) {
      const { items, total } = await fetchFn(currentPage, EXPORT_LIMIT);
      allItems.push(...items);
      if (allItems.length >= total || items.length === 0) break;
      currentPage++;
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    return allItems;
  });
}

/**
 * createDbExportFn — tạo hàm export từ DB local (1 request duy nhất).
 */
export function createDbExportFn<T = Record<string, unknown>>(
  exportApiFn: (params: Record<string, string | undefined>) => Promise<{ data: { data: { items: T[]; total: number } } }>,
  getParams: () => Record<string, string | undefined>,
): () => Promise<T[]> {
  return () => withLoading(async () => {
    const params = getParams();
    const res = await exportApiFn(params);
    return res.data.data.items;
  });
}

/**
 * createDualExportFn — hiện dialog chọn nguồn: DB local hoặc ee88.
 *
 * Mặc định chọn DB local (nút đầu tiên).
 * User bấm export → dialog hỏi nguồn → loading → fetch data → trả về.
 * Nếu user đóng dialog → throw EXPORT_CANCELLED (useToolbar sẽ catch).
 *
 * @param dbFn        Hàm export từ DB (tạo bởi createDbExportFn — đã có loading)
 * @param upstreamFn  Hàm export từ ee88 (tạo bởi createExportAllFn — đã có loading)
 * @returns           () => Promise<Record[]> — truyền vào :export-all-fn
 */
export function createDualExportFn<T = Record<string, unknown>>(
  dbFn: () => Promise<T[]>,
  upstreamFn: () => Promise<T[]>,
): () => Promise<T[]> {
  return () => {
    return new Promise<T[]>((resolve, reject) => {
      let chosen = false;

      layer.confirm(
        `<div style="line-height: 1.6">
          <p style="margin: 0 0 8px"><b>DB Local</b> — Xuất từ dữ liệu đã đồng bộ, nhanh hơn.</p>
          <p style="margin: 0"><b>ee88</b> — Xuất trực tiếp từ nguồn, dữ liệu mới nhất nhưng chậm hơn.</p>
        </div>`,
        {
          title: "Chọn nguồn xuất dữ liệu",
          isHtmlFragment: true,
          btn: [
            { text: "DB Local", callback: (id: string) => { chosen = true; layer.close(id); resolve(dbFn()); } },
            { text: "ee88", callback: (id: string) => { chosen = true; layer.close(id); resolve(upstreamFn()); } },
          ],
          close: () => { if (!chosen) reject(new Error("EXPORT_CANCELLED")); },
        },
      );
    });
  };
}

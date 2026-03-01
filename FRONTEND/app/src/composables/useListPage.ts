import { ref, reactive, nextTick, watch, onMounted, type Ref, type WatchSource } from "vue";

export interface PageState {
  current: number;
  limit: number;
  total: number;
}

export function useListPage<T = Record<string, any>>(initialLimit = 10) {
  const dataSource = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const page = reactive<PageState>({ current: 1, limit: initialLimit, total: 0 });

  function resetPage() {
    page.current = 1;
  }

  /** Scroll .layui-body lên đầu table sau khi đổi trang — tránh giật */
  function scrollToTable() {
    nextTick(() => {
      const body = document.querySelector(".layui-body");
      if (body) body.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /**
   * Chỉ show loading spinner khi chưa có data (lần đầu).
   * Khi đã có data → không show loading, tránh flicker.
   */
  function setLoading(val: boolean) {
    if (val && dataSource.value.length > 0) return;
    loading.value = val;
  }

  /**
   * Tạo các handler chuẩn cho pagination page.
   * Truyền loadData callback → composable tự tạo change, handleSearch,
   * watch(agentId), onMounted. Giúp xóa boilerplate lặp lại ở 9+ pages.
   *
   * @param loadData - Hàm tải dữ liệu (async)
   * @param agentIdSource - Ref selectedAgentId để watch (optional)
   */
  function bindLoadData(loadData: () => void | Promise<void>, agentIdSource?: WatchSource) {
    /** Pagination change handler → truyền cho lay-table @change */
    function handlePageChange(p: { current: number; limit: number }) {
      page.current = p.current;
      page.limit = p.limit;
      scrollToTable();
      loadData();
    }

    /** Search handler: reset về trang 1 rồi load */
    function handleSearch() {
      page.current = 1;
      loadData();
    }

    // Auto-watch selectedAgentId nếu có
    if (agentIdSource) {
      watch(agentIdSource, () => {
        page.current = 1;
        loadData();
      });
    }

    // Auto-mount
    onMounted(() => loadData());

    return { handlePageChange, handleSearch };
  }

  return {
    dataSource,
    loading,
    page,
    resetPage,
    scrollToTable,
    setLoading,
    bindLoadData,
  };
}

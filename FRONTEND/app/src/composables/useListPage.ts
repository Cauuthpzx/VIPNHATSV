import { ref, reactive, nextTick, watch, onMounted, onBeforeUnmount, type Ref, type WatchSource } from "vue";

export interface PageState {
  current: number;
  limit: number;
  total: number;
}

export function useListPage<T = Record<string, any>>(initialLimit = 10) {
  const dataSource = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const page = reactive<PageState>({ current: 1, limit: initialLimit, total: 0 });

  // Stale-request guard: incremented on every loadData call.
  // If a newer call starts before an older one finishes, the older
  // result is silently discarded (its `version` won't match `latestVersion`).
  let latestVersion = 0;

  function resetPage() {
    page.current = 1;
  }

  function scrollToTable() {
    nextTick(() => {
      const body = document.querySelector(".layui-body");
      if (body) body.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function setLoading(val: boolean) {
    loading.value = val;
  }

  /**
   * Check if the current call is still the latest.
   * Usage inside loadData():
   *   const isStale = guardStale();
   *   const res = await fetchXXX(params);
   *   if (isStale()) return;      // skip if superseded
   *   dataSource.value = res.data.data.items;
   */
  function guardStale(): () => boolean {
    const v = ++latestVersion;
    return () => v !== latestVersion;
  }

  /**
   * Tạo các handler chuẩn cho pagination page.
   */
  function bindLoadData(loadData: () => void | Promise<void>, agentIdSource?: WatchSource) {
    function handlePageChange(p: { current: number; limit: number }) {
      page.current = p.current;
      page.limit = p.limit;
      scrollToTable();
      loadData();
    }

    function handleSearch() {
      page.current = 1;
      loadData();
    }

    if (agentIdSource) {
      watch(agentIdSource, () => {
        page.current = 1;
        loadData();
      });
    }

    onMounted(() => loadData());

    // Bump version on unmount so any in-flight request becomes stale
    onBeforeUnmount(() => { latestVersion++; });

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
    guardStale,
  };
}

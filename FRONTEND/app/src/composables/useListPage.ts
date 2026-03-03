import { ref, reactive, nextTick, watch, onMounted, onBeforeUnmount, type Ref, type WatchSource } from "vue";

/** Debounce helper — collapses rapid-fire calls into one, with cancel support */
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = ((...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as unknown as T & { cancel: () => void };
  debounced.cancel = () => {
    if (timer) { clearTimeout(timer); timer = null; }
  };
  return debounced;
}

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
  function bindLoadData(loadData: () => void | Promise<void>, agentIdSource?: WatchSource, extraSources?: WatchSource[]) {
    // Set loading ngay lập tức (sync, trước render) → tránh flash empty state
    loading.value = true;

    // Debounced loadData — prevents cascading calls when agent+dateRange change simultaneously
    const debouncedLoad = debounce(() => {
      page.current = 1;
      loadData();
    }, 150);

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
      watch(agentIdSource, debouncedLoad);
    }

    if (extraSources) {
      for (const src of extraSources) {
        watch(src, debouncedLoad);
      }
    }

    onMounted(() => loadData());

    // Bump version on unmount so any in-flight request becomes stale
    // Cancel pending debounce timer to prevent firing after unmount
    onBeforeUnmount(() => { latestVersion++; debouncedLoad.cancel(); });

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

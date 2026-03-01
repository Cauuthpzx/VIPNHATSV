import { ref, reactive } from "vue";

export interface PageState {
  current: number;
  limit: number;
  total: number;
}

export function useListPage(initialLimit = 10) {
  const dataSource = ref<any[]>([]);
  const loading = ref(false);
  const page = reactive<PageState>({ current: 1, limit: initialLimit, total: 0 });

  function handlePageChange(val: { current: number }) {
    page.current = val.current;
  }

  function handleLimitChange(limit: number) {
    page.limit = limit;
    page.current = 1;
  }

  function resetPage() {
    page.current = 1;
  }

  return {
    dataSource,
    loading,
    page,
    handlePageChange,
    handleLimitChange,
    resetPage,
  };
}

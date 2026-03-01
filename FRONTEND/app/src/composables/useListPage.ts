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

  function resetPage() {
    page.current = 1;
  }

  return {
    dataSource,
    loading,
    page,
    resetPage,
  };
}

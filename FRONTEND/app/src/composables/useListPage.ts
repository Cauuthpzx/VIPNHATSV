import { ref, reactive, nextTick } from "vue";

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

  /** Scroll .layui-body lên đầu table sau khi đổi trang — tránh giật */
  function scrollToTable() {
    nextTick(() => {
      const body = document.querySelector(".layui-body");
      if (body) body.scrollTo({ top: 0, behavior: "instant" });
    });
  }

  return {
    dataSource,
    loading,
    page,
    resetPage,
    scrollToTable,
  };
}

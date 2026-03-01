import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";

export interface TabItem {
  title: string;
  path: string;
  closable: boolean;
}

export const useAppStore = defineStore("app", () => {
  const collapsed = ref(false);
  const authStore = useAuthStore();
  const username = computed(() => authStore.user?.name || authStore.user?.email || "");

  const tabs = ref<TabItem[]>([
    { title: "Trang chủ", path: "/agent/welcome", closable: false },
  ]);
  const activeTab = ref("/agent/welcome");

  function toggleCollapse() {
    collapsed.value = !collapsed.value;
  }

  function addTab(tab: TabItem) {
    const exists = tabs.value.find((t) => t.path === tab.path);
    if (!exists) {
      tabs.value.push(tab);
    }
    activeTab.value = tab.path;
  }

  function removeTab(path: string) {
    const idx = tabs.value.findIndex((t) => t.path === path);
    if (idx === -1) return;
    if (!tabs.value[idx].closable) return;
    tabs.value.splice(idx, 1);
    if (activeTab.value === path) {
      const newIdx = Math.min(idx, tabs.value.length - 1);
      activeTab.value = tabs.value[newIdx]?.path || "/agent/welcome";
    }
  }

  function closeOtherTabs() {
    tabs.value = tabs.value.filter(
      (t) => !t.closable || t.path === activeTab.value
    );
  }

  function closeAllTabs() {
    tabs.value = tabs.value.filter((t) => !t.closable);
    activeTab.value = tabs.value[0]?.path || "/agent/welcome";
  }

  return {
    collapsed,
    username,
    tabs,
    activeTab,
    toggleCollapse,
    addTab,
    removeTab,
    closeOtherTabs,
    closeAllTabs,
  };
});

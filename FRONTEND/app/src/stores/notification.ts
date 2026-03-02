import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  fetchNotifications,
  fetchNotificationCount,
  markNotificationsRead,
  deleteReadNotifications,
} from "@/api/services/notification";

export interface Notification {
  id: string;
  agentId: string;
  agentName: string;
  type: "member_new" | "member_lost";
  username: string;
  money: string | null;
  isRead: boolean;
  createdAt: string; // ISO string
}

export const useNotificationStore = defineStore("notification", () => {
  const notifications = ref<Notification[]>([]);
  const totalCount = ref(0);
  const unreadCount = ref(0);
  const loading = ref(false);
  const loadingMore = ref(false);

  const hasUnread = computed(() => unreadCount.value > 0);
  const hasMore = computed(() => notifications.value.length < totalCount.value);
  const hasReadItems = computed(() => notifications.value.some((n) => n.isRead));

  // --- Polling ---
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  function startPolling(intervalMs = 30_000) {
    stopPolling();
    pollUnreadCount(); // immediate
    pollTimer = setInterval(pollUnreadCount, intervalMs);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function pollUnreadCount() {
    try {
      const res = await fetchNotificationCount();
      const data = res.data?.data;
      if (data && typeof data.unread === "number") {
        unreadCount.value = data.unread;
      }
    } catch {
      // silent
    }
  }

  // --- WebSocket handler ---
  function onWsNotification() {
    pollUnreadCount();
  }

  // --- Load from server ---
  async function loadFromServer() {
    loading.value = true;
    try {
      const res = await fetchNotifications({ limit: 50, offset: 0 });
      const data = res.data?.data;
      if (data) {
        notifications.value = data.items ?? [];
        totalCount.value = data.total ?? 0;
        unreadCount.value = (data.items ?? []).filter((n: Notification) => !n.isRead).length;
      }
    } catch {
      // silent
    } finally {
      loading.value = false;
    }
  }

  async function loadMore() {
    if (loadingMore.value || !hasMore.value) return;
    loadingMore.value = true;
    try {
      const res = await fetchNotifications({
        limit: 50,
        offset: notifications.value.length,
      });
      const data = res.data?.data;
      if (data?.items?.length) {
        notifications.value.push(...data.items);
        totalCount.value = data.total ?? totalCount.value;
      }
    } catch {
      // silent
    } finally {
      loadingMore.value = false;
    }
  }

  // --- Actions ---
  async function markAsRead(id: string) {
    const n = notifications.value.find((n) => n.id === id);
    if (!n || n.isRead) return;
    n.isRead = true; // optimistic
    unreadCount.value = Math.max(0, unreadCount.value - 1);
    try {
      await markNotificationsRead({ ids: [id] });
    } catch {
      n.isRead = false; // rollback
      unreadCount.value++;
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.value.filter((n) => !n.isRead);
    if (unreadIds.length === 0) return;
    // optimistic
    for (const n of unreadIds) n.isRead = true;
    const prevCount = unreadCount.value;
    unreadCount.value = 0;
    try {
      await markNotificationsRead({ all: true });
    } catch {
      // rollback
      for (const n of unreadIds) n.isRead = false;
      unreadCount.value = prevCount;
    }
  }

  async function removeRead() {
    const readItems = notifications.value.filter((n) => n.isRead);
    if (readItems.length === 0) return;
    // optimistic
    const prevList = [...notifications.value];
    const prevTotal = totalCount.value;
    notifications.value = notifications.value.filter((n) => !n.isRead);
    totalCount.value -= readItems.length;
    try {
      await deleteReadNotifications();
    } catch {
      notifications.value = prevList;
      totalCount.value = prevTotal;
    }
  }

  return {
    notifications,
    totalCount,
    unreadCount,
    loading,
    loadingMore,
    hasUnread,
    hasMore,
    hasReadItems,
    startPolling,
    stopPolling,
    onWsNotification,
    loadFromServer,
    loadMore,
    markAsRead,
    markAllAsRead,
    removeRead,
  };
});

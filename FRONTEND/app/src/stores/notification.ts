import { defineStore } from "pinia";
import { ref, computed, reactive } from "vue";
import {
  fetchNotifications,
  fetchNotificationCount,
  markNotificationsRead,
  deleteReadNotifications,
  deleteAllNotifications,
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

export type NotifType = "member_new" | "member_lost";

export const NOTIF_TYPE_CONFIG: { type: NotifType; labelKey: string; color: string; icon: string }[] = [
  { type: "member_new", labelKey: "notification.memberNew", color: "#16baaa", icon: "+" },
  { type: "member_lost", labelKey: "notification.memberLost", color: "#ff5722", icon: "−" },
];

const SETTINGS_KEY = "hub_notif_settings";

function loadSettings(): Record<NotifType, boolean> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { member_new: true, member_lost: true, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { member_new: true, member_lost: true };
}

function saveSettings(s: Record<NotifType, boolean>) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export const useNotificationStore = defineStore("notification", () => {
  const notifications = ref<Notification[]>([]);
  const totalCount = ref(0);
  const unreadCount = ref(0);
  const loading = ref(false);
  const loadingMore = ref(false);
  const enabledTypes = reactive<Record<NotifType, boolean>>(loadSettings());

  const hasUnread = computed(() => unreadCount.value > 0);
  const hasMore = computed(() => notifications.value.length < totalCount.value);
  const hasReadItems = computed(() => notifications.value.some((n) => n.isRead));

  function isTypeEnabled(type: NotifType): boolean {
    return enabledTypes[type] !== false;
  }

  function toggleType(type: NotifType) {
    enabledTypes[type] = !enabledTypes[type];
    saveSettings({ ...enabledTypes });
  }

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
    for (const n of unreadIds) n.isRead = true;
    const prevCount = unreadCount.value;
    unreadCount.value = 0;
    try {
      await markNotificationsRead({ all: true });
    } catch {
      for (const n of unreadIds) n.isRead = false;
      unreadCount.value = prevCount;
    }
  }

  async function removeRead() {
    const readItems = notifications.value.filter((n) => n.isRead);
    if (readItems.length === 0) return;
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

  async function removeAll() {
    if (notifications.value.length === 0) return;
    const prevList = [...notifications.value];
    const prevTotal = totalCount.value;
    const prevUnread = unreadCount.value;
    notifications.value = [];
    totalCount.value = 0;
    unreadCount.value = 0;
    try {
      await deleteAllNotifications();
    } catch {
      notifications.value = prevList;
      totalCount.value = prevTotal;
      unreadCount.value = prevUnread;
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
    enabledTypes,
    isTypeEnabled,
    toggleType,
    startPolling,
    stopPolling,
    onWsNotification,
    loadFromServer,
    loadMore,
    markAsRead,
    markAllAsRead,
    removeRead,
    removeAll,
  };
});

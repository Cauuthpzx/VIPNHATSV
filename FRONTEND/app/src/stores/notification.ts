import { defineStore } from "pinia";
import { ref, computed } from "vue";

export type NotificationType = "info" | "success" | "warning" | "error" | "system";

export const NOTIFICATION_TYPES: { type: NotificationType; label: string; color: string }[] = [
  { type: "system", label: "Hệ thống", color: "#722ed1" },
  { type: "success", label: "Thành công", color: "#16baaa" },
  { type: "warning", label: "Cảnh báo", color: "#ffb800" },
  { type: "error", label: "Lỗi", color: "#ff5722" },
  { type: "info", label: "Thông tin", color: "#1e9fff" },
];

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: number; // epoch ms
  icon?: string; // layui-icon class name
  link?: string; // route path to navigate on click
}

const STORAGE_KEY = "hub_notifications";
const PREFS_KEY = "hub_notification_prefs";

type EnabledTypes = Record<NotificationType, boolean>;

const defaultEnabledTypes: EnabledTypes = {
  info: true, success: true, warning: true, error: true, system: true,
};

function loadPrefs(): EnabledTypes {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...defaultEnabledTypes };
    const parsed = JSON.parse(raw);
    // Ensure all types exist (forward compat)
    return { ...defaultEnabledTypes, ...parsed };
  } catch {
    return { ...defaultEnabledTypes };
  }
}

function savePrefs(prefs: EnabledTypes) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function loadFromStorage(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

let idCounter = Date.now();

export const useNotificationStore = defineStore("notification", () => {
  const notifications = ref<Notification[]>(loadFromStorage());
  const enabledTypes = ref<EnabledTypes>(loadPrefs());

  function isTypeEnabled(type: NotificationType) {
    return enabledTypes.value[type] !== false;
  }

  function toggleType(type: NotificationType) {
    enabledTypes.value = { ...enabledTypes.value, [type]: !enabledTypes.value[type] };
    savePrefs(enabledTypes.value);
  }

  // Only count unread for enabled types
  const unreadCount = computed(() =>
    notifications.value.filter((n) => !n.read && isTypeEnabled(n.type)).length,
  );
  const hasUnread = computed(() => unreadCount.value > 0);

  function persist() {
    saveToStorage(notifications.value);
  }

  function add(item: Omit<Notification, "id" | "read" | "timestamp">) {
    const n: Notification = {
      ...item,
      id: String(++idCounter),
      read: false,
      timestamp: Date.now(),
    };
    notifications.value.unshift(n);
    // Keep max 100 notifications
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100);
    }
    persist();
    return n;
  }

  function markAsRead(id: string) {
    const n = notifications.value.find((n) => n.id === id);
    if (n && !n.read) {
      n.read = true;
      persist();
    }
  }

  function markAllAsRead() {
    let changed = false;
    for (const n of notifications.value) {
      if (!n.read) {
        n.read = true;
        changed = true;
      }
    }
    if (changed) persist();
  }

  function removeRead() {
    const before = notifications.value.length;
    notifications.value = notifications.value.filter((n) => !n.read);
    if (notifications.value.length !== before) persist();
  }

  function remove(id: string) {
    const idx = notifications.value.findIndex((n) => n.id === id);
    if (idx >= 0) {
      notifications.value.splice(idx, 1);
      persist();
    }
  }

  function clearAll() {
    notifications.value = [];
    persist();
  }

  /** Seed demo notifications on first visit (nothing in localStorage) */
  function seedDemoIfEmpty() {
    if (notifications.value.length > 0) return;
    const now = Date.now();
    const demos: Omit<Notification, "id">[] = [
      {
        type: "system",
        title: "Chào mừng đến MaxHUB",
        message: "Hệ thống quản trị đã sẵn sàng hoạt động. Bạn có thể khám phá các tính năng quản lý hội viên, báo cáo tài chính, phân quyền chi tiết và nhiều công cụ hữu ích khác. Nhấn vào để bắt đầu!",
        read: false,
        timestamp: now - 1000 * 60 * 2,
      },
      {
        type: "success",
        title: "Đồng bộ dữ liệu thành công",
        message: "12 agents đã được đồng bộ cookie từ upstream server. Tất cả phiên hoạt động bình thường, không có lỗi nào được ghi nhận trong quá trình đồng bộ. Dữ liệu hội viên, nạp/rút và báo cáo đã được cập nhật.",
        read: false,
        timestamp: now - 1000 * 60 * 15,
        link: "/agent/user",
      },
      {
        type: "warning",
        title: "Cookie sắp hết hạn",
        message: "Agent 'demo_user03' có cookie sẽ hết hạn trong 2 giờ tới. Nếu không gia hạn kịp thời, hệ thống sẽ không thể truy xuất dữ liệu từ upstream cho agent này. Vui lòng vào trang quản lý agent để cập nhật cookie mới.",
        read: false,
        timestamp: now - 1000 * 60 * 45,
      },
      {
        type: "info",
        title: "Phân quyền đã cập nhật",
        message: "Hệ thống phân quyền đã được mở rộng lên 16 permissions chi tiết, bao gồm: quản lý hội viên, mã giới thiệu, báo cáo, tài chính, đơn cược, đổi mật khẩu và hoàn trả. Mỗi vai trò có thể được cấu hình quyền riêng biệt.",
        read: false,
        timestamp: now - 1000 * 60 * 60 * 2,
        link: "/system/roles",
      },
      {
        type: "error",
        title: "Lỗi kết nối upstream",
        message: "Hệ thống không thể kết nối tới upstream server lúc 14:30 do timeout sau 10 giây chờ. Nguyên nhân có thể do mạng hoặc server upstream đang bảo trì. Hệ thống đã tự động retry sau 30 giây và kết nối lại thành công. Không có dữ liệu nào bị mất.",
        read: true,
        timestamp: now - 1000 * 60 * 60 * 5,
      },
      {
        type: "success",
        title: "Báo cáo tài chính đã sẵn sàng",
        message: "Báo cáo tổng hợp tài chính tháng 2/2026 đã được tạo tự động. Bao gồm dữ liệu nạp/rút, hoa hồng đại lý, khuyến mãi và hoàn trả game bên thứ ba từ tất cả 12 agents. Nhấn để xem chi tiết báo cáo.",
        read: true,
        timestamp: now - 1000 * 60 * 60 * 24,
        link: "/agent/report-funds",
      },
    ];
    notifications.value = demos.map((d, i) => ({ ...d, id: String(now - i) }));
    persist();
  }

  return {
    notifications,
    enabledTypes,
    unreadCount,
    hasUnread,
    isTypeEnabled,
    toggleType,
    add,
    markAsRead,
    markAllAsRead,
    removeRead,
    remove,
    clearAll,
    seedDemoIfEmpty,
  };
});

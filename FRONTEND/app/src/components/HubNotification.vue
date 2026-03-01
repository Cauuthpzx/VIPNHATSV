<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore, NOTIFICATION_TYPES, type Notification, type NotificationType } from "@/stores/notification";

const router = useRouter();
const store = useNotificationStore();

const open = ref(false);
const filter = ref<"all" | "unread">("all");
const showSettings = ref(false);
const rootEl = ref<HTMLElement>();

const filteredList = computed(() => {
  let list = store.notifications.filter((n) => store.isTypeEnabled(n.type));
  if (filter.value === "unread") {
    list = list.filter((n) => !n.read);
  }
  return list;
});

const isEmpty = computed(() => filteredList.value.length === 0);

// Expanded items — track which notifications are showing full content
const expandedIds = ref<Set<string>>(new Set());

function isExpanded(id: string) {
  return expandedIds.value.has(id);
}

function toggleExpand(id: string) {
  const next = new Set(expandedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expandedIds.value = next;
}

function toggle() {
  open.value = !open.value;
  if (!open.value) {
    expandedIds.value = new Set(); // reset expanded on close
  }
}

function close() {
  open.value = false;
  expandedIds.value = new Set();
  showSettings.value = false;
}

// Click outside to close (click only, not hover)
function onDocClick(e: MouseEvent) {
  if (!open.value || !rootEl.value) return;
  if (!rootEl.value.contains(e.target as Node)) {
    close();
  }
}

onMounted(() => document.addEventListener("mousedown", onDocClick));
onBeforeUnmount(() => document.removeEventListener("mousedown", onDocClick));

let lastClickTime = 0;
function onClickNotification(n: Notification, e: MouseEvent) {
  // Guard against double-click collapsing immediately
  const now = Date.now();
  if (now - lastClickTime < 300) return;
  lastClickTime = now;

  // Toggle expand first, then mark as read.
  // When viewing "unread" filter, delay markAsRead so the item
  // doesn't vanish from the list while user is reading it.
  toggleExpand(n.id);
  if (!n.read) {
    if (filter.value === "unread") {
      setTimeout(() => store.markAsRead(n.id), 300);
    } else {
      store.markAsRead(n.id);
    }
  }
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Vừa xong";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  const date = new Date(timestamp);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

const iconMap: Record<NotificationType, string> = {
  info: "layui-icon-about",
  success: "layui-icon-ok-circle",
  warning: "layui-icon-tips-fill",
  error: "layui-icon-close-fill",
  system: "layui-icon-set-fill",
};

const colorMap: Record<NotificationType, string> = {
  info: "#1e9fff",
  success: "#16baaa",
  warning: "#ffb800",
  error: "#ff5722",
  system: "#722ed1",
};
</script>

<template>
  <div ref="rootEl" class="hub-notify">
    <!-- Bell trigger with lay-badge -->
    <a href="javascript:;" class="hub-notify-bell" @click="toggle" :class="{ active: open }">
      <lay-badge
        v-if="store.hasUnread"
        :value="store.unreadCount"
        :max="99"
        color="#ff4d4f"
        ripple
      >
        <span class="hub-notify-bell-inner">
          <svg class="hub-notify-bell-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </span>
      </lay-badge>
      <!-- No badge when no unread -->
      <span v-else class="hub-notify-bell-inner">
        <svg class="hub-notify-bell-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </span>
    </a>

    <!-- Dropdown panel -->
    <Transition name="notify-slide">
      <div v-show="open" class="hub-notify-panel">
        <!-- Header -->
        <div class="hub-notify-header">
          <div class="hub-notify-header-left">
            <h3 class="hub-notify-title">Thông báo</h3>
            <lay-badge v-if="store.hasUnread" :value="`${store.unreadCount} mới`" color="#ff4d4f" />
          </div>
          <div class="hub-notify-header-actions">
            <a href="javascript:;" class="hub-notify-action" :class="{ active: showSettings }" title="Cài đặt" @click="showSettings = !showSettings">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </a>
            <a v-show="!showSettings" href="javascript:;" class="hub-notify-action" title="Đánh dấu tất cả đã đọc" @click="store.markAllAsRead()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </a>
            <a v-show="!showSettings" href="javascript:;" class="hub-notify-action" title="Xóa đã đọc" @click="store.removeRead()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </a>
            <a v-show="!showSettings" href="javascript:;" class="hub-notify-action" title="Xóa tất cả" @click="store.clearAll()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </a>
          </div>
        </div>

        <!-- Settings view -->
        <div v-if="showSettings" class="hub-notify-settings">
          <div class="hub-notify-settings-title">Loại thông báo hiển thị</div>
          <div
            v-for="t in NOTIFICATION_TYPES"
            :key="t.type"
            class="hub-notify-settings-row"
          >
            <span class="hub-notify-settings-dot" :style="{ background: t.color }" />
            <span class="hub-notify-settings-label">{{ t.label }}</span>
            <lay-switch
              :model-value="store.enabledTypes[t.type]"
              @update:model-value="store.toggleType(t.type)"
              size="xs"
            />
          </div>
        </div>

        <!-- Filter tabs -->
        <div v-if="!showSettings" class="hub-notify-filters">
          <button
            class="hub-notify-filter-btn"
            :class="{ active: filter === 'all' }"
            @click="filter = 'all'"
          >Tất cả</button>
          <button
            class="hub-notify-filter-btn"
            :class="{ active: filter === 'unread' }"
            @click="filter = 'unread'"
          >
            Chưa đọc
            <lay-badge v-if="store.unreadCount > 0" :value="store.unreadCount" color="#ff4d4f" />
          </button>
        </div>

        <!-- Notification list -->
        <div v-if="!showSettings" class="hub-notify-list">
          <TransitionGroup name="notify-item" tag="div">
            <div
              v-for="n in filteredList"
              :key="n.id"
              class="hub-notify-item"
              :class="{ unread: !n.read, expanded: isExpanded(n.id) }"
              @click="onClickNotification(n, $event)"
            >
              <!-- Type icon -->
              <div class="hub-notify-item-icon" :style="{ background: colorMap[n.type] + '18', color: colorMap[n.type] }">
                <i :class="['layui-icon', n.icon || iconMap[n.type]]" />
              </div>
              <!-- Content -->
              <div class="hub-notify-item-body">
                <div class="hub-notify-item-title">{{ n.title }}</div>
                <div class="hub-notify-item-msg" :class="isExpanded(n.id) ? 'full' : 'clamped'">{{ n.message }}</div>
                <!-- Expand/collapse + link row -->
                <div class="hub-notify-item-footer">
                  <div class="hub-notify-item-time">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ formatTime(n.timestamp) }}
                  </div>
                  <div class="hub-notify-item-actions">
                    <a
                      v-if="isExpanded(n.id)"
                      href="javascript:;"
                      class="hub-notify-item-link collapse"
                      @click.stop="toggleExpand(n.id)"
                    >Thu gọn</a>
                    <a
                      v-if="isExpanded(n.id) && n.link"
                      href="javascript:;"
                      class="hub-notify-item-link go"
                      @click.stop="router.push(n.link)"
                    >Xem chi tiết →</a>
                  </div>
                </div>
              </div>
              <!-- Unread indicator -->
              <lay-badge v-if="!n.read" type="dot" color="#009688" ripple :badge-style="{ position: 'static', transform: 'none', 'box-shadow': 'none' }" />
              <!-- Remove button -->
              <a
                href="javascript:;"
                class="hub-notify-item-remove"
                title="Xóa"
                @click.stop="store.remove(n.id)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </a>
            </div>
          </TransitionGroup>

          <!-- Empty state -->
          <div v-if="isEmpty" class="hub-notify-empty">
            <div class="hub-notify-empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </div>
            <p>Không có thông báo</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* === Bell trigger === */
.hub-notify {
  position: relative;
  display: flex;
  align-items: center;
}

.hub-notify-bell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: #666;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.hub-notify-bell:hover,
.hub-notify-bell.active {
  background: #f0f5f4;
  color: #333;
}

.hub-notify-bell-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.hub-notify-bell-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hub-notify-bell:hover .hub-notify-bell-icon {
  animation: bell-ring 0.6s ease;
}

@keyframes bell-ring {
  0% { transform: rotate(0); }
  15% { transform: rotate(14deg); }
  30% { transform: rotate(-12deg); }
  45% { transform: rotate(10deg); }
  60% { transform: rotate(-6deg); }
  75% { transform: rotate(3deg); }
  100% { transform: rotate(0); }
}

/* === Panel dropdown === */
.hub-notify-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: -60px;
  width: 380px;
  max-height: 520px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
}

/* Caret arrow */
.hub-notify-panel::before {
  content: "";
  position: absolute;
  top: -6px;
  right: 76px;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 1px;
  transform: rotate(45deg);
  border-left: 1px solid #e8e8e8;
  border-top: 1px solid #e8e8e8;
}

.notify-slide-enter-active {
  animation: notify-slide-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.notify-slide-leave-active {
  animation: notify-slide-in 0.15s ease reverse;
}
@keyframes notify-slide-in {
  0% { opacity: 0; transform: translateY(-8px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* === Header === */
.hub-notify-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #e8e8e8;
}

.hub-notify-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hub-notify-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.hub-notify-header-actions {
  display: flex;
  gap: 2px;
}

.hub-notify-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  color: #999;
  text-decoration: none;
  transition: all 0.2s;
}

.hub-notify-action:hover,
.hub-notify-action.active {
  background: #f5f5f5;
  color: #009688;
}

/* === Filter tabs === */
.hub-notify-filters {
  display: flex;
  gap: 4px;
  padding: 8px 14px;
  border-bottom: 1px solid #e8e8e8;
}

.hub-notify-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: #666;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.hub-notify-filter-btn:hover {
  background: #f5f5f5;
}

.hub-notify-filter-btn.active {
  background: #e6f7f5;
  border-color: #b2dfdb;
  color: #009688;
  font-weight: 600;
}

/* === Notification list === */
.hub-notify-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 380px;
}

.hub-notify-list::-webkit-scrollbar {
  width: 4px;
}
.hub-notify-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 4px;
}
.hub-notify-list::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}

/* === Notification item === */
.hub-notify-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  border-bottom: 1px solid #f8f8f8;
}

.hub-notify-item:last-child {
  border-bottom: none;
}

.hub-notify-item:hover {
  background: #fafafa;
}

.hub-notify-item.unread {
  background: #f6ffed;
}

.hub-notify-item.unread:hover {
  background: #eef8e4;
}

/* Item icon */
.hub-notify-item-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hub-notify-item-icon .layui-icon {
  font-size: 18px;
}

/* Item body */
.hub-notify-item-body {
  flex: 1;
  min-width: 0;
}

.hub-notify-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 3px;
}

.hub-notify-item.unread .hub-notify-item-title {
  color: #000;
}

.hub-notify-item-msg {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
}

.hub-notify-item-msg.clamped {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hub-notify-item-msg.full {
  white-space: pre-wrap;
  word-break: break-word;
}

/* Footer: time + action links */
.hub-notify-item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  gap: 8px;
}

.hub-notify-item-time {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #aaa;
  flex-shrink: 0;
}

.hub-notify-item-time svg {
  opacity: 0.6;
}

.hub-notify-item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hub-notify-item-link {
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s;
}

.hub-notify-item-link.collapse {
  color: #999;
}

.hub-notify-item-link.collapse:hover {
  color: #666;
}

.hub-notify-item-link.go {
  color: #009688;
}

.hub-notify-item-link.go:hover {
  color: #00796b;
}

/* Expanded item highlight */
.hub-notify-item.expanded {
  background: #f8fffe;
  border-left: 3px solid #009688;
  padding-left: 11px;
}

/* Remove button */
.hub-notify-item-remove {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 3px;
  color: #ccc;
  text-decoration: none;
  opacity: 0;
  transition: all 0.2s;
}

.hub-notify-item:hover .hub-notify-item-remove {
  opacity: 1;
}

.hub-notify-item-remove:hover {
  background: #fff1f0;
  color: #ff4d4f;
}

/* Item transition — no position:absolute to avoid overlap */
.notify-item-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.notify-item-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.notify-item-enter-from {
  opacity: 0;
  transform: translateX(-12px);
}
.notify-item-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
.notify-item-move {
  transition: transform 0.25s ease;
}

/* === Settings view === */
.hub-notify-settings {
  padding: 14px;
}

.hub-notify-settings-title {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.hub-notify-settings-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.hub-notify-settings-row:last-child {
  border-bottom: none;
}

.hub-notify-settings-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.hub-notify-settings-label {
  flex: 1;
  font-size: 13px;
  color: #333;
}

/* === Empty state === */
.hub-notify-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 10px;
}

.hub-notify-empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 4px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d9d9d9;
}

.hub-notify-empty p {
  font-size: 14px;
  color: #bbb;
  margin: 0;
}
</style>

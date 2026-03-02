<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useNotificationStore, type Notification } from "@/stores/notification";
import { fetchMemberDetail } from "@/api/services/notification";
import { layer } from "@layui/layui-vue";

const store = useNotificationStore();

const open = ref(false);
const rootEl = ref<HTMLElement>();

// --- Member detail dialog ---
const detailVisible = ref(false);
const detailNotif = ref<Notification | null>(null);
const memberLoading = ref(false);
const memberInfo = ref<Record<string, unknown> | null>(null);

// --- Panel toggle ---
function toggle() {
  open.value = !open.value;
  if (open.value) {
    store.loadFromServer();
  }
}

function close() {
  open.value = false;
}

function onDocClick(e: MouseEvent) {
  if (!open.value || !rootEl.value) return;
  if (!rootEl.value.contains(e.target as Node)) {
    close();
  }
}

onMounted(() => document.addEventListener("mousedown", onDocClick));
onBeforeUnmount(() => document.removeEventListener("mousedown", onDocClick));

function onClickNotification(n: Notification) {
  if (!n.isRead) store.markAsRead(n.id);
}

// --- Member detail ---
async function openDetail(n: Notification, e: MouseEvent) {
  e.stopPropagation();
  if (!n.isRead) store.markAsRead(n.id);
  detailNotif.value = n;
  memberInfo.value = null;
  detailVisible.value = true;
  memberLoading.value = true;

  try {
    const res = await fetchMemberDetail(n.agentId, n.username);
    const data = res.data?.data;
    if (data) {
      memberInfo.value = data;
    } else {
      layer.msg("Không tìm thấy thông tin hội viên", { icon: 0 });
    }
  } catch {
    layer.msg("Lỗi tải thông tin hội viên", { icon: 2 });
  } finally {
    memberLoading.value = false;
  }
}

function closeDetail() {
  detailVisible.value = false;
  detailNotif.value = null;
  memberInfo.value = null;
}

// --- Formatters ---
function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Vừa xong";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  const date = new Date(isoStr);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

const memberFields: { key: string; label: string }[] = [
  { key: "username", label: "Tên hội viên" },
  { key: "money", label: "Số dư" },
  { key: "typeFormat", label: "Loại hình" },
  { key: "parentUser", label: "Đại lý cấp trên" },
  { key: "depositCount", label: "Lần nạp" },
  { key: "depositAmount", label: "Tổng tiền nạp" },
  { key: "withdrawalCount", label: "Lần rút" },
  { key: "withdrawalAmount", label: "Tổng tiền rút" },
  { key: "loginTime", label: "Đăng nhập cuối" },
  { key: "registerTime", label: "Thời gian đăng ký" },
  { key: "statusFormat", label: "Trạng thái" },
  { key: "syncedAt", label: "Cập nhật lúc" },
];

function formatFieldValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return "-";
  if (key === "syncedAt") return new Date(String(val)).toLocaleString("vi-VN");
  if (key === "depositCount" || key === "withdrawalCount") return `${val} lần`;
  if (key === "money" || key === "depositAmount" || key === "withdrawalAmount") {
    return Number(val).toLocaleString("vi-VN") + " ₫";
  }
  return String(val);
}

const badgeText = computed(() => {
  if (store.unreadCount > 99) return "99+";
  return String(store.unreadCount);
});
</script>

<template>
  <div ref="rootEl" class="hub-notify">
    <!-- Bell trigger -->
    <a href="javascript:;" class="hub-notify-bell" :class="{ active: open }" @click="toggle">
      <i class="layui-icon layui-icon-notice hub-notify-bell-icon" />
      <span v-if="store.hasUnread" class="hub-notify-badge">{{ badgeText }}</span>
    </a>

    <!-- Dropdown panel -->
    <Transition name="notify-slide">
      <div v-show="open" class="hub-notify-panel">
        <!-- Header -->
        <div class="hub-notify-header">
          <span class="hub-notify-title">Thông báo</span>
          <span v-if="store.hasUnread" class="hub-notify-header-count">{{ store.unreadCount }} chưa đọc</span>
          <i class="layui-icon layui-icon-close hub-notify-close" @click="close" />
        </div>

        <!-- Loading -->
        <div v-if="store.loading && store.notifications.length === 0" class="hub-notify-empty">
          <i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop" style="font-size: 20px; color: #009688;" />
          <span>Đang tải...</span>
        </div>

        <!-- Empty -->
        <div v-else-if="store.notifications.length === 0" class="hub-notify-empty">
          <i class="layui-icon layui-icon-face-surprised" style="font-size: 36px; color: #d9d9d9;" />
          <span>Không có thông báo</span>
        </div>

        <!-- Notification list -->
        <div v-else class="hub-notify-list">
          <div
            v-for="n in store.notifications"
            :key="n.id"
            class="hub-notify-item"
            :class="{ unread: !n.isRead }"
            @click="onClickNotification(n)"
          >
            <span class="hub-notify-item-icon" :class="n.type === 'member_new' ? 'new' : 'lost'">
              {{ n.type === "member_new" ? "+" : "−" }}
            </span>
            <div class="hub-notify-item-body">
              <span v-if="n.agentName" class="hub-notify-item-agent">{{ n.agentName }}</span>
              <span class="hub-notify-item-text">
                {{ n.type === "member_new" ? "Hội viên mới: " : "Mất hội viên: " }}
                <strong>{{ n.username }}</strong>
                <span v-if="n.money" class="hub-notify-item-money">{{ Number(n.money).toLocaleString("vi-VN") }} ₫</span>
              </span>
              <span class="hub-notify-item-meta">
                <span class="hub-notify-item-time">{{ timeAgo(n.createdAt) }}</span>
                <a
                  href="javascript:;"
                  class="hub-notify-item-detail"
                  @click="openDetail(n, $event)"
                >Chi tiết</a>
              </span>
            </div>
          </div>

          <!-- Load more -->
          <div v-if="store.hasMore" class="hub-notify-load-more">
            <button @click.stop="store.loadMore()" :disabled="store.loadingMore">
              {{ store.loadingMore ? "Đang tải..." : `Xem thêm (${store.notifications.length}/${store.totalCount})` }}
            </button>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="hub-notify-footer">
          <button
            v-if="store.hasUnread"
            class="hub-notify-footer-btn hub-notify-footer-btn--read"
            @click="store.markAllAsRead()"
          >
            <i class="layui-icon layui-icon-ok" /> Đã đọc tất cả
          </button>
          <button
            v-if="store.hasReadItems"
            class="hub-notify-footer-btn hub-notify-footer-btn--delete"
            @click="store.removeRead()"
          >
            <i class="layui-icon layui-icon-delete" /> Xóa đã đọc
          </button>
        </div>
      </div>
    </Transition>

    <!-- Member detail dialog -->
    <lay-layer
      v-model="detailVisible"
      :title="detailNotif ? (detailNotif.agentName ? detailNotif.agentName + ' › ' : '') + detailNotif.username : 'Chi tiết'"
      :area="['440px', 'auto']"
      :shade-close="true"
      :move="true"
      @close="closeDetail"
    >
      <div v-if="detailNotif" class="hub-member-detail">
        <!-- Loading -->
        <div v-if="memberLoading" class="hub-member-loading">
          <i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop" />
          Đang tải thông tin...
        </div>

        <!-- Member info table -->
        <table v-if="memberInfo" class="hub-member-table">
          <tbody>
            <tr v-for="field in memberFields" :key="field.key">
              <td class="hub-member-label">{{ field.label }}</td>
              <td>
                <template v-if="field.key === 'username'">
                  <strong>{{ memberInfo[field.key] ?? "-" }}</strong>
                </template>
                <template v-else-if="field.key === 'money' || field.key === 'depositAmount' || field.key === 'withdrawalAmount'">
                  <span class="hub-member-money">{{ formatFieldValue(field.key, memberInfo[field.key]) }}</span>
                </template>
                <template v-else>
                  {{ formatFieldValue(field.key, memberInfo[field.key]) }}
                </template>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Not found -->
        <div v-if="!memberLoading && !memberInfo" class="hub-member-empty">
          Không tìm thấy dữ liệu hội viên
        </div>
      </div>
    </lay-layer>
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #666;
  text-decoration: none;
  transition: all 0.2s ease;
}

.hub-notify-bell:hover,
.hub-notify-bell.active {
  background: rgba(0, 0, 0, 0.04);
  color: #333;
}

.hub-notify-bell-icon {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.hub-notify-bell:hover .hub-notify-bell-icon {
  animation: bell-ring 0.5s ease;
}

@keyframes bell-ring {
  0% { transform: rotate(0); }
  15% { transform: rotate(14deg); }
  30% { transform: rotate(-12deg); }
  45% { transform: rotate(8deg); }
  60% { transform: rotate(-4deg); }
  100% { transform: rotate(0); }
}

.hub-notify-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #ff4d4f;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  pointer-events: none;
}

/* === Panel dropdown === */
.hub-notify-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: -20px;
  width: 370px;
  max-height: 500px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
}

.notify-slide-enter-active {
  animation: notify-slide-in 0.2s ease-out;
}
.notify-slide-leave-active {
  animation: notify-slide-in 0.15s ease reverse;
}
@keyframes notify-slide-in {
  0% { opacity: 0; transform: translateY(-6px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* === Header === */
.hub-notify-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  gap: 8px;
}

.hub-notify-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
}

.hub-notify-header-count {
  font-size: 11px;
  color: #fff;
  background: #ff4d4f;
  border-radius: 10px;
  padding: 1px 8px;
  font-weight: 500;
}

.hub-notify-close {
  font-size: 14px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  margin-left: auto;
}

.hub-notify-close:hover {
  color: #333;
  background: #f5f5f5;
}

/* === Notification list === */
.hub-notify-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 370px;
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
  border-bottom: 1px solid #f8f8f8;
  transition: background 0.15s;
}

.hub-notify-item:last-child {
  border-bottom: none;
}

.hub-notify-item:hover {
  background: #fafafa;
}

.hub-notify-item.unread {
  background: #f0f7ff;
}

.hub-notify-item.unread:hover {
  background: #e6f0fa;
}

/* +/- icon */
.hub-notify-item-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  margin-top: 2px;
}

.hub-notify-item-icon.new {
  background: #e6f7f0;
  color: #16baaa;
}

.hub-notify-item-icon.lost {
  background: #fef2f2;
  color: #ff5722;
}

/* Item body */
.hub-notify-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hub-notify-item-agent {
  font-size: 11px;
  color: #1e9fff;
  font-weight: 600;
  line-height: 1.2;
}

.hub-notify-item-text {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
}

.hub-notify-item-money {
  display: inline-block;
  margin-left: 6px;
  font-weight: 700;
  color: #f59e0b;
  font-size: 13px;
}

.hub-notify-item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 1px;
}

.hub-notify-item-time {
  font-size: 11px;
  color: #aaa;
}

.hub-notify-item-detail {
  font-size: 11px;
  color: #009688;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.hub-notify-item-detail:hover {
  color: #00796b;
  text-decoration: underline;
}

/* === Load more === */
.hub-notify-load-more {
  display: flex;
  justify-content: center;
  padding: 8px 14px;
}

.hub-notify-load-more button {
  padding: 4px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  background: #fff;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.hub-notify-load-more button:hover:not(:disabled) {
  border-color: #009688;
  color: #009688;
}

.hub-notify-load-more button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* === Footer === */
.hub-notify-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-top: 1px solid #f0f0f0;
  gap: 8px;
}

.hub-notify-footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.hub-notify-footer-btn .layui-icon {
  font-size: 12px;
}

.hub-notify-footer-btn--read {
  color: #1e9fff;
  border-color: #d0e8ff;
}

.hub-notify-footer-btn--read:hover {
  background: #f0f7ff;
  border-color: #1e9fff;
}

.hub-notify-footer-btn--delete {
  color: #999;
}

.hub-notify-footer-btn--delete:hover {
  color: #dc2626;
  border-color: #dc2626;
  background: #fef2f2;
}

/* === Empty state === */
.hub-notify-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #bbb;
  font-size: 13px;
  gap: 8px;
}

/* === Member detail dialog === */
.hub-member-detail {
  padding: 12px 16px;
}

.hub-member-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
  font-size: 13px;
  color: #999;
  justify-content: center;
}

.hub-member-loading .layui-icon {
  font-size: 16px;
  color: #009688;
}

.hub-member-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.hub-member-table td {
  padding: 7px 10px;
  border-bottom: 1px solid #f5f5f5;
}

.hub-member-table tr:last-child td {
  border-bottom: none;
}

.hub-member-label {
  font-weight: 600;
  color: #666;
  width: 120px;
  white-space: nowrap;
}

.hub-member-money {
  font-weight: 700;
  color: #f59e0b;
  font-size: 15px;
}

.hub-member-empty {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
}
</style>

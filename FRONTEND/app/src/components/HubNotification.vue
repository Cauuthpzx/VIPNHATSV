<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useNotificationStore, NOTIF_TYPE_CONFIG, type Notification } from "@/stores/notification";
import { fetchMemberDetail } from "@/api/services/notification";
import { layer } from "@layui/layui-vue";

const { t } = useI18n();
const store = useNotificationStore();

const panelVisible = ref(false);
const filter = ref<"all" | "unread">("all");
const showSettings = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);

// --- Member detail dialog ---
const detailVisible = ref(false);
const detailNotif = ref<Notification | null>(null);
const memberLoading = ref(false);
const memberInfo = ref<Record<string, unknown> | null>(null);

const filteredList = computed(() => {
  let list = store.notifications.filter((n) => store.isTypeEnabled(n.type));
  if (filter.value === "unread") {
    list = list.filter((n) => !n.isRead);
  }
  return list;
});

const isEmpty = computed(() => filteredList.value.length === 0);

function togglePanel() {
  if (panelVisible.value) {
    closePanel();
  } else {
    panelVisible.value = true;
    showSettings.value = false;
    store.loadFromServer();
  }
}

function closePanel() {
  panelVisible.value = false;
  showSettings.value = false;
}

// Click outside to close
function onDocClick(e: MouseEvent) {
  if (!panelVisible.value) return;
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    closePanel();
  }
}

onMounted(() => document.addEventListener("mousedown", onDocClick));
onUnmounted(() => document.removeEventListener("mousedown", onDocClick));

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
      layer.msg(t("notification.memberNotFound"), { icon: 0 });
    }
  } catch {
    layer.msg(t("notification.errorLoadMember"), { icon: 2 });
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
function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${hh}:${mm} ${dd}/${mo}/${yy}`;
}

const memberFields: { key: string; labelKey: string }[] = [
  { key: "username", labelKey: "notification.memberName" },
  { key: "money", labelKey: "notification.memberBalance" },
  { key: "typeFormat", labelKey: "notification.memberType" },
  { key: "parentUser", labelKey: "notification.memberParent" },
  { key: "depositCount", labelKey: "notification.depositCount" },
  { key: "depositAmount", labelKey: "notification.totalDeposit" },
  { key: "withdrawalCount", labelKey: "notification.withdrawCount" },
  { key: "withdrawalAmount", labelKey: "notification.totalWithdraw" },
  { key: "loginTime", labelKey: "notification.lastLogin" },
  { key: "registerTime", labelKey: "notification.registerTime" },
  { key: "statusFormat", labelKey: "notification.status" },
  { key: "syncedAt", labelKey: "notification.updatedAt" },
];

function formatFieldValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return "-";
  if (key === "syncedAt") return new Date(String(val)).toLocaleString("vi-VN");
  if (key === "depositCount" || key === "withdrawalCount") return `${val}${t("notification.times")}`;
  if (key === "money" || key === "depositAmount" || key === "withdrawalAmount") {
    return Number(val).toLocaleString("en-US") + " ₫";
  }
  return String(val);
}

const badgeText = computed(() => {
  if (store.unreadCount > 99) return "99+";
  return String(store.unreadCount);
});

const panelTitle = computed(() => {
  if (store.hasUnread) return t("notification.titleWithCount", { n: store.unreadCount });
  return t("notification.title");
});
</script>

<template>
  <div ref="wrapperRef" class="hub-notify">
    <!-- Bell trigger -->
    <a href="javascript:;" class="hub-notify-bell" :class="{ active: panelVisible }" @click="togglePanel">
      <i class="layui-icon layui-icon-notice hub-notify-bell-icon" />
      <span v-if="store.hasUnread" class="hub-notify-badge">{{ badgeText }}</span>
    </a>

    <!-- Dropdown panel -->
    <transition name="hub-notify-fade">
      <div v-if="panelVisible" class="hub-notify-dropdown">
        <!-- Header -->
        <div class="hub-notify-header">
          <span class="hub-notify-title">{{ panelTitle }}</span>
        </div>

        <!-- Toolbar -->
        <div class="hub-notify-toolbar">
          <div class="hub-notify-filters">
            <button
              class="hub-notify-filter-btn"
              :class="{ active: filter === 'all' && !showSettings }"
              @click="
                filter = 'all';
                showSettings = false;
              "
            >
              {{ t("notification.all") }}
            </button>
            <button
              class="hub-notify-filter-btn"
              :class="{ active: filter === 'unread' && !showSettings }"
              @click="
                filter = 'unread';
                showSettings = false;
              "
            >
              {{ t("notification.unread") }}
              <span v-if="store.unreadCount > 0" class="hub-notify-filter-count">{{
                store.unreadCount
              }}</span>
            </button>
          </div>
          <div class="hub-notify-actions">
            <a
              href="javascript:;"
              class="hub-notify-action-btn"
              :class="{ active: showSettings }"
              :title="t('notification.settings')"
              @click="showSettings = !showSettings"
            >
              <i class="layui-icon layui-icon-set" />
            </a>
            <a
              v-show="!showSettings && store.hasUnread"
              href="javascript:;"
              class="hub-notify-action-btn hub-notify-action-btn--primary"
              :title="t('notification.markAllRead')"
              @click="store.markAllAsRead()"
            >
              <i class="layui-icon layui-icon-ok" />
            </a>
            <a
              v-show="!showSettings && store.hasReadItems"
              href="javascript:;"
              class="hub-notify-action-btn hub-notify-action-btn--warn"
              :title="t('notification.deleteRead')"
              @click="store.removeRead()"
            >
              <i class="layui-icon layui-icon-delete" />
            </a>
            <a
              v-show="!showSettings && store.notifications.length > 0"
              href="javascript:;"
              class="hub-notify-action-btn hub-notify-action-btn--danger"
              :title="t('notification.deleteAll')"
              @click="store.removeAll()"
            >
              <i class="layui-icon layui-icon-close" />
            </a>
          </div>
        </div>

        <!-- Settings view -->
        <div v-if="showSettings" class="hub-notify-settings">
          <div class="hub-notify-settings-title">
            {{ t("notification.typeSettings") }}
          </div>
          <div v-for="tc in NOTIF_TYPE_CONFIG" :key="tc.type" class="hub-notify-settings-row">
            <span class="hub-notify-settings-dot" :style="{ background: tc.color }" />
            <span class="hub-notify-settings-icon">{{ tc.icon }}</span>
            <span class="hub-notify-settings-label">{{ t(tc.labelKey) }}</span>
            <lay-switch
              :model-value="store.enabledTypes[tc.type]"
              size="xs"
              @update:model-value="store.toggleType(tc.type)"
            />
          </div>
        </div>

        <!-- Loading -->
        <div v-else-if="store.loading && store.notifications.length === 0" class="hub-notify-empty">
          <i
            class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop"
            style="font-size: 20px; color: #009688"
          />
          <span>{{ t("common.loading") }}</span>
        </div>

        <!-- Empty -->
        <div v-else-if="isEmpty" class="hub-notify-empty">
          <i class="layui-icon layui-icon-face-surprised" style="font-size: 36px; color: #d9d9d9" />
          <span>{{ t("notification.noNotifications") }}</span>
        </div>

        <!-- Notification list -->
        <div v-else class="hub-notify-list">
          <div
            v-for="n in filteredList"
            :key="n.id"
            class="hub-notify-item"
            :class="{ unread: !n.isRead }"
            @click="onClickNotification(n)"
          >
            <span class="hub-notify-item-icon" :class="n.type === 'member_new' ? 'new' : 'lost'">
              {{ n.type === "member_new" ? "+" : "−" }}
            </span>
            <div class="hub-notify-item-body">
              <div class="hub-notify-item-line1">
                <span class="hub-notify-item-agent-tag">{{ n.agentName || "—" }}</span>
                <span class="hub-notify-item-dash">{{ t("notification.agentSuffix") }}</span>
                <span class="hub-notify-item-verb"
                  >{{ n.type === "member_new" ? t("notification.justGot") : t("notification.justLost") }}
                  {{ t("notification.customer") }}</span
                >
              </div>
              <div class="hub-notify-item-line2">
                <strong class="hub-notify-item-username">{{ n.username }}</strong>
                <span v-if="n.money" class="hub-notify-item-money"
                  >{{ Number(n.money).toLocaleString("en-US") }} ₫</span
                >
                <span class="hub-notify-item-time">{{ formatDateTime(n.createdAt) }}</span>
                <a href="javascript:;" class="hub-notify-item-detail" @click="openDetail(n, $event)">{{
                  t("notification.memberDetailTitle")
                }}</a>
              </div>
            </div>
          </div>

          <!-- Load more -->
          <div v-if="store.hasMore" class="hub-notify-load-more">
            <button :disabled="store.loadingMore" @click.stop="store.loadMore()">
              {{
                store.loadingMore
                  ? t("common.loading")
                  : t("notification.loadMore", {
                      current: store.notifications.length,
                      total: store.totalCount,
                    })
              }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Member detail dialog -->
    <lay-layer
      v-model="detailVisible"
      :title="
        detailNotif
          ? (detailNotif.agentName ? detailNotif.agentName + ' › ' : '') + detailNotif.username
          : t('notification.memberDetailTitle')
      "
      :area="['440px', 'auto']"
      :shade-close="true"
      :move="true"
      @close="closeDetail"
    >
      <div v-if="detailNotif" class="hub-member-detail">
        <div v-if="memberLoading" class="hub-member-loading">
          <i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop" />
          {{ t("notification.memberDetailLoading") }}
        </div>

        <table v-if="memberInfo" class="hub-member-table">
          <tbody>
            <tr v-for="field in memberFields" :key="field.key">
              <td class="hub-member-label">
                {{ t(field.labelKey) }}
              </td>
              <td>
                <template v-if="field.key === 'username'">
                  <strong>{{ memberInfo[field.key] ?? "-" }}</strong>
                </template>
                <template
                  v-else-if="
                    field.key === 'money' || field.key === 'depositAmount' || field.key === 'withdrawalAmount'
                  "
                >
                  <span class="hub-member-money">{{
                    formatFieldValue(field.key, memberInfo[field.key])
                  }}</span>
                </template>
                <template v-else>
                  {{ formatFieldValue(field.key, memberInfo[field.key]) }}
                </template>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!memberLoading && !memberInfo" class="hub-member-empty">
          {{ t("notification.memberDetailEmpty") }}
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
  0% {
    transform: rotate(0);
  }
  15% {
    transform: rotate(14deg);
  }
  30% {
    transform: rotate(-12deg);
  }
  45% {
    transform: rotate(8deg);
  }
  60% {
    transform: rotate(-4deg);
  }
  100% {
    transform: rotate(0);
  }
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

/* === Dropdown panel === */
.hub-notify-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 460px;
  max-height: 520px;
  background: #fff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 999;
  display: flex;
  flex-direction: column;
}

/* Fade transition */
.hub-notify-fade-enter-active,
.hub-notify-fade-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.hub-notify-fade-enter-from,
.hub-notify-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* === Header === */
.hub-notify-header {
  padding: 10px 14px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.hub-notify-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* === Toolbar: filters + action buttons === */
.hub-notify-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.hub-notify-filters {
  display: flex;
  gap: 0;
}

.hub-notify-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #666;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.hub-notify-filter-btn:hover {
  color: #333;
  background: #fafafa;
}

.hub-notify-filter-btn.active {
  color: #009688;
  border-bottom-color: #009688;
  font-weight: 600;
}

.hub-notify-filter-count {
  display: inline-block;
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
}

/* === Action buttons === */
.hub-notify-actions {
  display: flex;
  gap: 3px;
}

.hub-notify-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  text-decoration: none;
  transition: all 0.15s;
  color: #666;
  background: #f0f0f0;
}

.hub-notify-action-btn .layui-icon {
  font-size: 14px;
}

.hub-notify-action-btn:hover,
.hub-notify-action-btn.active {
  background: #e0e0e0;
  color: #333;
}

.hub-notify-action-btn--primary {
  color: #fff;
  background: #1e9fff;
}
.hub-notify-action-btn--primary:hover {
  background: #1890e6;
  color: #fff;
}

.hub-notify-action-btn--warn {
  color: #fff;
  background: #ffb800;
}
.hub-notify-action-btn--warn:hover {
  background: #e6a600;
  color: #fff;
}

.hub-notify-action-btn--danger {
  color: #fff;
  background: #ff5722;
}
.hub-notify-action-btn--danger:hover {
  background: #e64a19;
  color: #fff;
}

/* === Settings === */
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
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.hub-notify-settings-row:last-child {
  border-bottom: none;
}

.hub-notify-settings-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.hub-notify-settings-icon {
  width: 20px;
  text-align: center;
  font-weight: 700;
  font-size: 14px;
  color: #666;
}

.hub-notify-settings-label {
  flex: 1;
  font-size: 13px;
  color: #333;
}

/* === Notification list === */
.hub-notify-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
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
  border-bottom: 1px dashed #ddd;
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
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
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

.hub-notify-item-line1 {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
}

.hub-notify-item-agent-tag {
  display: inline-block;
  padding: 0 5px;
  background: #e8f4fd;
  color: #1e9fff;
  font-weight: 600;
  font-size: 12px;
  border-radius: 2px;
  margin-right: 2px;
}

.hub-notify-item-dash {
  color: #999;
  font-size: 12px;
}

.hub-notify-item-verb {
  color: #555;
}

.hub-notify-item-line2 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hub-notify-item-username {
  font-size: 13px;
  color: #1a1a1a;
}

.hub-notify-item-money {
  font-weight: 700;
  color: #f59e0b;
  font-size: 13px;
}

.hub-notify-item-time {
  margin-left: auto;
  font-size: 11px;
  color: #aaa;
  white-space: nowrap;
}

.hub-notify-item-detail {
  font-size: 11px;
  color: #009688;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  white-space: nowrap;
}

.hub-notify-item-detail:hover {
  color: #00796b;
  text-decoration: underline;
}

/* === Load more === */
.hub-notify-load-more {
  display: flex;
  justify-content: center;
  padding: 10px 14px;
}

.hub-notify-load-more button {
  padding: 5px 16px;
  border: 1px solid #e0e0e0;
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
  flex: 1;
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

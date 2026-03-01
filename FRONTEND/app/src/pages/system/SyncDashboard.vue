<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { fetchSyncStatus, triggerSync } from "@/api/services/sync";
import { useAuthStore } from "@/stores/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { layer } from "@layui/layui-vue";

const authStore = useAuthStore();
const canWrite = computed(() => authStore.hasPermission(PERMISSIONS.SYNC_WRITE));

const loading = ref(true);
const triggering = ref(false);

// --- Data ---
const totalRows = ref(0);
const activeAgents = ref(0);
const totalAgents = ref(0);
const isSyncing = ref(false);
const intervalMs = ref(300000);

interface AgentChild {
  id: string;
  name: string;
  extUsername: string;
  rowCount: number;
  lastSyncedAt: string | null;
}

interface TableRow {
  id: string;
  table: string;
  label: string;
  icon: string;
  rowCount: number;
  lastSyncedAt: string | null;
  agentCount: number;
  children: AgentChild[];
}

interface AgentRow {
  id: string;
  name: string;
  extUsername: string;
  isActive: boolean;
  status: string;
  cookieExpires: string | null;
  totalRows: number;
}

const tables = ref<TableRow[]>([]);
const agents = ref<AgentRow[]>([]);
const expandKeys = ref<string[]>([]);

// --- Table columns (expandable) ---
const tableColumns = [
  { title: "Bảng dữ liệu", key: "label", customSlot: "label", width: "220px" },
  { title: "Tổng bản ghi", key: "rowCount", customSlot: "rowCount", width: "130px" },
  { title: "Đại lý đóng góp", key: "agentCount", customSlot: "agentCount", width: "130px" },
  { title: "Lần đồng bộ cuối", key: "lastSyncedAt", customSlot: "syncTime" },
  { title: "Độ tươi", key: "_freshness", customSlot: "freshness", width: "130px" },
];

// --- Agent table columns ---
const agentColumns = [
  { title: "Đại lý", key: "name", customSlot: "agentName", width: "180px" },
  { title: "Tài khoản", key: "extUsername", ellipsisTooltip: true },
  { title: "Trạng thái", key: "_status", customSlot: "agentStatus", width: "130px" },
  { title: "Cookie", key: "cookieExpires", customSlot: "cookieExp", width: "180px" },
  { title: "Tổng bản ghi", key: "totalRows", customSlot: "num", width: "130px" },
];

// --- Progress theme colors for agents (cycle through) ---
const PROGRESS_THEMES = ["green", "blue", "orange", "cyan", "red", "black"] as const;

function getProgressTheme(index: number): string {
  return PROGRESS_THEMES[index % PROGRESS_THEMES.length];
}

// Calculate percentage relative to the table's total
function getAgentPercent(agentRowCount: number, tableRowCount: number): number {
  if (!tableRowCount) return 0;
  return Math.round((agentRowCount / tableRowCount) * 100);
}

// --- Formatting helpers ---
function getMinutesSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 60000);
}

function getFreshnessColor(minutes: number | null): string {
  if (minutes === null) return "#999";
  if (minutes < 10) return "#16baaa";
  if (minutes < 30) return "#ffb800";
  return "#ff4d4f";
}

function getFreshnessText(minutes: number | null): string {
  if (minutes === null) return "Chưa sync";
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatNumber(n: number): string {
  return n.toLocaleString("vi-VN");
}

function isCookieExpired(dateStr: string | null): boolean {
  if (!dateStr) return true;
  return new Date(dateStr).getTime() < Date.now();
}

function isCookieExpiringSoon(dateStr: string | null): boolean {
  if (!dateStr) return true;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff < 24 * 60 * 60 * 1000;
}

function getCookieStatusColor(dateStr: string | null): string {
  if (!dateStr || isCookieExpired(dateStr)) return "#ff4d4f";
  if (isCookieExpiringSoon(dateStr)) return "#ffb800";
  return "#16baaa";
}

function getCookieStatusText(dateStr: string | null): string {
  if (!dateStr) return "Chưa cấu hình";
  if (isCookieExpired(dateStr)) return "Hết hạn";
  if (isCookieExpiringSoon(dateStr)) return "Sắp hết hạn";
  return formatDateTime(dateStr);
}

// --- Data loading ---
async function loadStatus() {
  try {
    const res = await fetchSyncStatus();
    if (res.data.success) {
      const d = res.data.data;
      totalRows.value = d.totalRows;
      activeAgents.value = d.activeAgents;
      totalAgents.value = d.totalAgents;
      isSyncing.value = d.isSyncing;
      intervalMs.value = d.intervalMs;
      tables.value = d.tables;
      agents.value = d.agents;
    }
  } catch {
    // silent
  } finally {
    loading.value = false;
  }
}

async function handleTrigger() {
  triggering.value = true;
  try {
    const res = await triggerSync();
    if (res.data.success) {
      layer.msg("Đã kích hoạt đồng bộ thủ công", { icon: 1 });
      isSyncing.value = true;
    } else {
      layer.msg(res.data.message || "Lỗi", { icon: 2 });
    }
  } catch {
    layer.msg("Lỗi khi kích hoạt đồng bộ", { icon: 2 });
  } finally {
    triggering.value = false;
  }
}

// --- Auto-refresh ---
let pollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  loadStatus();
  pollTimer = setInterval(loadStatus, 30000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <div class="sync-dashboard">
    <!-- ===== OVERVIEW CARDS ===== -->
    <lay-row :space="12">
      <lay-col :md="6">
        <lay-card class="stat-card">
          <div class="stat-icon-wrap bg-teal">
            <i class="layui-icon layui-icon-chart-screen"></i>
          </div>
          <div class="stat-info">
            <div class="stat-num">
              <lay-count-up :end-val="totalRows" :duration="800" :use-grouping="true" />
            </div>
            <div class="stat-desc">Tổng bản ghi</div>
          </div>
        </lay-card>
      </lay-col>
      <lay-col :md="6">
        <lay-card class="stat-card">
          <div class="stat-icon-wrap bg-blue">
            <i class="layui-icon layui-icon-group"></i>
          </div>
          <div class="stat-info">
            <div class="stat-num">
              {{ activeAgents }}<span class="stat-sub">/{{ totalAgents }}</span>
            </div>
            <div class="stat-desc">Agent hoạt động</div>
          </div>
        </lay-card>
      </lay-col>
      <lay-col :md="6">
        <lay-card class="stat-card">
          <div class="stat-icon-wrap bg-orange">
            <i class="layui-icon layui-icon-timer"></i>
          </div>
          <div class="stat-info">
            <div class="stat-num">{{ Math.round(intervalMs / 60000) }}<span class="stat-sub">phút</span></div>
            <div class="stat-desc">Chu kỳ đồng bộ</div>
          </div>
        </lay-card>
      </lay-col>
      <lay-col :md="6">
        <lay-card class="stat-card">
          <div class="stat-icon-wrap" :class="isSyncing ? 'bg-yellow pulse' : 'bg-green'">
            <i class="layui-icon" :class="isSyncing ? 'layui-icon-loading-1 spin' : 'layui-icon-ok-circle'"></i>
          </div>
          <div class="stat-info">
            <div class="stat-num">
              <lay-tag
                :color="isSyncing ? '#ffb800' : '#16baaa'"
                variant="light"
                size="sm"
                bordered
              >
                {{ isSyncing ? "Đang đồng bộ..." : "Sẵn sàng" }}
              </lay-tag>
            </div>
            <div v-if="canWrite" class="stat-trigger">
              <lay-button
                size="xs"
                type="normal"
                :loading="triggering"
                :disabled="isSyncing"
                @click="handleTrigger"
              >
                <i class="layui-icon layui-icon-refresh-1"></i> Đồng bộ ngay
              </lay-button>
            </div>
            <div v-else class="stat-desc">Trạng thái</div>
          </div>
        </lay-card>
      </lay-col>
    </lay-row>

    <!-- ===== EXPANDABLE TABLE: Click row → show per-agent progress bars ===== -->
    <lay-card style="margin-top: 12px">
      <lay-field title="Chi tiết đồng bộ theo bảng dữ liệu">
        <div class="table-container">
          <lay-table
            :columns="tableColumns"
            :data-source="tables"
            :loading="loading"
            :default-toolbar="true"
            v-model:expandKeys="expandKeys"
          >
            <template v-slot:toolbar>
              <lay-button size="sm" type="normal" @click="loadStatus">
                <i class="layui-icon layui-icon-refresh"></i> Làm mới
              </lay-button>
            </template>

            <!-- Label: icon + name -->
            <template #label="{ row }">
              <span class="table-label">
                <i class="layui-icon" :class="row.icon" style="margin-right: 6px; color: #009688;"></i>
                <b>{{ row.label }}</b>
                <span class="table-name">({{ row.table }})</span>
              </span>
            </template>

            <!-- Row count -->
            <template #rowCount="{ row }">
              <b>{{ formatNumber(row.rowCount) }}</b>
            </template>

            <!-- Agent count badge -->
            <template #agentCount="{ row }">
              <span class="agent-badge">
                <i class="layui-icon layui-icon-group" style="font-size: 12px; margin-right: 3px;"></i>
                {{ row.agentCount }} agent
              </span>
            </template>

            <!-- Last sync time -->
            <template #syncTime="{ row }">
              {{ formatDateTime(row.lastSyncedAt) }}
            </template>

            <!-- Freshness badge -->
            <template #freshness="{ row }">
              <lay-tag
                :color="getFreshnessColor(getMinutesSince(row.lastSyncedAt))"
                variant="light"
                size="sm"
                bordered
              >
                {{ getFreshnessText(getMinutesSince(row.lastSyncedAt)) }}
              </lay-tag>
            </template>

            <!-- EXPAND: Per-agent progress bars -->
            <template v-slot:expand="{ data }">
              <div class="expand-content">
                <div
                  v-for="(child, idx) in data.children"
                  :key="child.id"
                  class="expand-row"
                >
                  <lay-progress
                    :percent="getAgentPercent(child.rowCount, data.rowCount)"
                    :theme="getProgressTheme(idx)"
                    :show-text="true"
                    :text="`${child.name} — ${formatNumber(child.rowCount)} bản ghi`"
                  />
                </div>
                <div v-if="!data.children || data.children.length === 0" class="expand-empty">
                  Chưa có dữ liệu đồng bộ từ agent nào
                </div>
              </div>
            </template>
          </lay-table>
        </div>
      </lay-field>
    </lay-card>

    <!-- ===== AGENT TABLE ===== -->
    <lay-card style="margin-top: 12px">
      <lay-field title="Trạng thái đại lý">
        <div class="table-container">
          <lay-table
            :columns="agentColumns"
            :data-source="agents"
            :loading="loading"
            :default-toolbar="true"
          >
            <template v-slot:toolbar>
              <lay-button size="sm" type="normal">
                <b>{{ activeAgents }}/{{ totalAgents }} HOẠT ĐỘNG</b>
              </lay-button>
            </template>

            <!-- Agent name with icon -->
            <template #agentName="{ row }">
              <span class="agent-name-cell">
                <i
                  class="layui-icon"
                  :class="row.isActive && row.status === 'active' ? 'layui-icon-ok-circle' : 'layui-icon-close-fill'"
                  :style="{ color: row.isActive && row.status === 'active' ? '#16baaa' : '#ff4d4f', marginRight: '6px', fontSize: '14px' }"
                ></i>
                {{ row.name }}
              </span>
            </template>

            <!-- Agent status -->
            <template #agentStatus="{ row }">
              <lay-tag
                :color="row.isActive && row.status === 'active' ? '#16baaa' : '#ff4d4f'"
                variant="light"
                size="sm"
                bordered
              >
                {{ row.isActive && row.status === "active" ? "Hoạt động" : "Tắt" }}
              </lay-tag>
            </template>

            <!-- Cookie expiry -->
            <template #cookieExp="{ row }">
              <lay-tag
                :color="getCookieStatusColor(row.cookieExpires)"
                variant="light"
                size="sm"
                bordered
              >
                {{ getCookieStatusText(row.cookieExpires) }}
              </lay-tag>
            </template>

            <!-- Number -->
            <template #num="{ row, column }">
              <lay-count-up
                :end-val="Number(row[column.key]) || 0"
                :duration="600"
                :use-grouping="true"
              />
            </template>
          </lay-table>
        </div>
      </lay-field>
    </lay-card>

    <!-- ===== AUTO-REFRESH ===== -->
    <div class="auto-refresh-note">
      <i class="layui-icon layui-icon-refresh-1"></i>
      Tự động cập nhật mỗi 30 giây
    </div>
  </div>
</template>

<style scoped>
.sync-dashboard {
  padding: 0;
}

/* ===== STAT CARDS ===== */
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px !important;
  min-height: 80px;
}

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-wrap .layui-icon {
  font-size: 24px;
  color: #fff;
}

.bg-teal { background: linear-gradient(135deg, #16baaa, #1cc7b6); }
.bg-blue { background: linear-gradient(135deg, #1e9fff, #4db8ff); }
.bg-orange { background: linear-gradient(135deg, #ffb800, #ffc833); }
.bg-green { background: linear-gradient(135deg, #16baaa, #5cd7ca); }
.bg-yellow { background: linear-gradient(135deg, #ffb800, #ffe066); }

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
}

.stat-sub {
  font-size: 13px;
  font-weight: 400;
  color: #999;
  margin-left: 2px;
}

.stat-desc {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.stat-trigger {
  margin-top: 6px;
}

.pulse {
  animation: pulse-ring 1.5s ease-in-out infinite;
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(255, 184, 0, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(255, 184, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 184, 0, 0); }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ===== TABLE ===== */
.table-container {
  margin-top: 8px;
}

.table-label {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
}

.table-name {
  color: #bbb;
  font-size: 11px;
  margin-left: 6px;
  font-weight: 400;
}

.agent-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f0f9f8;
  color: #16baaa;
  font-size: 12px;
  font-weight: 500;
}

/* ===== EXPAND CONTENT: Progress bars per agent ===== */
.expand-content {
  width: 100%;
  padding: 4px 20px 16px 0;
}

.expand-content .expand-row {
  margin-top: 18px;
}

.expand-content .expand-row:first-child {
  margin-top: 8px;
}

.expand-empty {
  padding: 12px 0;
  text-align: center;
  color: #bbb;
  font-size: 12px;
}

/* ===== AGENT TABLE ===== */
.agent-name-cell {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
}

/* ===== FOOTER ===== */
.auto-refresh-note {
  text-align: center;
  padding: 12px 0 4px;
  font-size: 12px;
  color: #bbb;
}

.auto-refresh-note .layui-icon {
  font-size: 12px;
  margin-right: 4px;
}
</style>

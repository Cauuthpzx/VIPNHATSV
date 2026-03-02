<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { fetchSyncStatus, triggerSync, triggerAgentSync, purgeAllData, purgeAgentData } from "@/api/services/sync";
import { useAuthStore } from "@/stores/auth";
import { useAgentStore } from "@/stores/agent";
import { PERMISSIONS } from "@/constants/permissions";
import { layer } from "@layui/layui-vue";

const authStore = useAuthStore();
const agentStore = useAgentStore();
const canWrite = computed(() => authStore.hasPermission(PERMISSIONS.SYNC_WRITE));

const loading = ref(true);
const triggering = ref(false);
const syncingAgentId = ref<string | null>(null);
const purgingAgentId = ref<string | null>(null);
const purgingAll = ref(false);

const totalRows = ref(0);
const activeAgents = ref(0);
const totalAgents = ref(0);
const isSyncing = ref(false);
const intervalMs = ref(300000);
const tables = ref<any[]>([]);
const agents = ref<any[]>([]);
const expandKeys = ref<string[]>([]);

const agentColumns = computed(() => [
  { title: "Đại lý / Dữ liệu", key: "name", customSlot: "agentName", width: "220px" },
  { title: "Tài khoản", key: "extUsername", ellipsisTooltip: true },
  { title: "Trạng thái", key: "_status", customSlot: "agentStatus", width: "130px" },
  { title: "Cookie", key: "cookieExpires", customSlot: "cookieExp", width: "180px" },
  { title: "Bản ghi", key: "totalRows", customSlot: "num", width: "120px" },
  { title: "Đồng bộ lần cuối", key: "lastSyncedAt", customSlot: "syncTime", width: "170px" },
  ...(canWrite.value ? [{ title: "Thao tác", key: "_actions", customSlot: "actions", width: "160px", align: "center" }] : []),
]);

function getCookieStatusColor(agentId: string): string {
  const alive = agentStore.cookieHealthMap[agentId];
  if (alive === undefined) return "#999";
  return alive ? "#16baaa" : "#ff4d4f";
}

function getCookieStatusText(agentId: string): string {
  const alive = agentStore.cookieHealthMap[agentId];
  if (alive === undefined) return "Đang kiểm tra...";
  return alive ? "Hoạt động" : "Hết hạn";
}

// Accordion: chỉ cho expand 1 agent tại 1 thời điểm
let lastExpandKey: string | null = null;
watch(expandKeys, (keys) => {
  if (keys.length > 1) {
    const newKey = keys.find((k) => k !== lastExpandKey) ?? keys[keys.length - 1];
    expandKeys.value = [newKey];
    lastExpandKey = newKey;
  } else {
    lastExpandKey = keys[0] ?? null;
  }
}, { deep: true });

function getLatestSync(children: any[]): string | null {
  let latest: number | null = null;
  for (const c of children) {
    if (c.lastSyncedAt) {
      const t = new Date(c.lastSyncedAt).getTime();
      if (latest === null || t > latest) latest = t;
    }
  }
  return latest ? new Date(latest).toISOString() : null;
}

async function loadStatus() {
  try {
    const [statusRes] = await Promise.all([
      fetchSyncStatus(),
      agentStore.loadCookieHealth(),
    ]);
    if (statusRes.data.success) {
      const d = statusRes.data.data;
      totalRows.value = d.totalRows;
      activeAgents.value = d.activeAgents;
      totalAgents.value = d.totalAgents;
      isSyncing.value = d.isSyncing;
      intervalMs.value = d.intervalMs;
      tables.value = d.tables;
      agents.value = d.agents.map((a: any) => {
        const filtered = (a.children ?? []).filter((c: any) => c.rowCount > 0);
        return {
          ...a,
          lastSyncedAt: getLatestSync(a.children ?? []),
          // Chỉ gán children khi có data, nếu không lay-table sẽ hiện expand icon rỗng
          ...(filtered.length > 0 ? { children: filtered } : {}),
        };
      });
    }
  } catch {
    // silent
  } finally {
    loading.value = false;
  }
}

// ---- Actions ----

async function handleSyncAll() {
  triggering.value = true;
  try {
    const res = await triggerSync();
    if (res.data.success) {
      layer.msg("Đã kích hoạt đồng bộ tất cả", { icon: 1 });
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

async function handleSyncAgent(agentId: string) {
  syncingAgentId.value = agentId;
  try {
    const res = await triggerAgentSync(agentId);
    if (res.data.success) {
      layer.msg("Đã kích hoạt đồng bộ đại lý", { icon: 1 });
      isSyncing.value = true;
    } else {
      layer.msg(res.data.message || "Lỗi", { icon: 2 });
    }
  } catch {
    layer.msg("Lỗi khi kích hoạt đồng bộ đại lý", { icon: 2 });
  } finally {
    syncingAgentId.value = null;
  }
}

function confirmPurgeAll() {
  layer.confirm(
    "Bạn có chắc muốn <b style='color:#ff4d4f'>xóa TẤT CẢ</b> dữ liệu đồng bộ?<br>Hành động này không thể hoàn tác.",
    {
      title: "Xác nhận xóa tất cả",
      isHtmlContent: true,
      btn: [
        { text: "Xóa tất cả", callback: (id: string) => { layer.close(id); doPurgeAll(); } },
        { text: "Hủy" },
      ],
    },
  );
}

async function doPurgeAll() {
  purgingAll.value = true;
  try {
    const res = await purgeAllData();
    if (res.data.success) {
      layer.msg("Đã xóa tất cả dữ liệu", { icon: 1 });
      await loadStatus();
    } else {
      layer.msg(res.data.message || "Lỗi", { icon: 2 });
    }
  } catch {
    layer.msg("Lỗi khi xóa dữ liệu", { icon: 2 });
  } finally {
    purgingAll.value = false;
  }
}

function confirmPurgeAgent(agentId: string, agentName: string) {
  layer.confirm(
    `Bạn có chắc muốn <b style='color:#ff4d4f'>xóa dữ liệu</b> của đại lý <b>${agentName}</b>?<br>Hành động này không thể hoàn tác.`,
    {
      title: "Xác nhận xóa dữ liệu đại lý",
      isHtmlContent: true,
      btn: [
        { text: "Xóa", callback: (id: string) => { layer.close(id); doPurgeAgent(agentId); } },
        { text: "Hủy" },
      ],
    },
  );
}

async function doPurgeAgent(agentId: string) {
  purgingAgentId.value = agentId;
  try {
    const res = await purgeAgentData(agentId);
    if (res.data.success) {
      layer.msg("Đã xóa dữ liệu đại lý", { icon: 1 });
      await loadStatus();
    } else {
      layer.msg(res.data.message || "Lỗi", { icon: 2 });
    }
  } catch {
    layer.msg("Lỗi khi xóa dữ liệu đại lý", { icon: 2 });
  } finally {
    purgingAgentId.value = null;
  }
}

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
            <div class="stat-desc">Trạng thái</div>
          </div>
        </lay-card>
      </lay-col>
    </lay-row>

    <!-- ===== AGENT TABLE ===== -->
    <lay-card style="margin-top: 12px">
      <lay-field title="Trạng thái đại lý">
        <div class="table-container">
          <lay-table
            :columns="agentColumns"
            :data-source="agents"
            :loading="loading"
            :default-toolbar="true"
            childrenColumnName="children"
            :indentSize="20"
            v-model:expandKeys="expandKeys"
          >
            <template v-slot:toolbar>
              <lay-button size="sm" type="normal">
                <b>{{ activeAgents }}/{{ totalAgents }} HOẠT ĐỘNG</b>
              </lay-button>
              <template v-if="canWrite">
                <lay-button
                  size="sm"
                  type="normal"
                  :loading="triggering"
                  :disabled="isSyncing"
                  @click="handleSyncAll"
                >
                  <i class="layui-icon layui-icon-refresh-1"></i> Đồng bộ tất cả
                </lay-button>
                <lay-button
                  size="sm"
                  type="warm"
                  :loading="purgingAll"
                  :disabled="isSyncing"
                  @click="confirmPurgeAll"
                >
                  <i class="layui-icon layui-icon-delete"></i> Xóa tất cả DB
                </lay-button>
              </template>
            </template>

            <template #agentName="{ row }">
              <!-- Child row: table label with icon -->
              <span v-if="row.icon" class="agent-name-cell" style="color: #666">
                <i class="layui-icon" :class="row.icon" style="margin-right: 6px; font-size: 14px; color: #999"></i>
                {{ row.name }}
              </span>
              <!-- Parent row: agent name with status icon -->
              <span v-else class="agent-name-cell">
                <i
                  class="layui-icon"
                  :class="row.isActive && row.status === 'active' ? 'layui-icon-ok-circle' : 'layui-icon-close-fill'"
                  :style="{ color: row.isActive && row.status === 'active' ? '#16baaa' : '#ff4d4f', marginRight: '6px', fontSize: '14px' }"
                ></i>
                <b>{{ row.name }}</b>
              </span>
            </template>

            <template #agentStatus="{ row }">
              <template v-if="!row.icon">
                <lay-tag
                  :color="row.isActive && row.status === 'active' ? '#16baaa' : '#ff4d4f'"
                  variant="light"
                  size="sm"
                  bordered
                >
                  {{ row.isActive && row.status === "active" ? "Hoạt động" : "Tắt" }}
                </lay-tag>
              </template>
            </template>

            <template #cookieExp="{ row }">
              <template v-if="!row.icon">
                <lay-tag
                  :color="getCookieStatusColor(row.id)"
                  variant="light"
                  size="sm"
                  bordered
                >
                  {{ getCookieStatusText(row.id) }}
                </lay-tag>
              </template>
            </template>

            <template #num="{ row }">
              <lay-count-up
                :end-val="Number(row.rowCount ?? row.totalRows) || 0"
                :duration="600"
                :use-grouping="true"
              />
            </template>

            <template #syncTime="{ row }">
              <span v-if="row.lastSyncedAt" style="font-size: 12px; color: #666">
                {{ new Date(row.lastSyncedAt).toLocaleString("vi-VN", {
                  month: "2-digit", day: "2-digit",
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                }) }}
              </span>
              <span v-else style="color: #ccc">—</span>
            </template>

            <template #actions="{ row }">
              <!-- Only show actions for parent (agent) rows, not children -->
              <template v-if="!row.icon">
                <div class="action-btns">
                  <lay-button
                    size="xs"
                    type="normal"
                    :loading="syncingAgentId === row.id"
                    :disabled="isSyncing"
                    @click="handleSyncAgent(row.id)"
                  >
                    <i class="layui-icon layui-icon-refresh-1"></i> Sync
                  </lay-button>
                  <lay-button
                    size="xs"
                    type="warm"
                    :loading="purgingAgentId === row.id"
                    :disabled="isSyncing"
                    @click="confirmPurgeAgent(row.id, row.name)"
                  >
                    <i class="layui-icon layui-icon-delete"></i> Xóa
                  </lay-button>
                </div>
              </template>
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

.table-container {
  margin-top: 8px;
}

.agent-name-cell {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
}

.action-btns {
  display: flex;
  gap: 4px;
  justify-content: center;
}

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

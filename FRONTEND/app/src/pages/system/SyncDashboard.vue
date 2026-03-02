<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { fetchSyncStatus, triggerSync } from "@/api/services/sync";
import { useAuthStore } from "@/stores/auth";
import { useAgentStore } from "@/stores/agent";
import { PERMISSIONS } from "@/constants/permissions";
import { layer } from "@layui/layui-vue";

const authStore = useAuthStore();
const agentStore = useAgentStore();
const canWrite = computed(() => authStore.hasPermission(PERMISSIONS.SYNC_WRITE));

const loading = ref(true);
const triggering = ref(false);

const totalRows = ref(0);
const activeAgents = ref(0);
const totalAgents = ref(0);
const isSyncing = ref(false);
const intervalMs = ref(300000);
const tables = ref<any[]>([]);
const agents = ref<any[]>([]);
const expandKeys = ref<string[]>([]);

const agentColumns = [
  { title: "Đại lý / Dữ liệu", key: "name", customSlot: "agentName", width: "220px" },
  { title: "Tài khoản", key: "extUsername", ellipsisTooltip: true },
  { title: "Trạng thái", key: "_status", customSlot: "agentStatus", width: "130px" },
  { title: "Cookie", key: "cookieExpires", customSlot: "cookieExp", width: "180px" },
  { title: "Bản ghi", key: "totalRows", customSlot: "num", width: "120px" },
  { title: "Đồng bộ lần cuối", key: "lastSyncedAt", customSlot: "syncTime", width: "170px" },
];

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

.table-container {
  margin-top: 8px;
}

.agent-name-cell {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
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

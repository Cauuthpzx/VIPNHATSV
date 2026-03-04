<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  fetchSyncStatus,
  triggerSync,
  triggerAgentSync,
  triggerAgentEndpointSync,
  stopSync,
  setSyncIntervals,
  purgeAllData,
  purgeAgentData,
} from "@/api/services/sync";
import {
  loginAgentEE88,
  logoutAgentEE88,
  loginAllAgentsEE88,
  createAgent,
  updateAgent,
  deleteAgent,
  editUpstreamPassword,
} from "@/api/services/proxy";
import { useAuthStore } from "@/stores/auth";
import { useAgentStore } from "@/stores/agent";
import { useWsBus } from "@/composables/useWsBus";
import { useToolbarPermission } from "@/composables/useToolbarPermission";
import { PERMISSIONS } from "@/constants/permissions";
import { layer } from "@layui/layui-vue";
import { useDateRange } from "@/composables/useDateRange";

const { t } = useI18n();
const authStore = useAuthStore();
const agentStore = useAgentStore();
const { defaultToolbar } = useToolbarPermission();
const canWrite = computed(() => authStore.hasPermission(PERMISSIONS.SYNC_WRITE));

// Date range picker cho sync
const {
  dateRange: syncDateRange,
  dateQuickSelect,
  dateQuickOptions,
  dateQuickWidth,
} = useDateRange("thisMonth");

/** Parsed start/end dates from date range picker — undefined if not set */
const syncStartDate = computed(() => syncDateRange.value?.[0] || undefined);
const syncEndDate = computed(() => syncDateRange.value?.[1] || undefined);

const loading = ref(true);
const triggering = ref(false);
const stopping = ref(false);
const syncingAgentId = ref<string | null>(null);
const syncingEndpointKey = ref<string | null>(null); // "agentId__table" format
const purgingAgentId = ref<string | null>(null);
const purgingAll = ref(false);
const loggingInAgentId = ref<string | null>(null);
const loggingOutAgentId = ref<string | null>(null);
const loggingInAll = ref(false);

const totalRows = ref(0);
const activeAgents = ref(0);
const totalAgents = ref(0);
const isSyncing = ref(false);
const intervalMs = ref(300000);
const intervals = ref<Record<string, number>>({});
const tables = ref<any[]>([]);
const agents = ref<any[]>([]);

// Map endpoint table → label i18n
const ENDPOINT_LABELS = computed<Record<string, string>>(() => ({
  proxyUser: t("sync.endpointUsers"),
  proxyDeposit: t("sync.endpointDeposit"),
  proxyWithdrawal: t("sync.endpointWithdraw"),
  proxyBet: t("sync.endpointBetLottery"),
  proxyBetOrder: t("sync.endpointBetThird"),
  proxyReportLottery: t("sync.endpointReportLottery"),
  proxyReportFunds: t("sync.endpointReportFunds"),
  proxyReportThirdGame: t("sync.endpointReportThird"),
}));
const expandKeys = ref<string[]>([]);

// --- Agent CRUD modal ---
const agentModalVisible = ref(false);
const agentModalTitle = ref("");
const agentSaving = ref(false);
const editingAgentId = ref<string | null>(null);
const agentForm = reactive({
  name: "",
  extUsername: "",
  extPassword: "",
  baseUrl: "",
});

function openCreateAgent() {
  editingAgentId.value = null;
  agentModalTitle.value = t("sync.addAgentTitle");
  agentForm.name = "";
  agentForm.extUsername = "";
  agentForm.extPassword = "";
  agentForm.baseUrl = "";
  agentModalVisible.value = true;
}

function openEditAgent(row: any) {
  editingAgentId.value = row.id;
  agentModalTitle.value = t("sync.editAgentTitle", { name: row.name });
  agentForm.name = row.name || "";
  agentForm.extUsername = row.extUsername || "";
  agentForm.extPassword = "";
  agentForm.baseUrl = row.baseUrl || "";
  agentModalVisible.value = true;
}

async function saveAgent() {
  if (!agentForm.name.trim()) {
    layer.msg(t("sync.enterAgentName"), { icon: 0 });
    return;
  }
  agentSaving.value = true;
  try {
    if (editingAgentId.value) {
      // Update
      const data: Record<string, any> = { name: agentForm.name };
      if (agentForm.extPassword) data.extPassword = agentForm.extPassword;
      if (agentForm.baseUrl) data.baseUrl = agentForm.baseUrl;
      else data.baseUrl = null;
      await updateAgent(editingAgentId.value, data);
      layer.msg(t("sync.agentUpdated"), { icon: 1 });
    } else {
      // Create
      if (!agentForm.extUsername.trim() || !agentForm.extPassword.trim()) {
        layer.msg(t("sync.usernamePasswordRequired"), { icon: 0 });
        agentSaving.value = false;
        return;
      }
      await createAgent({
        name: agentForm.name,
        extUsername: agentForm.extUsername,
        extPassword: agentForm.extPassword,
        baseUrl: agentForm.baseUrl || undefined,
      });
      layer.msg(t("sync.agentCreated"), { icon: 1 });
    }
    agentModalVisible.value = false;
    await loadStatus();
    await agentStore.loadAgents();
  } catch (err: any) {
    const msg = err?.response?.data?.message || t("sync.agentSaveError");
    layer.msg(msg, { icon: 2 });
  } finally {
    agentSaving.value = false;
  }
}

// --- Đổi mật khẩu đại lý modal ---
const pwModalVisible = ref(false);
const pwModalAgentName = ref("");
const pwSaving = ref(false);
const pwForm = reactive({
  agentId: "",
  old_password: "",
  new_password: "",
  confirm_password: "",
});

function openChangePassword(row: any) {
  pwForm.agentId = row.id;
  pwForm.old_password = "";
  pwForm.new_password = "";
  pwForm.confirm_password = "";
  pwModalAgentName.value = row.name;
  pwModalVisible.value = true;
}

async function submitChangePassword() {
  if (!pwForm.old_password) {
    layer.msg(t("sync.enterOldPassword"), { icon: 0 });
    return;
  }
  if (!pwForm.new_password || pwForm.new_password.length < 6) {
    layer.msg(t("sync.passwordMinLength"), { icon: 0 });
    return;
  }
  if (pwForm.new_password !== pwForm.confirm_password) {
    layer.msg(t("sync.passwordMismatch"), { icon: 0 });
    return;
  }
  pwSaving.value = true;
  try {
    await editUpstreamPassword({
      agentId: pwForm.agentId,
      old_password: pwForm.old_password,
      new_password: pwForm.new_password,
      confirm_password: pwForm.confirm_password,
    });
    layer.msg(t("sync.passwordChangeSuccess"), { icon: 1 });
    pwModalVisible.value = false;
  } catch (err: any) {
    const msg = err?.response?.data?.message || t("sync.passwordChangeError");
    layer.msg(msg, { icon: 2 });
  } finally {
    pwSaving.value = false;
  }
}

function confirmDeleteAgent(agentId: string, agentName: string) {
  layer.confirm(t("sync.confirmDisable", { name: agentName }), {
    title: t("sync.confirmDisableTitle"),

    btn: [
      {
        text: t("sync.confirmDisableBtn"),
        callback: (id: string) => {
          layer.close(id);
          doDeleteAgent(agentId);
        },
      },
      {
        text: t("common.cancel"),
        callback: (id: string) => {
          layer.close(id);
        },
      },
    ],
  });
}

async function doDeleteAgent(agentId: string) {
  try {
    await deleteAgent(agentId, "deactivate");
    layer.msg(t("sync.disabledSuccess"), { icon: 1 });
    await loadStatus();
    await agentStore.loadAgents();
  } catch (err: any) {
    const msg = err?.response?.data?.message || t("sync.disabledError");
    layer.msg(msg, { icon: 2 });
  }
}

const agentColumns = computed(() => [
  { title: t("sync.colAgentData"), key: "name", customSlot: "agentName", width: "180px" },
  { title: t("sync.colAccount"), key: "extUsername", ellipsisTooltip: true, width: "120px" },
  { title: t("sync.overviewStatus"), key: "_status", customSlot: "agentStatus", width: "120px" },
  { title: t("sync.colRecords"), key: "totalRows", customSlot: "num", width: "80px" },
  { title: t("sync.colLastSync"), key: "lastSyncedAt", customSlot: "syncTime", width: "130px" },
  ...(canWrite.value
    ? [
        {
          title: t("common.actions"),
          key: "_actions",
          customSlot: "actions",
          width: "140px",
          align: "center",
        },
      ]
    : []),
]);

const statusMap = computed<Record<string, { color: string; label: string }>>(() => ({
  active: { color: "#16baaa", label: t("sync.statusActive") },
  online: { color: "#16baaa", label: t("sync.statusActive") },
  logging_in: { color: "#ffb800", label: t("sync.statusLogging") },
  offline: { color: "#999", label: t("sync.statusOffline") },
  error: { color: "#ff4d4f", label: t("sync.statusError") },
}));

function getAgentStatusColor(row: any): string {
  if (!row.isActive) return "#999";
  // Nếu status active nhưng cookie hết hạn → hiện warning
  if (row.status === "active" || row.status === "online") {
    const alive = agentStore.cookieHealthMap[row.id];
    if (alive === false) return "#ff4d4f";
  }
  return statusMap.value[row.status]?.color || "#999";
}

function getAgentStatusLabel(row: any): string {
  if (!row.isActive) return t("sync.statusDisabled");
  // Gộp cookie health vào status
  if (row.status === "active" || row.status === "online") {
    const alive = agentStore.cookieHealthMap[row.id];
    if (alive === false) return t("sync.statusExpired");
    if (alive === undefined) return t("sync.statusChecking");
  }
  return statusMap.value[row.status]?.label || row.status;
}

// Accordion: chỉ cho expand 1 agent tại 1 thời điểm
let lastExpandKey: string | null = null;
watch(
  expandKeys,
  (keys) => {
    if (keys.length > 1) {
      const newKey = keys.find((k) => k !== lastExpandKey) ?? keys[keys.length - 1];
      expandKeys.value = [newKey];
      lastExpandKey = newKey;
    } else {
      lastExpandKey = keys[0] ?? null;
    }
  },
  { deep: true },
);

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

/** Fingerprint để so sánh xem data có thay đổi không — tránh re-render không cần thiết */
let lastFingerprint = "";

async function loadStatus() {
  try {
    const [statusRes] = await Promise.all([fetchSyncStatus(), agentStore.loadCookieHealth()]);
    if (statusRes.data.success) {
      const d = statusRes.data.data;

      // Tạo fingerprint từ các giá trị quan trọng
      const fp = `${d.totalRows}|${d.isSyncing}|${d.activeAgents}|${d.agents.map((a: any) => `${a.id}:${a.totalRows}:${a.status}`).join(",")}`;

      // Luôn cập nhật trạng thái syncing (nhẹ, không gây re-render bảng)
      isSyncing.value = d.isSyncing;
      intervalMs.value = d.intervalMs;
      if (d.intervals) intervals.value = d.intervals;

      // Khi đang sync → luôn cập nhật (hiển thị realtime). Khi idle → chỉ khi data thay đổi
      if (fp !== lastFingerprint || d.isSyncing) {
        lastFingerprint = fp;
        totalRows.value = d.totalRows;
        activeAgents.value = d.activeAgents;
        totalAgents.value = d.totalAgents;
        tables.value = d.tables;
        agents.value = d.agents.map((a: any) => ({
          ...a,
          lastSyncedAt: getLatestSync(a.children ?? []),
          children: a.children ?? [],
        }));
      }
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
    const res = await triggerSync(syncStartDate.value, syncEndDate.value);
    if (res.data.success) {
      layer.msg(t("sync.syncAllTriggered"), { icon: 1 });
      isSyncing.value = true;
    } else {
      layer.msg(res.data.message || t("common.errorLoad"), { icon: 2 });
    }
  } catch {
    layer.msg(t("sync.syncAllError"), { icon: 2 });
  } finally {
    triggering.value = false;
  }
}

async function handleStopSync() {
  stopping.value = true;
  try {
    const res = await stopSync();
    if (res.data.success) {
      layer.msg(t("sync.syncStopRequested"), { icon: 1 });
    } else {
      layer.msg(res.data.message || t("sync.statusError"), { icon: 2 });
    }
  } catch {
    layer.msg(t("sync.syncStopError"), { icon: 2 });
  } finally {
    stopping.value = false;
  }
}

// --- Cài đặt chu kỳ đồng bộ (per-endpoint) ---
const intervalEditing = ref(false);
const intervalInputs = ref<Record<string, number>>({});
const intervalSaving = ref(false);

function openIntervalEdit() {
  // Copy current intervals → form inputs (convert ms → phút)
  const inputs: Record<string, number> = {};
  for (const [table, ms] of Object.entries(intervals.value)) {
    inputs[table] = Math.round(ms / 60000);
  }
  intervalInputs.value = inputs;
  intervalEditing.value = true;
}

async function saveIntervals() {
  // Convert phút → ms
  const payload: Record<string, number> = {};
  for (const [table, minutes] of Object.entries(intervalInputs.value)) {
    const ms = minutes * 60000;
    if (ms < 30000) {
      const label = ENDPOINT_LABELS.value[table] || table;
      layer.msg(t("sync.intervalMin", { label }), { icon: 0 });
      return;
    }
    payload[table] = ms;
  }
  intervalSaving.value = true;
  try {
    const res = await setSyncIntervals(payload);
    if (res.data.success) {
      if (res.data.data?.intervals) {
        intervals.value = res.data.data.intervals;
      }
      layer.msg(t("sync.intervalUpdated"), { icon: 1 });
      intervalEditing.value = false;
    } else {
      layer.msg(res.data.message || t("common.errorLoad"), { icon: 2 });
    }
  } catch {
    layer.msg(t("sync.intervalUpdateError"), { icon: 2 });
  } finally {
    intervalSaving.value = false;
  }
}

async function handleSyncAgent(agentId: string) {
  syncingAgentId.value = agentId;
  try {
    const res = await triggerAgentSync(agentId, syncStartDate.value, syncEndDate.value);
    if (res.data.success) {
      layer.msg(t("sync.syncAgentTriggered"), { icon: 1 });
      isSyncing.value = true;
    } else {
      layer.msg(res.data.message || t("common.errorLoad"), { icon: 2 });
    }
  } catch {
    layer.msg(t("sync.syncAgentError"), { icon: 2 });
  } finally {
    syncingAgentId.value = null;
  }
}

async function handleSyncAgentEndpoint(agentId: string, table: string, label: string) {
  const key = `${agentId}__${table}`;
  syncingEndpointKey.value = key;
  try {
    const res = await triggerAgentEndpointSync(agentId, table, syncStartDate.value, syncEndDate.value);
    if (res.data.success) {
      layer.msg(t("sync.syncEndpointTriggered", { label }), { icon: 1 });
      isSyncing.value = true;
    } else {
      layer.msg(res.data.message || t("common.errorLoad"), { icon: 2 });
    }
  } catch {
    layer.msg(t("sync.syncEndpointError"), { icon: 2 });
  } finally {
    syncingEndpointKey.value = null;
  }
}

function confirmPurgeAll() {
  layer.confirm(t("sync.confirmDeleteAll"), {
    title: t("sync.confirmDeleteAllTitle"),

    btn: [
      {
        text: t("sync.confirmDeleteAllBtn"),
        callback: (id: string) => {
          layer.close(id);
          doPurgeAll();
        },
      },
      {
        text: t("common.cancel"),
        callback: (id: string) => {
          layer.close(id);
        },
      },
    ],
  });
}

async function doPurgeAll() {
  purgingAll.value = true;
  try {
    const res = await purgeAllData();
    if (res.data.success) {
      layer.msg(t("sync.deleteAllSuccess"), { icon: 1 });
      await loadStatus();
    } else {
      layer.msg(res.data.message || t("common.errorLoad"), { icon: 2 });
    }
  } catch {
    layer.msg(t("sync.deleteAllError"), { icon: 2 });
  } finally {
    purgingAll.value = false;
  }
}

function confirmPurgeAgent(agentId: string, agentName: string) {
  layer.confirm(t("sync.confirmDeleteAgent", { name: agentName }), {
    title: t("sync.confirmDeleteAgentTitle"),

    btn: [
      {
        text: t("common.delete"),
        callback: (id: string) => {
          layer.close(id);
          doPurgeAgent(agentId);
        },
      },
      {
        text: t("common.cancel"),
        callback: (id: string) => {
          layer.close(id);
        },
      },
    ],
  });
}

async function doPurgeAgent(agentId: string) {
  purgingAgentId.value = agentId;
  try {
    const res = await purgeAgentData(agentId);
    if (res.data.success) {
      layer.msg(t("sync.deleteAgentSuccess"), { icon: 1 });
      await loadStatus();
    } else {
      layer.msg(res.data.message || t("common.errorLoad"), { icon: 2 });
    }
  } catch {
    layer.msg(t("sync.deleteAgentError"), { icon: 2 });
  } finally {
    purgingAgentId.value = null;
  }
}

// ---- EE88 Login/Logout ----

async function handleLoginAgent(agentId: string) {
  loggingInAgentId.value = agentId;
  try {
    const res = await loginAgentEE88(agentId);
    if (res.data.success) {
      layer.msg(t("sync.loginSuccess"), { icon: 1 });
      await loadStatus();
    } else {
      layer.msg(res.data.message || t("sync.loginError"), { icon: 2 });
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || t("sync.loginAgentError");
    layer.msg(msg, { icon: 2 });
  } finally {
    loggingInAgentId.value = null;
  }
}

async function handleLogoutAgent(agentId: string) {
  loggingOutAgentId.value = agentId;
  try {
    const res = await logoutAgentEE88(agentId);
    if (res.data.success) {
      layer.msg(t("sync.logoutSuccess"), { icon: 1 });
      await loadStatus();
    } else {
      layer.msg(res.data.message || t("sync.logoutError"), { icon: 2 });
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || t("sync.logoutAgentError");
    layer.msg(msg, { icon: 2 });
  } finally {
    loggingOutAgentId.value = null;
  }
}

async function handleLoginAll() {
  loggingInAll.value = true;
  try {
    const res = await loginAllAgentsEE88();
    if (res.data.success) {
      const d = res.data.data;
      layer.msg(t("sync.loginAllResult", { success: d.success, total: d.total }), { icon: 1 });
      await loadStatus();
    } else {
      layer.msg(res.data.message || t("common.errorLoad"), { icon: 2 });
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || t("sync.loginAllError");
    layer.msg(msg, { icon: 2 });
  } finally {
    loggingInAll.value = false;
  }
}

// ---- WebSocket push: nhận sync events → debounce loadStatus ----
const wsBus = useWsBus();
let wsUnsubs: (() => void)[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounce loadStatus — gom nhiều WS events trong 1.5s thành 1 lần fetch */
function debouncedLoadStatus() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => loadStatus(), 1500);
}

function onSyncStatus(data: any) {
  // Cập nhật trạng thái sync ngay lập tức (không cần debounce)
  if (data.status === "started") {
    isSyncing.value = true;
  } else if (data.status === "completed" || data.status === "aborted") {
    isSyncing.value = false;
    loadStatus(); // Load full status khi sync kết thúc
  }
}

// ---- Polling 30s fallback (phòng WS mất kết nối) ----
let pollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  loadStatus();
  pollTimer = setInterval(loadStatus, 30000);

  // Subscribe WS events
  wsUnsubs.push(wsBus.on("sync_progress", debouncedLoadStatus));
  wsUnsubs.push(wsBus.on("sync_agent_done", debouncedLoadStatus));
  wsUnsubs.push(wsBus.on("sync_status", onSyncStatus));
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  if (debounceTimer) clearTimeout(debounceTimer);
  wsUnsubs.forEach((unsub) => unsub());
  wsUnsubs = [];
});
</script>

<template>
  <div class="sync-dashboard">
    <!-- ===== OVERVIEW: 1 CARD GỘP 4 THỐNG KÊ ===== -->
    <lay-card class="overview-card">
      <div class="overview-stats">
        <div class="overview-item" :class="{ 'overview-item--syncing': isSyncing }">
          <div class="overview-icon" :class="isSyncing ? 'bg-yellow pulse' : 'bg-green'">
            <i class="layui-icon" :class="isSyncing ? 'layui-icon-loading-1 spin' : 'layui-icon-ok-circle'" />
          </div>
          <div class="overview-text">
            <div class="overview-label">
              {{ t("sync.overviewStatus") }}
            </div>
            <div class="overview-value">
              <lay-tag :color="isSyncing ? '#ffb800' : '#16baaa'" variant="light" size="sm" bordered>
                {{ isSyncing ? t("sync.syncing") : t("sync.ready") }}
              </lay-tag>
            </div>
          </div>
        </div>
        <div class="overview-divider" />
        <div class="overview-item">
          <div class="overview-icon bg-teal">
            <i class="layui-icon layui-icon-chart-screen" />
          </div>
          <div class="overview-text">
            <div class="overview-label">
              {{ t("sync.totalRecords") }}
            </div>
            <div class="overview-value">
              <lay-count-up :end-val="totalRows" :duration="800" :use-grouping="true" />
            </div>
          </div>
        </div>
        <div class="overview-divider" />
        <div class="overview-item">
          <div class="overview-icon bg-blue">
            <i class="layui-icon layui-icon-group" />
          </div>
          <div class="overview-text">
            <div class="overview-label">
              {{ t("sync.activeAgents") }}
            </div>
            <div class="overview-value">
              {{ activeAgents }}<span class="overview-sub">/{{ totalAgents }}</span>
            </div>
          </div>
        </div>
        <div class="overview-divider" />
        <div class="overview-item" :class="{ clickable: canWrite }" @click="canWrite && openIntervalEdit()">
          <div class="overview-icon bg-orange">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20"
              viewBox="0 -960 960 960"
              width="20"
              fill="#fff"
            >
              <path
                d="M360-860v-60h240v60H360Zm90 447h60v-230h-60v230ZM340.5-109.5Q275-138 226-187t-77.5-114.5Q120-367 120-441t28.5-139.5Q177-646 226-695t114.5-77.5Q406-801 480-801q67 0 126 22.5T711-716l51-51 42 42-51 51q36 40 61.5 97T840-441q0 74-28.5 139.5T734-187q-49 49-114.5 77.5T480-81q-74 0-139.5-28.5Zm352-119Q780-316 780-441t-87.5-212.5Q605-741 480-741t-212.5 87.5Q180-566 180-441t87.5 212.5Q355-141 480-141t212.5-87.5ZM480-440Z"
              />
            </svg>
          </div>
          <div class="overview-text">
            <div class="overview-label">
              {{ t("sync.syncCycle")
              }}<template v-if="canWrite">
                <i class="layui-icon layui-icon-edit" style="font-size: 11px; cursor: pointer; color: #999" />
              </template>
            </div>
            <div class="overview-value">
              <lay-tag color="#ffb800" variant="light" size="sm" bordered>
                {{ t("sync.customize") }}
              </lay-tag>
            </div>
          </div>
        </div>
      </div>
    </lay-card>

    <!-- ===== AGENT TABLE ===== -->
    <lay-card style="margin-top: 12px">
      <lay-field :title="t('sync.agentStatus')">
        <div class="table-container">
          <lay-table
            v-model:expand-keys="expandKeys"
            :columns="agentColumns"
            :data-source="agents"
            :loading="loading"
            :default-toolbar="defaultToolbar"
            children-column-name="children"
            :indent-size="20"
          >
            <template #toolbar>
              <div class="toolbar-row">
                <div class="toolbar-date">
                  <lay-select v-model="dateQuickSelect" size="sm" :style="{ width: dateQuickWidth }">
                    <lay-select-option
                      v-for="opt in dateQuickOptions"
                      :key="opt.value"
                      :value="opt.value"
                      :label="opt.label"
                    />
                  </lay-select>
                  <lay-date-picker v-model="syncDateRange" type="date" range size="sm" style="width: 220px" />
                </div>
                <template v-if="canWrite">
                  <lay-button size="sm" type="primary" @click="openCreateAgent">
                    <i class="layui-icon layui-icon-add-1" /> {{ t("sync.addAgent") }}
                  </lay-button>
                  <lay-button size="sm" :loading="loggingInAll" @click="handleLoginAll">
                    <i class="layui-icon layui-icon-key" /> {{ t("sync.loginAll") }}
                  </lay-button>
                  <lay-button
                    v-if="!isSyncing"
                    size="sm"
                    type="normal"
                    :loading="triggering"
                    @click="handleSyncAll"
                  >
                    <i class="layui-icon layui-icon-play" /> {{ t("sync.syncAll") }}
                  </lay-button>
                  <lay-button v-else size="sm" type="danger" :loading="stopping" @click="handleStopSync">
                    <i class="layui-icon layui-icon-pause" /> {{ t("sync.stopSync") }}
                  </lay-button>
                </template>
              </div>
            </template>

            <template #agentName="{ row }">
              <span v-if="row.icon" class="agent-name-cell" style="color: #666">
                <i
                  class="layui-icon"
                  :class="row.icon"
                  style="margin-right: 6px; font-size: 14px; color: #999"
                />
                {{ row.name }}
              </span>
              <span v-else class="agent-name-cell">
                <i
                  class="layui-icon"
                  :class="
                    row.status === 'logging_in'
                      ? 'layui-icon-loading-1 spin'
                      : row.isActive && row.status === 'active'
                        ? 'layui-icon-ok-circle'
                        : 'layui-icon-close-fill'
                  "
                  :style="{ color: getAgentStatusColor(row), marginRight: '6px', fontSize: '14px' }"
                />
                <b>{{ row.name }}</b>
              </span>
            </template>

            <template #agentStatus="{ row }">
              <template v-if="!row.icon">
                <lay-tag :color="getAgentStatusColor(row)" variant="light" size="sm" bordered>
                  {{ getAgentStatusLabel(row) }}
                </lay-tag>
                <div v-if="row.loginError" class="login-error-text">
                  {{ row.loginError }}
                </div>
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
                {{
                  new Date(row.lastSyncedAt).toLocaleString("vi-VN", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                }}
              </span>
              <span v-else style="color: #ccc">—</span>
            </template>

            <template #actions="{ row }">
              <!-- Child row: per-table sync button -->
              <template v-if="row.icon && row.table">
                <lay-button
                  size="xs"
                  type="primary"
                  :loading="syncingEndpointKey === `${row.agentId}__${row.table}`"
                  :disabled="isSyncing"
                  @click="handleSyncAgentEndpoint(row.agentId, row.table, row.name)"
                >
                  <svg
                    class="sync-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    height="14"
                    viewBox="0 -960 960 960"
                    width="14"
                    fill="currentColor"
                  >
                    <path
                      d="M238-211q-57-53-87.5-122.5T120-480q0-150 105-255t255-105v-80l183 140-183 140v-80q-100 0-170 70t-70 170q0 57 25 107.5t67 88.5l-94 73ZM480-40 297-180l183-140v80q100 0 170-70t70-170q0-57-25-108t-70-88l95-71q58 51 89 120.5T840-480q0 150-105 255T480-120v80Z"
                    />
                  </svg>
                  Sync
                </lay-button>
              </template>
              <!-- Parent row: Sync + dropdown menu -->
              <template v-else-if="!row.icon">
                <div class="action-btns">
                  <lay-button
                    size="xs"
                    :type="agentStore.cookieHealthMap[row.id] === true ? 'primary' : 'normal'"
                    :loading="syncingAgentId === row.id"
                    :disabled="isSyncing || agentStore.cookieHealthMap[row.id] !== true"
                    @click="handleSyncAgent(row.id)"
                  >
                    <svg
                      class="sync-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      height="14"
                      viewBox="0 -960 960 960"
                      width="14"
                      fill="currentColor"
                    >
                      <path
                        d="M238-211q-57-53-87.5-122.5T120-480q0-150 105-255t255-105v-80l183 140-183 140v-80q-100 0-170 70t-70 170q0 57 25 107.5t67 88.5l-94 73ZM480-40 297-180l183-140v80q100 0 170-70t70-170q0-57-25-108t-70-88l95-71q58 51 89 120.5T840-480q0 150-105 255T480-120v80Z"
                      />
                    </svg>
                    Sync
                  </lay-button>
                  <lay-dropdown>
                    <lay-button size="xs">
                      <i class="layui-icon layui-icon-more-vertical" />
                    </lay-button>
                    <template #content>
                      <lay-dropdown-menu>
                        <lay-dropdown-menu-item @click="openEditAgent(row)">
                          <i class="layui-icon layui-icon-edit" style="margin-right: 6px" />{{
                            t("sync.editInfo")
                          }}
                        </lay-dropdown-menu-item>
                        <lay-dropdown-menu-item
                          :disabled="loggingInAgentId === row.id"
                          @click="loggingInAgentId !== row.id && handleLoginAgent(row.id)"
                        >
                          <i class="layui-icon layui-icon-key" style="margin-right: 6px" />{{
                            loggingInAgentId === row.id ? t("sync.loggingIn") : t("sync.loginEE88")
                          }}
                        </lay-dropdown-menu-item>
                        <lay-dropdown-menu-item
                          :disabled="loggingOutAgentId === row.id"
                          @click="loggingOutAgentId !== row.id && handleLogoutAgent(row.id)"
                        >
                          <i class="layui-icon layui-icon-release" style="margin-right: 6px" />{{
                            loggingOutAgentId === row.id ? t("sync.loggingOut") : t("sync.logoutEE88")
                          }}
                        </lay-dropdown-menu-item>
                        <lay-dropdown-menu-item @click="openChangePassword(row)">
                          <i class="layui-icon layui-icon-password" style="margin-right: 6px" />{{
                            t("sync.changePassword")
                          }}
                        </lay-dropdown-menu-item>
                        <li style="border-top: 1px solid #eee; margin: 4px 0" />
                        <lay-dropdown-menu-item
                          :disabled="isSyncing || purgingAgentId === row.id"
                          @click="
                            !isSyncing && purgingAgentId !== row.id && confirmPurgeAgent(row.id, row.name)
                          "
                        >
                          <span style="color: #ff9900"
                            ><i class="layui-icon layui-icon-delete" style="margin-right: 6px" />{{
                              t("sync.deleteData")
                            }}</span
                          >
                        </lay-dropdown-menu-item>
                        <lay-dropdown-menu-item @click="confirmDeleteAgent(row.id, row.name)">
                          <span style="color: #ff4d4f"
                            ><i class="layui-icon layui-icon-close" style="margin-right: 6px" />{{
                              t("sync.disable")
                            }}</span
                          >
                        </lay-dropdown-menu-item>
                      </lay-dropdown-menu>
                    </template>
                  </lay-dropdown>
                </div>
              </template>
            </template>
          </lay-table>
        </div>
      </lay-field>
    </lay-card>

    <!-- ===== MODAL THÊM/SỬA AGENT ===== -->
    <lay-layer
      v-model="agentModalVisible"
      :title="agentModalTitle"
      :area="['460px', 'auto']"
      :shade-close="false"
      :btn="[
        { text: t('common.save'), callback: () => saveAgent() },
        {
          text: t('common.cancel'),
          callback: (id: string) => {
            agentModalVisible = false;
          },
        },
      ]"
    >
      <div style="padding: 16px 20px">
        <lay-form :model="agentForm" label-width="130">
          <lay-form-item :label="t('sync.agentName')" required>
            <lay-input v-model="agentForm.name" :placeholder="t('sync.agentNamePlaceholder')" />
          </lay-form-item>
          <lay-form-item :label="t('sync.usernameEE88')" :required="!editingAgentId">
            <lay-input
              v-model="agentForm.extUsername"
              :placeholder="t('sync.usernameEE88Placeholder')"
              :disabled="!!editingAgentId"
            />
          </lay-form-item>
          <lay-form-item
            :label="editingAgentId ? t('sync.passwordNew') : t('sync.passwordEE88')"
            :required="!editingAgentId"
          >
            <lay-input
              v-model="agentForm.extPassword"
              type="password"
              :placeholder="
                editingAgentId ? t('sync.passwordNewPlaceholder') : t('sync.passwordEE88Placeholder')
              "
            />
          </lay-form-item>
          <lay-form-item :label="t('sync.baseUrl')">
            <lay-input v-model="agentForm.baseUrl" :placeholder="t('sync.baseUrlPlaceholder')" />
          </lay-form-item>
        </lay-form>
      </div>
    </lay-layer>
    <!-- ===== MODAL ĐỔI MẬT KHẨU ===== -->
    <lay-layer
      v-model="pwModalVisible"
      :title="t('sync.changePasswordTitle', { name: pwModalAgentName })"
      :area="['420px', 'auto']"
      :shade-close="false"
      :btn="[
        {
          text: pwSaving ? t('sync.changingPassword') : t('sync.changePassword'),
          callback: () => submitChangePassword(),
        },
        {
          text: t('common.cancel'),
          callback: () => {
            pwModalVisible = false;
          },
        },
      ]"
    >
      <div style="padding: 16px 20px; display: flex; flex-direction: column; gap: 10px">
        <lay-input
          v-model="pwForm.old_password"
          type="password"
          :placeholder="t('sync.oldPasswordPlaceholder')"
          prefix-icon="layui-icon-password"
        />
        <lay-input
          v-model="pwForm.new_password"
          type="password"
          :placeholder="t('sync.newPasswordPlaceholder')"
          prefix-icon="layui-icon-key"
        />
        <lay-input
          v-model="pwForm.confirm_password"
          type="password"
          :placeholder="t('sync.confirmPasswordPlaceholder')"
          prefix-icon="layui-icon-key"
        />
      </div>
    </lay-layer>

    <!-- ===== MODAL CÀI ĐẶT CHU KỲ ĐỒNG BỘ (PER-ENDPOINT) ===== -->
    <lay-layer
      v-model="intervalEditing"
      :title="t('sync.syncIntervalTitle')"
      :area="['500px', 'auto']"
      :shade-close="true"
      :btn="[
        { text: intervalSaving ? t('sync.saving') : t('sync.saveAll'), callback: () => saveIntervals() },
        {
          text: t('common.cancel'),
          callback: () => {
            intervalEditing = false;
          },
        },
      ]"
    >
      <div style="padding: 16px 20px">
        <div style="margin-bottom: 12px; color: #666; font-size: 13px">
          {{ t("sync.syncIntervalDesc") }}
        </div>
        <table class="interval-table">
          <thead>
            <tr>
              <th>{{ t("sync.dataType") }}</th>
              <th style="width: 120px; text-align: center">
                {{ t("sync.cycleMinutes") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(label, table) in ENDPOINT_LABELS" :key="table">
              <td>{{ label }}</td>
              <td style="text-align: center">
                <lay-input-number
                  v-model="intervalInputs[table]"
                  :min="1"
                  :max="1440"
                  :step="1"
                  size="sm"
                  position="right"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </lay-layer>
  </div>
</template>

<style scoped>
.sync-dashboard {
  padding: 0;
}

/* ===== OVERVIEW CARD ===== */
.overview-stats {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 4px 8px;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background 0.2s;
}

.overview-item.clickable:hover {
  background: #f6f6f6;
  cursor: pointer;
}

.overview-divider {
  width: 1px;
  height: 36px;
  background: #e8e8e8;
  flex-shrink: 0;
}

.overview-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.overview-icon .layui-icon {
  font-size: 18px;
  color: #fff;
}

.bg-teal {
  background: linear-gradient(135deg, #16baaa, #1cc7b6);
}
.bg-blue {
  background: linear-gradient(135deg, #1e9fff, #4db8ff);
}
.bg-orange {
  background: linear-gradient(135deg, #ffb800, #ffc833);
}
.bg-green {
  background: linear-gradient(135deg, #16baaa, #5cd7ca);
}
.bg-yellow {
  background: linear-gradient(135deg, #ffb800, #ffe066);
}

.overview-text {
  min-width: 0;
}

.overview-label {
  font-size: 12px;
  color: #999;
  line-height: 1.2;
}

.overview-value {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  line-height: 1.3;
}

.overview-sub {
  font-size: 13px;
  font-weight: 400;
  color: #999;
}

/* ===== ANIMATIONS ===== */
.pulse {
  animation: pulse-ring 1.5s ease-in-out infinite;
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 184, 0, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(255, 184, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 184, 0, 0);
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ===== TOOLBAR ===== */
.toolbar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-date {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ===== TABLE ===== */
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
  align-items: center;
}

.sync-icon {
  vertical-align: middle;
  margin-right: 2px;
}

.login-error-text {
  font-size: 11px;
  color: #ff4d4f;
  margin-top: 2px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== INTERVAL TABLE ===== */
.interval-table {
  width: 100%;
  border-collapse: collapse;
}

.interval-table th,
.interval-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.interval-table th {
  background: #fafafa;
  color: #666;
  font-weight: 500;
  text-align: left;
}

.interval-table td:first-child {
  color: #333;
}
</style>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { fetchSyncStatus, triggerSync, triggerAgentSync, triggerAgentEndpointSync, stopSync, setSyncIntervals, purgeAllData, purgeAgentData } from "@/api/services/sync";
import {
  loginAgentEE88, logoutAgentEE88, loginAllAgentsEE88,
  createAgent, updateAgent, deleteAgent,
  editUpstreamPassword,
} from "@/api/services/proxy";
import { useAuthStore } from "@/stores/auth";
import { useAgentStore } from "@/stores/agent";
import { useWsBus } from "@/composables/useWsBus";
import { PERMISSIONS } from "@/constants/permissions";
import { layer } from "@layui/layui-vue";

const authStore = useAuthStore();
const agentStore = useAgentStore();
const canWrite = computed(() => authStore.hasPermission(PERMISSIONS.SYNC_WRITE));

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

// Map endpoint table → label tiếng Việt
const ENDPOINT_LABELS: Record<string, string> = {
  proxyUser: "Hội viên",
  proxyDeposit: "Nạp tiền",
  proxyWithdrawal: "Rút tiền",
  proxyBet: "Đơn cược xổ số",
  proxyBetOrder: "Đơn cược bên thứ 3",
  proxyReportLottery: "Báo cáo xổ số",
  proxyReportFunds: "Sao kê giao dịch",
  proxyReportThirdGame: "Báo cáo NCC",
};
const expandKeys = ref<string[]>([]);

// --- Agent CRUD modal ---
const agentModalVisible = ref(false);
const agentModalTitle = ref("Thêm đại lý");
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
  agentModalTitle.value = "Thêm đại lý";
  agentForm.name = "";
  agentForm.extUsername = "";
  agentForm.extPassword = "";
  agentForm.baseUrl = "";
  agentModalVisible.value = true;
}

function openEditAgent(row: any) {
  editingAgentId.value = row.id;
  agentModalTitle.value = `Sửa đại lý: ${row.name}`;
  agentForm.name = row.name || "";
  agentForm.extUsername = row.extUsername || "";
  agentForm.extPassword = "";
  agentForm.baseUrl = row.baseUrl || "";
  agentModalVisible.value = true;
}

async function saveAgent() {
  if (!agentForm.name.trim()) {
    layer.msg("Vui lòng nhập tên đại lý", { icon: 0 });
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
      layer.msg("Đã cập nhật đại lý", { icon: 1 });
    } else {
      // Create
      if (!agentForm.extUsername.trim() || !agentForm.extPassword.trim()) {
        layer.msg("Username và Password ee88 là bắt buộc", { icon: 0 });
        agentSaving.value = false;
        return;
      }
      await createAgent({
        name: agentForm.name,
        extUsername: agentForm.extUsername,
        extPassword: agentForm.extPassword,
        baseUrl: agentForm.baseUrl || undefined,
      });
      layer.msg("Đã tạo đại lý mới", { icon: 1 });
    }
    agentModalVisible.value = false;
    await loadStatus();
    await agentStore.loadAgents();
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Lỗi lưu đại lý";
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
    layer.msg("Vui lòng nhập mật khẩu cũ", { icon: 0 });
    return;
  }
  if (!pwForm.new_password || pwForm.new_password.length < 6) {
    layer.msg("Mật khẩu mới tối thiểu 6 ký tự", { icon: 0 });
    return;
  }
  if (pwForm.new_password !== pwForm.confirm_password) {
    layer.msg("Xác nhận mật khẩu không khớp", { icon: 0 });
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
    layer.msg("Đổi mật khẩu thành công", { icon: 1 });
    pwModalVisible.value = false;
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Lỗi đổi mật khẩu";
    layer.msg(msg, { icon: 2 });
  } finally {
    pwSaving.value = false;
  }
}

function confirmDeleteAgent(agentId: string, agentName: string) {
  layer.confirm(
    `Bạn có chắc muốn <b style='color:#ff4d4f'>vô hiệu hoá</b> đại lý <b>${agentName}</b>?`,
    {
      title: "Xác nhận vô hiệu hoá",

      btn: [
        { text: "Vô hiệu hoá", callback: (id: string) => { layer.close(id); doDeleteAgent(agentId); } },
        { text: "Hủy", callback: (id: string) => { layer.close(id); } },
      ],
    },
  );
}

async function doDeleteAgent(agentId: string) {
  try {
    await deleteAgent(agentId, "deactivate");
    layer.msg("Đã vô hiệu hoá đại lý", { icon: 1 });
    await loadStatus();
    await agentStore.loadAgents();
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Lỗi xóa đại lý";
    layer.msg(msg, { icon: 2 });
  }
}

const agentColumns = computed(() => [
  { title: "Đại lý / Dữ liệu", key: "name", customSlot: "agentName", width: "180px" },
  { title: "Tài khoản", key: "extUsername", ellipsisTooltip: true, width: "120px" },
  { title: "Trạng thái", key: "_status", customSlot: "agentStatus", width: "120px" },
  { title: "Bản ghi", key: "totalRows", customSlot: "num", width: "80px" },
  { title: "Sync cuối", key: "lastSyncedAt", customSlot: "syncTime", width: "130px" },
  ...(canWrite.value ? [{ title: "Thao tác", key: "_actions", customSlot: "actions", width: "140px", align: "center" }] : []),
]);

const statusMap: Record<string, { color: string; label: string }> = {
  active: { color: "#16baaa", label: "Hoạt động" },
  online: { color: "#16baaa", label: "Hoạt động" },
  logging_in: { color: "#ffb800", label: "Đang login..." },
  offline: { color: "#999", label: "Offline" },
  error: { color: "#ff4d4f", label: "Lỗi" },
};

function getAgentStatusColor(row: any): string {
  if (!row.isActive) return "#999";
  // Nếu status active nhưng cookie hết hạn → hiện warning
  if (row.status === "active" || row.status === "online") {
    const alive = agentStore.cookieHealthMap[row.id];
    if (alive === false) return "#ff4d4f";
  }
  return statusMap[row.status]?.color || "#999";
}

function getAgentStatusLabel(row: any): string {
  if (!row.isActive) return "Tắt";
  // Gộp cookie health vào status
  if (row.status === "active" || row.status === "online") {
    const alive = agentStore.cookieHealthMap[row.id];
    if (alive === false) return "Cookie hết hạn";
    if (alive === undefined) return "Kiểm tra...";
  }
  return statusMap[row.status]?.label || row.status;
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

/** Fingerprint để so sánh xem data có thay đổi không — tránh re-render không cần thiết */
let lastFingerprint = "";

async function loadStatus() {
  try {
    const [statusRes] = await Promise.all([
      fetchSyncStatus(),
      agentStore.loadCookieHealth(),
    ]);
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

async function handleStopSync() {
  stopping.value = true;
  try {
    const res = await stopSync();
    if (res.data.success) {
      layer.msg("Đã yêu cầu dừng đồng bộ", { icon: 1 });
    } else {
      layer.msg(res.data.message || "Lỗi", { icon: 2 });
    }
  } catch {
    layer.msg("Lỗi khi dừng đồng bộ", { icon: 2 });
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
      const label = ENDPOINT_LABELS[table] || table;
      layer.msg(`${label}: tối thiểu 1 phút`, { icon: 0 });
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
      layer.msg("Đã cập nhật chu kỳ đồng bộ", { icon: 1 });
      intervalEditing.value = false;
    } else {
      layer.msg(res.data.message || "Lỗi", { icon: 2 });
    }
  } catch {
    layer.msg("Lỗi cập nhật chu kỳ đồng bộ", { icon: 2 });
  } finally {
    intervalSaving.value = false;
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

async function handleSyncAgentEndpoint(agentId: string, table: string, label: string) {
  const key = `${agentId}__${table}`;
  syncingEndpointKey.value = key;
  try {
    const res = await triggerAgentEndpointSync(agentId, table);
    if (res.data.success) {
      layer.msg(`Đã kích hoạt đồng bộ ${label}`, { icon: 1 });
      isSyncing.value = true;
    } else {
      layer.msg(res.data.message || "Lỗi", { icon: 2 });
    }
  } catch {
    layer.msg("Lỗi khi kích hoạt đồng bộ", { icon: 2 });
  } finally {
    syncingEndpointKey.value = null;
  }
}

function confirmPurgeAll() {
  layer.confirm(
    "Bạn có chắc muốn <b style='color:#ff4d4f'>xóa TẤT CẢ</b> dữ liệu đồng bộ?<br>Hành động này không thể hoàn tác.",
    {
      title: "Xác nhận xóa tất cả",

      btn: [
        { text: "Xóa tất cả", callback: (id: string) => { layer.close(id); doPurgeAll(); } },
        { text: "Hủy", callback: (id: string) => { layer.close(id); } },
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

      btn: [
        { text: "Xóa", callback: (id: string) => { layer.close(id); doPurgeAgent(agentId); } },
        { text: "Hủy", callback: (id: string) => { layer.close(id); } },
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

// ---- EE88 Login/Logout ----

async function handleLoginAgent(agentId: string) {
  loggingInAgentId.value = agentId;
  try {
    const res = await loginAgentEE88(agentId);
    if (res.data.success) {
      layer.msg("Đăng nhập thành công", { icon: 1 });
      await loadStatus();
    } else {
      layer.msg(res.data.message || "Lỗi đăng nhập", { icon: 2 });
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Lỗi đăng nhập agent";
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
      layer.msg("Đã logout agent", { icon: 1 });
      await loadStatus();
    } else {
      layer.msg(res.data.message || "Lỗi logout", { icon: 2 });
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Lỗi logout agent";
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
      layer.msg(`Đã login ${d.success}/${d.total} agents`, { icon: 1 });
      await loadStatus();
    } else {
      layer.msg(res.data.message || "Lỗi", { icon: 2 });
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Lỗi login tất cả";
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
            <i class="layui-icon" :class="isSyncing ? 'layui-icon-loading-1 spin' : 'layui-icon-ok-circle'"></i>
          </div>
          <div class="overview-text">
            <div class="overview-label">Trạng thái</div>
            <div class="overview-value">
              <lay-tag :color="isSyncing ? '#ffb800' : '#16baaa'" variant="light" size="sm" bordered>
                {{ isSyncing ? "Đang đồng bộ..." : "Sẵn sàng" }}
              </lay-tag>
            </div>
          </div>
        </div>
        <div class="overview-divider"></div>
        <div class="overview-item">
          <div class="overview-icon bg-teal">
            <i class="layui-icon layui-icon-chart-screen"></i>
          </div>
          <div class="overview-text">
            <div class="overview-label">Tổng bản ghi</div>
            <div class="overview-value">
              <lay-count-up :end-val="totalRows" :duration="800" :use-grouping="true" />
            </div>
          </div>
        </div>
        <div class="overview-divider"></div>
        <div class="overview-item">
          <div class="overview-icon bg-blue">
            <i class="layui-icon layui-icon-group"></i>
          </div>
          <div class="overview-text">
            <div class="overview-label">Agent hoạt động</div>
            <div class="overview-value">{{ activeAgents }}<span class="overview-sub">/{{ totalAgents }}</span></div>
          </div>
        </div>
        <div class="overview-divider"></div>
        <div class="overview-item" :class="{ clickable: canWrite }" @click="canWrite && openIntervalEdit()">
          <div class="overview-icon bg-orange">
            <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="#fff"><path d="M360-860v-60h240v60H360Zm90 447h60v-230h-60v230ZM340.5-109.5Q275-138 226-187t-77.5-114.5Q120-367 120-441t28.5-139.5Q177-646 226-695t114.5-77.5Q406-801 480-801q67 0 126 22.5T711-716l51-51 42 42-51 51q36 40 61.5 97T840-441q0 74-28.5 139.5T734-187q-49 49-114.5 77.5T480-81q-74 0-139.5-28.5Zm352-119Q780-316 780-441t-87.5-212.5Q605-741 480-741t-212.5 87.5Q180-566 180-441t87.5 212.5Q355-141 480-141t212.5-87.5ZM480-440Z"/></svg>
          </div>
          <div class="overview-text">
            <div class="overview-label">Chu kỳ đồng bộ<template v-if="canWrite"> <i class="layui-icon layui-icon-edit" style="font-size: 11px; cursor: pointer; color: #999"></i></template></div>
            <div class="overview-value">
              <lay-tag color="#ffb800" variant="light" size="sm" bordered>Tuỳ chỉnh</lay-tag>
            </div>
          </div>
        </div>
      </div>
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
            childrenColumnName="children"
            :indentSize="20"
            v-model:expandKeys="expandKeys"
          >
            <template v-slot:toolbar>
              <template v-if="canWrite">
                <lay-button
                  size="sm"
                  type="primary"
                  @click="openCreateAgent"
                >
                  <i class="layui-icon layui-icon-add-1"></i> Thêm đại lý
                </lay-button>
                <lay-button
                  size="sm"
                  :loading="loggingInAll"
                  @click="handleLoginAll"
                >
                  <i class="layui-icon layui-icon-key"></i> Login tất cả
                </lay-button>
                <lay-button
                  v-if="!isSyncing"
                  size="sm"
                  type="normal"
                  :loading="triggering"
                  @click="handleSyncAll"
                >
                  <i class="layui-icon layui-icon-play"></i> Đồng bộ
                </lay-button>
                <lay-button
                  v-else
                  size="sm"
                  type="danger"
                  :loading="stopping"
                  @click="handleStopSync"
                >
                  <i class="layui-icon layui-icon-pause"></i> Dừng
                </lay-button>
              </template>
            </template>

            <template #agentName="{ row }">
              <span v-if="row.icon" class="agent-name-cell" style="color: #666">
                <i class="layui-icon" :class="row.icon" style="margin-right: 6px; font-size: 14px; color: #999"></i>
                {{ row.name }}
              </span>
              <span v-else class="agent-name-cell">
                <i
                  class="layui-icon"
                  :class="row.status === 'logging_in' ? 'layui-icon-loading-1 spin' : (row.isActive && row.status === 'active' ? 'layui-icon-ok-circle' : 'layui-icon-close-fill')"
                  :style="{ color: getAgentStatusColor(row), marginRight: '6px', fontSize: '14px' }"
                ></i>
                <b>{{ row.name }}</b>
              </span>
            </template>

            <template #agentStatus="{ row }">
              <template v-if="!row.icon">
                <lay-tag
                  :color="getAgentStatusColor(row)"
                  variant="light"
                  size="sm"
                  bordered
                >
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
                {{ new Date(row.lastSyncedAt).toLocaleString("vi-VN", {
                  month: "2-digit", day: "2-digit",
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                }) }}
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
                  <svg class="sync-icon" xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="currentColor"><path d="M238-211q-57-53-87.5-122.5T120-480q0-150 105-255t255-105v-80l183 140-183 140v-80q-100 0-170 70t-70 170q0 57 25 107.5t67 88.5l-94 73ZM480-40 297-180l183-140v80q100 0 170-70t70-170q0-57-25-108t-70-88l95-71q58 51 89 120.5T840-480q0 150-105 255T480-120v80Z"/></svg> Sync
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
                    <svg class="sync-icon" xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="currentColor"><path d="M238-211q-57-53-87.5-122.5T120-480q0-150 105-255t255-105v-80l183 140-183 140v-80q-100 0-170 70t-70 170q0 57 25 107.5t67 88.5l-94 73ZM480-40 297-180l183-140v80q100 0 170-70t70-170q0-57-25-108t-70-88l95-71q58 51 89 120.5T840-480q0 150-105 255T480-120v80Z"/></svg> Sync
                  </lay-button>
                  <lay-dropdown>
                    <lay-button size="xs">
                      <i class="layui-icon layui-icon-more-vertical"></i>
                    </lay-button>
                    <template #content>
                      <lay-dropdown-menu>
                        <lay-dropdown-menu-item @click="openEditAgent(row)">
                          <i class="layui-icon layui-icon-edit" style="margin-right: 6px"></i>Sửa thông tin
                        </lay-dropdown-menu-item>
                        <lay-dropdown-menu-item
                          @click="loggingInAgentId !== row.id && handleLoginAgent(row.id)"
                          :disabled="loggingInAgentId === row.id"
                        >
                          <i class="layui-icon layui-icon-key" style="margin-right: 6px"></i>{{ loggingInAgentId === row.id ? 'Đang login...' : 'Login EE88' }}
                        </lay-dropdown-menu-item>
                        <lay-dropdown-menu-item
                          @click="loggingOutAgentId !== row.id && handleLogoutAgent(row.id)"
                          :disabled="loggingOutAgentId === row.id"
                        >
                          <i class="layui-icon layui-icon-release" style="margin-right: 6px"></i>{{ loggingOutAgentId === row.id ? 'Đang logout...' : 'Logout EE88' }}
                        </lay-dropdown-menu-item>
                        <lay-dropdown-menu-item @click="openChangePassword(row)">
                          <i class="layui-icon layui-icon-password" style="margin-right: 6px"></i>Đổi mật khẩu
                        </lay-dropdown-menu-item>
                        <li style="border-top: 1px solid #eee; margin: 4px 0"></li>
                        <lay-dropdown-menu-item
                          @click="!isSyncing && purgingAgentId !== row.id && confirmPurgeAgent(row.id, row.name)"
                          :disabled="isSyncing || purgingAgentId === row.id"
                        >
                          <span style="color: #ff9900"><i class="layui-icon layui-icon-delete" style="margin-right: 6px"></i>Xóa dữ liệu</span>
                        </lay-dropdown-menu-item>
                        <lay-dropdown-menu-item @click="confirmDeleteAgent(row.id, row.name)">
                          <span style="color: #ff4d4f"><i class="layui-icon layui-icon-close" style="margin-right: 6px"></i>Vô hiệu hoá</span>
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
        { text: 'Lưu', callback: () => saveAgent() },
        { text: 'Hủy', callback: (id: string) => { agentModalVisible = false; } },
      ]"
    >
      <div style="padding: 16px 20px">
        <lay-form :model="agentForm" label-width="130">
          <lay-form-item label="Tên đại lý" required>
            <lay-input v-model="agentForm.name" placeholder="VD: Agent 01" />
          </lay-form-item>
          <lay-form-item label="Username EE88" :required="!editingAgentId">
            <lay-input
              v-model="agentForm.extUsername"
              placeholder="Tài khoản ee88"
              :disabled="!!editingAgentId"
            />
          </lay-form-item>
          <lay-form-item :label="editingAgentId ? 'Mật khẩu mới' : 'Mật khẩu EE88'" :required="!editingAgentId">
            <lay-input
              v-model="agentForm.extPassword"
              type="password"
              :placeholder="editingAgentId ? 'Để trống nếu không đổi' : 'Mật khẩu ee88'"
            />
          </lay-form-item>
          <lay-form-item label="Base URL">
            <lay-input v-model="agentForm.baseUrl" placeholder="Mặc định nếu để trống" />
          </lay-form-item>
        </lay-form>
      </div>
    </lay-layer>
    <!-- ===== MODAL ĐỔI MẬT KHẨU ===== -->
    <lay-layer
      v-model="pwModalVisible"
      :title="`Đổi mật khẩu: ${pwModalAgentName}`"
      :area="['420px', 'auto']"
      :shade-close="false"
      :btn="[
        { text: pwSaving ? 'Đang lưu...' : 'Đổi mật khẩu', callback: () => submitChangePassword() },
        { text: 'Hủy', callback: () => { pwModalVisible = false; } },
      ]"
    >
      <div style="padding: 16px 20px; display: flex; flex-direction: column; gap: 10px">
        <lay-input v-model="pwForm.old_password" type="password" placeholder="Nhập mật khẩu cũ đại lý EE88" prefix-icon="layui-icon-password" />
        <lay-input v-model="pwForm.new_password" type="password" placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" prefix-icon="layui-icon-key" />
        <lay-input v-model="pwForm.confirm_password" type="password" placeholder="Xác nhận mật khẩu mới" prefix-icon="layui-icon-key" />
      </div>
    </lay-layer>

    <!-- ===== MODAL CÀI ĐẶT CHU KỲ ĐỒNG BỘ (PER-ENDPOINT) ===== -->
    <lay-layer
      v-model="intervalEditing"
      title="Cài đặt chu kỳ đồng bộ"
      :area="['500px', 'auto']"
      :shade-close="true"
      :btn="[
        { text: intervalSaving ? 'Đang lưu...' : 'Lưu tất cả', callback: () => saveIntervals() },
        { text: 'Hủy', callback: () => { intervalEditing = false; } },
      ]"
    >
      <div style="padding: 16px 20px">
        <div style="margin-bottom: 12px; color: #666; font-size: 13px">
          Cài đặt chu kỳ đồng bộ riêng cho từng loại dữ liệu (phút). Tối thiểu 1 phút.
        </div>
        <table class="interval-table">
          <thead>
            <tr>
              <th>Loại dữ liệu</th>
              <th style="width: 120px; text-align: center">Chu kỳ (phút)</th>
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

.bg-teal { background: linear-gradient(135deg, #16baaa, #1cc7b6); }
.bg-blue { background: linear-gradient(135deg, #1e9fff, #4db8ff); }
.bg-orange { background: linear-gradient(135deg, #ffb800, #ffc833); }
.bg-green { background: linear-gradient(135deg, #16baaa, #5cd7ca); }
.bg-yellow { background: linear-gradient(135deg, #ffb800, #ffe066); }

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

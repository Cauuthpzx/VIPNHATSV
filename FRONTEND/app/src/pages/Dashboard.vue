<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, h } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import VChart from "vue-echarts";
import { registerCharts, formatMoney as fmtMoney, tooltipFormatter, yAxisMoneyFormatter } from "@/composables/useCharts";
import { fetchDashboardSummary, fetchActivityFeed, fetchDashboardSettings, saveDashboardSettings, fetchMemberDetail, fetchOnlineMembers, type DashboardSummary, type ActivityItem, type DashboardSettings, type MemberDetail } from "@/api/services/dashboard";
import { useAuthStore } from "@/stores/auth";
import { useDateRange } from "@/composables/useDateRange";

const { t } = useI18n();

registerCharts();

const authStore = useAuthStore();
const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth } = useDateRange("today");
const loading = ref(true);
const data = ref<DashboardSummary | null>(null);
const activityItems = ref<ActivityItem[]>([]);
const activityLoading = ref(false);

// --- Settings ---
const settings = ref<DashboardSettings>({ pollInterval: 300, bigDepositMin: 10_000_000, bigWithdrawMin: 10_000_000 });
const showSettings = ref(false);
const settingsForm = ref<DashboardSettings>({ pollInterval: 300, bigDepositMin: 10_000_000, bigWithdrawMin: 10_000_000 });
const settingsSaving = ref(false);

// --- Member detail drawer ---
const showMemberDetail = ref(false);
const memberDetail = ref<MemberDetail | null>(null);
const memberLoading = ref(false);

// --- Last updated ---
const lastUpdatedAt = ref<Date | null>(null);
const lastUpdatedText = ref("");
let lastUpdatedTimer: ReturnType<typeof setInterval> | null = null;

function updateLastUpdatedText() {
  if (!lastUpdatedAt.value) { lastUpdatedText.value = ""; return; }
  const diff = Date.now() - lastUpdatedAt.value.getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5) lastUpdatedText.value = t("dashboard.justUpdated");
  else if (secs < 60) lastUpdatedText.value = `${secs}${t("dashboard.secondsAgo")}`;
  else lastUpdatedText.value = `${Math.floor(secs / 60)}${t("dashboard.minutesAgo")}`;
}

// --- Polling: luân phiên dashboard ↔ activity, không block UI ---
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollPhase: "data" | "activity" = "data";

function setupPolling() {
  clearTimers();
  const interval = settings.value.pollInterval * 1000;
  if (interval <= 0) return;
  // Luân phiên: mỗi nửa interval gọi 1 loại
  const halfInterval = Math.max(interval / 2, 5000);
  pollPhase = "data";
  pollTimer = setInterval(() => {
    if (pollPhase === "data") {
      silentLoadData();
      pollPhase = "activity";
    } else {
      silentLoadActivity();
      pollPhase = "data";
    }
  }, halfInterval);
  // Cập nhật text "x giây trước" mỗi 10s
  lastUpdatedTimer = setInterval(updateLastUpdatedText, 10000);
}

function clearTimers() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (lastUpdatedTimer) { clearInterval(lastUpdatedTimer); lastUpdatedTimer = null; }
}

// Load lần đầu (có loading spinner)
async function loadData() {
  try {
    const startDate = dateRange.value?.[0] || undefined;
    const endDate = dateRange.value?.[1] || undefined;
    const res = await fetchDashboardSummary(startDate, endDate);
    data.value = res.data.data;
    lastUpdatedAt.value = new Date();
    updateLastUpdatedText();
  } catch {
    layer.msg(t("dashboard.errorLoadDashboard"), { icon: 2, time: 2000 });
  } finally {
    loading.value = false;
  }
}

// Silent load — không set loading, không scroll
async function silentLoadData() {
  try {
    const startDate = dateRange.value?.[0] || undefined;
    const endDate = dateRange.value?.[1] || undefined;
    const res = await fetchDashboardSummary(startDate, endDate);
    data.value = res.data.data;
    lastUpdatedAt.value = new Date();
    updateLastUpdatedText();
  } catch {
    // silent — không hiện lỗi khi polling
  }
}

function handleDateChange() {
  if (!data.value) { loading.value = true; loadData(); }
  else silentLoadData();
}

async function loadActivity() {
  activityLoading.value = true;
  try {
    const res = await fetchActivityFeed();
    activityItems.value = res.data.data;
  } catch {
    // silent
  } finally {
    activityLoading.value = false;
  }
}

async function silentLoadActivity() {
  try {
    const res = await fetchActivityFeed();
    activityItems.value = res.data.data;
  } catch {
    // silent
  }
}

async function loadSettings() {
  try {
    const res = await fetchDashboardSettings();
    settings.value = res.data.data;
    settingsForm.value = { ...res.data.data };
  } catch {
    // use defaults
  }
}

async function handleSaveSettings() {
  settingsSaving.value = true;
  try {
    const res = await saveDashboardSettings(settingsForm.value);
    settings.value = res.data.data;
    settingsForm.value = { ...res.data.data };
    showSettings.value = false;
    setupPolling();
    loadActivity();
    layer.msg(t("dashboard.settingsSaved"), { icon: 1, time: 1500 });
  } catch {
    layer.msg(t("dashboard.settingsError"), { icon: 2, time: 2000 });
  } finally {
    settingsSaving.value = false;
  }
}

function openSettings() {
  settingsForm.value = { ...settings.value };
  showSettings.value = true;
}

async function openMemberDetail(agentId: string, username: string) {
  showMemberDetail.value = true;
  memberLoading.value = true;
  memberDetail.value = null;
  try {
    const res = await fetchMemberDetail(agentId, username);
    memberDetail.value = res.data.data;
  } catch {
    layer.msg(t("dashboard.memberNotFound"), { icon: 2, time: 2000 });
    showMemberDetail.value = false;
  } finally {
    memberLoading.value = false;
  }
}

// Auto-reload when quick select changes (dateRange is set by composable watcher)
// Dùng silentLoadData để tránh destroy DOM → scroll reset
watch(dateQuickSelect, () => {
  if (!data.value) { loading.value = true; loadData(); }
  else silentLoadData();
});


onMounted(async () => {
  await loadSettings();
  loadData();
  loadActivity();
  setupPolling();
});

onBeforeUnmount(() => {
  clearTimers();
});

// --- KPI helpers ---
const formatMoney = fmtMoney;

function pctChange(today: number, yesterday: number): string {
  if (yesterday === 0) return today > 0 ? "+100%" : "0%";
  const pct = ((today - yesterday) / yesterday) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

function changeClass(today: number, yesterday: number): string {
  if (today > yesterday) return "kpi-up";
  if (today < yesterday) return "kpi-down";
  return "kpi-neutral";
}

// Label ghi chú "so với ..." cho KPI cards
const comparisonLabel = computed(() => {
  const q = dateQuickSelect.value;
  if (q === "today") return t("dashboard.vsYesterday");
  if (q === "yesterday") return t("dashboard.vsDayBefore");
  if (q === "thisWeek") return t("dashboard.vsLastWeek");
  if (q === "thisMonth") return t("dashboard.vsLastMonth");
  if (q === "lastMonth") return t("dashboard.vsMonthBefore");
  // Custom date range
  if (dateRange.value?.length >= 2) {
    const start = new Date(dateRange.value[0] + "T00:00:00");
    const end = new Date(dateRange.value[1] + "T00:00:00");
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    return t("dashboard.vsPrevDays", { n: days });
  }
  return t("dashboard.vsPrevPeriod");
});

const kpiCardsRow1 = computed(() => {
  if (!data.value) return [];
  const k = data.value.kpi;
  return [
    { ...k.deposit, icon: "layui-icon-dollar", color: "#009688" },
    { ...k.withdrawal, icon: "layui-icon-export", color: "#ff5722" },
    { ...k.betLottery, icon: "layui-icon-note", color: "#1e9fff" },
    { ...k.betThirdGame, icon: "layui-icon-chart-screen", color: "#ffb800" },
  ];
});

const kpiCardsRow2 = computed(() => {
  if (!data.value) return [];
  const k = data.value.kpi;
  return [
    { ...k.winLoseLottery, icon: "layui-icon-chart", color: "#009688", isMoney: true },
    { ...k.winLoseThirdGame, icon: "layui-icon-chart-screen", color: "#ff9800", isMoney: true },
    { ...k.newMembers, icon: "layui-icon-add-circle", color: "#4caf50", isCount: true },
    { ...k.lostMembers, icon: "layui-icon-close-circle", color: "#f44336", isCount: true },
  ];
});

// --- Charts ---
const trendLabel = computed(() => {
  if (!dateRange.value?.[0]) return `(7 ${t("common.days")})`;
  return `(${dateRange.value[0]} → ${dateRange.value[1]})`;
});

const trendOption = computed(() => {
  if (!data.value) return {};
  const trend = data.value.trend7d;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter, padding: [10, 14], textStyle: { fontSize: 13 }, extraCssText: "max-height:400px;overflow-y:auto;line-height:1.6" },
    legend: { data: [t("dashboard.chartDeposit"), t("dashboard.chartWithdrawal")], bottom: 0 },
    grid: { top: 10, right: 20, bottom: 35, left: 60, containLabel: false },
    xAxis: {
      type: "category",
      data: trend.map((t) => t.date.slice(5)),
      axisLabel: { fontSize: 12 },
    },
    yAxis: { type: "value", axisLabel: { formatter: yAxisMoneyFormatter } },
    series: [
      {
        name: t("dashboard.chartDeposit"),
        type: "line",
        smooth: true,
        data: trend.map((r) => r.deposit),
        itemStyle: { color: "#009688" },
        areaStyle: { color: "rgba(0, 150, 136, 0.08)" },
      },
      {
        name: t("dashboard.chartWithdrawal"),
        type: "line",
        smooth: true,
        data: trend.map((r) => r.withdrawal),
        itemStyle: { color: "#ff5722" },
        areaStyle: { color: "rgba(255, 87, 34, 0.08)" },
      },
    ],
  };
});

// --- Pie carousel (lay-carousel) ---
const pieActiveId = ref("platform");
const pieLabels = computed<Record<string, string>>(() => ({
  platform: t("dashboard.chartPlatformShare"),
  lottery: t("dashboard.chartLotteryShare"),
}));

function buildPieOption(items: { name: string; value: number }[]) {
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: 10, top: "center", textStyle: { fontSize: 11 } },
    series: [{
      type: "pie",
      radius: ["40%", "70%"],
      center: ["35%", "50%"],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: "bold" } },
      data: items.map((p) => ({ name: p.name, value: p.value })),
    }],
  };
}

const platformPieOption = computed(() => {
  if (!data.value) return {};
  return buildPieOption(data.value.platformShare.slice(0, 8));
});

const lotteryPieOption = computed(() => {
  if (!data.value) return {};
  return buildPieOption(data.value.lotteryShare.slice(0, 8));
});

const currentPieLabel = computed(() => pieLabels.value[pieActiveId.value] || pieLabels.value.platform);

// --- Activity feed helpers ---
function activityLabel(type: string): string {
  if (type === "member_new") return t("dashboard.activityNew");
  if (type === "member_lost") return t("dashboard.activityLost");
  if (type === "big_deposit") return t("dashboard.activityBigDeposit");
  if (type === "big_withdrawal") return t("dashboard.activityBigWithdraw");
  return type;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("common.justNow");
  if (mins < 60) return mins + t("common.minutesAgo");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + t("common.hoursAgo");
  return Math.floor(hours / 24) + t("common.daysAgo");
}

function activityTagClass(type: string): string {
  if (type === "member_new") return "tag-new";
  if (type === "member_lost") return "tag-lost";
  if (type === "big_deposit") return "tag-deposit";
  if (type === "big_withdrawal") return "tag-withdrawal";
  return "";
}

function formatLoginTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN");
}

// --- Agent table (lay-table) ---
const agentColumns = computed(() => {
  const dates = data.value?.agentDates ?? [];
  const dateChildren = dates.map((d) => ({
    title: d.slice(5), // "MM-DD"
    key: `online_${d}`,
    width: "56px",
    align: "center",
    customSlot: "onlineCount",
    titleSlot: () => h("span", { class: "bg-online" }, d.slice(5)),
    exportHeaderColor: "CCE5FF",
    exportCellColor: "F0F7FF",
  }));

  return [
    { title: "", exportTitle: "#", exportHeaderColor: "E0E0E0", titleSlot: () => h("span", { class: "bg-base" }, "#"), type: "number", width: "36px", align: "center" },
    { title: "", exportTitle: t("common.agent").toUpperCase(), exportHeaderColor: "E0E0E0", titleSlot: () => h("span", { class: "bg-base" }, t("common.agent").toUpperCase()), key: "name", width: "90px", ellipsisTooltip: true },
    {
      title: "",
      exportTitle: t("dashboard.memberOnline"),
      exportHeaderColor: "CCE5FF",
      exportCellColor: "F0F7FF",
      titleSlot: () => h("span", { class: "th-group bg-online" }, t("dashboard.memberOnline")),
      children: dateChildren,
    },
    {
      title: "",
      exportTitle: t("dashboard.todayLabel"),
      exportHeaderColor: "B2DFDB",
      exportCellColor: "E8F5E9",
      titleSlot: () => h("span", { class: "th-group bg-today" }, t("dashboard.todayLabel")),
      children: [
        { title: "", exportTitle: t("dashboard.exploitation"), exportHeaderColor: "B2DFDB", exportCellColor: "E8F5E9", titleSlot: () => h("span", { class: "bg-today" }, t("dashboard.exploitation")), key: "newAccountsToday", width: "68px", align: "center", customSlot: "todayCell" },
        { title: "", exportTitle: t("dashboard.betLottery"), exportHeaderColor: "B2DFDB", exportCellColor: "E8F5E9", titleSlot: () => h("span", { class: "bg-today" }, t("dashboard.betLottery")), key: "betLotteryToday", width: "72px", align: "center", customSlot: "todayMoney" },
        { title: "", exportTitle: t("dashboard.betThird"), exportHeaderColor: "B2DFDB", exportCellColor: "E8F5E9", titleSlot: () => h("span", { class: "bg-today" }, t("dashboard.betThird")), key: "betThirdToday", width: "72px", align: "center", customSlot: "todayMoney" },
        { title: "", exportTitle: t("dashboard.depositLabel"), exportHeaderColor: "B2DFDB", exportCellColor: "E8F5E9", titleSlot: () => h("span", { class: "bg-today" }, t("dashboard.depositLabel")), key: "depositToday", width: "72px", align: "center", customSlot: "todayMoney" },
      ],
    },
    {
      title: "",
      exportTitle: t("dashboard.monthTotal"),
      exportHeaderColor: "FFE0B2",
      exportCellColor: "FFF8E1",
      titleSlot: () => h("span", { class: "th-group bg-month" }, t("dashboard.monthTotal")),
      children: [
        { title: "", exportTitle: t("dashboard.depositLabel"), exportHeaderColor: "FFE0B2", exportCellColor: "FFF8E1", titleSlot: () => h("span", { class: "bg-month" }, t("dashboard.depositLabel")), key: "totalDepositMonth", width: "72px", align: "center", customSlot: "monthMoney" },
        { title: "", exportTitle: t("dashboard.betLottery"), exportHeaderColor: "FFE0B2", exportCellColor: "FFF8E1", titleSlot: () => h("span", { class: "bg-month" }, t("dashboard.betLottery")), key: "totalBetLotteryMonth", width: "72px", align: "center", customSlot: "monthMoney" },
        { title: "", exportTitle: t("dashboard.winLose"), exportHeaderColor: "FFE0B2", exportCellColor: "FFF8E1", titleSlot: () => h("span", { class: "bg-month" }, t("dashboard.winLose")), key: "winLoseLotteryMonth", width: "80px", align: "center", customSlot: "monthWinLose" },
      ],
    },
  ];
});

const agentTableData = computed(() => {
  if (!data.value) return [];
  return data.value.agents.map((agent) => {
    const row: Record<string, any> = { ...agent };
    for (const [date, count] of Object.entries(agent.onlineCounts)) {
      row[`online_${date}`] = count;
    }
    return row;
  });
});

// --- Online members dialog ---
const showOnlineMembers = ref(false);
const onlineMembersLoading = ref(false);
const onlineMembersList = ref<string[]>([]);
const onlineMembersTitle = ref("");
const onlineMembersAgentId = ref("");

async function openOnlineMembers(agentId: string, date: string) {
  const agent = data.value?.agents.find((a) => a.id === agentId);
  onlineMembersTitle.value = t("dashboard.onlineMembers", { agentName: agent?.name ?? agentId, date });
  onlineMembersAgentId.value = agentId;
  onlineMembersList.value = [];
  showOnlineMembers.value = true;
  onlineMembersLoading.value = true;
  try {
    const res = await fetchOnlineMembers(agentId, date);
    onlineMembersList.value = res.data.data;
  } catch {
    layer.msg(t("dashboard.errorLoadMembers"), { icon: 2, time: 2000 });
  } finally {
    onlineMembersLoading.value = false;
  }
}

</script>

<template>
  <div class="dashboard">
    <!-- Loading skeleton -->
    <div v-if="loading" class="dashboard-loading">
      <i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop" style="font-size: 32px; color: #009688"></i>
    </div>

    <template v-else-if="data">
      <!-- === DATE RANGE FILTER === -->
      <div class="dashboard-filter">
        <lay-select v-model="dateQuickSelect" :style="{ width: dateQuickWidth }" size="sm">
          <lay-select-option v-for="opt in dateQuickOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </lay-select>
        <lay-date-picker
          v-model="dateRange"
          range
          single-panel
          range-separator="-"
          :placeholder="[t('common.dateStart'), t('common.dateEnd')]"
          :allow-clear="true"
          size="sm"
          @change="handleDateChange"
        />
        <span v-if="lastUpdatedText" class="last-updated">
          <i class="layui-icon layui-icon-ok-circle" style="font-size: 12px; margin-right: 3px"></i>
          {{ lastUpdatedText }}
        </span>
      </div>

      <!-- === KPI CARDS ROW 1 === -->
      <div class="kpi-grid">
        <div v-for="card in kpiCardsRow1" :key="card.label" class="kpi-card">
          <div class="kpi-icon" :style="{ background: card.color }">
            <i class="layui-icon" :class="card.icon"></i>
          </div>
          <div class="kpi-body">
            <div class="kpi-label">{{ card.label }}</div>
            <div class="kpi-value">{{ formatMoney(card.value) }}</div>
            <div class="kpi-meta">
              <span class="kpi-count">{{ card.count }} {{ t('dashboard.unitOrders') }}</span>
              <span :class="changeClass(card.value, card.yesterdayValue)">
                {{ pctChange(card.value, card.yesterdayValue) }}
              </span>
              <span class="kpi-compare">{{ comparisonLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- === KPI CARDS ROW 2 === -->
      <div class="kpi-grid">
        <div v-for="card in kpiCardsRow2" :key="card.label" class="kpi-card">
          <div class="kpi-icon" :style="{ background: card.color }">
            <i class="layui-icon" :class="card.icon"></i>
          </div>
          <div class="kpi-body">
            <div class="kpi-label">{{ card.label }}</div>
            <div class="kpi-value" :class="card.isMoney ? (card.value >= 0 ? 'text-green' : 'text-red') : ''">
              {{ card.isCount ? card.value : formatMoney(card.value) }}
            </div>
            <div class="kpi-meta">
              <span class="kpi-count">{{ card.isCount ? card.count + ' ' + t('dashboard.unitCustomers') : card.count + ' ' + t('dashboard.unitOrders') }}</span>
              <span :class="changeClass(card.value, card.yesterdayValue)">
                {{ pctChange(card.value, card.yesterdayValue) }}
              </span>
              <span class="kpi-compare">{{ comparisonLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- === CHARTS ROW === -->
      <lay-row :space="15" class="chart-row">
        <lay-col :md="15">
          <lay-card>
            <div class="section-header">
              {{ t('dashboard.chartDeposit') }} / {{ t('dashboard.chartWithdrawal') }} {{ trendLabel }}
              <i v-if="authStore.isAdmin" class="layui-icon layui-icon-set section-settings-btn" :title="t('dashboard.dashboardSettings')" @click="openSettings"></i>
            </div>
            <v-chart :option="trendOption" autoresize style="height: 280px" />
          </lay-card>
        </lay-col>
        <lay-col :md="9">
          <lay-card>
            <div class="section-header">
              {{ currentPieLabel }}
              <i v-if="authStore.isAdmin" class="layui-icon layui-icon-set section-settings-btn" :title="t('dashboard.dashboardSettings')" @click="openSettings"></i>
            </div>
            <lay-carousel v-model="pieActiveId" anim="fade" :autoplay="true" :interval="8000" indicator="outside" arrow="always" class="pie-carousel">
              <lay-carousel-item id="platform">
                <v-chart :option="platformPieOption" autoresize class="pie-chart" />
              </lay-carousel-item>
              <lay-carousel-item id="lottery">
                <v-chart :option="lotteryPieOption" autoresize class="pie-chart" />
              </lay-carousel-item>
            </lay-carousel>
          </lay-card>
        </lay-col>
      </lay-row>

      <!-- === AGENT TABLE === -->
      <lay-card class="section-card">
        <div class="section-header">{{ t('dashboard.agentOverview') }}</div>
        <lay-table :columns="agentColumns" :data-source="agentTableData" size="sm" :default-toolbar="true">
          <template #toolbar>
            <div class="agent-toolbar">
              <lay-select v-model="dateQuickSelect" :style="{ width: dateQuickWidth }" size="xs">
                <lay-select-option v-for="opt in dateQuickOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
              </lay-select>
              <lay-date-picker
                v-model="dateRange"
                range
                single-panel
                range-separator="-"
                :placeholder="[t('common.dateStart'), t('common.dateEnd')]"
                :allow-clear="true"
                size="xs"
                @change="handleDateChange"
              />
            </div>
          </template>
          <template #onlineCount="{ row, column }">
            <span
              class="online-cell"
              :class="{ clickable: row[column.key] > 0 }"
              @click="row[column.key] > 0 && openOnlineMembers(row.id, column.key.replace('online_', ''))"
            >
              {{ row[column.key] || 0 }}
            </span>
          </template>
          <template #todayCell="{ row, column }">
            <span class="td-today">
              {{ row[column.key] ?? 0 }}
            </span>
          </template>
          <template #todayMoney="{ row, column }">
            <span class="td-today">{{ formatMoney(row[column.key] ?? 0) }}</span>
          </template>
          <template #monthMoney="{ row, column }">
            <span class="td-month">{{ formatMoney(row[column.key] ?? 0) }}</span>
          </template>
          <template #monthWinLose="{ row, column }">
            <span class="td-month" :class="row[column.key] >= 0 ? 'text-green' : 'text-red'">
              {{ formatMoney(row[column.key] ?? 0) }}
            </span>
          </template>
        </lay-table>
      </lay-card>

      <!-- === BOTTOM ROW: Activity Feed + Quick Info === -->
      <lay-row :space="15" class="bottom-row">
        <lay-col :md="16">
          <lay-card>
            <div class="section-header">
              {{ t('dashboard.recentActivity') }}
              <span class="poll-badge" v-if="settings.pollInterval > 0">
                <i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop" style="font-size: 12px"></i>
                {{ settings.pollInterval >= 60 ? Math.round(settings.pollInterval / 60) + 'p' : settings.pollInterval + 's' }}
              </span>
              <i v-if="authStore.isAdmin" class="layui-icon layui-icon-set section-settings-btn" :title="t('dashboard.dashboardSettings')" @click="openSettings"></i>
            </div>

            <div class="activity-feed">
              <!-- Column headers -->
              <div class="activity-header">
                <span class="ah-type">{{ t('common.status') }}</span>
                <span class="ah-agent">{{ t('common.agent') }}</span>
                <span class="ah-user">{{ t('common.username') }}</span>
                <span class="ah-money">{{ t('common.amount') }}</span>
                <span class="ah-time">{{ t('common.time') }}</span>
              </div>
              <template v-if="activityItems.length > 0">
                <div v-for="item in activityItems" :key="item.id" class="activity-item">
                  <span class="activity-tag" :class="activityTagClass(item.type)">{{ activityLabel(item.type) }}</span>
                  <span class="activity-agent">{{ item.agentName }}</span>
                  <span class="activity-username" @click="openMemberDetail(item.agentId, item.username)">{{ item.username }}</span>
                  <span class="activity-money" :class="{ 'money-deposit': item.type === 'big_deposit' || item.type === 'member_new', 'money-withdrawal': item.type === 'big_withdrawal' || item.type === 'member_lost' }">
                    {{ item.money ? formatMoney(Number(item.money)) : "—" }}
                  </span>
                  <span class="activity-time">{{ timeAgo(item.createdAt) }}</span>
                </div>
              </template>
              <div v-else class="activity-empty">
                {{ activityLoading ? t('common.loading') : t('dashboard.noActivity') }}
              </div>
            </div>
          </lay-card>
        </lay-col>
        <lay-col :md="8">
          <lay-card class="info-card">
            <div class="section-header">{{ t('dashboard.quickInfo') }}</div>
            <div class="info-row">
              <span class="info-label">{{ t('dashboard.lastLogin') }}</span>
              <span class="info-val">{{ formatLoginTime(data.loginInfo.lastLoginAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('dashboard.loginIp') }}</span>
              <span class="info-val">{{ data.loginInfo.lastLoginIp || "—" }}</span>
            </div>
            <lay-line margin="12px 0" />
            <div class="info-row">
              <span class="info-label">{{ t('dashboard.totalAgent') }}</span>
              <span class="info-val">{{ data.agentSessionSummary.total }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('dashboard.activeAgent') }}</span>
              <span class="info-val" style="color: #009688; font-weight: 600">{{ data.agentSessionSummary.active }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('dashboard.errorAgent') }}</span>
              <span class="info-val" style="color: #ff5722; font-weight: 600">{{ data.agentSessionSummary.error }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('dashboard.offlineAgent') }}</span>
              <span class="info-val" style="color: #999">{{ data.agentSessionSummary.offline }}</span>
            </div>
          </lay-card>
        </lay-col>
      </lay-row>
    </template>

    <!-- === SETTINGS DRAWER === -->
    <lay-layer
      v-model="showSettings"
      :title="t('dashboard.dashboardSettings')"
      :area="['400px', '380px']"
      :shadeClose="true"
    >
      <div class="settings-panel">
        <div class="settings-row">
          <label>{{ t('dashboard.pollInterval') }}</label>
          <lay-input v-model.number="settingsForm.pollInterval" placeholder="60" type="number" size="sm" />
          <span class="settings-hint">{{ t('dashboard.pollHint') }}</span>
        </div>
        <div class="settings-row">
          <label>{{ t('dashboard.bigDepositThreshold') }}</label>
          <lay-input v-model.number="settingsForm.bigDepositMin" placeholder="10000000" type="number" size="sm" />
          <span class="settings-hint">{{ t('dashboard.bigDepositHint') }}</span>
        </div>
        <div class="settings-row">
          <label>{{ t('dashboard.bigWithdrawThreshold') }}</label>
          <lay-input v-model.number="settingsForm.bigWithdrawMin" placeholder="10000000" type="number" size="sm" />
          <span class="settings-hint">{{ t('dashboard.bigWithdrawHint') }}</span>
        </div>
        <div class="settings-actions">
          <lay-button type="primary" size="sm" :loading="settingsSaving" @click="handleSaveSettings">{{ t('common.save') }}</lay-button>
          <lay-button size="sm" @click="showSettings = false">{{ t('common.cancel') }}</lay-button>
        </div>
      </div>
    </lay-layer>

    <!-- === MEMBER DETAIL DRAWER === -->
    <lay-layer
      v-model="showMemberDetail"
      :title="t('dashboard.memberDetail')"
      :area="['480px', '500px']"
      :shadeClose="true"
    >
      <div class="member-detail-panel">
        <div v-if="memberLoading" class="member-loading">
          <i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop" style="font-size: 24px; color: #009688"></i>
        </div>
        <template v-else-if="memberDetail">
          <div class="detail-row">
            <span class="detail-label">{{ t('common.username') }}</span>
            <span class="detail-val text-bold">{{ memberDetail.username }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('dashboard.memberType') }}</span>
            <span class="detail-val">{{ memberDetail.typeFormat || "—" }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('dashboard.memberParent') }}</span>
            <span class="detail-val">{{ memberDetail.parentUser || "—" }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('dashboard.memberStatus') }}</span>
            <span class="detail-val">{{ memberDetail.statusFormat || "—" }}</span>
          </div>
          <lay-line margin="12px 0" />
          <div class="detail-row">
            <span class="detail-label">{{ t('dashboard.memberBalance') }}</span>
            <span class="detail-val text-bold" style="color: #009688">{{ formatMoney(Number(memberDetail.money || 0)) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('dashboard.memberTotalDeposit') }}</span>
            <span class="detail-val">{{ formatMoney(Number(memberDetail.depositAmount)) }} ({{ memberDetail.depositCount }} {{ t('notification.times') }})</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('dashboard.memberTotalWithdraw') }}</span>
            <span class="detail-val">{{ formatMoney(Number(memberDetail.withdrawalAmount)) }} ({{ memberDetail.withdrawalCount }} {{ t('notification.times') }})</span>
          </div>
          <lay-line margin="12px 0" />
          <div class="detail-row">
            <span class="detail-label">{{ t('dashboard.memberRegisterTime') }}</span>
            <span class="detail-val">{{ memberDetail.registerTime || "—" }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('dashboard.memberLastLogin') }}</span>
            <span class="detail-val">{{ memberDetail.loginTime || "—" }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('dashboard.memberSyncTime') }}</span>
            <span class="detail-val">{{ formatLoginTime(memberDetail.syncedAt) }}</span>
          </div>
        </template>
      </div>
    </lay-layer>

    <!-- === ONLINE MEMBERS DIALOG === -->
    <lay-layer
      v-model="showOnlineMembers"
      :title="onlineMembersTitle"
      :area="['420px', '500px']"
      :shadeClose="true"
    >
      <div class="online-members-panel">
        <div v-if="onlineMembersLoading" class="member-loading">
          <i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop" style="font-size: 24px; color: #009688"></i>
        </div>
        <template v-else>
          <div class="online-members-count">{{ t('dashboard.totalMembers', { n: onlineMembersList.length }) }}</div>
          <div class="online-members-list">
            <div
              v-for="username in onlineMembersList"
              :key="username"
              class="online-member-item"
              @click="openMemberDetail(onlineMembersAgentId, username)"
            >
              <i class="layui-icon layui-icon-username" style="font-size: 14px; color: #999; margin-right: 6px"></i>
              {{ username }}
            </div>
          </div>
          <div v-if="onlineMembersList.length === 0" class="activity-empty">
            {{ t('dashboard.noOnlineMembers') }}
          </div>
        </template>
      </div>
    </lay-layer>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 0;
}

.dashboard-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

/* === DATE RANGE FILTER === */
.dashboard-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.last-updated {
  margin-left: auto;
  font-size: 12px;
  color: #999;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.agent-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* === KPI GRID === */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.kpi-card {
  background: #fff;
  border-radius: 4px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon .layui-icon {
  font-size: 22px;
  color: #fff;
}

.kpi-body {
  flex: 1;
  min-width: 0;
}

.kpi-label {
  font-size: 13px;
  color: #888;
  margin-bottom: 4px;
}

.kpi-value {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
}

.kpi-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-top: 4px;
  font-size: 12px;
}

.kpi-count {
  color: #999;
}

.kpi-compare {
  color: #bbb;
  font-size: 11px;
  font-style: italic;
}

.kpi-up {
  color: #009688;
}

.kpi-down {
  color: #ff5722;
}

.kpi-neutral {
  color: #999;
}

/* === SECTIONS === */
.section-header {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-settings-btn {
  font-size: 16px;
  color: #999;
  cursor: pointer;
  margin-left: auto;
  transition: color 0.2s;
}

.section-settings-btn:hover {
  color: #009688;
}

.poll-badge {
  font-size: 11px;
  color: #999;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f5f5f5;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 400;
}

.section-card {
  margin-bottom: 15px;
}

.chart-row {
  margin-bottom: 0;
}

.chart-row :deep(.layui-col-md15),
.chart-row :deep(.layui-col-md9),
.bottom-row :deep(.layui-col-md16),
.bottom-row :deep(.layui-col-md8) {
  display: flex;
  flex-direction: column;
}

.chart-row :deep(.layui-col-md15 > .layui-card),
.chart-row :deep(.layui-col-md9 > .layui-card),
.bottom-row :deep(.layui-col-md16 > .layui-card),
.bottom-row :deep(.layui-col-md8 > .layui-card) {
  flex: 1;
}

/* === PIE CAROUSEL === */
.pie-carousel {
  flex: 1;
}

.pie-carousel :deep(.layui-carousel),
.pie-carousel :deep(.layui-carousel-item) {
  background: #fff;
}

.pie-chart {
  width: 100%;
  height: 100%;
  min-height: 240px;
}


.bottom-row {
  margin-top: 0;
}

/* === AGENT TABLE (lay-table) === */
.section-card :deep(.layui-table) {
  font-size: 13px;
}

.section-card :deep(.layui-table th) {
  font-size: 12px;
  padding: 8px 6px;
  text-align: center;
  white-space: nowrap;
  text-transform: uppercase;
  font-weight: 700;
}

.section-card :deep(.layui-table td) {
  padding: 8px 8px;
  font-size: 13px;
  text-align: center;
}

.section-card :deep(.th-group) {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Tiêu đề: nền đậm + border cùng màu */
.section-card :deep(th:has(.bg-base)) {
  background: #e0e0e0;
  border-color: #bdbdbd;
}

.section-card :deep(th:has(.bg-online)) {
  background: #cce5ff;
  border-color: #90caf9;
}

.section-card :deep(th:has(.bg-today)) {
  background: #b2dfdb;
  border-color: #80cbc4;
}

.section-card :deep(th:has(.bg-month)) {
  background: #ffe0b2;
  border-color: #ffcc80;
}

/* Dữ liệu: nền nhạt + border cùng màu */
.section-card :deep(td:has(.online-cell)) {
  background: #f0f7ff;
  border-color: #d6e8ff;
}

.section-card :deep(td:has(.td-today)) {
  background: #e8f5e9;
  border-color: #c8e6c9;
}

.section-card :deep(td:has(.td-month)) {
  background: #fff8e1;
  border-color: #ffecb3;
}

.online-cell {
  display: inline-block;
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: #bbb;
}

.online-cell.clickable {
  color: #1e9fff;
  cursor: pointer;
  font-weight: 600;
}

.online-cell.clickable:hover {
  color: #009688;
  text-decoration: underline;
}

/* === ONLINE MEMBERS DIALOG === */
.online-members-panel {
  padding: 16px 20px;
}

.online-members-count {
  font-size: 13px;
  color: #888;
  margin-bottom: 10px;
  font-weight: 500;
}

.online-members-list {
  max-height: 360px;
  overflow-y: auto;
}

.online-member-item {
  display: flex;
  align-items: center;
  padding: 7px 10px;
  font-size: 13px;
  color: #1e9fff;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.15s;
}

.online-member-item:hover {
  background: #f0faff;
  color: #009688;
}

.online-member-item:last-child {
  border-bottom: none;
}

.text-green {
  color: #009688;
}

.text-red {
  color: #ff5722;
}

.text-bold {
  font-weight: 600;
}

/* === ACTIVITY FEED === */
.activity-feed {
  max-height: 380px;
  overflow-y: auto;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 2px solid #e8e8e8;
  font-size: 12px;
  font-weight: 600;
  color: #888;
}

.ah-type,
.ah-agent,
.ah-user,
.ah-money,
.ah-time { flex: 1; min-width: 0; }
.ah-money { text-align: right; }
.ah-time { text-align: right; }

.activity-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px dashed #f0f0f0;
  font-size: 13px;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-tag,
.activity-agent,
.activity-username,
.activity-money,
.activity-time {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-tag {
  text-align: center;
  padding: 1px 0;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  line-height: 20px;
}

.tag-new { background: #e6f7f5; color: #009688; }
.tag-lost { background: #fff0ec; color: #ff5722; }
.tag-deposit { background: #e8f4ff; color: #1e9fff; }
.tag-withdrawal { background: #fff8e6; color: #e6a200; }

.activity-agent {
  font-weight: 500;
  color: #888;
  font-size: 12px;
}

.activity-username {
  color: #1e9fff;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.activity-username:hover {
  color: #009688;
  text-decoration: underline;
}

.activity-money {
  text-align: right;
  font-weight: 600;
  font-size: 12px;
}

.money-deposit {
  color: #009688;
}

.money-withdrawal {
  color: #ff5722;
}

.activity-time {
  text-align: right;
  font-size: 12px;
  color: #bbb;
}

.activity-empty {
  text-align: center;
  color: #999;
  padding: 30px 0;
  font-size: 13px;
}

/* === INFO CARD === */
.info-card {
  height: 100%;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
}

.info-label {
  color: #888;
}

.info-val {
  color: #333;
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}


/* === SETTINGS PANEL === */
.settings-panel {
  padding: 20px;
}

.settings-row {
  margin-bottom: 16px;
}

.settings-row label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.settings-hint {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.settings-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

/* === MEMBER DETAIL PANEL === */
.member-detail-panel {
  padding: 20px;
}

.member-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid #f5f5f5;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: #888;
  flex-shrink: 0;
}

.detail-val {
  color: #333;
  text-align: right;
  word-break: break-all;
}

/* === RESPONSIVE === */
@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>

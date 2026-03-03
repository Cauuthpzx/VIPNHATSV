<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import VChart from "vue-echarts";
import {
  registerCharts,
  shortDate,
  tooltipFormatter,
  yAxisMoneyFormatter,
  formatMoney,
  COLORS,
  PALETTE,
} from "@/composables/useCharts";
import { fetchAgentPerformance, type AgentPerformance } from "@/api/services/analytics";

registerCharts();

const { t } = useI18n();
const loading = ref(true);
const data = ref<AgentPerformance | null>(null);
const days = ref(30);

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchAgentPerformance(days.value);
    data.value = res.data.data;
  } catch {
    layer.msg(t("common.errorLoad"), { icon: 2, time: 2000 });
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

function changeDays(d: number) {
  days.value = d;
  loadData();
}

// --- Charts ---
const overviewOption = computed(() => {
  if (!data.value) return {};
  const agents = data.value.agentOverview;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    legend: {
      data: [
        t("analyticsAgents.deposit"),
        t("analyticsAgents.withdraw"),
        t("analyticsAgents.betLottery"),
        t("analyticsAgents.betThird"),
      ],
      bottom: 0,
    },
    grid: { top: 10, right: 20, bottom: 35, left: 10, containLabel: true },
    xAxis: { type: "category", data: agents.map((a) => a.name), axisLabel: { rotate: 30, fontSize: 11 } },
    yAxis: { type: "value", axisLabel: { formatter: yAxisMoneyFormatter } },
    series: [
      {
        name: t("analyticsAgents.deposit"),
        type: "bar",
        data: agents.map((a) => a.totalDeposit),
        itemStyle: { color: COLORS.green },
      },
      {
        name: t("analyticsAgents.withdraw"),
        type: "bar",
        data: agents.map((a) => a.totalWithdrawal),
        itemStyle: { color: COLORS.red },
      },
      {
        name: t("analyticsAgents.betLottery"),
        type: "bar",
        data: agents.map((a) => a.lotteryBet),
        itemStyle: { color: COLORS.blue },
      },
      {
        name: t("analyticsAgents.betThird"),
        type: "bar",
        data: agents.map((a) => a.thirdBet),
        itemStyle: { color: COLORS.yellow },
      },
    ],
  };
});

const commissionTrendOption = computed(() => {
  if (!data.value) return {};
  const ct = data.value.agentCommissionTrend;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    legend: { data: [t("analyticsAgents.commission"), t("analyticsAgents.promotion")], bottom: 0 },
    grid: { top: 10, right: 20, bottom: 55, left: 60, containLabel: false },
    dataZoom: [{ type: "inside" }, { type: "slider", bottom: 25, height: 18 }],
    xAxis: { type: "category", data: ct.map((d) => shortDate(d.date)) },
    yAxis: { type: "value", axisLabel: { formatter: yAxisMoneyFormatter } },
    series: [
      {
        name: t("analyticsAgents.commission"),
        type: "bar",
        data: ct.map((d) => d.commission),
        itemStyle: { color: COLORS.yellow },
      },
      {
        name: t("analyticsAgents.promotion"),
        type: "line",
        smooth: true,
        data: ct.map((d) => d.promotion),
        itemStyle: { color: COLORS.purple },
      },
    ],
  };
});

// Stacked line: deposit by agent over 7 days
const agentTrendOption = computed(() => {
  if (!data.value || data.value.agentTrend.length === 0) return {};
  const at = data.value.agentTrend;
  const agentNames = at[0]?.agents.map((a) => a.name) ?? [];
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    legend: { data: agentNames, bottom: 0, textStyle: { fontSize: 10 } },
    grid: { top: 10, right: 20, bottom: 55, left: 60, containLabel: false },
    xAxis: { type: "category", data: at.map((d) => shortDate(d.date)) },
    yAxis: { type: "value", axisLabel: { formatter: yAxisMoneyFormatter } },
    series: agentNames.map((name, i) => ({
      name,
      type: "line",
      smooth: true,
      stack: "deposit",
      areaStyle: { opacity: 0.3 },
      data: at.map((d) => d.agents[i]?.deposit ?? 0),
      itemStyle: { color: PALETTE[i % PALETTE.length] },
    })),
  };
});

// Login stats
const loginOption = computed(() => {
  if (!data.value) return {};
  const items = data.value.loginHistory;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    legend: { data: [t("analyticsAgents.success"), t("analyticsAgents.failed")], bottom: 0 },
    grid: { top: 10, right: 20, bottom: 35, left: 10, containLabel: true },
    xAxis: { type: "category", data: items.map((a) => a.agentName), axisLabel: { rotate: 30, fontSize: 11 } },
    yAxis: { type: "value" },
    series: [
      {
        name: t("analyticsAgents.success"),
        type: "bar",
        stack: "login",
        data: items.map((a) => a.successCount),
        itemStyle: { color: COLORS.green },
      },
      {
        name: t("analyticsAgents.failed"),
        type: "bar",
        stack: "login",
        data: items.map((a) => a.failCount),
        itemStyle: { color: COLORS.red },
      },
    ],
  };
});

function statusColor(s: string): string {
  if (s === "active") return "#009688";
  if (s === "error") return "#ff5722";
  return "#999";
}

function statusLabel(s: string): string {
  if (s === "active") return "Active";
  if (s === "error") return "Error";
  return "Offline";
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + t("common.minutesAgo");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + t("common.hoursAgo");
  return Math.floor(hours / 24) + t("common.daysAgo");
}

// Summary KPIs
const totalDeposit = computed(() => data.value?.agentOverview.reduce((s, a) => s + a.totalDeposit, 0) ?? 0);
const totalCommission = computed(() => data.value?.agentOverview.reduce((s, a) => s + a.commission, 0) ?? 0);
const totalUsers = computed(() => data.value?.agentOverview.reduce((s, a) => s + a.userCount, 0) ?? 0);
</script>

<template>
  <div class="analytics-page">
    <div class="page-header">
      <div class="page-title">
        {{ t("analyticsAgents.title") }}
      </div>
      <div class="day-filter">
        <lay-button
          v-for="d in [7, 14, 30, 60, 90]"
          :key="d"
          :type="days === d ? 'primary' : undefined"
          size="sm"
          @click="changeDays(d)"
        >
          {{ d }} {{ t("common.days") }}
        </lay-button>
      </div>
    </div>

    <div v-if="loading" class="loading-center">
      <i
        class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop"
        style="font-size: 32px; color: #009688"
      />
    </div>

    <template v-else-if="data">
      <!-- KPI row -->
      <div class="kpi-row">
        <div class="kpi-mini">
          <div class="kpi-mini-label">
            {{ t("analyticsAgents.totalAgents") }}
          </div>
          <div class="kpi-mini-value">
            {{ data.agentOverview.length }}
          </div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-label">
            {{ t("analyticsAgents.totalDeposit", { days }) }}
          </div>
          <div class="kpi-mini-value text-green">
            {{ formatMoney(totalDeposit) }}
          </div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-label">
            {{ t("analyticsAgents.totalCommission") }}
          </div>
          <div class="kpi-mini-value" style="color: #ffb800">
            {{ formatMoney(totalCommission) }}
          </div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-label">
            {{ t("analyticsAgents.totalMembers") }}
          </div>
          <div class="kpi-mini-value">
            {{ totalUsers.toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- Overview bar chart -->
      <lay-card class="section-card">
        <div class="section-header">
          {{ t("analyticsAgents.compareTitle") }}
        </div>
        <v-chart :option="overviewOption" autoresize style="height: 320px" />
      </lay-card>

      <!-- Agent deposit trend (stacked area 7d) -->
      <lay-card class="section-card">
        <div class="section-header">
          {{ t("analyticsAgents.depositTrend") }}
        </div>
        <v-chart :option="agentTrendOption" autoresize style="height: 300px" />
      </lay-card>

      <!-- Commission trend -->
      <lay-card class="section-card">
        <div class="section-header">
          {{ t("analyticsAgents.commissionByDay") }}
        </div>
        <v-chart :option="commissionTrendOption" autoresize style="height: 280px" />
      </lay-card>

      <!-- Login history chart -->
      <lay-card class="section-card">
        <div class="section-header">
          {{ t("analyticsAgents.loginHistory") }}
        </div>
        <v-chart :option="loginOption" autoresize style="height: 280px" />
      </lay-card>

      <!-- Agent detail table -->
      <lay-card class="section-card">
        <div class="section-header">
          {{ t("analyticsAgents.agentDetail") }}
        </div>
        <div style="overflow-x: auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t("analyticsAgents.agentCol") }}</th>
                <th>{{ t("analyticsAgents.statusCol") }}</th>
                <th style="text-align: right">
                  {{ t("analyticsAgents.memberCount") }}
                </th>
                <th style="text-align: right">
                  {{ t("analyticsAgents.totalDepositCol") }}
                </th>
                <th style="text-align: right">
                  {{ t("analyticsAgents.totalWithdrawCol") }}
                </th>
                <th style="text-align: right">
                  {{ t("analyticsAgents.betLotteryCol") }}
                </th>
                <th style="text-align: right">
                  {{ t("analyticsAgents.wlLotteryCol") }}
                </th>
                <th style="text-align: right">
                  {{ t("analyticsAgents.betThirdCol") }}
                </th>
                <th style="text-align: right">
                  {{ t("analyticsAgents.wlThirdCol") }}
                </th>
                <th style="text-align: right">
                  {{ t("analyticsAgents.commissionCol") }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in data.agentOverview" :key="a.name">
                <td class="text-bold">
                  {{ a.name }}
                </td>
                <td>
                  <span class="status-badge" :style="{ background: statusColor(a.status) }">{{
                    statusLabel(a.status)
                  }}</span>
                </td>
                <td style="text-align: right">
                  {{ a.userCount.toLocaleString() }}
                </td>
                <td style="text-align: right" class="text-green">
                  {{ formatMoney(a.totalDeposit) }}
                </td>
                <td style="text-align: right" class="text-red">
                  {{ formatMoney(a.totalWithdrawal) }}
                </td>
                <td style="text-align: right">
                  {{ formatMoney(a.lotteryBet) }}
                </td>
                <td style="text-align: right" :class="a.lotteryWinLose >= 0 ? 'text-red' : 'text-green'">
                  {{ formatMoney(Math.abs(a.lotteryWinLose)) }}
                </td>
                <td style="text-align: right">
                  {{ formatMoney(a.thirdBet) }}
                </td>
                <td style="text-align: right" :class="a.thirdWinLose >= 0 ? 'text-red' : 'text-green'">
                  {{ formatMoney(Math.abs(a.thirdWinLose)) }}
                </td>
                <td style="text-align: right; color: #ffb800; font-weight: 500">
                  {{ formatMoney(a.commission) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </lay-card>

      <!-- Login detail table -->
      <lay-card class="section-card">
        <div class="section-header">
          {{ t("analyticsAgents.loginDetail") }}
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t("analyticsAgents.agentCol") }}</th>
              <th style="text-align: right">
                {{ t("analyticsAgents.successCount") }}
              </th>
              <th style="text-align: right">
                {{ t("analyticsAgents.failedCount") }}
              </th>
              <th style="text-align: right">
                {{ t("analyticsAgents.avgCaptcha") }}
              </th>
              <th>{{ t("analyticsAgents.lastLoginCol") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in data.loginHistory" :key="l.agentName">
              <td class="text-bold">
                {{ l.agentName }}
              </td>
              <td style="text-align: right" class="text-green">
                {{ l.successCount }}
              </td>
              <td style="text-align: right" class="text-red">
                {{ l.failCount }}
              </td>
              <td style="text-align: right">
                {{ l.avgCaptchaAttempts }}
              </td>
              <td>{{ timeAgo(l.lastLogin) }}</td>
            </tr>
          </tbody>
        </table>
      </lay-card>
    </template>
  </div>
</template>

<style scoped>
@import "./analytics-shared.css";
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import VChart from "vue-echarts";
import { registerCharts, shortDate, tooltipFormatter, yAxisMoneyFormatter, formatMoney, COLORS, PALETTE } from "@/composables/useCharts";
import { fetchBettingAnalytics, type BettingAnalytics } from "@/api/services/analytics";

registerCharts();

const { t } = useI18n();
const loading = ref(true);
const data = ref<BettingAnalytics | null>(null);
const days = ref(30);

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchBettingAnalytics(days.value);
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
const lotteryTrendOption = computed(() => {
  if (!data.value) return {};
  const lt = data.value.lotteryTrend;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    legend: { data: [t("analyticsBetting.bet"), "Win/Lose"], bottom: 0 },
    grid: { top: 10, right: 20, bottom: 55, left: 60, containLabel: false },
    dataZoom: [{ type: "inside" }, { type: "slider", bottom: 25, height: 18 }],
    xAxis: { type: "category", data: lt.map((d) => shortDate(d.date)) },
    yAxis: { type: "value", axisLabel: { formatter: yAxisMoneyFormatter } },
    series: [
      { name: t("analyticsBetting.bet"), type: "bar", data: lt.map((d) => d.betAmount), itemStyle: { color: COLORS.blue } },
      { name: "Win/Lose", type: "line", smooth: true, data: lt.map((d) => d.winLose), itemStyle: { color: COLORS.red }, yAxisIndex: 0 },
    ],
  };
});

const thirdTrendOption = computed(() => {
  if (!data.value) return {};
  const tt = data.value.thirdGameTrend;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    legend: { data: [t("analyticsBetting.betThird"), "Win/Lose"], bottom: 0 },
    grid: { top: 10, right: 20, bottom: 55, left: 60, containLabel: false },
    dataZoom: [{ type: "inside" }, { type: "slider", bottom: 25, height: 18 }],
    xAxis: { type: "category", data: tt.map((d) => shortDate(d.date)) },
    yAxis: { type: "value", axisLabel: { formatter: yAxisMoneyFormatter } },
    series: [
      { name: t("analyticsBetting.betThird"), type: "bar", data: tt.map((d) => d.betAmount), itemStyle: { color: COLORS.yellow } },
      { name: "Win/Lose", type: "line", smooth: true, data: tt.map((d) => d.winLose), itemStyle: { color: COLORS.red } },
    ],
  };
});

const profitOption = computed(() => {
  if (!data.value) return {};
  const pd = data.value.profitByDay;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    legend: { data: [t("analyticsBetting.profitLottery"), t("analyticsBetting.profitThird"), t("analyticsBetting.total")], bottom: 0 },
    grid: { top: 10, right: 20, bottom: 55, left: 60, containLabel: false },
    dataZoom: [{ type: "inside" }, { type: "slider", bottom: 25, height: 18 }],
    xAxis: { type: "category", data: pd.map((d) => shortDate(d.date)) },
    yAxis: { type: "value", axisLabel: { formatter: yAxisMoneyFormatter } },
    series: [
      { name: t("analyticsBetting.profitLottery"), type: "bar", stack: "profit", data: pd.map((d) => d.lotteryProfit), itemStyle: { color: COLORS.blue } },
      { name: t("analyticsBetting.profitThird"), type: "bar", stack: "profit", data: pd.map((d) => d.thirdGameProfit), itemStyle: { color: COLORS.yellow } },
      { name: t("analyticsBetting.total"), type: "line", smooth: true, data: pd.map((d) => d.totalProfit), itemStyle: { color: COLORS.green }, lineStyle: { width: 2 } },
    ],
  };
});

const lotteryTypeOption = computed(() => {
  if (!data.value) return {};
  const items = data.value.lotteryByType;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    grid: { top: 10, right: 20, bottom: 5, left: 10, containLabel: true },
    xAxis: { type: "value", axisLabel: { formatter: yAxisMoneyFormatter } },
    yAxis: { type: "category", data: items.map((d) => d.name).reverse(), axisLabel: { fontSize: 11, width: 100, overflow: "truncate" } },
    series: [{ name: t("analyticsBetting.bet"), type: "bar", data: items.map((d) => d.betAmount).reverse(), itemStyle: { color: COLORS.blue } }],
  };
});

const platformOption = computed(() => {
  if (!data.value) return {};
  const items = data.value.platformRanking.slice(0, 10);
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: 10, top: "center", textStyle: { fontSize: 11 } },
    series: [{
      type: "pie", radius: ["35%", "65%"], center: ["35%", "50%"],
      itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12 } },
      data: items.map((d, i) => ({ name: d.name, value: d.betAmount, itemStyle: { color: PALETTE[i % PALETTE.length] } })),
    }],
  };
});

// KPI summaries
const totalLotteryBet = computed(() => data.value?.lotteryTrend.reduce((s, d) => s + d.betAmount, 0) ?? 0);
const totalThirdBet = computed(() => data.value?.thirdGameTrend.reduce((s, d) => s + d.betAmount, 0) ?? 0);
const totalProfit = computed(() => data.value?.profitByDay.reduce((s, d) => s + d.totalProfit, 0) ?? 0);
const totalBetCount = computed(() => data.value?.lotteryTrend.reduce((s, d) => s + d.betCount, 0) ?? 0);
</script>

<template>
  <div class="analytics-page">
    <div class="page-header">
      <div class="page-title">{{ t('analyticsBetting.title') }}</div>
      <div class="day-filter">
        <lay-button v-for="d in [7, 14, 30, 60, 90]" :key="d"
          :type="days === d ? 'primary' : undefined" size="sm" @click="changeDays(d)">
          {{ d }} {{ t('common.days') }}
        </lay-button>
      </div>
    </div>

    <div v-if="loading" class="loading-center">
      <i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop" style="font-size: 32px; color: #009688"></i>
    </div>

    <template v-else-if="data">
      <!-- KPI row -->
      <div class="kpi-row">
        <div class="kpi-mini">
          <div class="kpi-mini-label">{{ t('analyticsBetting.totalBetLottery') }}</div>
          <div class="kpi-mini-value text-blue">{{ formatMoney(totalLotteryBet) }}</div>
          <div class="kpi-mini-sub">{{ totalBetCount.toLocaleString() }} {{ t('analyticsBetting.orders') }}</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-label">{{ t('analyticsBetting.totalBetThird') }}</div>
          <div class="kpi-mini-value" style="color: #ffb800">{{ formatMoney(totalThirdBet) }}</div>
          <div class="kpi-mini-sub">{{ data.thirdGameTrend.reduce((s: number, d: any) => s + d.betTimes, 0).toLocaleString() }} {{ t('analyticsBetting.plays') }}</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-label">{{ t('analyticsBetting.totalProfit') }}</div>
          <div class="kpi-mini-value" :class="totalProfit >= 0 ? 'text-green' : 'text-red'">{{ formatMoney(totalProfit) }}</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-label">{{ t('analyticsBetting.lotteryTypes') }}</div>
          <div class="kpi-mini-value">{{ data.lotteryByType.length }}</div>
          <div class="kpi-mini-sub">{{ data.platformRanking.length }} {{ t('analyticsBetting.thirdPlatforms') }}</div>
        </div>
      </div>

      <!-- Lottery trend -->
      <lay-card class="section-card">
        <div class="section-header">{{ t('analyticsBetting.lotteryTrend') }}</div>
        <v-chart :option="lotteryTrendOption" autoresize style="height: 300px" />
      </lay-card>

      <!-- Third game trend -->
      <lay-card class="section-card">
        <div class="section-header">{{ t('analyticsBetting.thirdTrend') }}</div>
        <v-chart :option="thirdTrendOption" autoresize style="height: 300px" />
      </lay-card>

      <!-- Profit chart -->
      <lay-card class="section-card">
        <div class="section-header">{{ t('analyticsBetting.profitByDay') }}</div>
        <v-chart :option="profitOption" autoresize style="height: 320px" />
      </lay-card>

      <!-- Lottery by type + Platform pie -->
      <lay-row :space="15">
        <lay-col :md="12">
          <lay-card class="section-card">
            <div class="section-header">{{ t('analyticsBetting.betByLottery') }}</div>
            <v-chart :option="lotteryTypeOption" autoresize style="height: 350px" />
          </lay-card>
        </lay-col>
        <lay-col :md="12">
          <lay-card class="section-card">
            <div class="section-header">{{ t('analyticsBetting.platformShare') }}</div>
            <v-chart :option="platformOption" autoresize style="height: 350px" />
          </lay-card>
        </lay-col>
      </lay-row>

      <!-- Platform ranking table -->
      <lay-card class="section-card">
        <div class="section-header">{{ t('analyticsBetting.platformRanking') }}</div>
        <div style="overflow-x: auto">
          <table class="data-table">
            <thead><tr><th>{{ t('analyticsBetting.rank') }}</th><th>{{ t('analyticsBetting.platform') }}</th><th style="text-align:right">{{ t('analyticsBetting.bet') }}</th><th style="text-align:right">{{ t('analyticsBetting.revenue') }}</th><th style="text-align:right">Win/Lose</th><th style="text-align:right">{{ t('analyticsBetting.plays') }}</th></tr></thead>
            <tbody>
              <tr v-for="(p, i) in data.platformRanking" :key="p.name">
                <td>{{ i + 1 }}</td>
                <td class="text-bold">{{ p.name }}</td>
                <td style="text-align:right">{{ formatMoney(p.betAmount) }}</td>
                <td style="text-align:right">{{ formatMoney(p.turnover) }}</td>
                <td style="text-align:right" :class="p.winLose >= 0 ? 'text-red' : 'text-green'">{{ formatMoney(Math.abs(p.winLose)) }}</td>
                <td style="text-align:right">{{ p.betTimes.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </lay-card>

      <!-- Top bettors -->
      <lay-card class="section-card">
        <div class="section-header">{{ t('analyticsBetting.topBettors') }}</div>
        <table class="data-table">
          <thead><tr><th>{{ t('analyticsBetting.rank') }}</th><th>Username</th><th>Agent</th><th style="text-align:right">{{ t('analyticsBetting.totalBet') }}</th><th style="text-align:right">Win/Lose</th></tr></thead>
          <tbody>
            <tr v-for="(u, i) in data.topBettors" :key="u.username">
              <td>{{ i + 1 }}</td><td class="text-bold">{{ u.username }}</td><td>{{ u.agentName }}</td>
              <td style="text-align:right">{{ formatMoney(u.betAmount) }}</td>
              <td style="text-align:right" :class="u.winLose >= 0 ? 'text-red' : 'text-green'">{{ formatMoney(Math.abs(u.winLose)) }}</td>
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

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import VChart from "vue-echarts";
import { registerCharts, shortDate, tooltipFormatter, yAxisMoneyFormatter, formatMoney, COLORS, PALETTE } from "@/composables/useCharts";
import { fetchFinanceAnalytics, type FinanceAnalytics } from "@/api/services/analytics";

registerCharts();

const { t } = useI18n();
const loading = ref(true);
const data = ref<FinanceAnalytics | null>(null);
const days = ref(30);

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchFinanceAnalytics(days.value);
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
const trendOption = computed(() => {
  if (!data.value) return {};
  const td = data.value.trend30d;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    legend: { data: [t("analyticsFinance.deposit"), t("analyticsFinance.withdrawal"), t("analyticsFinance.netProfit")], bottom: 0 },
    grid: { top: 10, right: 20, bottom: 55, left: 60, containLabel: false },
    dataZoom: [{ type: "inside", start: 0, end: 100 }, { type: "slider", bottom: 25, height: 18 }],
    xAxis: { type: "category", data: td.map((d) => shortDate(d.date)) },
    yAxis: { type: "value", axisLabel: { formatter: yAxisMoneyFormatter } },
    series: [
      { name: t("analyticsFinance.deposit"), type: "line", smooth: true, data: td.map((d) => d.deposit), itemStyle: { color: COLORS.green }, areaStyle: { color: "rgba(0,150,136,0.08)" } },
      { name: t("analyticsFinance.withdrawal"), type: "line", smooth: true, data: td.map((d) => d.withdrawal), itemStyle: { color: COLORS.red }, areaStyle: { color: "rgba(255,87,34,0.08)" } },
      { name: t("analyticsFinance.netProfit"), type: "bar", data: td.map((d) => d.net), itemStyle: { color: (p: any) => p.value >= 0 ? COLORS.green : COLORS.red } },
    ],
  };
});

const depositAgentOption = computed(() => {
  if (!data.value) return {};
  const items = data.value.depositByAgent.slice(0, 10);
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    grid: { top: 10, right: 20, bottom: 5, left: 10, containLabel: true },
    xAxis: { type: "value", axisLabel: { formatter: yAxisMoneyFormatter } },
    yAxis: { type: "category", data: items.map((d) => d.agentName).reverse(), axisLabel: { fontSize: 11 } },
    series: [{ name: t("analyticsFinance.deposit"), type: "bar", data: items.map((d) => d.value).reverse(), itemStyle: { color: COLORS.green } }],
  };
});

const withdrawalAgentOption = computed(() => {
  if (!data.value) return {};
  const items = data.value.withdrawalByAgent.slice(0, 10);
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    grid: { top: 10, right: 20, bottom: 5, left: 10, containLabel: true },
    xAxis: { type: "value", axisLabel: { formatter: yAxisMoneyFormatter } },
    yAxis: { type: "category", data: items.map((d) => d.agentName).reverse(), axisLabel: { fontSize: 11 } },
    series: [{ name: t("analyticsFinance.withdrawal"), type: "bar", data: items.map((d) => d.value).reverse(), itemStyle: { color: COLORS.red } }],
  };
});

const feeOption = computed(() => {
  if (!data.value) return {};
  const fd = data.value.dailyFees;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    legend: { data: [t("analyticsFinance.transactionFee"), t("analyticsFinance.commission"), t("analyticsFinance.promotionLabel"), t("analyticsFinance.thirdPartyRebate")], bottom: 0 },
    grid: { top: 10, right: 20, bottom: 55, left: 60, containLabel: false },
    dataZoom: [{ type: "inside" }, { type: "slider", bottom: 25, height: 18 }],
    xAxis: { type: "category", data: fd.map((d) => shortDate(d.date)) },
    yAxis: { type: "value", axisLabel: { formatter: yAxisMoneyFormatter } },
    series: [
      { name: t("analyticsFinance.transactionFee"), type: "line", smooth: true, data: fd.map((d) => d.chargeFee), itemStyle: { color: COLORS.blue } },
      { name: t("analyticsFinance.commission"), type: "line", smooth: true, data: fd.map((d) => d.commission), itemStyle: { color: COLORS.yellow } },
      { name: t("analyticsFinance.promotionLabel"), type: "line", smooth: true, data: fd.map((d) => d.promotion), itemStyle: { color: COLORS.purple } },
      { name: t("analyticsFinance.thirdPartyRebate"), type: "line", smooth: true, data: fd.map((d) => d.thirdRebate), itemStyle: { color: COLORS.cyan } },
    ],
  };
});

const depositStatusOption = computed(() => {
  if (!data.value) return {};
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: 10, top: "center", textStyle: { fontSize: 11 } },
    series: [{
      type: "pie", radius: ["35%", "65%"], center: ["35%", "50%"],
      itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12 } },
      data: data.value.depositStatusBreakdown.map((d, i) => ({ name: d.status, value: d.amount, itemStyle: { color: PALETTE[i % PALETTE.length] } })),
    }],
  };
});

const withdrawalStatusOption = computed(() => {
  if (!data.value) return {};
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: 10, top: "center", textStyle: { fontSize: 11 } },
    series: [{
      type: "pie", radius: ["35%", "65%"], center: ["35%", "50%"],
      itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12 } },
      data: data.value.withdrawalStatusBreakdown.map((d, i) => ({ name: d.status, value: d.amount, itemStyle: { color: PALETTE[i % PALETTE.length] } })),
    }],
  };
});
</script>

<template>
  <div class="analytics-page">
    <div class="page-header">
      <div class="page-title">{{ t('analyticsFinance.title') }}</div>
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
      <!-- Trend 30d -->
      <lay-card class="section-card">
        <div class="section-header">{{ t('analyticsFinance.trendTitle') }}</div>
        <v-chart :option="trendOption" autoresize style="height: 320px" />
      </lay-card>

      <!-- Agent breakdown -->
      <lay-row :space="15">
        <lay-col :md="12">
          <lay-card class="section-card">
            <div class="section-header">{{ t('analyticsFinance.depositByAgent') }}</div>
            <v-chart :option="depositAgentOption" autoresize style="height: 300px" />
          </lay-card>
        </lay-col>
        <lay-col :md="12">
          <lay-card class="section-card">
            <div class="section-header">{{ t('analyticsFinance.withdrawByAgent') }}</div>
            <v-chart :option="withdrawalAgentOption" autoresize style="height: 300px" />
          </lay-card>
        </lay-col>
      </lay-row>

      <!-- Fee trend -->
      <lay-card class="section-card">
        <div class="section-header">{{ t('analyticsFinance.feesCommissions') }}</div>
        <v-chart :option="feeOption" autoresize style="height: 280px" />
      </lay-card>

      <!-- Status breakdown -->
      <lay-row :space="15">
        <lay-col :md="12">
          <lay-card class="section-card">
            <div class="section-header">{{ t('analyticsFinance.depositStatus') }}</div>
            <v-chart :option="depositStatusOption" autoresize style="height: 250px" />
          </lay-card>
        </lay-col>
        <lay-col :md="12">
          <lay-card class="section-card">
            <div class="section-header">{{ t('analyticsFinance.withdrawStatus') }}</div>
            <v-chart :option="withdrawalStatusOption" autoresize style="height: 250px" />
          </lay-card>
        </lay-col>
      </lay-row>

      <!-- Top tables -->
      <lay-row :space="15">
        <lay-col :md="12">
          <lay-card class="section-card">
            <div class="section-header">{{ t('analyticsFinance.topDeposit') }}</div>
            <table class="data-table">
              <thead><tr><th>{{ t('analyticsFinance.rank') }}</th><th>Username</th><th>{{ t('analyticsFinance.agent') }}</th><th style="text-align:right">{{ t('analyticsFinance.totalDeposit') }}</th><th style="text-align:right">{{ t('analyticsFinance.orderCount') }}</th></tr></thead>
              <tbody>
                <tr v-for="(u, i) in data.topDepositors" :key="u.username">
                  <td>{{ i + 1 }}</td><td class="text-bold">{{ u.username }}</td><td>{{ u.agentName }}</td>
                  <td style="text-align:right" class="text-green">{{ formatMoney(u.totalAmount) }}</td>
                  <td style="text-align:right">{{ u.count }}</td>
                </tr>
              </tbody>
            </table>
          </lay-card>
        </lay-col>
        <lay-col :md="12">
          <lay-card class="section-card">
            <div class="section-header">{{ t('analyticsFinance.topWithdraw') }}</div>
            <table class="data-table">
              <thead><tr><th>{{ t('analyticsFinance.rank') }}</th><th>Username</th><th>{{ t('analyticsFinance.agent') }}</th><th style="text-align:right">{{ t('analyticsFinance.totalWithdraw') }}</th><th style="text-align:right">{{ t('analyticsFinance.orderCount') }}</th></tr></thead>
              <tbody>
                <tr v-for="(u, i) in data.topWithdrawers" :key="u.username">
                  <td>{{ i + 1 }}</td><td class="text-bold">{{ u.username }}</td><td>{{ u.agentName }}</td>
                  <td style="text-align:right" class="text-red">{{ formatMoney(u.totalAmount) }}</td>
                  <td style="text-align:right">{{ u.count }}</td>
                </tr>
              </tbody>
            </table>
          </lay-card>
        </lay-col>
      </lay-row>
    </template>
  </div>
</template>

<style scoped>
@import "./analytics-shared.css";
</style>

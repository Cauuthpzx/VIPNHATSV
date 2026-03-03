<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import VChart from "vue-echarts";
import { registerCharts, formatMoney, shortDate, tooltipFormatter, COLORS, PALETTE } from "@/composables/useCharts";
import { fetchMemberAnalytics, type MemberAnalytics } from "@/api/services/analytics";

registerCharts();

const { t } = useI18n();
const loading = ref(true);
const data = ref<MemberAnalytics | null>(null);

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchMemberAnalytics();
    data.value = res.data.data;
  } catch {
    layer.msg(t("common.errorLoad"), { icon: 2, time: 2000 });
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

// --- Charts ---
const memberByAgentOption = computed(() => {
  if (!data.value) return {};
  const items = data.value.membersByAgent;
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: 10, top: "center", textStyle: { fontSize: 11 } },
    series: [{
      type: "pie", radius: ["35%", "65%"], center: ["35%", "50%"],
      itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12 } },
      data: items.map((d, i) => ({ name: d.agentName, value: d.count, itemStyle: { color: PALETTE[i % PALETTE.length] } })),
    }],
  };
});

const statusOption = computed(() => {
  if (!data.value) return {};
  const items = data.value.memberStatusDistribution;
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: 10, top: "center", textStyle: { fontSize: 11 } },
    series: [{
      type: "pie", radius: ["35%", "65%"], center: ["35%", "50%"],
      itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12 } },
      data: items.map((d, i) => ({ name: d.status, value: d.count, itemStyle: { color: PALETTE[i % PALETTE.length] } })),
    }],
  };
});

const typeOption = computed(() => {
  if (!data.value) return {};
  const items = data.value.memberTypeDistribution;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    grid: { top: 10, right: 20, bottom: 5, left: 10, containLabel: true },
    xAxis: { type: "value" },
    yAxis: { type: "category", data: items.map((d) => d.type).reverse(), axisLabel: { fontSize: 11 } },
    series: [{ name: t("analyticsMembers.members"), type: "bar", data: items.map((d) => d.count).reverse(), itemStyle: { color: COLORS.blue } }],
  };
});

const churnOption = computed(() => {
  if (!data.value) return {};
  const ct = data.value.churnTrend;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    legend: { data: [t("analyticsMembers.newMembers"), t("analyticsMembers.lostMembers"), t("analyticsMembers.net")], bottom: 0 },
    grid: { top: 10, right: 20, bottom: 55, left: 50, containLabel: false },
    dataZoom: [{ type: "inside" }, { type: "slider", bottom: 25, height: 18 }],
    xAxis: { type: "category", data: ct.map((d) => shortDate(d.date)) },
    yAxis: { type: "value" },
    series: [
      { name: t("analyticsMembers.newMembers"), type: "bar", stack: "churn", data: ct.map((d) => d.newMembers), itemStyle: { color: COLORS.green } },
      { name: t("analyticsMembers.lostMembers"), type: "bar", stack: "churn", data: ct.map((d) => -d.lostMembers), itemStyle: { color: COLORS.red } },
      { name: t("analyticsMembers.net"), type: "line", smooth: true, data: ct.map((d) => d.net), itemStyle: { color: COLORS.blue }, lineStyle: { width: 2 } },
    ],
  };
});

const registrationOption = computed(() => {
  if (!data.value) return {};
  const rm = data.value.registrationByMonth;
  return {
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    grid: { top: 10, right: 20, bottom: 5, left: 50, containLabel: false },
    xAxis: { type: "category", data: rm.map((d) => d.month) },
    yAxis: { type: "value" },
    series: [{ name: t("analyticsMembers.register"), type: "bar", data: rm.map((d) => d.count), itemStyle: { color: COLORS.purple }, barWidth: "50%" }],
  };
});

// KPI
const totalNew = computed(() => data.value?.churnTrend.reduce((s, d) => s + d.newMembers, 0) ?? 0);
const totalLost = computed(() => data.value?.churnTrend.reduce((s, d) => s + d.lostMembers, 0) ?? 0);
</script>

<template>
  <div class="analytics-page">
    <div class="page-header">
      <div class="page-title">{{ t('analyticsMembers.title') }}</div>
    </div>

    <div v-if="loading" class="loading-center">
      <i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop" style="font-size: 32px; color: #009688"></i>
    </div>

    <template v-else-if="data">
      <!-- KPI row -->
      <div class="kpi-row">
        <div class="kpi-mini">
          <div class="kpi-mini-label">{{ t('analyticsMembers.totalMembers') }}</div>
          <div class="kpi-mini-value">{{ data.totalMembers.toLocaleString() }}</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-label">{{ t('analyticsMembers.newMembers30d') }}</div>
          <div class="kpi-mini-value text-green">+{{ totalNew.toLocaleString() }}</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-label">{{ t('analyticsMembers.lostMembers30d') }}</div>
          <div class="kpi-mini-value text-red">-{{ totalLost.toLocaleString() }}</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-label">{{ t('analyticsMembers.net30d') }}</div>
          <div class="kpi-mini-value" :class="totalNew - totalLost >= 0 ? 'text-green' : 'text-red'">
            {{ (totalNew - totalLost >= 0 ? "+" : "") + (totalNew - totalLost).toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- Member distribution -->
      <lay-row :space="15">
        <lay-col :md="12">
          <lay-card class="section-card">
            <div class="section-header">{{ t('analyticsMembers.byAgent') }}</div>
            <v-chart :option="memberByAgentOption" autoresize style="height: 300px" />
          </lay-card>
        </lay-col>
        <lay-col :md="12">
          <lay-card class="section-card">
            <div class="section-header">{{ t('analyticsMembers.memberStatus') }}</div>
            <v-chart :option="statusOption" autoresize style="height: 300px" />
          </lay-card>
        </lay-col>
      </lay-row>

      <!-- Type distribution -->
      <lay-card class="section-card">
        <div class="section-header">{{ t('analyticsMembers.memberType') }}</div>
        <v-chart :option="typeOption" autoresize style="height: 250px" />
      </lay-card>

      <!-- Churn trend -->
      <lay-card class="section-card">
        <div class="section-header">{{ t('analyticsMembers.trend30d') }}</div>
        <v-chart :option="churnOption" autoresize style="height: 300px" />
      </lay-card>

      <!-- Registration by month -->
      <lay-card class="section-card">
        <div class="section-header">{{ t('analyticsMembers.registerByMonth') }}</div>
        <v-chart :option="registrationOption" autoresize style="height: 250px" />
      </lay-card>

      <!-- Top tables -->
      <lay-row :space="15">
        <lay-col :md="12">
          <lay-card class="section-card">
            <div class="section-header">{{ t('analyticsMembers.topBalance') }}</div>
            <table class="data-table">
              <thead><tr><th>{{ t('analyticsMembers.rank') }}</th><th>Username</th><th>{{ t('analyticsMembers.agent') }}</th><th style="text-align:right">{{ t('analyticsMembers.balance') }}</th></tr></thead>
              <tbody>
                <tr v-for="(u, i) in data.topMembersByBalance" :key="u.username">
                  <td>{{ i + 1 }}</td><td class="text-bold">{{ u.username }}</td><td>{{ u.agentName }}</td>
                  <td style="text-align:right" class="text-green">{{ formatMoney(u.money) }}</td>
                </tr>
              </tbody>
            </table>
          </lay-card>
        </lay-col>
        <lay-col :md="12">
          <lay-card class="section-card">
            <div class="section-header">{{ t('analyticsMembers.topDeposit') }}</div>
            <table class="data-table">
              <thead><tr><th>{{ t('analyticsMembers.rank') }}</th><th>Username</th><th>{{ t('analyticsMembers.agent') }}</th><th style="text-align:right">{{ t('analyticsMembers.totalDeposit') }}</th><th style="text-align:right">{{ t('analyticsMembers.depositCount') }}</th></tr></thead>
              <tbody>
                <tr v-for="(u, i) in data.topMembersByDeposit" :key="u.username">
                  <td>{{ i + 1 }}</td><td class="text-bold">{{ u.username }}</td><td>{{ u.agentName }}</td>
                  <td style="text-align:right" class="text-green">{{ formatMoney(u.depositAmount) }}</td>
                  <td style="text-align:right">{{ u.depositCount }}</td>
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

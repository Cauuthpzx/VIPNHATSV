<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import { fetchRevenueSummary, uploadCustomerFile, type RevenueSummaryResult } from "@/api/services/analytics";
import { useToolbarPermission } from "@/composables/useToolbarPermission";
import { exportRevenueExcel } from "@/composables/useRevenueExport";

const { t } = useI18n();
const { canExport } = useToolbarPermission();
const loading = ref(true);
const uploading = ref(false);
const exporting = ref(false);
const data = ref<RevenueSummaryResult | null>(null);

// Default to current month
const now = new Date();
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

// Format number with locale and sign
function fmtNum(v: number): string {
  return v.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

// Format large money values with abbreviation
function fmtMoney(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return sign + (abs / 1_000_000_000).toFixed(1) + "B";
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return sign + (abs / 1_000).toFixed(1) + "K";
  return v.toLocaleString("vi-VN");
}

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchRevenueSummary(selectedMonth.value);
    data.value = res.data.data;
  } catch {
    layer.msg(t("common.errorLoad"), { icon: 2, time: 2000 });
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
watch(selectedMonth, loadData);

// File upload
const fileInputRef = ref<HTMLInputElement | null>(null);

function triggerUpload() {
  fileInputRef.value?.click();
}

async function handleExport() {
  exporting.value = true;
  try {
    await exportRevenueExcel(selectedMonth.value);
  } finally {
    exporting.value = false;
  }
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploading.value = true;
  try {
    const res = await uploadCustomerFile(file);
    const { employeeCount, mappingCount } = res.data.data;
    layer.msg(t("analyticsRevenue.uploadSuccess", { employees: employeeCount, mappings: mappingCount }), {
      icon: 1,
      time: 3000,
    });
    await loadData();
  } catch {
    layer.msg(t("analyticsRevenue.uploadError"), { icon: 2, time: 2000 });
  } finally {
    uploading.value = false;
    input.value = "";
  }
}
</script>

<template>
  <div class="analytics-page">
    <div class="page-header">
      <div class="page-title">
        {{ t("analyticsRevenue.title") }}
      </div>
      <div class="revenue-actions">
        <input v-model="selectedMonth" type="month" class="month-picker" />
        <template v-if="canExport">
          <lay-button size="sm" :loading="uploading" @click="triggerUpload">
            <i class="layui-icon layui-icon-upload" />
            {{ t("analyticsRevenue.uploadCustomers") }}
          </lay-button>
          <lay-button
            size="sm"
            type="normal"
            :loading="exporting"
            :disabled="!data || !data.hasCustomerData"
            @click="handleExport"
          >
            <i class="layui-icon layui-icon-export" />
            {{ t("analyticsRevenue.exportXlsx") }}
          </lay-button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".xlsx,.xls"
            style="display: none"
            @change="handleFileUpload"
          />
        </template>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <i
        class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop"
        style="font-size: 32px; color: #009688"
      />
    </div>

    <template v-else-if="data">
      <!-- No customer data -->
      <lay-card v-if="!data.hasCustomerData" class="section-card">
        <div style="text-align: center; padding: 40px 20px; color: #999">
          <i
            class="layui-icon layui-icon-upload"
            style="font-size: 48px; display: block; margin-bottom: 12px"
          />
          {{ t("analyticsRevenue.noCustomerData") }}
        </div>
      </lay-card>

      <template v-else>
        <!-- KPI Row -->
        <div class="kpi-row">
          <div class="kpi-mini">
            <div class="kpi-mini-label">
              {{ t("analyticsRevenue.totalRevenue") }}
            </div>
            <div class="kpi-mini-value" :class="data.grandTotal.totalRevenue < 0 ? 'text-green' : 'text-red'">
              {{ fmtMoney(data.grandTotal.totalRevenue) }}
            </div>
          </div>
          <div class="kpi-mini">
            <div class="kpi-mini-label">
              {{ t("analyticsRevenue.lotteryProfit") }}
            </div>
            <div class="kpi-mini-value">
              {{ fmtMoney(data.grandTotal.lotteryWinLose) }}
            </div>
          </div>
          <div class="kpi-mini">
            <div class="kpi-mini-label">
              {{ t("analyticsRevenue.thirdGameProfit") }}
            </div>
            <div class="kpi-mini-value">
              {{ fmtMoney(data.grandTotal.thirdGameWinLose) }}
            </div>
          </div>
          <div class="kpi-mini">
            <div class="kpi-mini-label">
              {{ t("analyticsRevenue.totalCustomers") }}
            </div>
            <div class="kpi-mini-value">
              {{ data.grandTotal.customerCount.toLocaleString() }}
            </div>
          </div>
        </div>

        <!-- Summary Table -->
        <lay-card class="section-card">
          <div class="section-header">
            {{ t("analyticsRevenue.summaryTable") }}
          </div>
          <div style="overflow-x: auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>{{ t("analyticsRevenue.employeeName") }}</th>
                  <th style="text-align: right">
                    {{ t("analyticsRevenue.lotteryProfit") }}
                  </th>
                  <th style="text-align: right">
                    {{ t("analyticsRevenue.thirdGameProfit") }}
                  </th>
                  <th style="text-align: right">
                    {{ t("analyticsRevenue.promotionCol") }}
                  </th>
                  <th style="text-align: right">
                    {{ t("analyticsRevenue.rebateCol") }}
                  </th>
                  <th style="text-align: right">
                    {{ t("analyticsRevenue.totalRevenue") }}
                  </th>
                  <th style="text-align: right">
                    {{ t("analyticsRevenue.customerCountCol") }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(emp, i) in data.employees" :key="emp.employeeId">
                  <td>{{ i + 1 }}</td>
                  <td class="text-bold">
                    {{ emp.employeeName }}
                  </td>
                  <td style="text-align: right">
                    {{ fmtNum(emp.lotteryWinLose) }}
                  </td>
                  <td style="text-align: right">
                    {{ fmtNum(emp.thirdGameWinLose) }}
                  </td>
                  <td style="text-align: right">
                    {{ fmtNum(emp.promotion) }}
                  </td>
                  <td style="text-align: right">
                    {{ fmtNum(emp.thirdRebate) }}
                  </td>
                  <td
                    style="text-align: right; font-weight: 600"
                    :class="emp.totalRevenue < 0 ? 'text-green' : emp.totalRevenue > 0 ? 'text-red' : ''"
                  >
                    {{ fmtNum(emp.totalRevenue) }}
                  </td>
                  <td style="text-align: right">
                    {{ emp.customerCount }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td />
                  <td style="font-weight: 700">
                    {{ t("analyticsRevenue.grandTotal") }}
                  </td>
                  <td style="text-align: right; font-weight: 600">
                    {{ fmtNum(data.grandTotal.lotteryWinLose) }}
                  </td>
                  <td style="text-align: right; font-weight: 600">
                    {{ fmtNum(data.grandTotal.thirdGameWinLose) }}
                  </td>
                  <td style="text-align: right; font-weight: 600">
                    {{ fmtNum(data.grandTotal.promotion) }}
                  </td>
                  <td style="text-align: right; font-weight: 600">
                    {{ fmtNum(data.grandTotal.thirdRebate) }}
                  </td>
                  <td
                    style="text-align: right; font-weight: 700"
                    :class="data.grandTotal.totalRevenue < 0 ? 'text-green' : 'text-red'"
                  >
                    {{ fmtNum(data.grandTotal.totalRevenue) }}
                  </td>
                  <td style="text-align: right; font-weight: 600">
                    {{ data.grandTotal.customerCount }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </lay-card>
      </template>
    </template>
  </div>
</template>

<style scoped>
@import "./analytics-shared.css";

.revenue-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.month-picker {
  padding: 4px 10px;
  border: 1px solid #d2d2d2;
  border-radius: 2px;
  font-size: 13px;
  height: 30px;
  outline: none;
}

.month-picker:focus {
  border-color: #009688;
}

.total-row {
  background: #f8f8f8;
}

.total-row td {
  border-top: 2px solid #e0e0e0;
}
</style>

<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { fetchReportFunds } from "@/api/services/proxy";
import { createExportAllFn } from "@/composables/useExportAll";
import { layer } from "@layui/layui-vue";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { useToolbarPermission } from "@/composables/useToolbarPermission";
import CookieBadge from "@/components/CookieBadge.vue";

const { t } = useI18n();

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();
const { defaultToolbar, canExport } = useToolbarPermission();

const searchForm = reactive({
  username: "",
});

const columns = computed(() => [
  { title: t("common.agent"), key: "_agentName" },
  { title: t("reportFunds.account"), key: "username" },
  { title: t("reportFunds.agentBelong"), key: "user_parent_format" },
  { title: t("reportFunds.depositCount"), key: "deposit_count", customSlot: "num" },
  { title: t("reportFunds.depositAmount"), key: "deposit_amount", customSlot: "num" },
  { title: t("reportFunds.withdrawCount"), key: "withdrawal_count", customSlot: "num" },
  { title: t("reportFunds.withdrawAmount"), key: "withdrawal_amount", customSlot: "num" },
  { title: t("reportFunds.serviceFee"), key: "charge_fee", customSlot: "num" },
  { title: t("reportFunds.agentCommission"), key: "agent_commission", customSlot: "num" },
  { title: t("reportFunds.promotion"), key: "promotion", customSlot: "num" },
  { title: t("reportFunds.thirdPartyRebate"), key: "third_rebate", customSlot: "num" },
  { title: t("reportFunds.thirdPartyBonus"), key: "third_activity_amount", customSlot: "num" },
  { title: t("common.time"), key: "date" },
]);

const summaryColumns = computed(() => [
  { title: t("reportFunds.depositAmount"), key: "total_deposit_amount", customSlot: "sumNum" },
  { title: t("reportFunds.withdrawAmount"), key: "total_withdrawal_amount", customSlot: "sumNum" },
  { title: t("reportFunds.serviceFee"), key: "total_charge_fee", customSlot: "sumNum" },
  { title: t("reportFunds.agentCommission"), key: "total_agent_commission", customSlot: "sumNum" },
  { title: t("reportFunds.promotion"), key: "total_promotion", customSlot: "sumNum" },
  { title: t("reportFunds.thirdPartyRebate"), key: "total_third_rebate", customSlot: "sumNum" },
  { title: t("reportFunds.thirdPartyBonus"), key: "total_third_activity_amount", customSlot: "sumNum" },
]);

const summaryData = ref([
  {
    total_deposit_amount: "0.0000",
    total_withdrawal_amount: "0.0000",
    total_charge_fee: "0.0000",
    total_agent_commission: "0.0000",
    total_promotion: "0.0000",
    total_third_rebate: "0.0000",
    total_third_activity_amount: "0.0000",
  },
]);

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  try {
    const res = await fetchReportFunds({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
    });
    if (isStale()) return;
    dataSource.value = res.data.data.items;
    page.total = res.data.data.total;
    if (res.data.data.totalData) {
      summaryData.value = [res.data.data.totalData as any];
    } else {
      summaryData.value = [{ total_deposit_amount: "0.0000", total_withdrawal_amount: "0.0000", total_charge_fee: "0.0000", total_agent_commission: "0.0000", total_promotion: "0.0000", total_third_rebate: "0.0000", total_third_activity_amount: "0.0000" }];
    }
  } catch {
    if (!isStale()) layer.msg(t("common.errorLoad"), { icon: 2 });
  } finally {
    if (!isStale()) setLoading(false);
  }
}

const { handlePageChange, handleSearch } = bindLoadData(loadData, selectedAgentId, [dateRange]);

const exportAllFn = createExportAllFn((p, limit) =>
  fetchReportFunds({
    page: p, limit,
    username: searchForm.username || undefined,
    date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
  }).then(r => r.data.data),
);

function handleReset() {
  resetDateRange();
  searchForm.username = "";
}
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('reportFunds.title')">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">{{ t("common.agentLabel") }}</span>
          <lay-select v-model="selectedAgentId" :style="{ width: agentWidth }">
            <lay-select-option v-for="opt in agentOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t("common.timeLabel") }}</span>
          <lay-date-picker v-model="dateRange" range single-panel range-separator="-" :placeholder="[t('common.dateStart'), t('common.dateEnd')]" />
        </div>
        <div class="layui-inline">
          <lay-select v-model="dateQuickSelect" :style="{ width: dateQuickWidth }">
            <lay-select-option v-for="opt in dateQuickOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t("reportFunds.accountLabel") }}</span>
          <lay-input v-model="searchForm.username" :placeholder="t('reportFunds.accountPlaceholder')" />
        </div>
        <div class="layui-inline">
          <lay-button type="normal" @click="handleSearch">
            <i class="layui-icon layui-icon-search"></i> {{ t("common.search") }}
          </lay-button>
          <lay-button type="primary" @click="handleReset">
            <i class="layui-icon layui-icon-refresh"></i> {{ t("common.reset") }}
          </lay-button>
        </div>
      </div>
      </lay-field>

      <div class="table-container">
        <lay-table
          :page="page"
          :resize="true"
          :columns="columns"
          :loading="loading"
          :default-toolbar="defaultToolbar"
          :data-source="dataSource"
          :export-all-fn="canExport ? exportAllFn : undefined"
          @change="handlePageChange"
        >
          <template v-slot:toolbar>
            <CookieBadge />
          </template>
          <template #num="{ row, column }">
            <lay-count-up :end-val="Number(row[column.key]) || 0" :duration="0" :decimal-places="String(row[column.key]).includes('.') ? 2 : 0" :use-grouping="false" />
          </template>
        </lay-table>
        <lay-table :columns="summaryColumns" :data-source="summaryData" :default-toolbar="defaultToolbar">
          <template v-slot:toolbar>
            <lay-button size="xs" type="normal"><b>{{ t("common.summaryData") }}</b></lay-button>
          </template>
          <template #sumNum="{ row, column }">
            <lay-count-up :end-val="Number(row[column.key]) || 0" :duration="0" :decimal-places="String(row[column.key]).includes('.') ? 4 : 0" :use-grouping="false" />
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

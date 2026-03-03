<script setup lang="ts">
import { reactive, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { fetchWithdrawalsRecord } from "@/api/services/proxy";
import { createExportAllFn } from "@/composables/useExportAll";
import { layer } from "@layui/layui-vue";
import CookieBadge from "@/components/CookieBadge.vue";

const { t } = useI18n();

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();

const searchForm = reactive({
  username: "",
  serialNumber: "",
  status: "",
});

const statusOptions = computed(() => [
  { label: t("common.select"), value: "" },
  { label: t("withdrawals.statusPending"), value: "pending" },
  { label: t("withdrawals.statusSuccess"), value: "success" },
  { label: t("withdrawals.statusFailed"), value: "failed" },
  { label: t("withdrawals.statusCancelled"), value: "cancelled" },
]);

const { selectWidth: statusWidth } = useAutoFitSelect(statusOptions);

const columns = computed(() => [
  { title: t("common.agent"), key: "_agentName" },
  { title: t("withdrawals.serialNo"), key: "serial_no", ellipsisTooltip: true },
  { title: t("withdrawals.createdTime"), key: "create_time", ellipsisTooltip: true },
  { title: t("withdrawals.account"), key: "username" },
  { title: t("withdrawals.agentBelong"), key: "user_parent_format" },
  { title: t("withdrawals.requestAmount"), key: "amount", customSlot: "num" },
  { title: t("withdrawals.fee"), key: "user_fee", customSlot: "num" },
  { title: t("withdrawals.actualAmount"), key: "true_amount", customSlot: "num" },
  { title: t("common.status"), key: "status_format" },
  { title: t("common.actions"), key: "operation", customSlot: "operation" },
]);

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  try {
    const res = await fetchWithdrawalsRecord({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      serial_no: searchForm.serialNumber || undefined,
      status: searchForm.status || undefined,
      date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
    });
    if (isStale()) return;
    dataSource.value = res.data.data.items;
    page.total = res.data.data.total;
  } catch {
    if (!isStale()) layer.msg(t("common.errorLoad"), { icon: 2 });
  } finally {
    if (!isStale()) setLoading(false);
  }
}

const { handlePageChange, handleSearch } = bindLoadData(loadData, selectedAgentId, [dateRange]);

const exportAllFn = createExportAllFn((p, limit) =>
  fetchWithdrawalsRecord({
    page: p, limit,
    username: searchForm.username || undefined,
    serial_no: searchForm.serialNumber || undefined,
    status: searchForm.status || undefined,
    date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
  }).then(r => r.data.data),
);

function handleReset() {
  resetDateRange();
  searchForm.username = "";
  searchForm.serialNumber = "";
  searchForm.status = "";
  page.current = 1;
  loadData();
}

function handleDetail(_row: Record<string, unknown>) {
  // TODO: open detail dialog
}
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('withdrawals.title')">
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
          <span class="form-label">{{ t("withdrawals.accountLabel") }}</span>
          <lay-input v-model="searchForm.username" :placeholder="t('withdrawals.accountPlaceholder')" />
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t("withdrawals.serialNoLabel") }}</span>
          <lay-input v-model="searchForm.serialNumber" :placeholder="t('withdrawals.serialNoPlaceholder')" />
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t("withdrawals.statusLabel") }}</span>
          <lay-select v-model="searchForm.status" :style="{ width: statusWidth }">
            <lay-select-option v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
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
          :default-toolbar="true"
          :data-source="dataSource"
          :export-all-fn="exportAllFn"
          @change="handlePageChange"
        >
          <template v-slot:toolbar>
            <CookieBadge />
          </template>
          <template #num="{ row, column }">
            <lay-count-up :end-val="Number(row[column.key]) || 0" :duration="0" :decimal-places="String(row[column.key]).includes('.') ? 2 : 0" :use-grouping="false" />
          </template>
          <template #operation="{ row }">
            <lay-button size="xs" type="primary" @click="handleDetail(row)">{{ t("common.detail") }}</lay-button>
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

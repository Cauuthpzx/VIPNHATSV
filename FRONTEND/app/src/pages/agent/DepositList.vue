<script setup lang="ts">
import { reactive, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { fetchDepositList } from "@/api/services/proxy";
import { createExportAllFn } from "@/composables/useExportAll";
import { useToolbarPermission } from "@/composables/useToolbarPermission";
import { layer } from "@layui/layui-vue";
import StatusBadge from "@/components/StatusBadge.vue";
import CookieBadge from "@/components/CookieBadge.vue";

const { t } = useI18n();

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();
const { defaultToolbar, canExport } = useToolbarPermission();

const searchForm = reactive({
  username: "",
  transactionType: "",
  status: "",
});

const transactionTypeOptions = computed(() => [
  { label: t("common.select"), value: "" },
  { label: t("depositList.typeDeposit"), value: "deposit" },
  { label: t("depositList.typeTransfer"), value: "transfer" },
]);

const statusOptions = computed(() => [
  { label: t("common.select"), value: "" },
  { label: t("depositList.statusPending"), value: "pending" },
  { label: t("depositList.statusSuccess"), value: "success" },
  { label: t("depositList.statusFailed"), value: "failed" },
]);

const { selectWidth: transactionTypeWidth } = useAutoFitSelect(transactionTypeOptions);
const { selectWidth: statusWidth } = useAutoFitSelect(statusOptions);

const DEPOSIT_STATUS_MAP = computed(() => ({
  pending: { label: t("depositList.statusPending"), color: "#e6a23c" },
  success: { label: t("depositList.statusSuccess"), color: "#67c23a" },
  failed: { label: t("depositList.statusFailed"), color: "#f56c6c" },
}));

const columns = computed(() => [
  { title: t("common.agent"), key: "_agentName" },
  { title: t("depositList.account"), key: "username" },
  { title: t("depositList.agentBelong"), key: "user_parent_format" },
  { title: t("common.amount"), key: "amount", customSlot: "num" },
  { title: t("depositList.transactionType"), key: "type" },
  { title: t("depositList.transactionStatus"), key: "status", customSlot: "status" },
  { title: t("common.time"), key: "create_time" },
]);

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  try {
    const res = await fetchDepositList({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
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
  fetchDepositList({
    page: p, limit,
    username: searchForm.username || undefined,
    date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
  }).then(r => r.data.data),
);

function handleReset() {
  resetDateRange();
  searchForm.username = "";
  searchForm.transactionType = "";
  searchForm.status = "";
  page.current = 1;
  loadData();
}
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('depositList.title')">
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
          <span class="form-label">{{ t("depositList.accountLabel") }}</span>
          <lay-input v-model="searchForm.username" :placeholder="t('depositList.accountPlaceholder')" />
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t("depositList.typeLabel") }}</span>
          <lay-select v-model="searchForm.transactionType" :style="{ width: transactionTypeWidth }">
            <lay-select-option v-for="opt in transactionTypeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t("depositList.statusLabel") }}</span>
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
          <template #status="{ row }">
            <StatusBadge :status="row.status" :map="DEPOSIT_STATUS_MAP as any" />
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

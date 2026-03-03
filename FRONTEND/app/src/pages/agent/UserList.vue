<script setup lang="ts">
import { reactive, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useListPage } from "@/composables/useListPage";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { useAuthStore } from "@/stores/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { fetchUserList } from "@/api/services/proxy";
import { createExportAllFn } from "@/composables/useExportAll";
import { layer } from "@layui/layui-vue";
import CookieBadge from "@/components/CookieBadge.vue";

const { t } = useI18n();

const authStore = useAuthStore();
const canWrite = authStore.hasPermission(PERMISSIONS.MEMBER_WRITE);

const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();

const searchForm = reactive({
  username: "",
  dateRange: [] as string[],
  status: "",
  sortField: "",
  sortOrder: "",
});

const columns = computed(() => [
  { title: t("common.agent"), key: "_agentName" },
  { title: t("userList.member"), key: "username" },
  { title: t("userList.memberType"), key: "type_format" },
  { title: t("userList.agentAccount"), key: "parent_user" },
  { title: t("userList.balance"), key: "money", customSlot: "num" },
  { title: t("userList.depositCount"), key: "deposit_count", customSlot: "num" },
  { title: t("userList.withdrawCount"), key: "withdrawal_count", customSlot: "num" },
  { title: t("userList.totalDeposit"), key: "deposit_amount", customSlot: "num" },
  { title: t("userList.totalWithdraw"), key: "withdrawal_amount", customSlot: "num" },
  { title: t("userList.lastLogin"), key: "login_time", ellipsisTooltip: true },
  { title: t("userList.registerTime"), key: "register_time", ellipsisTooltip: true },
  { title: t("common.status"), key: "status_format" },
  { title: t("common.actions"), key: "action", customSlot: "action" },
]);

const statusOptions = computed(() => [
  { label: t("common.select"), value: "" },
  { label: t("userList.statusNormal"), value: "1" },
  { label: t("userList.statusLocked"), value: "0" },
]);

const sortFieldOptions = computed(() => [
  { label: t("common.select"), value: "" },
  { label: t("userList.sortFieldBalance"), value: "balance" },
  { label: t("userList.sortFieldRegisterTime"), value: "registerTime" },
]);

const sortOrderOptions = computed(() => [
  { label: t("common.select"), value: "" },
  { label: t("userList.sortDesc"), value: "desc" },
  { label: t("userList.sortAsc"), value: "asc" },
]);

const { selectWidth: statusWidth } = useAutoFitSelect(statusOptions);
const { selectWidth: sortFieldWidth } = useAutoFitSelect(sortFieldOptions);
const { selectWidth: sortOrderWidth } = useAutoFitSelect(sortOrderOptions);

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  try {
    const res = await fetchUserList({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      status: searchForm.status || undefined,
      sort_field: searchForm.sortField || undefined,
      sort_order: searchForm.sortOrder || undefined,
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

const { handlePageChange, handleSearch } = bindLoadData(loadData, selectedAgentId);

const exportAllFn = createExportAllFn((p, limit) =>
  fetchUserList({
    page: p, limit,
    username: searchForm.username || undefined,
    status: searchForm.status || undefined,
    sort_field: searchForm.sortField || undefined,
    sort_order: searchForm.sortOrder || undefined,
  }).then(r => r.data.data),
);

function handleReset() {
  searchForm.username = "";
  searchForm.dateRange = [];
  searchForm.status = "";
  searchForm.sortField = "";
  searchForm.sortOrder = "";
  page.current = 1;
  loadData();
}
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('userList.title')">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">{{ t("common.agentLabel") }}</span>
          <lay-select v-model="selectedAgentId" :style="{ width: agentWidth }">
            <lay-select-option v-for="opt in agentOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t("userList.accountLabel") }}</span>
          <lay-input v-model="searchForm.username" :placeholder="t('userList.accountPlaceholder')" />
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t("userList.registerTimeLabel") }}</span>
          <lay-date-picker v-model="searchForm.dateRange" range single-panel range-separator="-" :placeholder="[t('common.dateStart'), t('common.dateEnd')]" :allow-clear="true" />
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t("userList.statusLabel") }}</span>
          <lay-select v-model="searchForm.status" :style="{ width: statusWidth }">
            <lay-select-option v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t("userList.sortFieldLabel") }}</span>
          <lay-select v-model="searchForm.sortField" :style="{ width: sortFieldWidth }">
            <lay-select-option v-for="opt in sortFieldOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t("userList.sortOrderLabel") }}</span>
          <lay-select v-model="searchForm.sortOrder" :style="{ width: sortOrderWidth }">
            <lay-select-option v-for="opt in sortOrderOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
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
            <template v-if="canWrite">
              <lay-button type="normal" size="xs">{{ t("userList.addMember") }}</lay-button>
              <lay-button type="normal" size="xs">{{ t("userList.addAgent") }}</lay-button>
              <lay-button type="normal" size="xs">{{ t("userList.rebateSettings") }}</lay-button>
            </template>
          </template>
          <template #num="{ row, column }">
            <lay-count-up :end-val="Number(row[column.key]) || 0" :duration="0" :decimal-places="String(row[column.key]).includes('.') ? 2 : 0" :use-grouping="false" />
          </template>
          <template v-slot:action>
            <lay-button v-if="canWrite" size="xs" type="normal">{{ t("userList.rebateSettings") }}</lay-button>
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

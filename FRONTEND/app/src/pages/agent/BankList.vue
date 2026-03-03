<script setup lang="ts">
import { reactive, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useListPage } from "@/composables/useListPage";
import { fetchBankList } from "@/api/services/proxy";
import { createExportAllFn } from "@/composables/useExportAll";
import { layer } from "@layui/layui-vue";
import { useAgentFilter } from "@/composables/useAgentFilter";
import CookieBadge from "@/components/CookieBadge.vue";
import { useAuthStore } from "@/stores/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { useToolbarPermission } from "@/composables/useToolbarPermission";

const { t } = useI18n();

const authStore = useAuthStore();
const canWrite = authStore.hasPermission(PERMISSIONS.FINANCE_WRITE);

const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();
const { defaultToolbar, canExport } = useToolbarPermission();

const searchForm = reactive({
  accountNumber: "",
});

const columns = computed(() => [
  { title: t("common.agent"), key: "_agentName" },
  { title: t("bankList.code"), key: "id" },
  { title: t("bankList.isDefault"), key: "is_default_format" },
  { title: t("bankList.bankName"), key: "bank_name" },
  { title: t("bankList.branch"), key: "bank_branch", ellipsisTooltip: true },
  { title: t("bankList.accountNumber"), key: "card_no" },
  { title: t("bankList.accountHolder"), key: "name" },
  { title: t("common.actions"), key: "operation", customSlot: "operation" },
]);

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  try {
    const res = await fetchBankList({
      page: page.current,
      limit: page.limit,
      card_no: searchForm.accountNumber || undefined,
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
  fetchBankList({
    page: p,
    limit,
    card_no: searchForm.accountNumber || undefined,
  }).then((r) => r.data.data),
);

function handleReset() {
  searchForm.accountNumber = "";
  page.current = 1;
  loadData();
}

function handleAdd() {
  // TODO: open add bank account dialog
}

function handleEdit(_row: Record<string, unknown>) {
  // TODO: open edit bank account dialog
}

function handleDelete(_row: Record<string, unknown>) {
  // TODO: open delete confirmation dialog
}
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('bankList.title')">
        <div class="search-form-wrap">
          <div class="layui-inline">
            <span class="form-label">{{ t("common.agentLabel") }}</span>
            <lay-select v-model="selectedAgentId" :style="{ width: agentWidth }">
              <lay-select-option
                v-for="opt in agentOptions"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
              />
            </lay-select>
          </div>
          <div class="layui-inline">
            <span class="form-label">{{ t("bankList.accountLabel") }}</span>
            <lay-input v-model="searchForm.accountNumber" :placeholder="t('bankList.accountPlaceholder')" />
          </div>
          <div class="layui-inline">
            <lay-button type="normal" @click="handleSearch">
              <i class="layui-icon layui-icon-search" /> {{ t("common.search") }}
            </lay-button>
            <lay-button type="primary" @click="handleReset">
              <i class="layui-icon layui-icon-refresh" /> {{ t("common.reset") }}
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
          <template #toolbar>
            <CookieBadge />
            <lay-button v-if="canWrite" type="normal" size="xs" @click="handleAdd">
              {{ t("bankList.addBank") }}
            </lay-button>
          </template>
          <template #operation="{ row }">
            <lay-button v-if="canWrite" size="xs" type="primary" @click="handleEdit(row)">
              {{ t("common.edit") }}
            </lay-button>
            <lay-button v-if="canWrite" size="xs" type="danger" @click="handleDelete(row)">
              {{ t("common.delete") }}
            </lay-button>
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

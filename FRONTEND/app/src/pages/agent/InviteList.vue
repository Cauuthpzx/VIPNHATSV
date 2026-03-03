<script setup lang="ts">
import { reactive, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useListPage } from "@/composables/useListPage";
import { fetchInviteList } from "@/api/services/proxy";
import { createExportAllFn } from "@/composables/useExportAll";
import { layer } from "@layui/layui-vue";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { useAuthStore } from "@/stores/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { useToolbarPermission } from "@/composables/useToolbarPermission";

const { t } = useI18n();

const authStore = useAuthStore();
const canWrite = authStore.hasPermission(PERMISSIONS.INVITE_WRITE);

const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();
const { defaultToolbar, canExport } = useToolbarPermission();

const searchForm = reactive({
  dateAdded: [] as string[],
  inviteCode: "",
});

const columns = computed(() => [
  { title: t("common.agent"), key: "_agentName" },
  { title: t("inviteList.inviteCode"), key: "invite_code" },
  { title: t("inviteList.inviteType"), key: "user_type" },
  { title: t("inviteList.totalRegistered"), key: "reg_count", customSlot: "num" },
  { title: t("inviteList.userRegistered"), key: "scope_reg_count", customSlot: "num" },
  { title: t("inviteList.depositors"), key: "recharge_count", customSlot: "num" },
  { title: t("inviteList.firstDayDeposit"), key: "first_recharge_count", customSlot: "num" },
  { title: t("inviteList.firstDayDepositAmount"), key: "register_recharge_count", customSlot: "num" },
  { title: t("common.remark"), key: "remark", ellipsisTooltip: true },
  { title: t("inviteList.addedTime"), key: "create_time" },
  { title: t("common.actions"), key: "action", customSlot: "action" },
]);

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  try {
    const res = await fetchInviteList({
      page: page.current,
      limit: page.limit,
      invite_code: searchForm.inviteCode || undefined,
      create_time:
        searchForm.dateAdded?.length === 2
          ? `${searchForm.dateAdded[0]} - ${searchForm.dateAdded[1]}`
          : undefined,
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
  fetchInviteList({
    page: p,
    limit,
    invite_code: searchForm.inviteCode || undefined,
    create_time:
      searchForm.dateAdded?.length === 2
        ? `${searchForm.dateAdded[0]} - ${searchForm.dateAdded[1]}`
        : undefined,
  }).then((r) => r.data.data),
);

function handleReset() {
  searchForm.dateAdded = [];
  searchForm.inviteCode = "";
}
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('inviteList.title')">
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
            <span class="form-label">{{ t("inviteList.addedTimeLabel") }}</span>
            <lay-date-picker
              v-model="searchForm.dateAdded"
              range
              single-panel
              range-separator="-"
              :placeholder="[t('common.dateStart'), t('common.dateEnd')]"
              :allow-clear="true"
            />
          </div>
          <div class="layui-inline">
            <span class="form-label">{{ t("inviteList.inviteCodeLabel") }}</span>
            <lay-input v-model="searchForm.inviteCode" :placeholder="t('inviteList.inviteCodePlaceholder')" />
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
            <lay-button size="xs" type="normal">
              <i class="layui-icon layui-icon-chart-screen" style="margin-right: 4px" />
              <b>{{ t("common.localData") }}</b>
            </lay-button>
            <template v-if="canWrite">
              <lay-button type="normal" size="xs">
                {{ t("inviteList.addInviteCode") }}
              </lay-button>
              <lay-button type="normal" size="xs">
                {{ t("inviteList.copyLink") }}
              </lay-button>
              <lay-button type="normal" size="xs">
                {{ t("inviteList.viewSettings") }}
              </lay-button>
            </template>
          </template>
          <template #num="{ row, column }">
            <lay-count-up
              :end-val="Number(row[column.key]) || 0"
              :duration="0"
              :decimal-places="String(row[column.key]).includes('.') ? 2 : 0"
              :use-grouping="false"
            />
          </template>
          <template #action>
            <lay-button size="xs" type="primary">
              {{ t("common.detail") }}
            </lay-button>
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

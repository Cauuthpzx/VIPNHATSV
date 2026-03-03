<script setup lang="ts">
import { reactive, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useListPage } from "@/composables/useListPage";
import { fetchBetOrder } from "@/api/services/proxy";
import { createExportAllFn } from "@/composables/useExportAll";
import { layer } from "@layui/layui-vue";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { useToolbarPermission } from "@/composables/useToolbarPermission";
import CookieBadge from "@/components/CookieBadge.vue";

const { t } = useI18n();

const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();
const { defaultToolbar, canExport } = useToolbarPermission();

const searchForm = reactive({
  dateRange: [] as string[],
  serialNo: "",
  platformUsername: "",
});

const columns = computed(() => [
  { title: t("common.agent"), key: "_agentName" },
  { title: t("betOrder.serialNo"), key: "serial_no" },
  { title: t("betOrder.provider"), key: "platform_id_name" },
  { title: t("betOrder.platformUsername"), key: "platform_username" },
  { title: t("betOrder.gameType"), key: "c_name", ellipsisTooltip: true },
  { title: t("betOrder.gameName"), key: "game_name", ellipsisTooltip: true },
  { title: t("betOrder.betAmount"), key: "bet_amount", customSlot: "num" },
  { title: t("betOrder.validBet"), key: "turnover", customSlot: "num" },
  { title: t("betOrder.prize"), key: "prize", customSlot: "num" },
  { title: t("betOrder.winLose"), key: "win_lose", customSlot: "num" },
  { title: t("betOrder.betTime"), key: "bet_time" },
]);

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  try {
    const res = await fetchBetOrder({
      page: page.current,
      limit: page.limit,
      serial_no: searchForm.serialNo || undefined,
      platform_username: searchForm.platformUsername || undefined,
      bet_time:
        searchForm.dateRange?.length === 2
          ? `${searchForm.dateRange[0]} - ${searchForm.dateRange[1]}`
          : undefined,
      es: 1,
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
  fetchBetOrder({
    page: p,
    limit,
    serial_no: searchForm.serialNo || undefined,
    platform_username: searchForm.platformUsername || undefined,
    bet_time:
      searchForm.dateRange?.length === 2
        ? `${searchForm.dateRange[0]} - ${searchForm.dateRange[1]}`
        : undefined,
    es: 1,
  }).then((r) => r.data.data),
);

function handleReset() {
  searchForm.dateRange = [];
  searchForm.serialNo = "";
  searchForm.platformUsername = "";
}
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('betOrder.title')">
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
            <span class="form-label">{{ t("common.timeLabel") }}</span>
            <lay-date-picker
              v-model="searchForm.dateRange"
              range
              single-panel
              range-separator="-"
              :placeholder="[t('common.dateStart'), t('common.dateEnd')]"
              :allow-clear="true"
            />
          </div>
          <div class="layui-inline">
            <span class="form-label">{{ t("betOrder.serialNoLabel") }}</span>
            <lay-input v-model="searchForm.serialNo" :placeholder="t('betOrder.serialNoPlaceholder')" />
          </div>
          <div class="layui-inline">
            <span class="form-label">{{ t("betOrder.platformUsernameLabel") }}</span>
            <lay-input
              v-model="searchForm.platformUsername"
              :placeholder="t('betOrder.platformUsernamePlaceholder')"
            />
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
          </template>
          <template #num="{ row, column }">
            <lay-count-up
              :end-val="Number(row[column.key]) || 0"
              :duration="0"
              :decimal-places="String(row[column.key]).includes('.') ? 2 : 0"
              :use-grouping="false"
            />
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

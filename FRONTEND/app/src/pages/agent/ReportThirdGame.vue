<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { fetchReportThirdGame } from "@/api/services/proxy";
import { createExportAllFn } from "@/composables/useExportAll";
import { useToolbarPermission } from "@/composables/useToolbarPermission";
import { layer } from "@layui/layui-vue";
import CookieBadge from "@/components/CookieBadge.vue";

const { t } = useI18n();

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } =
  useDateRange("today");
const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();
const { defaultToolbar, canExport } = useToolbarPermission();

const searchForm = reactive({
  username: "",
  platform: "",
});

const platformOptions = [
  { label: t("common.all"), value: "" },
  { label: "PA", value: "PA" },
  { label: "BBIN", value: "BBIN" },
  { label: "WM", value: "WM" },
  { label: "MINI", value: "MINI" },
  { label: "KY", value: "KY" },
  { label: "PGSOFT", value: "PGSOFT" },
  { label: "LUCKYWIN", value: "LUCKYWIN" },
  { label: "SABA", value: "SABA" },
  { label: "PT", value: "PT" },
  { label: "RICH88", value: "RICH88" },
  { label: "ASTAR", value: "ASTAR" },
  { label: "FB", value: "FB" },
  { label: "JILI", value: "JILI" },
  { label: "KA", value: "KA" },
  { label: "MW", value: "MW" },
  { label: "SBO", value: "SBO" },
  { label: "NEXTSPIN", value: "NEXTSPIN" },
  { label: "AMB", value: "AMB" },
  { label: "FunTa", value: "FunTa" },
  { label: "MG", value: "MG" },
  { label: "WS168", value: "WS168" },
  { label: "DG CASINO", value: "DG CASINO" },
  { label: "V8", value: "V8" },
  { label: "AE", value: "AE" },
  { label: "TP", value: "TP" },
  { label: "FC", value: "FC" },
  { label: "JDB", value: "JDB" },
  { label: "CQ9", value: "CQ9" },
  { label: "PP", value: "PP" },
  { label: "VA", value: "VA" },
  { label: "BNG", value: "BNG" },
  { label: "DB CASINO", value: "DB CASINO" },
  { label: "EVO CASINO", value: "EVO CASINO" },
  { label: "CMD SPORTS", value: "CMD SPORTS" },
  { label: "PG NEW", value: "PG NEW" },
  { label: "FBLIVE", value: "FBLIVE" },
  { label: "ON CASINO", value: "ON CASINO" },
  { label: "MT", value: "MT" },
  { label: "fC NEW", value: "fC NEW" },
];

const { selectWidth: platformWidth } = useAutoFitSelect(platformOptions);

const columns = computed(() => [
  { title: t("common.agent"), key: "_agentName" },
  { title: t("reportThirdGame.account"), key: "username" },
  { title: t("reportThirdGame.provider"), key: "platform_id_name", ellipsisTooltip: true },
  { title: t("reportThirdGame.betCount"), key: "t_bet_times", customSlot: "num" },
  { title: t("reportThirdGame.betAmount"), key: "t_bet_amount", customSlot: "num" },
  { title: t("reportThirdGame.validBet"), key: "t_turnover", customSlot: "num" },
  { title: t("reportThirdGame.prize"), key: "t_prize", customSlot: "num" },
  { title: t("reportThirdGame.winLose"), key: "t_win_lose", customSlot: "num" },
]);

const summaryColumns = computed(() => [
  { title: t("reportThirdGame.betCount"), key: "total_bet_times", customSlot: "sumNum" },
  { title: t("reportThirdGame.bettorsCount"), key: "total_bet_number", customSlot: "sumNum" },
  { title: t("reportThirdGame.betAmount"), key: "total_bet_amount", customSlot: "sumNum" },
  { title: t("reportThirdGame.validBet"), key: "total_turnover", customSlot: "sumNum" },
  { title: t("reportThirdGame.prize"), key: "total_prize", customSlot: "sumNum" },
  { title: t("reportThirdGame.winLose"), key: "total_win_lose", customSlot: "sumNum" },
]);

const summaryData = ref([
  {
    total_bet_number: 0,
    total_bet_times: 0,
    total_bet_amount: "0.0000",
    total_turnover: "0.0000",
    total_prize: "0.0000",
    total_win_lose: "0.0000",
  },
]);

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  try {
    const res = await fetchReportThirdGame({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      platform_id: searchForm.platform || undefined,
      date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
    });
    if (isStale()) return;
    dataSource.value = res.data.data.items;
    page.total = res.data.data.total;
    if (res.data.data.totalData) {
      summaryData.value = [res.data.data.totalData as any];
    } else {
      summaryData.value = [
        {
          total_bet_number: 0,
          total_bet_times: 0,
          total_bet_amount: "0.0000",
          total_turnover: "0.0000",
          total_prize: "0.0000",
          total_win_lose: "0.0000",
        },
      ];
    }
  } catch {
    if (!isStale()) layer.msg(t("common.errorLoad"), { icon: 2 });
  } finally {
    if (!isStale()) setLoading(false);
  }
}

const { handlePageChange, handleSearch } = bindLoadData(loadData, selectedAgentId, [dateRange]);

const exportAllFn = createExportAllFn((p, limit) =>
  fetchReportThirdGame({
    page: p,
    limit,
    username: searchForm.username || undefined,
    platform_id: searchForm.platform || undefined,
    date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
  }).then((r) => r.data.data),
);

function handleReset() {
  resetDateRange();
  searchForm.username = "";
  searchForm.platform = "";
}
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('reportThirdGame.title')">
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
              v-model="dateRange"
              range
              single-panel
              range-separator="-"
              :placeholder="[t('common.dateStart'), t('common.dateEnd')]"
            />
          </div>
          <div class="layui-inline">
            <lay-select v-model="dateQuickSelect" :style="{ width: dateQuickWidth }">
              <lay-select-option
                v-for="opt in dateQuickOptions"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
              />
            </lay-select>
          </div>
          <div class="layui-inline">
            <span class="form-label">{{ t("reportThirdGame.accountLabel") }}</span>
            <lay-input v-model="searchForm.username" :placeholder="t('reportThirdGame.accountPlaceholder')" />
          </div>
          <div class="layui-inline">
            <span class="form-label">{{ t("reportThirdGame.providerLabel") }}</span>
            <lay-select v-model="searchForm.platform" :style="{ width: platformWidth }">
              <lay-select-option
                v-for="opt in platformOptions"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
              />
            </lay-select>
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
        <lay-table :columns="summaryColumns" :data-source="summaryData" :default-toolbar="defaultToolbar">
          <template #toolbar>
            <lay-button size="xs" type="normal">
              <b>{{ t("common.summaryData") }}</b>
            </lay-button>
          </template>
          <template #sumNum="{ row, column }">
            <lay-count-up
              :end-val="Number(row[column.key]) || 0"
              :duration="0"
              :decimal-places="String(row[column.key]).includes('.') ? 4 : 0"
              :use-grouping="false"
            />
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

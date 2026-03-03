<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { fetchReportLottery, fetchLotteryDropdown } from "@/api/services/proxy";
import { createExportAllFn } from "@/composables/useExportAll";
import { layer } from "@layui/layui-vue";
import CookieBadge from "@/components/CookieBadge.vue";

const { t } = useI18n();

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();

const searchForm = reactive({
  lotteryType: "",
  username: "",
});

const lotteryOptions = ref([
  { label: "Tất cả", value: "" },
]);

const { selectWidth: lotteryWidth } = useAutoFitSelect(lotteryOptions);

async function loadLotteryOptions() {
  try {
    const res = await fetchLotteryDropdown();
    const items = res.data.data.items as any;
    if (items?.lotteryData) {
      lotteryOptions.value = [
        { label: "Tất cả", value: "" },
        ...items.lotteryData.map((l: any) => ({ label: l.name, value: String(l.id) })),
      ];
    }
  } catch {}
}

const columns = computed(() => [
  { title: t("common.agent"), key: "_agentName" },
  { title: t("reportLottery.account"), key: "username" },
  { title: t("reportLottery.agentBelong"), key: "user_parent_format" },
  { title: t("reportLottery.betCount"), key: "bet_count", customSlot: "num" },
  { title: t("reportLottery.betAmount"), key: "bet_amount", customSlot: "num" },
  { title: t("reportLottery.validBet"), key: "valid_amount", customSlot: "num" },
  { title: t("reportLottery.rebate"), key: "rebate_amount", customSlot: "num" },
  { title: t("reportLottery.winLose"), key: "result", customSlot: "num" },
  { title: t("reportLottery.winLoseNoRebate"), key: "win_lose", customSlot: "num" },
  { title: t("reportLottery.prizeAmount"), key: "prize", customSlot: "num" },
  { title: t("reportLottery.lotteryName"), key: "lottery_name", ellipsisTooltip: true },
]);

const summaryColumns = computed(() => [
  { title: t("reportLottery.bettorsCount"), key: "total_bet_number", customSlot: "sumNum" },
  { title: t("reportLottery.betCount"), key: "total_bet_count", customSlot: "sumNum" },
  { title: t("reportLottery.betAmount"), key: "total_bet_amount", customSlot: "sumNum" },
  { title: t("reportLottery.validBet"), key: "total_valid_amount", customSlot: "sumNum" },
  { title: t("reportLottery.rebate"), key: "total_rebate_amount", customSlot: "sumNum" },
  { title: t("reportLottery.winLose"), key: "total_result", customSlot: "sumNum" },
  { title: t("reportLottery.winLoseNoRebate"), key: "total_win_lose", customSlot: "sumNum" },
  { title: t("reportLottery.prizeAmount"), key: "total_prize", customSlot: "sumNum" },
]);

const summaryData = ref([
  {
    total_bet_number: 0,
    total_bet_count: 0,
    total_bet_amount: "0.0000",
    total_valid_amount: "0.0000",
    total_rebate_amount: "0.0000",
    total_result: "0.0000",
    total_win_lose: "0.0000",
    total_prize: "0.0000",
  },
]);

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  try {
    const res = await fetchReportLottery({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      lottery_id: searchForm.lotteryType || undefined,
      date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
    });
    if (isStale()) return;
    dataSource.value = res.data.data.items;
    page.total = res.data.data.total;
    if (res.data.data.totalData) {
      summaryData.value = [res.data.data.totalData as any];
    } else {
      summaryData.value = [{ total_bet_number: 0, total_bet_count: 0, total_bet_amount: "0.0000", total_valid_amount: "0.0000", total_rebate_amount: "0.0000", total_result: "0.0000", total_win_lose: "0.0000", total_prize: "0.0000" }];
    }
  } catch {
    if (!isStale()) layer.msg(t("common.errorLoad"), { icon: 2 });
  } finally {
    if (!isStale()) setLoading(false);
  }
}

const { handlePageChange, handleSearch } = bindLoadData(loadData, selectedAgentId, [dateRange]);

const exportAllFn = createExportAllFn((p, limit) =>
  fetchReportLottery({
    page: p, limit,
    username: searchForm.username || undefined,
    lottery_id: searchForm.lotteryType || undefined,
    date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
  }).then(r => r.data.data),
);

function handleReset() {
  resetDateRange();
  searchForm.lotteryType = "";
  searchForm.username = "";
}

onMounted(() => loadLotteryOptions());
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('reportLottery.title')">
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
          <span class="form-label">{{ t("reportLottery.lotteryNameLabel") }}</span>
          <lay-select v-model="searchForm.lotteryType" :style="{ width: lotteryWidth }">
            <lay-select-option v-for="opt in lotteryOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t("reportLottery.accountLabel") }}</span>
          <lay-input v-model="searchForm.username" :placeholder="t('reportLottery.accountPlaceholder')" />
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
        </lay-table>
        <lay-table :columns="summaryColumns" :data-source="summaryData" :default-toolbar="true">
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

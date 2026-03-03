<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { fetchLotteryDropdown, fetchRebateOdds } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { useAgentFilter } from "@/composables/useAgentFilter";
import CookieBadge from "@/components/CookieBadge.vue";

const { t } = useI18n();

const selectedSeries = ref("");
const selectedLottery = ref("");
const seriesOptions = ref<{ value: string; label: string }[]>([]);
const lotteryOptions = ref<{ value: string; label: string }[]>([]);
const loading = ref(false);

const { selectWidth: seriesWidth } = useAutoFitSelect(seriesOptions);
const { selectWidth: lotteryWidth } = useAutoFitSelect(lotteryOptions);
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();

const agentColumn = { title: t("common.agent"), key: "_agentName" };
const columns = ref<{ title: string; key: string }[]>([]);
const dataSource = ref<Record<string, any>[]>([]);

async function fetchInit() {
  try {
    const res = await fetchLotteryDropdown();
    const items = res.data.data.items as any;
    if (items?.seriesData) {
      seriesOptions.value = items.seriesData.map((s: any) => ({
        value: String(s.id),
        label: s.name,
      }));
    }
    if (seriesOptions.value.length > 0) {
      selectedSeries.value = seriesOptions.value[0].value;
    }
  } catch {
    layer.msg(t("rebateOdds.errorLoadLottery"), { icon: 2 });
  }
}

async function fetchLotteryTypes(seriesId: string) {
  if (!seriesId) {
    lotteryOptions.value = [];
    return;
  }
  try {
    const res = await fetchLotteryDropdown({ series_id: seriesId });
    const items = res.data.data.items as any;
    if (items?.lotteryData) {
      lotteryOptions.value = items.lotteryData
        .filter((l: any) => String(l.series_id) === seriesId)
        .map((l: any) => ({ value: String(l.id), label: l.name }));
    }
    if (lotteryOptions.value.length > 0) {
      selectedLottery.value = lotteryOptions.value[0].value;
    }
  } catch {
    layer.msg(t("rebateOdds.errorLoadType"), { icon: 2 });
  }
}

async function fetchRebateData() {
  if (!selectedLottery.value) {
    dataSource.value = [];
    return;
  }
  loading.value = true;
  try {
    const res = await fetchRebateOdds({
      type: "getData",
      lotteryId: selectedLottery.value,
    });
    const items = res.data.data.items as any;
    if (items?.tableHead && items?.tableBody) {
      columns.value = [
        agentColumn,
        ...(items.tableHead as any[]).map((h: any) => ({
          title: h.title || h,
          key: h.key || h.field || h,
        })),
      ];
      dataSource.value = items.tableBody;
    } else {
      buildFallbackData();
    }
  } catch {
    buildFallbackData();
  } finally {
    loading.value = false;
  }
}

function buildFallbackData() {
  columns.value = [
    agentColumn,
    { title: t("rebateOdds.playType"), key: "playType" },
    { title: `${t("rebateOdds.rebate")} 10`, key: "rebate10" },
    { title: `${t("rebateOdds.rebate")} 9`, key: "rebate9" },
    { title: `${t("rebateOdds.rebate")} 8`, key: "rebate8" },
    { title: `${t("rebateOdds.rebate")} 7`, key: "rebate7" },
    { title: `${t("rebateOdds.rebate")} 6`, key: "rebate6" },
    { title: `${t("rebateOdds.rebate")} 5`, key: "rebate5" },
    { title: `${t("rebateOdds.rebate")} 4`, key: "rebate4" },
    { title: `${t("rebateOdds.rebate")} 3`, key: "rebate3" },
    { title: `${t("rebateOdds.rebate")} 2`, key: "rebate2" },
    { title: `${t("rebateOdds.rebate")} 1`, key: "rebate1" },
  ];

  const generateRow = (playType: string, base: number, step: number) => ({
    playType,
    rebate10: base.toFixed(3).replace(/\.?0+$/, ""),
    rebate9: (base - step * 1).toFixed(3).replace(/\.?0+$/, ""),
    rebate8: (base - step * 2).toFixed(3).replace(/\.?0+$/, ""),
    rebate7: (base - step * 3).toFixed(3).replace(/\.?0+$/, ""),
    rebate6: (base - step * 4).toFixed(3).replace(/\.?0+$/, ""),
    rebate5: (base - step * 5).toFixed(3).replace(/\.?0+$/, ""),
    rebate4: (base - step * 6).toFixed(3).replace(/\.?0+$/, ""),
    rebate3: (base - step * 7).toFixed(3).replace(/\.?0+$/, ""),
    rebate2: (base - step * 8).toFixed(3).replace(/\.?0+$/, ""),
    rebate1: (base - step * 9).toFixed(3).replace(/\.?0+$/, ""),
  });

  dataSource.value = [
    generateRow(t("playType.lo2so"), 99.5, 0.099),
    generateRow(t("playType.lo2so1k"), 5.5, 0.005),
    generateRow(t("playType.lo3so"), 980, 0.98),
    generateRow(t("playType.lo4so"), 8880, 8.88),
    generateRow(t("playType.xien2"), 28, 0.028),
    generateRow(t("playType.xien3"), 150, 0.15),
    generateRow(t("playType.xien4"), 750, 0.75),
    generateRow(t("playType.deDau"), 99.5, 0.099),
    generateRow(t("playType.deDacBiet"), 99.5, 0.099),
    generateRow(t("playType.deDauDuoi"), 99.5, 0.099),
    generateRow(t("playType.dau"), 9.95, 0.01),
    generateRow(t("playType.duoi"), 9.95, 0.01),
    generateRow(t("playType.cang3Dau"), 980, 0.98),
    generateRow(t("playType.cang3DacBiet"), 980, 0.98),
    generateRow(t("playType.cang3DauDuoi"), 980, 0.98),
    generateRow(t("playType.cang4DacBiet"), 8880, 8.88),
    generateRow(t("playType.truotXien4"), 2, 0.002),
    generateRow(t("playType.truotXien8"), 3.3, 0.003),
    generateRow(t("playType.truotXien10"), 5.6, 0.006),
    generateRow(t("playType.keoDoi"), 1.995, 0.002),
    generateRow(t("playType.tong0"), 70, 0.07),
    generateRow(t("playType.tong1"), 36, 0.036),
  ];
}

watch(selectedSeries, (val) => {
  selectedLottery.value = "";
  lotteryOptions.value = [];
  dataSource.value = [];
  columns.value = [];
  if (val) {
    fetchLotteryTypes(val);
  }
});

watch(selectedLottery, (val) => {
  if (val) {
    fetchRebateData();
  }
});

watch(selectedAgentId, () => { if (selectedLottery.value) fetchRebateData(); });
onMounted(() => {
  fetchInit();
});
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('rebateOdds.title')">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">{{ t('common.agentLabel') }}</span>
          <lay-select v-model="selectedAgentId" :style="{ width: agentWidth }">
            <lay-select-option v-for="opt in agentOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">{{ t('rebateOdds.lotteryLabel') }}</span>
          <lay-select v-model="selectedSeries" :style="{ width: seriesWidth }">
            <lay-select-option
              v-for="opt in seriesOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </lay-select>
        </div>
        <div class="layui-inline">
          <lay-select v-model="selectedLottery" :style="{ width: lotteryWidth }">
            <lay-select-option
              v-for="opt in lotteryOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </lay-select>
        </div>
      </div>
      </lay-field>

      <div class="table-container">
        <lay-table
          :resize="true"
          :columns="columns"
          :loading="loading"
          :default-toolbar="true"
          :data-source="dataSource"
        >
          <template v-slot:toolbar>
            <CookieBadge />
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

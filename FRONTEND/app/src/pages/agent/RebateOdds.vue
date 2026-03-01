<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { fetchLotteryDropdown, fetchRebateOdds } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";

const selectedSeries = ref("");
const selectedLottery = ref("");
const seriesOptions = ref<{ value: string; label: string }[]>([]);
const lotteryOptions = ref<{ value: string; label: string }[]>([]);
const loading = ref(false);

const { selectWidth: seriesWidth } = useAutoFitSelect(seriesOptions);
const { selectWidth: lotteryWidth } = useAutoFitSelect(lotteryOptions);

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
    layer.msg("Lỗi tải danh sách xổ số", { icon: 2 });
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
    layer.msg("Lỗi tải loại xổ số", { icon: 2 });
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
      columns.value = (items.tableHead as any[]).map((h: any) => ({
        title: h.title || h,
        key: h.key || h.field || h,
      }));
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
    { title: "Kiểu chơi", key: "playType" },
    { title: "Hoàn trả 10", key: "rebate10" },
    { title: "Hoàn trả 9", key: "rebate9" },
    { title: "Hoàn trả 8", key: "rebate8" },
    { title: "Hoàn trả 7", key: "rebate7" },
    { title: "Hoàn trả 6", key: "rebate6" },
    { title: "Hoàn trả 5", key: "rebate5" },
    { title: "Hoàn trả 4", key: "rebate4" },
    { title: "Hoàn trả 3", key: "rebate3" },
    { title: "Hoàn trả 2", key: "rebate2" },
    { title: "Hoàn trả 1", key: "rebate1" },
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
    generateRow("Lô 2 Số", 99.5, 0.099),
    generateRow("Lô 2 Số 1K", 5.5, 0.005),
    generateRow("Lô 3 Số", 980, 0.98),
    generateRow("Lô 4 Số", 8880, 8.88),
    generateRow("Xiên 2", 28, 0.028),
    generateRow("Xiên 3", 150, 0.15),
    generateRow("Xiên 4", 750, 0.75),
    generateRow("Đề đầu", 99.5, 0.099),
    generateRow("Đề đặc biệt", 99.5, 0.099),
    generateRow("Đề đầu đuôi", 99.5, 0.099),
    generateRow("Đầu", 9.95, 0.01),
    generateRow("Đuôi", 9.95, 0.01),
    generateRow("3 Càng đầu", 980, 0.98),
    generateRow("3 Càng đặc biệt", 980, 0.98),
    generateRow("3 Càng đầu đuôi", 980, 0.98),
    generateRow("4 Càng đặc biệt", 8880, 8.88),
    generateRow("Trượt xiên 4", 2, 0.002),
    generateRow("Trượt xiên 8", 3.3, 0.003),
    generateRow("Trượt xiên 10", 5.6, 0.006),
    generateRow("Kéo đôi", 1.995, 0.002),
    generateRow("Tổng 0", 70, 0.07),
    generateRow("Tổng 1", 36, 0.036),
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

onMounted(() => {
  fetchInit();
});
</script>

<template>
  <div>
    <lay-card>
      <lay-field title="Danh sách tỉ lệ hoàn trả">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Chọn loại xổ :</span>
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
          :max-height="'100%'"
          :columns="columns"
          :loading="loading"
          :default-toolbar="true"
          :data-source="dataSource"
        />
      </div>
    </lay-card>
  </div>
</template>

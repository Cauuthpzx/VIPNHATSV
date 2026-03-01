<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const selectedSeries = ref("");
const selectedLottery = ref("");
const seriesOptions = ref<{ value: string; label: string }[]>([]);
const lotteryOptions = ref<{ value: string; label: string }[]>([]);
const loading = ref(false);

const columns = ref<{ title: string; key: string; width?: string; align?: string }[]>([]);
const dataSource = ref<Record<string, any>[]>([]);

async function fetchInit() {
  // TODO: call API POST /agent/getRebateOddsPanel.html { type: "init" }
  seriesOptions.value = [
    { value: "1", label: "Miền Nam" },
    { value: "2", label: "Miền Bắc" },
    { value: "3", label: "Miền Trung" },
    { value: "6", label: "Xổ số nhanh" },
    { value: "7", label: "Keno" },
    { value: "8", label: "Xổ số cào" },
    { value: "9", label: "Sicbo" },
    { value: "10", label: "pk" },
    { value: "11", label: "Wingo" },
  ];
  selectedSeries.value = "1";
}

async function fetchLotteryTypes(seriesId: string) {
  if (!seriesId) {
    lotteryOptions.value = [];
    return;
  }
  // TODO: call API POST /agent/getRebateOddsPanel.html { type: "getLottery", series_id: seriesId }
  lotteryOptions.value = [
    { value: "1", label: "Miền Nam VIP" },
    { value: "2", label: "Hồ Chí Minh" },
  ];
  if (lotteryOptions.value.length > 0) {
    selectedLottery.value = lotteryOptions.value[0].value;
  }
}

async function fetchRebateData() {
  if (!selectedLottery.value) {
    dataSource.value = [];
    return;
  }
  loading.value = true;
  // TODO: call API POST /agent/getRebateOddsPanel.html { type: "getData", lotteryId }
  buildFallbackData();
  loading.value = false;
}

function buildFallbackData() {
  columns.value = [
    { title: "Kiểu chơi", key: "playType", width: "231.8px", align: "center" },
    { title: "Hoàn trả 10", key: "rebate10", width: "174.5px", align: "center" },
    { title: "Hoàn trả 9", key: "rebate9", width: "161.4px", align: "center" },
    { title: "Hoàn trả 8", key: "rebate8", width: "161.4px", align: "center" },
    { title: "Hoàn trả 7", key: "rebate7", width: "161.4px", align: "center" },
    { title: "Hoàn trả 6", key: "rebate6", width: "161.4px", align: "center" },
    { title: "Hoàn trả 5", key: "rebate5", width: "161.4px", align: "center" },
    { title: "Hoàn trả 4", key: "rebate4", width: "161.4px", align: "center" },
    { title: "Hoàn trả 3", key: "rebate3", width: "161.4px", align: "center" },
    { title: "Hoàn trả 2", key: "rebate2", width: "161.4px", align: "center" },
    { title: "Hoàn trả 1", key: "rebate1", width: "161.4px", align: "center" },
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
    <lay-card title="Danh sách tỉ lệ hoàn trả">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Chọn loại xổ :</span>
          <lay-select v-model="selectedSeries" style="width: 150px">
            <lay-select-option
              v-for="opt in seriesOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </lay-select>
        </div>
        <div class="layui-inline">
          <lay-select v-model="selectedLottery" style="width: 200px">
            <lay-select-option
              v-for="opt in lotteryOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </lay-select>
        </div>
      </div>

      <lay-table :columns="columns" :data-source="dataSource" :default-toolbar="true" :loading="loading" />
    </lay-card>
  </div>
</template>

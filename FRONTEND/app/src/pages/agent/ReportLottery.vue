<script setup lang="ts">
import { ref, reactive, watch } from "vue";

const searchForm = reactive({
  dateRange: [] as string[],
  lotteryType: "",
  username: "",
});

const dateQuickSelect = ref("today");
const dateQuickOptions = [
  { label: "Hôm nay", value: "today" },
  { label: "Hôm qua", value: "yesterday" },
  { label: "Tuần này", value: "thisWeek" },
  { label: "Tháng này", value: "thisMonth" },
  { label: "Tháng trước", value: "lastMonth" },
];

function getDateRange(type: string): string[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  let start = fmt(today);
  let end = fmt(today);
  switch (type) {
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      start = fmt(y);
      end = fmt(y);
      break;
    }
    case "thisWeek": {
      const day = today.getDay() || 7;
      const mon = new Date(today);
      mon.setDate(today.getDate() - day + 1);
      start = fmt(mon);
      break;
    }
    case "thisMonth": {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      start = fmt(first);
      break;
    }
    case "lastMonth": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      start = fmt(first);
      end = fmt(last);
      break;
    }
  }
  return [start, end];
}

// Initialize with today's date
searchForm.dateRange = getDateRange("today");

watch(dateQuickSelect, (val) => {
  searchForm.dateRange = getDateRange(val);
});

const columns = [
  { title: "Tên tài khoản", key: "username", width: "150.5px", align: "center" },
  { title: "Thuộc đại lý", key: "agent", width: "151px", align: "center" },
  { title: "Số lần cược", key: "betCount", width: "201px", align: "center" },
  { title: "Tiền cược", key: "betAmount", width: "201px", align: "center" },
  { title: "Tiền cược hợp lệ (trừ cược hoà)", key: "validBet", width: "201px", align: "center" },
  { title: "Hoàn trả", key: "rebate", align: "center" },
  { title: "Thắng thua", key: "winLoss", align: "center" },
  { title: "Kết quả thắng thua (không gồm hoàn trả)", key: "netResult", align: "center" },
  { title: "Tiền trúng", key: "winAmount", align: "center" },
  { title: "Tên loại xổ", key: "lotteryName", align: "center" },
];

const summaryColumns = [
  { title: "Số khách đặt cược", key: "players", align: "center" },
  { title: "Số lần cược", key: "bets", align: "center" },
  { title: "Tiền cược", key: "betAmount", align: "center" },
  { title: "Tiền cược hợp lệ (trừ cược hoà)", key: "validBet", align: "center" },
  { title: "Hoàn trả", key: "rebate", align: "center" },
  { title: "Thắng thua", key: "winLoss", align: "center" },
  { title: "Kết quả thắng thua (không gồm hoàn trả)", key: "netResult", align: "center" },
  { title: "Tiền trúng", key: "winAmount", align: "center" },
];

const dataSource = ref([]);
const loading = ref(false);
const page = reactive({ current: 1, limit: 10, total: 0 });

const summary = reactive({
  totalPlayers: 0,
  totalBets: 0,
  totalBetAmount: "0.0000",
  totalValidBet: "0.0000",
  totalRebate: "0.0000",
  totalWinLoss: "0.0000",
  totalNetResult: "0.0000",
  totalWinAmount: "0.0000",
});

const summaryData = ref([
  {
    players: 0,
    bets: 0,
    betAmount: "0.0000",
    validBet: "0.0000",
    rebate: "0.0000",
    winLoss: "0.0000",
    netResult: "0.0000",
    winAmount: "0.0000",
  },
]);

function handleSearch() {
  page.current = 1;
  // TODO: call API
}

function handleReset() {
  searchForm.dateRange = [];
  searchForm.lotteryType = "";
  searchForm.username = "";
}

function handlePageChange(val: { current: number }) {
  page.current = val.current;
}

function handleLimitChange(limit: number) {
  page.limit = limit;
  page.current = 1;
}
</script>

<template>
  <div>
    <lay-card title="Báo cáo xổ số">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Thời gian :</span>
          <lay-date-picker v-model="searchForm.dateRange" range single-panel range-separator="-" :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" />
        </div>
        <div class="layui-inline">
          <lay-select v-model="dateQuickSelect" style="width: 150px" @change="onDateQuickChange">
            <lay-select-option v-for="opt in dateQuickOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Tên loại xổ :</span>
          <lay-select v-model="searchForm.lotteryType" placeholder="Chọn hoặc nhập để tìm kiếm" style="width: 200px" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Tên tài khoản :</span>
          <lay-input v-model="searchForm.username" placeholder="Nhập tên tài khoản" style="width: 200px" />
        </div>
        <div class="layui-inline">
          <lay-button type="normal" @click="handleSearch">
            <i class="layui-icon layui-icon-search"></i> Tìm kiếm
          </lay-button>
          <lay-button type="primary" @click="handleReset">
            <i class="layui-icon layui-icon-refresh"></i> Đặt lại
          </lay-button>
        </div>
      </div>

      <lay-table :columns="columns" :data-source="dataSource" :default-toolbar="true" :loading="loading" />
      <lay-page
        v-model="page.current"
        :limit="page.limit"
        :total="page.total"
        :layout="['prev', 'page', 'next', 'skip', 'count', 'limits']"
        style="margin-top: 10px"
        @change="handlePageChange"
        @limit-change="handleLimitChange"
      />

      <div class="summary-section">
        <div class="summary-title">Dữ liệu tổng hợp :</div>
        <lay-table :columns="summaryColumns" :data-source="summaryData" :default-toolbar="true" />
      </div>
    </lay-card>
  </div>
</template>

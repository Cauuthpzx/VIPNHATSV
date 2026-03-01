<script setup lang="ts">
import { ref, reactive, watch } from "vue";

const searchForm = reactive({
  dateRange: [] as string[],
  username: "",
  serialNo: "",
  lotteryType: "",
  playType: "",
  play: "",
  status: "",
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

const lotteryOptions = [
  { label: "Chọn", value: "" },
];

const playTypeOptions = [
  { label: "Chọn", value: "" },
];

const playOptions = [
  { label: "Chọn", value: "" },
];

const statusOptions = [
  { label: "Chọn", value: "" },
  { label: "Chờ xử lý", value: "pending" },
  { label: "Thắng", value: "won" },
  { label: "Thua", value: "lost" },
  { label: "Hoà", value: "draw" },
  { label: "Đã hủy", value: "cancelled" },
];

const columns = [
  { title: "Mã giao dịch", key: "serialNo", width: "200.5px", align: "center" },
  { title: "Tên người dùng", key: "username", width: "151px", align: "center" },
  { title: "Thời gian cược", key: "betTime", width: "161px", align: "center" },
  { title: "Trò chơi", key: "game", width: "157px", align: "center" },
  { title: "Loại trò chơi", key: "gameType", width: "157px", align: "center" },
  { title: "Kiểu chơi", key: "playType", align: "center" },
  { title: "Nội dung cược", key: "betContent", align: "center" },
  { title: "Tiền cược", key: "betAmount", align: "center" },
  { title: "Tỉ lệ cược", key: "odds", align: "center" },
  { title: "Kết quả", key: "result", align: "center" },
  { title: "Hoàn trả", key: "rebate", align: "center" },
  { title: "Trạng thái", key: "status", customSlot: "status", align: "center" },
  { title: "Thời gian xổ", key: "drawTime", align: "center" },
  { title: "Kỳ xổ", key: "drawPeriod", align: "center" },
  { title: "Thao tác", key: "action", customSlot: "action", align: "center" },
];

const summaryColumns = [
  { title: "Tổng tiền cược", key: "totalBetAmount", align: "center" },
  { title: "Tổng tiền thắng", key: "totalWinAmount", align: "center" },
  { title: "Tổng hoàn trả", key: "totalRebate", align: "center" },
  { title: "Tổng thắng thua", key: "totalWinLoss", align: "center" },
];

const dataSource = ref([]);
const loading = ref(false);
const page = reactive({ current: 1, limit: 10, total: 0 });

const summaryData = ref([
  {
    totalBetAmount: "0.0000",
    totalWinAmount: "0.0000",
    totalRebate: "0.0000",
    totalWinLoss: "0.0000",
  },
]);

function handleSearch() {
  page.current = 1;
  // TODO: call API
}

function handleReset() {
  searchForm.dateRange = [];
  searchForm.username = "";
  searchForm.serialNo = "";
  searchForm.lotteryType = "";
  searchForm.playType = "";
  searchForm.play = "";
  searchForm.status = "";
}

function handlePageChange(val: { current: number }) {
  page.current = val.current;
}

function handleLimitChange(limit: number) {
  page.limit = limit;
  page.current = 1;
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "#e6a23c",
    won: "#67c23a",
    lost: "#f56c6c",
    draw: "#909399",
    cancelled: "#909399",
  };
  return map[status] || "#333";
}
</script>

<template>
  <div>
    <!-- Search form -->
    <lay-card title="Danh sách đơn cược">
      <div class="search-form-wrap">
        <!-- Row 1 -->
        <div class="layui-inline">
          <span class="form-label">Thời gian :</span>
          <lay-date-picker v-model="searchForm.dateRange" range single-panel :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" :allow-clear="true" />
        </div>
        <div class="layui-inline">
          <lay-select v-model="dateQuickSelect" style="width: 150px" @change="onDateQuickChange">
            <lay-select-option v-for="opt in dateQuickOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Tên người dùng :</span>
          <lay-input v-model="searchForm.username" placeholder="Vui lòng nhập đầy đủ Tên người dùng" style="width: 160px" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Mã giao dịch :</span>
          <lay-input v-model="searchForm.serialNo" placeholder="Nhập mã giao dịch" style="width: 182px" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Tên loại xổ :</span>
          <lay-select v-model="searchForm.lotteryType" style="width: 150px">
            <lay-select-option v-for="opt in lotteryOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <!-- Row 2 -->
        <div class="layui-inline">
          <span class="form-label">Kiểu chơi :</span>
          <lay-select v-model="searchForm.playType" style="width: 150px">
            <lay-select-option v-for="opt in playTypeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Trò chơi :</span>
          <lay-select v-model="searchForm.play" style="width: 150px">
            <lay-select-option v-for="opt in playOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Trạng thái :</span>
          <lay-select v-model="searchForm.status" style="width: 150px">
            <lay-select-option v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
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

      <lay-table :columns="columns" :data-source="dataSource" :default-toolbar="true" :loading="loading">
        <template #status="{ row }">
          <span :style="{ color: getStatusColor(row.status) }">{{ row.statusText }}</span>
        </template>
        <template #action="{ row }">
          <lay-button size="xs" type="primary">Chi tiết</lay-button>
        </template>
      </lay-table>
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

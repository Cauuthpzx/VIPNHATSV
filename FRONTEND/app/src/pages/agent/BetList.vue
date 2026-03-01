<script setup lang="ts">
import { reactive, ref } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import StatusBadge from "@/components/StatusBadge.vue";

const { dateRange, dateQuickSelect, dateQuickOptions, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, handlePageChange, handleLimitChange } = useListPage();

const searchForm = reactive({
  username: "",
  serialNo: "",
  lotteryType: "",
  playType: "",
  play: "",
  status: "",
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

const BET_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "#e6a23c" },
  won: { label: "Thắng", color: "#67c23a" },
  lost: { label: "Thua", color: "#f56c6c" },
  draw: { label: "Hoà", color: "#909399" },
  cancelled: { label: "Đã hủy", color: "#909399" },
};

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
  resetDateRange();
  searchForm.username = "";
  searchForm.serialNo = "";
  searchForm.lotteryType = "";
  searchForm.playType = "";
  searchForm.play = "";
  searchForm.status = "";
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
          <lay-date-picker v-model="dateRange" range single-panel range-separator="-" :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" />
        </div>
        <div class="layui-inline">
          <lay-select v-model="dateQuickSelect" style="width: 150px">
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
          <StatusBadge :status="row.status" :map="BET_STATUS_MAP" />
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

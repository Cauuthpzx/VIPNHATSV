<script setup lang="ts">
import { reactive, ref } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";

const { dateRange, dateQuickSelect, dateQuickOptions, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, handlePageChange, handleLimitChange } = useListPage();

const searchForm = reactive({
  lotteryType: "",
  username: "",
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
  resetDateRange();
  searchForm.lotteryType = "";
  searchForm.username = "";
}
</script>

<template>
  <div>
    <lay-card title="Báo cáo xổ số">
      <div class="search-form-wrap">
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

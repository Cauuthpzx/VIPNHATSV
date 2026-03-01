<script setup lang="ts">
import { reactive, ref } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";

const { dateRange, dateQuickSelect, dateQuickOptions, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, handlePageChange, handleLimitChange } = useListPage();

const searchForm = reactive({
  username: "",
});

const columns = [
  { title: "Tên tài khoản", key: "username", align: "center" },
  { title: "Thuộc đại lý", key: "agent", align: "center" },
  { title: "Số lần nạp", key: "depositCount", align: "center" },
  { title: "Số tiền nạp", key: "depositAmount", align: "center" },
  { title: "Số lần rút", key: "withdrawCount", align: "center" },
  { title: "Số tiền rút", key: "withdrawAmount", align: "center" },
  { title: "Phí giao dịch", key: "transactionFee", align: "center" },
  { title: "Hoa hồng đại lý", key: "agentCommission", align: "center" },
  { title: "Chênh lệch", key: "difference", align: "center" },
];

const summaryColumns = [
  { title: "Số lần nạp", key: "depositCount", align: "center" },
  { title: "Số tiền nạp", key: "depositAmount", align: "center" },
  { title: "Số lần rút", key: "withdrawCount", align: "center" },
  { title: "Số tiền rút", key: "withdrawAmount", align: "center" },
  { title: "Phí giao dịch", key: "transactionFee", align: "center" },
  { title: "Hoa hồng đại lý", key: "agentCommission", align: "center" },
  { title: "Chênh lệch", key: "difference", align: "center" },
];

const summaryData = ref([
  {
    depositCount: 0,
    depositAmount: "0.0000",
    withdrawCount: 0,
    withdrawAmount: "0.0000",
    transactionFee: "0.0000",
    agentCommission: "0.0000",
    difference: "0.0000",
  },
]);

function handleSearch() {
  page.current = 1;
  // TODO: call API
}

function handleReset() {
  resetDateRange();
  searchForm.username = "";
}
</script>

<template>
  <div>
    <lay-card title="Sao kê giao dịch">
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

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { fetchReportFunds } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, handlePageChange: _pageChange, handleLimitChange: _limitChange } = useListPage();

const searchForm = reactive({
  username: "",
});

const columns = [
  { title: "Tên tài khoản", key: "username", align: "center" },
  { title: "Thuộc đại lý", key: "user_parent_format", align: "center" },
  { title: "Số lần nạp", key: "deposit_count", align: "center" },
  { title: "Số tiền nạp", key: "deposit_amount", align: "center" },
  { title: "Số lần rút", key: "withdrawal_count", align: "center" },
  { title: "Số tiền rút", key: "withdrawal_amount", align: "center" },
  { title: "Phí giao dịch", key: "charge_fee", align: "center" },
  { title: "Hoa hồng đại lý", key: "agent_commission", align: "center" },
  { title: "Khuyến mãi", key: "promotion", align: "center" },
];

const summaryColumns = [
  { title: "Số lần nạp", key: "total_deposit_count", align: "center" },
  { title: "Số tiền nạp", key: "total_deposit_amount", align: "center" },
  { title: "Số lần rút", key: "total_withdrawal_count", align: "center" },
  { title: "Số tiền rút", key: "total_withdrawal_amount", align: "center" },
  { title: "Phí giao dịch", key: "total_charge_fee", align: "center" },
  { title: "Hoa hồng đại lý", key: "total_agent_commission", align: "center" },
  { title: "Khuyến mãi", key: "total_promotion", align: "center" },
];

const summaryData = ref([
  {
    total_deposit_count: 0,
    total_deposit_amount: "0.0000",
    total_withdrawal_count: 0,
    total_withdrawal_amount: "0.0000",
    total_charge_fee: "0.0000",
    total_agent_commission: "0.0000",
    total_promotion: "0.0000",
  },
]);

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchReportFunds({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
    });
    dataSource.value = res.data.data.items;
    page.total = res.data.data.total;
    if (res.data.data.totalData) {
      summaryData.value = [res.data.data.totalData as any];
    }
  } catch {
    layer.msg("Lỗi tải dữ liệu", { icon: 2 });
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.current = 1;
  loadData();
}

function handlePageChange(val: number) {
  _pageChange(val);
  loadData();
}

function handleLimitChange(val: number) {
  _limitChange(val);
  loadData();
}

function handleReset() {
  resetDateRange();
  searchForm.username = "";
}

onMounted(() => loadData());
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
          <lay-select v-model="dateQuickSelect" :style="{ width: dateQuickWidth }">
            <lay-select-option v-for="opt in dateQuickOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Tên tài khoản :</span>
          <lay-input v-model="searchForm.username" placeholder="Nhập tên tài khoản" />
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

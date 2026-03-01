<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { fetchReportFunds } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page } = useListPage();

const searchForm = reactive({
  username: "",
});

const columns = [
  { title: "Tên tài khoản", key: "username" },
  { title: "Thuộc đại lý", key: "user_parent_format" },
  { title: "Số lần nạp", key: "deposit_count" },
  { title: "Số tiền nạp", key: "deposit_amount" },
  { title: "Số lần rút", key: "withdrawal_count" },
  { title: "Số tiền rút", key: "withdrawal_amount" },
  { title: "Phí giao dịch", key: "charge_fee" },
  { title: "Hoa hồng đại lý", key: "agent_commission" },
  { title: "Khuyến mãi", key: "promotion" },
];

const summaryColumns = [
  { title: "Số lần nạp", key: "total_deposit_count" },
  { title: "Số tiền nạp", key: "total_deposit_amount" },
  { title: "Số lần rút", key: "total_withdrawal_count" },
  { title: "Số tiền rút", key: "total_withdrawal_amount" },
  { title: "Phí giao dịch", key: "total_charge_fee" },
  { title: "Hoa hồng đại lý", key: "total_agent_commission" },
  { title: "Khuyến mãi", key: "total_promotion" },
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

function change(p: { current: number; limit: number }) {
  page.current = p.current;
  page.limit = p.limit;
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

      <div class="table-container">
        <lay-table
          :page="page"
          :resize="true"
          :height="'100%'"
          :columns="columns"
          :loading="loading"
          :default-toolbar="true"
          :data-source="dataSource"
          @change="change"
        />
      </div>

      <div class="summary-section">
        <div class="summary-title">Dữ liệu tổng hợp :</div>
        <lay-table :columns="summaryColumns" :data-source="summaryData" :default-toolbar="true" />
      </div>
    </lay-card>
  </div>
</template>

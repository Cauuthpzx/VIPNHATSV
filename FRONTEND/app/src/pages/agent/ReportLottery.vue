<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { fetchReportLottery } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, handlePageChange: _pageChange, handleLimitChange: _limitChange } = useListPage();

const searchForm = reactive({
  lotteryType: "",
  username: "",
});

const columns = [
  { title: "Tên tài khoản", key: "username", width: "150.5px", align: "center" },
  { title: "Thuộc đại lý", key: "user_parent_format", width: "151px", align: "center" },
  { title: "Số lần cược", key: "bet_count", width: "201px", align: "center" },
  { title: "Tiền cược", key: "bet_amount", width: "201px", align: "center" },
  { title: "Tiền cược hợp lệ (trừ cược hoà)", key: "valid_amount", width: "201px", align: "center" },
  { title: "Hoàn trả", key: "rebate_amount", align: "center" },
  { title: "Kết quả thắng thua (không gồm hoàn trả)", key: "result", align: "center" },
  { title: "Thắng thua", key: "win_lose", align: "center" },
  { title: "Tiền trúng", key: "prize", align: "center" },
  { title: "Tên loại xổ", key: "lottery_name", align: "center" },
];

const summaryColumns = [
  { title: "Số khách đặt cược", key: "total_bet_number", align: "center" },
  { title: "Số lần cược", key: "total_bet_count", align: "center" },
  { title: "Tiền cược", key: "total_bet_amount", align: "center" },
  { title: "Tiền cược hợp lệ (trừ cược hoà)", key: "total_valid_amount", align: "center" },
  { title: "Hoàn trả", key: "total_rebate_amount", align: "center" },
  { title: "Kết quả thắng thua (không gồm hoàn trả)", key: "total_result", align: "center" },
  { title: "Thắng thua", key: "total_win_lose", align: "center" },
  { title: "Tiền trúng", key: "total_prize", align: "center" },
];

const summaryData = ref([
  {
    total_bet_number: 0,
    total_bet_count: 0,
    total_bet_amount: "0.0000",
    total_valid_amount: "0.0000",
    total_rebate_amount: "0.0000",
    total_result: "0.0000",
    total_win_lose: "0.0000",
    total_prize: "0.0000",
  },
]);

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchReportLottery({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      lottery_id: searchForm.lotteryType || undefined,
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
  searchForm.lotteryType = "";
  searchForm.username = "";
}

onMounted(() => loadData());
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
          <lay-select v-model="dateQuickSelect" :style="{ width: dateQuickWidth }">
            <lay-select-option v-for="opt in dateQuickOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Tên loại xổ :</span>
          <lay-select v-model="searchForm.lotteryType" placeholder="Chọn hoặc nhập để tìm kiếm" />
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

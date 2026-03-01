<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { fetchReportThirdGame } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, handlePageChange: _pageChange, handleLimitChange: _limitChange } = useListPage();

const searchForm = reactive({
  username: "",
  platform: "",
});

const columns = [
  { title: "Tên tài khoản", key: "username", width: "266.5px", align: "center" },
  { title: "Nhà cung cấp game", key: "platform_id_name", width: "267px", align: "center" },
  { title: "Số lần cược", key: "t_bet_times", width: "267px", align: "center" },
  { title: "Tiền cược", key: "t_bet_amount", width: "267px", align: "center" },
  { title: "Tiền cược hợp lệ", key: "t_turnover", width: "267px", align: "center" },
  { title: "Tiền trúng", key: "t_prize", align: "center" },
  { title: "Thắng thua", key: "t_win_lose", align: "center" },
];

const summaryColumns = [
  { title: "Số người chơi", key: "total_bet_number", align: "center" },
  { title: "Số lần cược", key: "total_bet_times", align: "center" },
  { title: "Tiền cược", key: "total_bet_amount", align: "center" },
  { title: "Tiền cược hợp lệ", key: "total_turnover", align: "center" },
  { title: "Tiền trúng", key: "total_prize", align: "center" },
  { title: "Thắng thua", key: "total_win_lose", align: "center" },
];

const summaryData = ref([
  {
    total_bet_number: 0,
    total_bet_times: 0,
    total_bet_amount: "0.0000",
    total_turnover: "0.0000",
    total_prize: "0.0000",
    total_win_lose: "0.0000",
  },
]);

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchReportThirdGame({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      platform_id: searchForm.platform || undefined,
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
  searchForm.platform = "";
}

onMounted(() => loadData());
</script>

<template>
  <div>
    <lay-card title="Báo cáo nhà cung cấp">
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
          <span class="form-label">Nhà cung cấp :</span>
          <lay-select v-model="searchForm.platform" placeholder="Chọn hoặc nhập để tìm kiếm" />
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

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { fetchReportThirdGame } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page } = useListPage();

const searchForm = reactive({
  username: "",
  platform: "",
});

const columns = [
  { title: "Tên tài khoản", key: "username", ellipsisTooltip: true },
  { title: "Nhà cung cấp game", key: "platform_id_name", ellipsisTooltip: true },
  { title: "Số lần cược", key: "t_bet_times", ellipsisTooltip: true },
  { title: "Tiền cược", key: "t_bet_amount", ellipsisTooltip: true },
  { title: "Tiền cược hợp lệ", key: "t_turnover", ellipsisTooltip: true },
  { title: "Tiền trúng", key: "t_prize", ellipsisTooltip: true },
  { title: "Thắng thua", key: "t_win_lose", ellipsisTooltip: true },
];

const summaryColumns = [
  { title: "Số người chơi", key: "total_bet_number", ellipsisTooltip: true },
  { title: "Số lần cược", key: "total_bet_times", ellipsisTooltip: true },
  { title: "Tiền cược", key: "total_bet_amount", ellipsisTooltip: true },
  { title: "Tiền cược hợp lệ", key: "total_turnover", ellipsisTooltip: true },
  { title: "Tiền trúng", key: "total_prize", ellipsisTooltip: true },
  { title: "Thắng thua", key: "total_win_lose", ellipsisTooltip: true },
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

function change(p: { current: number; limit: number }) {
  page.current = p.current;
  page.limit = p.limit;
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
      <lay-field title="Tìm kiếm">
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
      </lay-field>

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

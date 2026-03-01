<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { fetchBetList } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page } = useListPage();

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

const { selectWidth: lotteryWidth } = useAutoFitSelect(lotteryOptions);
const { selectWidth: playTypeWidth } = useAutoFitSelect(playTypeOptions);
const { selectWidth: playWidth } = useAutoFitSelect(playOptions);
const { selectWidth: statusWidth } = useAutoFitSelect(statusOptions);

const columns = [
  { title: "Mã giao dịch", key: "serial_no", ellipsisTooltip: true },
  { title: "Tên người dùng", key: "username", ellipsisTooltip: true },
  { title: "Thời gian cược", key: "create_time", ellipsisTooltip: true },
  { title: "Trò chơi", key: "lottery_name", ellipsisTooltip: true },
  { title: "Loại trò chơi", key: "play_type_name", ellipsisTooltip: true },
  { title: "Kiểu chơi", key: "play_name", ellipsisTooltip: true },
  { title: "Kỳ xổ", key: "issue", ellipsisTooltip: true },
  { title: "Nội dung cược", key: "content", ellipsisTooltip: true },
  { title: "Tiền cược", key: "money", ellipsisTooltip: true },
  { title: "Hoàn trả", key: "rebate_amount", ellipsisTooltip: true },
  { title: "Kết quả", key: "result", ellipsisTooltip: true },
  { title: "Trạng thái", key: "status_text", ellipsisTooltip: true },
  { title: "Thao tác", key: "action", customSlot: "action" },
];

const summaryColumns = [
  { title: "Tổng tiền cược", key: "total_money", ellipsisTooltip: true },
  { title: "Tổng kết quả", key: "total_result", ellipsisTooltip: true },
  { title: "Tổng hoàn trả", key: "total_rebate_amount", ellipsisTooltip: true },
];

const summaryData = ref([
  {
    total_money: "0.0000",
    total_result: "0.0000",
    total_rebate_amount: "0.0000",
  },
]);

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchBetList({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      serial_no: searchForm.serialNo || undefined,
      date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
      lottery_id: searchForm.lotteryType || undefined,
      status: searchForm.status || undefined,
      is_summary: 1,
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
  searchForm.serialNo = "";
  searchForm.lotteryType = "";
  searchForm.playType = "";
  searchForm.play = "";
  searchForm.status = "";
}

onMounted(() => loadData());
</script>

<template>
  <div>
    <lay-card>
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
          <span class="form-label">Tên người dùng :</span>
          <lay-input v-model="searchForm.username" placeholder="Vui lòng nhập đầy đủ Tên người dùng" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Mã giao dịch :</span>
          <lay-input v-model="searchForm.serialNo" placeholder="Nhập mã giao dịch" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Tên loại xổ :</span>
          <lay-select v-model="searchForm.lotteryType" :style="{ width: lotteryWidth }">
            <lay-select-option v-for="opt in lotteryOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Kiểu chơi :</span>
          <lay-select v-model="searchForm.playType" :style="{ width: playTypeWidth }">
            <lay-select-option v-for="opt in playTypeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Trò chơi :</span>
          <lay-select v-model="searchForm.play" :style="{ width: playWidth }">
            <lay-select-option v-for="opt in playOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Trạng thái :</span>
          <lay-select v-model="searchForm.status" :style="{ width: statusWidth }">
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
      </lay-field>

      <div class="table-container">
        <lay-table
          :page="page"
          :resize="true"
          :max-height="'100%'"
          :columns="columns"
          :loading="loading"
          :default-toolbar="true"
          :data-source="dataSource"
          @change="change"
        >
          <template #action="{ row }">
            <lay-button size="xs" type="primary">Chi tiết</lay-button>
          </template>
        </lay-table>
      </div>

      <div class="summary-section">
        <div class="summary-title">Dữ liệu tổng hợp :</div>
        <lay-table :columns="summaryColumns" :data-source="summaryData" :default-toolbar="true" />
      </div>
    </lay-card>
  </div>
</template>

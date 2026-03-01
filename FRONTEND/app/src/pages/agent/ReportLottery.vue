<script setup lang="ts">
import { reactive, ref, watch, onMounted } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { fetchReportLottery, fetchLotteryDropdown } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, scrollToTable } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();

const searchForm = reactive({
  lotteryType: "",
  username: "",
});

const lotteryOptions = ref([
  { label: "Tất cả", value: "" },
]);

const { selectWidth: lotteryWidth } = useAutoFitSelect(lotteryOptions);

async function loadLotteryOptions() {
  try {
    const res = await fetchLotteryDropdown();
    const items = res.data.data.items as any;
    if (items?.lotteryData) {
      lotteryOptions.value = [
        { label: "Tất cả", value: "" },
        ...items.lotteryData.map((l: any) => ({ label: l.name, value: String(l.id) })),
      ];
    }
  } catch {}
}

const columns = [
  { title: "Nhân viên", key: "_agentName", ellipsisTooltip: true },
  { title: "Tên tài khoản", key: "username", ellipsisTooltip: true },
  { title: "Thuộc đại lý", key: "user_parent_format", ellipsisTooltip: true },
  { title: "Số lần cược", key: "bet_count", ellipsisTooltip: true },
  { title: "Tiền cược", key: "bet_amount", ellipsisTooltip: true },
  { title: "Tiền cược hợp lệ (trừ cược hoà)", key: "valid_amount", ellipsisTooltip: true },
  { title: "Hoàn trả", key: "rebate_amount", ellipsisTooltip: true },
  { title: "Thắng thua", key: "result", ellipsisTooltip: true },
  { title: "Kết quả thắng thua (không gồm hoàn trả)", key: "win_lose", ellipsisTooltip: true },
  { title: "Tiền trúng", key: "prize", ellipsisTooltip: true },
  { title: "Tên loại xổ", key: "lottery_name", ellipsisTooltip: true },
];

const summaryColumns = [
  { title: "Số khách đặt cược", key: "total_bet_number", ellipsisTooltip: true },
  { title: "Số lần cược", key: "total_bet_count", ellipsisTooltip: true },
  { title: "Tiền cược", key: "total_bet_amount", ellipsisTooltip: true },
  { title: "Tiền cược hợp lệ (trừ cược hoà)", key: "total_valid_amount", ellipsisTooltip: true },
  { title: "Hoàn trả", key: "total_rebate_amount", ellipsisTooltip: true },
  { title: "Thắng thua", key: "total_result", ellipsisTooltip: true },
  { title: "Kết quả thắng thua (không gồm hoàn trả)", key: "total_win_lose", ellipsisTooltip: true },
  { title: "Tiền trúng", key: "total_prize", ellipsisTooltip: true },
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

function change(p: { current: number; limit: number }) {
  page.current = p.current;
  page.limit = p.limit;
  scrollToTable(); loadData();
}

function handleReset() {
  resetDateRange();
  searchForm.lotteryType = "";
  searchForm.username = "";
}

watch(selectedAgentId, () => { page.current = 1; loadData(); });
onMounted(() => {
  loadLotteryOptions();
  loadData();
});
</script>

<template>
  <div>
    <lay-card>
      <lay-field title="Báo cáo xổ số">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Nhân viên :</span>
          <lay-select v-model="selectedAgentId" :style="{ width: agentWidth }">
            <lay-select-option v-for="opt in agentOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
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
          <lay-select v-model="searchForm.lotteryType" :style="{ width: lotteryWidth }">
            <lay-select-option v-for="opt in lotteryOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
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
      </lay-field>

      <div class="table-container">
        <lay-table
          :page="page"
          :resize="true"
          :columns="columns"
          :loading="loading"
          :default-toolbar="true"
          :data-source="dataSource"
          @change="change"
        />
        <lay-table :columns="summaryColumns" :data-source="summaryData" :default-toolbar="true">
          <template v-slot:toolbar>
            <lay-button size="sm" type="normal"><b>DỮ LIỆU TỔNG HỢP</b></lay-button>
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

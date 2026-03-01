<script setup lang="ts">
import { reactive, ref, watch, onMounted } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { fetchReportThirdGame } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, scrollToTable, setLoading } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();

const searchForm = reactive({
  username: "",
  platform: "",
});

const platformOptions = [
  { label: "Tất cả", value: "" },
  { label: "PA", value: "PA" },
  { label: "BBIN", value: "BBIN" },
  { label: "WM", value: "WM" },
  { label: "MINI", value: "MINI" },
  { label: "KY", value: "KY" },
  { label: "PGSOFT", value: "PGSOFT" },
  { label: "LUCKYWIN", value: "LUCKYWIN" },
  { label: "SABA", value: "SABA" },
  { label: "PT", value: "PT" },
  { label: "RICH88", value: "RICH88" },
  { label: "ASTAR", value: "ASTAR" },
  { label: "FB", value: "FB" },
  { label: "JILI", value: "JILI" },
  { label: "KA", value: "KA" },
  { label: "MW", value: "MW" },
  { label: "SBO", value: "SBO" },
  { label: "NEXTSPIN", value: "NEXTSPIN" },
  { label: "AMB", value: "AMB" },
  { label: "FunTa", value: "FunTa" },
  { label: "MG", value: "MG" },
  { label: "WS168", value: "WS168" },
  { label: "DG CASINO", value: "DG CASINO" },
  { label: "V8", value: "V8" },
  { label: "AE", value: "AE" },
  { label: "TP", value: "TP" },
  { label: "FC", value: "FC" },
  { label: "JDB", value: "JDB" },
  { label: "CQ9", value: "CQ9" },
  { label: "PP", value: "PP" },
  { label: "VA", value: "VA" },
  { label: "BNG", value: "BNG" },
  { label: "DB CASINO", value: "DB CASINO" },
  { label: "EVO CASINO", value: "EVO CASINO" },
  { label: "CMD SPORTS", value: "CMD SPORTS" },
  { label: "PG NEW", value: "PG NEW" },
  { label: "FBLIVE", value: "FBLIVE" },
  { label: "ON CASINO", value: "ON CASINO" },
  { label: "MT", value: "MT" },
  { label: "fC NEW", value: "fC NEW" },
];

const { selectWidth: platformWidth } = useAutoFitSelect(platformOptions);

const columns = [
  { title: "Nhân viên", key: "_agentName", ellipsisTooltip: true },
  { title: "Tên tài khoản", key: "username", ellipsisTooltip: true },
  { title: "Nhà cung cấp game", key: "platform_id_name", ellipsisTooltip: true },
  { title: "Số lần cược", key: "t_bet_times", customSlot: "num" },
  { title: "Tiền cược", key: "t_bet_amount", customSlot: "num" },
  { title: "Tiền cược hợp lệ", key: "t_turnover", customSlot: "num" },
  { title: "Tiền thưởng", key: "t_prize", customSlot: "num" },
  { title: "Thắng thua", key: "t_win_lose", customSlot: "num" },
];

const summaryColumns = [
  { title: "Số lần cược", key: "total_bet_times", customSlot: "sumNum" },
  { title: "Số khách đặt cược", key: "total_bet_number", customSlot: "sumNum" },
  { title: "Tiền cược", key: "total_bet_amount", customSlot: "sumNum" },
  { title: "Tiền cược hợp lệ", key: "total_turnover", customSlot: "sumNum" },
  { title: "Tiền thưởng", key: "total_prize", customSlot: "sumNum" },
  { title: "Thắng thua", key: "total_win_lose", customSlot: "sumNum" },
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
  setLoading(true);
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
    setLoading(false);
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
  searchForm.username = "";
  searchForm.platform = "";
}

watch(selectedAgentId, () => { page.current = 1; loadData(); });
onMounted(() => loadData());
</script>

<template>
  <div>
    <lay-card>
      <lay-field title="Báo cáo nhà cung cấp">
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
          <span class="form-label">Tên tài khoản :</span>
          <lay-input v-model="searchForm.username" placeholder="Nhập tên tài khoản" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Nhà cung cấp :</span>
          <lay-select v-model="searchForm.platform" :style="{ width: platformWidth }">
            <lay-select-option v-for="opt in platformOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
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
          :columns="columns"
          :loading="loading"
          :default-toolbar="true"
          :data-source="dataSource"
          @change="change"
        >
          <template #num="{ row, column }">
            <lay-count-up :end-val="Number(row[column.key]) || 0" :duration="600" :decimal-places="String(row[column.key]).includes('.') ? 2 : 0" :use-grouping="false" />
          </template>
        </lay-table>
        <lay-table :columns="summaryColumns" :data-source="summaryData" :default-toolbar="true">
          <template v-slot:toolbar>
            <lay-button size="sm" type="normal"><b>DỮ LIỆU TỔNG HỢP</b></lay-button>
          </template>
          <template #sumNum="{ row, column }">
            <lay-count-up :end-val="Number(row[column.key]) || 0" :duration="600" :decimal-places="String(row[column.key]).includes('.') ? 4 : 0" :use-grouping="false" />
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

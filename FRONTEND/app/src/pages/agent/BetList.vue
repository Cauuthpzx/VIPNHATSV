<script setup lang="ts">
import { reactive, ref, watch, onMounted } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { fetchBetList, fetchLotteryDropdown } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";
import CookieBadge from "@/components/CookieBadge.vue";

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();

const searchForm = reactive({
  username: "",
  serialNo: "",
  lotteryType: "",
  playType: "",
  play: "",
  status: "",
});

const lotteryOptions = ref([
  { label: "Tất cả", value: "" },
]);

const playTypeOptions = ref([
  { label: "Tất cả", value: "" },
]);

const playOptions = ref([
  { label: "Tất cả", value: "" },
]);

const statusOptions = [
  { label: "Tất cả", value: "" },
  { label: "Chưa thanh toán", value: "-9" },
  { label: "Trúng", value: "1" },
  { label: "Không trúng", value: "-1" },
  { label: "Hòa", value: "2" },
  { label: "Khách hủy đơn", value: "3" },
  { label: "Hệ thống hủy đơn", value: "4" },
  { label: "Đơn cược bất thường", value: "5" },
  { label: "Chưa thanh toán (khôi phục thủ công)", value: "6" },
];

// Static lottery data extracted from upstream — used as fallback and for series_id lookup
const STATIC_LOTTERY_DATA = [
  { id: 67, name: "Sicbo 30 giây", series_id: 9 },
  { id: 66, name: "Sicbo 20 giây", series_id: 9 },
  { id: 68, name: "Sicbo 40 giây", series_id: 9 },
  { id: 69, name: "Sicbo 50 giây", series_id: 9 },
  { id: 70, name: "Sicbo 1 phút", series_id: 9 },
  { id: 71, name: "Sicbo 1.5 phút", series_id: 9 },
  { id: 32, name: "Miền Bắc", series_id: 2 },
  { id: 46, name: "M.bắc nhanh 3 phút", series_id: 2 },
  { id: 45, name: "M.bắc nhanh 5 phút", series_id: 2 },
  { id: 47, name: "Miền Bắc VIP 45 giây", series_id: 2 },
  { id: 48, name: "Miền Bắc VIP 75 giây", series_id: 2 },
  { id: 49, name: "Miền Bắc VIP 2 phút", series_id: 2 },
  { id: 63, name: "Xổ số Miền Bắc", series_id: 8 },
  { id: 51, name: "Keno VIP 20 giây", series_id: 7 },
  { id: 52, name: "Keno VIP 30 giây", series_id: 7 },
  { id: 53, name: "Keno VIP 40 giây", series_id: 7 },
  { id: 54, name: "Keno VIP 50 giây", series_id: 7 },
  { id: 55, name: "Keno VIP 1 phút", series_id: 7 },
  { id: 56, name: "Keno VIP 5 phút", series_id: 7 },
  { id: 73, name: "Win go 45 giây", series_id: 11 },
  { id: 74, name: "Win go 1 phút", series_id: 11 },
  { id: 75, name: "Win go 3 phút", series_id: 11 },
  { id: 76, name: "Win go 5 phút", series_id: 11 },
  { id: 77, name: "Win go 30 giây", series_id: 11 },
  { id: 1, name: "Bạc Liêu", series_id: 1 },
  { id: 2, name: "Vũng Tàu", series_id: 1 },
  { id: 3, name: "Tiền Giang", series_id: 1 },
  { id: 4, name: "Kiên Giang", series_id: 1 },
  { id: 5, name: "Đà Lạt", series_id: 1 },
  { id: 6, name: "Bình Phước", series_id: 1 },
  { id: 7, name: "Bình Dương", series_id: 1 },
  { id: 8, name: "An Giang", series_id: 1 },
  { id: 9, name: "Bình Thuận", series_id: 1 },
  { id: 10, name: "Cà Mau", series_id: 1 },
  { id: 11, name: "Cần Thơ", series_id: 1 },
  { id: 12, name: "Hậu Giang", series_id: 1 },
  { id: 13, name: "Đồng Tháp", series_id: 1 },
  { id: 14, name: "Tây Ninh", series_id: 1 },
  { id: 15, name: "Sóc Trăng", series_id: 1 },
  { id: 16, name: "TP Hồ Chí Minh", series_id: 1 },
  { id: 17, name: "Đồng Nai", series_id: 1 },
  { id: 42, name: "Trà Vinh", series_id: 1 },
  { id: 43, name: "Vĩnh Long", series_id: 1 },
  { id: 44, name: "Miền Nam VIP 5 phút", series_id: 1 },
  { id: 57, name: "Miền Nam VIP 45 giây", series_id: 1 },
  { id: 58, name: "Miền Nam VIP 1 phút", series_id: 1 },
  { id: 59, name: "Miền Nam VIP 90 giây", series_id: 1 },
  { id: 60, name: "Miền Nam VIP 2 phút", series_id: 1 },
  { id: 18, name: "Đà Nẵng", series_id: 3 },
  { id: 19, name: "Thừa Thiên Huế", series_id: 3 },
  { id: 20, name: "Quảng Trị", series_id: 3 },
  { id: 21, name: "Phú Yên", series_id: 3 },
  { id: 22, name: "Quảng Bình", series_id: 3 },
  { id: 23, name: "Quảng Nam", series_id: 3 },
  { id: 24, name: "Quảng Ngãi", series_id: 3 },
  { id: 25, name: "Ninh Thuận", series_id: 3 },
  { id: 26, name: "Kon Tum", series_id: 3 },
  { id: 27, name: "Khánh Hoà", series_id: 3 },
  { id: 28, name: "Gia Lai", series_id: 3 },
  { id: 29, name: "Bình Định", series_id: 3 },
  { id: 30, name: "Đắk Lắk", series_id: 3 },
  { id: 31, name: "Đắk Nông", series_id: 3 },
];

// Store lottery data for series_id lookup in cascading selects
const allLotteryData = ref<any[]>(STATIC_LOTTERY_DATA);

// Initialize lottery options from static data
lotteryOptions.value = [
  { label: "Tất cả", value: "" },
  ...STATIC_LOTTERY_DATA.map((l) => ({ label: l.name, value: String(l.id) })),
];

const { selectWidth: lotteryWidth } = useAutoFitSelect(lotteryOptions, 180);
const { selectWidth: playTypeWidth } = useAutoFitSelect(playTypeOptions, 180);
const { selectWidth: playWidth } = useAutoFitSelect(playOptions, 180);
const { selectWidth: statusWidth } = useAutoFitSelect(statusOptions);

async function loadDropdownData() {
  try {
    const res = await fetchLotteryDropdown();
    const items = res.data.data.items as any;
    if (items?.lotteryData && Array.isArray(items.lotteryData) && items.lotteryData.length > 0) {
      allLotteryData.value = items.lotteryData;
      lotteryOptions.value = [
        { label: "Tất cả", value: "" },
        ...items.lotteryData.map((l: any) => ({ label: l.name, value: String(l.id) })),
      ];
    }
  } catch {}
}

// When lottery changes → load playType options via POST /agent/bet {play_type:1, series_id, lottery_id}
watch(() => searchForm.lotteryType, async (lotteryId) => {
  searchForm.playType = "";
  searchForm.play = "";
  playTypeOptions.value = [{ label: "Tất cả", value: "" }];
  playOptions.value = [{ label: "Tất cả", value: "" }];
  if (!lotteryId) return;
  const lottery = allLotteryData.value.find((l: any) => String(l.id) === lotteryId);
  const seriesId = lottery ? String(lottery.series_id) : "";
  if (!seriesId) return;
  try {
    const res = await fetchBetList({ page: 1, limit: 200, play_type: 1, series_id: seriesId, lottery_id: lotteryId });
    const items = res.data.data.items;
    if (Array.isArray(items) && items.length > 0) {
      playTypeOptions.value = [
        { label: "Tất cả", value: "" },
        ...(items as any[]).map((p: any) => ({ label: p.name, value: String(p.id) })),
      ];
    }
  } catch {}
});

// When playType changes → load play options via POST /agent/bet {play_type:2, play_type_id}
watch(() => searchForm.playType, async (playTypeId) => {
  searchForm.play = "";
  playOptions.value = [{ label: "Tất cả", value: "" }];
  if (!playTypeId) return;
  try {
    const res = await fetchBetList({ page: 1, limit: 200, play_type: 2, play_type_id: playTypeId });
    const items = res.data.data.items;
    if (Array.isArray(items) && items.length > 0) {
      playOptions.value = [
        { label: "Tất cả", value: "" },
        ...(items as any[]).map((p: any) => ({ label: p.name, value: String(p.id) })),
      ];
    }
  } catch {}
});

const columns = [
  { title: "Nhân viên", key: "_agentName", ellipsisTooltip: true },
  { title: "Mã giao dịch", key: "serial_no", ellipsisTooltip: true },
  { title: "Tên người dùng", key: "username", ellipsisTooltip: true },
  { title: "Thời gian cược", key: "create_time", ellipsisTooltip: true },
  { title: "Trò chơi", key: "lottery_name", ellipsisTooltip: true },
  { title: "Loại trò chơi", key: "play_type_name", ellipsisTooltip: true },
  { title: "Cách chơi", key: "play_name", ellipsisTooltip: true },
  { title: "Kỳ", key: "issue", ellipsisTooltip: true },
  { title: "Thông tin cược", key: "content", ellipsisTooltip: true },
  { title: "Tiền cược", key: "money", customSlot: "num", ellipsisTooltip: true },
  { title: "Tiền hoàn trả", key: "rebate_amount", customSlot: "num", ellipsisTooltip: true },
  { title: "Thắng thua", key: "result", customSlot: "num", ellipsisTooltip: true },
  { title: "Trạng thái", key: "status_text", ellipsisTooltip: true },
];

const summaryColumns = [
  { title: "Tiền cược", key: "total_money", customSlot: "sumNum", ellipsisTooltip: true },
  { title: "Tiền hoàn trả", key: "total_rebate_amount", customSlot: "sumNum", ellipsisTooltip: true },
  { title: "Thắng thua", key: "total_result", customSlot: "sumNum", ellipsisTooltip: true },
];

const summaryData = ref([
  {
    total_money: "0.0000",
    total_result: "0.0000",
    total_rebate_amount: "0.0000",
  },
]);

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  const params = {
    page: page.current,
    limit: page.limit,
    username: searchForm.username || undefined,
    serial_no: searchForm.serialNo || undefined,
    date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
    lottery_id: searchForm.lotteryType || undefined,
    play_type_id: searchForm.playType || undefined,
    play_id: searchForm.play || undefined,
    status: searchForm.status || undefined,
    es: 1,
  };
  try {
    const [res, sumRes] = await Promise.all([
      fetchBetList(params),
      fetchBetList({ ...params, is_summary: 1 }),
    ]);
    if (isStale()) return;
    dataSource.value = res.data.data.items;
    page.total = res.data.data.total;
    if (sumRes.data.data.totalData) {
      summaryData.value = [sumRes.data.data.totalData as any];
    }
  } catch {
    if (!isStale()) layer.msg("Lỗi tải dữ liệu", { icon: 2 });
  } finally {
    if (!isStale()) setLoading(false);
  }
}

const { handlePageChange, handleSearch } = bindLoadData(loadData, selectedAgentId);

function handleReset() {
  resetDateRange();
  searchForm.username = "";
  searchForm.serialNo = "";
  searchForm.lotteryType = "";
  searchForm.playType = "";
  searchForm.play = "";
  searchForm.status = "";
}

onMounted(() => loadDropdownData());
</script>

<template>
  <div>
    <lay-card>
      <lay-field title="Danh sách đơn cược">
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
          <span class="form-label">Tên người dùng :</span>
          <lay-input v-model="searchForm.username" placeholder="Vui lòng nhập đầy đủ Tên người dùng" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Mã giao dịch :</span>
          <lay-input v-model="searchForm.serialNo" placeholder="Nhập mã giao dịch" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Trò chơi :</span>
          <lay-select v-model="searchForm.lotteryType" :style="{ width: lotteryWidth }">
            <lay-select-option v-for="opt in lotteryOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Loại trò chơi :</span>
          <lay-select v-model="searchForm.playType" :style="{ width: playTypeWidth }">
            <lay-select-option v-for="opt in playTypeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Cách chơi :</span>
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
          :columns="columns"
          :loading="loading"
          :default-toolbar="true"
          :data-source="dataSource"
          @change="handlePageChange"
        >
          <template v-slot:toolbar>
            <CookieBadge />
          </template>
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

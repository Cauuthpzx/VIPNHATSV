<script setup lang="ts">
import { reactive, watch, onMounted } from "vue";
import { useListPage } from "@/composables/useListPage";
import { fetchBetOrder } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";
import { useAgentFilter } from "@/composables/useAgentFilter";

const { dataSource, loading, page, scrollToTable, setLoading } = useListPage();
const { selectedAgentId, agentOptions, agentWidth, notifySuccess } = useAgentFilter();

const searchForm = reactive({
  dateRange: [] as string[],
  serialNo: "",
  platformUsername: "",
});

const columns = [
  { title: "Nhân viên", key: "_agentName", ellipsisTooltip: true },
  { title: "Mã giao dịch", key: "serial_no", ellipsisTooltip: true },
  { title: "Nhà cung cấp game bên thứ 3", key: "platform_id_name", ellipsisTooltip: true },
  { title: "Tên tài khoản thuộc nhà cái", key: "platform_username", ellipsisTooltip: true },
  { title: "Loại hình trò chơi", key: "c_name", ellipsisTooltip: true },
  { title: "Tên trò chơi bên thứ 3", key: "game_name", ellipsisTooltip: true },
  { title: "Tiền cược", key: "bet_amount", customSlot: "num", ellipsisTooltip: true },
  { title: "Tiền cược hợp lệ", key: "turnover", customSlot: "num", ellipsisTooltip: true },
  { title: "Tiền thưởng", key: "prize", customSlot: "num", ellipsisTooltip: true },
  { title: "Thắng/Thua", key: "win_lose", customSlot: "num", ellipsisTooltip: true },
  { title: "Thời gian cược", key: "bet_time", ellipsisTooltip: true },
];

async function loadData() {
  setLoading(true);
  try {
    const res = await fetchBetOrder({
      page: page.current,
      limit: page.limit,
      serial_no: searchForm.serialNo || undefined,
      platform_username: searchForm.platformUsername || undefined,
      bet_time: searchForm.dateRange?.length === 2 ? `${searchForm.dateRange[0]} - ${searchForm.dateRange[1]}` : undefined,
      es: 1,
    });
    dataSource.value = res.data.data.items;
    page.total = res.data.data.total;
    notifySuccess(page.total);
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
  searchForm.dateRange = [];
  searchForm.serialNo = "";
  searchForm.platformUsername = "";
}

watch(selectedAgentId, () => { page.current = 1; loadData(); });
onMounted(() => loadData());
</script>

<template>
  <div>
    <lay-card>
      <lay-field title="Đơn cược bên thứ 3">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Nhân viên :</span>
          <lay-select v-model="selectedAgentId" :style="{ width: agentWidth }">
            <lay-select-option v-for="opt in agentOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Thời gian :</span>
          <lay-date-picker v-model="searchForm.dateRange" range single-panel range-separator="-" :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" :allow-clear="true" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Mã giao dịch :</span>
          <lay-input v-model="searchForm.serialNo" placeholder="Nhập mã giao dịch" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Tên tài khoản thuộc nhà cái :</span>
          <lay-input v-model="searchForm.platformUsername" placeholder="Nhập tên tài khoản" />
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
      </div>
    </lay-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { fetchWithdrawalsRecord } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, setLoading, bindLoadData } = useListPage();
const { selectedAgentId, agentOptions, agentWidth, notifySuccess } = useAgentFilter();

const searchForm = reactive({
  username: "",
  serialNumber: "",
  status: "",
});

const statusOptions = [
  { label: "Chọn", value: "" },
  { label: "Chờ xử lý", value: "pending" },
  { label: "Thành công", value: "success" },
  { label: "Thất bại", value: "failed" },
  { label: "Đã hủy", value: "cancelled" },
];

const { selectWidth: statusWidth } = useAutoFitSelect(statusOptions);

const columns = [
  { title: "Nhân viên", key: "_agentName", ellipsisTooltip: true },
  { title: "Mã giao dịch", key: "serial_no", ellipsisTooltip: true },
  { title: "Thời gian tạo đơn", key: "create_time", ellipsisTooltip: true },
  { title: "Tên tài khoản", key: "username", ellipsisTooltip: true },
  { title: "Thuộc đại lý", key: "user_parent_format", ellipsisTooltip: true },
  { title: "Số tiền yêu cầu", key: "amount", customSlot: "num", ellipsisTooltip: true },
  { title: "Phí rút", key: "user_fee", customSlot: "num", ellipsisTooltip: true },
  { title: "Số tiền thực nhận", key: "true_amount", customSlot: "num", ellipsisTooltip: true },
  { title: "Trạng thái", key: "status_format", ellipsisTooltip: true },
  { title: "Thao tác", key: "operation", customSlot: "operation" },
];

async function loadData() {
  setLoading(true);
  try {
    const res = await fetchWithdrawalsRecord({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      serial_no: searchForm.serialNumber || undefined,
      status: searchForm.status || undefined,
      date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
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

const { handlePageChange, handleSearch } = bindLoadData(loadData, selectedAgentId);

function handleReset() {
  resetDateRange();
  searchForm.username = "";
  searchForm.serialNumber = "";
  searchForm.status = "";
  page.current = 1;
  loadData();
}

function handleDetail(row: any) {
  console.log("Detail:", row);
}
</script>

<template>
  <div>
    <lay-card>
      <lay-field title="Lịch sử rút tiền">
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
          <span class="form-label">Tên tài khoản:</span>
          <lay-input v-model="searchForm.username" placeholder="Tên tài khoản" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Mã giao dịch:</span>
          <lay-input v-model="searchForm.serialNumber" placeholder="Mã giao dịch" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Trạng thái:</span>
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
          <template #num="{ row, column }">
            <lay-count-up :end-val="Number(row[column.key]) || 0" :duration="600" :decimal-places="String(row[column.key]).includes('.') ? 2 : 0" :use-grouping="false" />
          </template>
          <template #operation="{ row }">
            <lay-button size="xs" type="primary" @click="handleDetail(row)">Chi tiết</lay-button>
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

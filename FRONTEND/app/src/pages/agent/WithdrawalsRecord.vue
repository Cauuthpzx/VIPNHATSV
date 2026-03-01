<script setup lang="ts">
import { reactive, onMounted } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { fetchWithdrawalsRecord } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";
import StatusBadge from "@/components/StatusBadge.vue";

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page } = useListPage();

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

const WITHDRAWAL_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "#e6a23c" },
  success: { label: "Thành công", color: "#67c23a" },
  failed: { label: "Thất bại", color: "#f56c6c" },
  cancelled: { label: "Đã hủy", color: "#909399" },
};

const columns = [
  { title: "Mã giao dịch", key: "serial_number" },
  { title: "Thời gian tạo đơn", key: "create_time" },
  { title: "Tên tài khoản", key: "username" },
  { title: "Thuộc đại lý", key: "user_parent_format" },
  { title: "Số tiền", key: "money" },
  { title: "Trạng thái", key: "status", customSlot: "status" },
  { title: "Thao tác", key: "operation", customSlot: "operation" },
];

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchWithdrawalsRecord({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      status: searchForm.status || undefined,
      date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
    });
    dataSource.value = res.data.data.items;
    page.total = res.data.data.total;
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

function change(p: { current: number; limit: number }) {
  page.current = p.current;
  page.limit = p.limit;
  loadData();
}

onMounted(() => loadData());
</script>

<template>
  <div>
    <lay-card title="Lịch sử rút tiền">
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
        >
          <template #status="{ row }">
            <StatusBadge :status="row.status" :map="WITHDRAWAL_STATUS_MAP" />
          </template>
          <template #operation="{ row }">
            <lay-button size="xs" type="primary" @click="handleDetail(row)">Chi tiết</lay-button>
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";

const searchForm = reactive({
  dateRange: [] as string[],
  username: "",
  transactionType: "",
  status: "",
});

const dateQuickSelect = ref("today");
const dateQuickOptions = [
  { label: "Hôm nay", value: "today" },
  { label: "Hôm qua", value: "yesterday" },
  { label: "Tuần này", value: "thisWeek" },
  { label: "Tháng này", value: "thisMonth" },
  { label: "Tháng trước", value: "lastMonth" },
];

const transactionTypeOptions = [
  { label: "Chọn", value: "" },
  { label: "Nạp tiền", value: "deposit" },
  { label: "Chuyển khoản", value: "transfer" },
];

const statusOptions = [
  { label: "Chọn", value: "" },
  { label: "Chờ xử lý", value: "pending" },
  { label: "Thành công", value: "success" },
  { label: "Thất bại", value: "failed" },
];

const columns = [
  { title: "Tên tài khoản", key: "username", width: "311.5px", align: "center" },
  { title: "Thuộc đại lý", key: "agent", width: "312px", align: "center" },
  { title: "Số tiền", key: "amount", width: "312px", align: "center" },
  { title: "Loại hình giao dịch", key: "transactionType", width: "312px", align: "center" },
  { title: "Trạng thái giao dịch", key: "status", width: "312px", align: "center", customSlot: "status" },
  { title: "Thời gian", key: "createdAt", align: "center" },
];

const dataSource = ref([]);
const loading = ref(false);
const page = reactive({ current: 1, limit: 10, total: 0 });

function getDateRange(type: string): string[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  let start = fmt(today);
  let end = fmt(today);
  switch (type) {
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      start = fmt(y);
      end = fmt(y);
      break;
    }
    case "thisWeek": {
      const day = today.getDay() || 7;
      const mon = new Date(today);
      mon.setDate(today.getDate() - day + 1);
      start = fmt(mon);
      break;
    }
    case "thisMonth": {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      start = fmt(first);
      break;
    }
    case "lastMonth": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      start = fmt(first);
      end = fmt(last);
      break;
    }
  }
  return [start, end];
}

// Initialize with today's date
searchForm.dateRange = getDateRange("today");

watch(dateQuickSelect, (val) => {
  searchForm.dateRange = getDateRange(val);
});

function handleSearch() {
  page.current = 1;
  loadData();
}

function handleReset() {
  searchForm.dateRange = [];
  searchForm.username = "";
  searchForm.transactionType = "";
  searchForm.status = "";
  page.current = 1;
  loadData();
}

function handlePageChange(val: { current: number }) {
  page.current = val.current;
  loadData();
}

function handleLimitChange(limit: number) {
  page.limit = limit;
  page.current = 1;
  loadData();
}

function loadData() {
  loading.value = true;
  // TODO: API call
  loading.value = false;
}
</script>

<template>
  <div>
    <!-- Search form -->
    <lay-card title="Danh sách nạp tiền">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Thời gian :</span>
          <lay-date-picker v-model="searchForm.dateRange" range single-panel :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" :allow-clear="true" />
        </div>
        <div class="layui-inline">
          <lay-select v-model="dateQuickSelect" style="width: 150px" @change="onDateQuickChange">
            <lay-select-option v-for="opt in dateQuickOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Tên tài khoản:</span>
          <lay-input v-model="searchForm.username" placeholder="Tên tài khoản" style="width: 300px" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Loại hình giao dịch:</span>
          <lay-select v-model="searchForm.transactionType" style="width: 220px">
            <lay-select-option v-for="opt in transactionTypeOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Trạng thái:</span>
          <lay-select v-model="searchForm.status" style="width: 180px">
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

      <lay-table :columns="columns" :data-source="dataSource" :default-toolbar="true" :loading="loading">
        <template #status="{ row }">
          <span v-if="row.status === 'pending'" style="color: #e6a23c">Chờ xử lý</span>
          <span v-else-if="row.status === 'success'" style="color: #67c23a">Thành công</span>
          <span v-else-if="row.status === 'failed'" style="color: #f56c6c">Thất bại</span>
        </template>
      </lay-table>
      <lay-page
        v-model="page.current"
        :limit="page.limit"
        :total="page.total"
        :layout="['prev', 'page', 'next', 'skip', 'count', 'limits']"
        @change="handlePageChange"
        @limit-change="handleLimitChange"
      />
    </lay-card>
  </div>
</template>

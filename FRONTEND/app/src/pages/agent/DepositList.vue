<script setup lang="ts">
import { reactive } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import StatusBadge from "@/components/StatusBadge.vue";

const { dateRange, dateQuickSelect, dateQuickOptions, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, handlePageChange: _pageChange, handleLimitChange: _limitChange } = useListPage();

const searchForm = reactive({
  username: "",
  transactionType: "",
  status: "",
});

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

const DEPOSIT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "#e6a23c" },
  success: { label: "Thành công", color: "#67c23a" },
  failed: { label: "Thất bại", color: "#f56c6c" },
};

const columns = [
  { title: "Tên tài khoản", key: "username", width: "311.5px", align: "center" },
  { title: "Thuộc đại lý", key: "agent", width: "312px", align: "center" },
  { title: "Số tiền", key: "amount", width: "312px", align: "center" },
  { title: "Loại hình giao dịch", key: "transactionType", width: "312px", align: "center" },
  { title: "Trạng thái giao dịch", key: "status", width: "312px", align: "center", customSlot: "status" },
  { title: "Thời gian", key: "createdAt", align: "center" },
];

function loadData() {
  loading.value = true;
  // TODO: API call
  loading.value = false;
}

function handleSearch() {
  page.current = 1;
  loadData();
}

function handleReset() {
  resetDateRange();
  searchForm.username = "";
  searchForm.transactionType = "";
  searchForm.status = "";
  page.current = 1;
  loadData();
}

function handlePageChange(val: { current: number }) {
  _pageChange(val);
  loadData();
}

function handleLimitChange(limit: number) {
  _limitChange(limit);
  loadData();
}
</script>

<template>
  <div>
    <!-- Search form -->
    <lay-card title="Danh sách nạp tiền">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Thời gian :</span>
          <lay-date-picker v-model="dateRange" range single-panel range-separator="-" :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" />
        </div>
        <div class="layui-inline">
          <lay-select v-model="dateQuickSelect" style="width: 150px">
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
          <StatusBadge :status="row.status" :map="DEPOSIT_STATUS_MAP" />
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

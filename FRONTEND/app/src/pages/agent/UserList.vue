<script setup lang="ts">
import { ref, reactive } from "vue";

const searchForm = reactive({
  username: "",
  dateRange: [] as string[],
  status: "",
  sortField: "",
  sortOrder: "",
});

const columns = [
  { title: "Hội viên", key: "username" },
  { title: "Loại hình hội viên", key: "memberType" },
  { title: "Tài khoản đại lý", key: "agentAccount" },
  { title: "Số dư", key: "balance" },
  { title: "Lần nạp", key: "depositCount" },
  { title: "Lần rút", key: "withdrawCount" },
  { title: "Tổng tiền nạp", key: "totalDeposit" },
  { title: "Tổng tiền rút", key: "totalWithdraw" },
  { title: "IP đăng nhập cuối", key: "lastLoginIp" },
  { title: "Thời gian đăng nhập cuối", key: "lastLoginTime" },
  { title: "Thời gian đăng ký", key: "registerTime" },
  { title: "Trạng thái", key: "status" },
  { title: "Thao tác", key: "action" },
];

const dataSource = ref([]);
const loading = ref(false);
const page = reactive({ current: 1, limit: 10, total: 0 });

const statusOptions = [
  { label: "Chọn", value: "" },
  { label: "Bình thường", value: "1" },
  { label: "Đã khóa", value: "0" },
];

const sortFieldOptions = [
  { label: "Chọn", value: "" },
  { label: "Số dư", value: "balance" },
  { label: "Thời gian đăng ký", value: "registerTime" },
];

const sortOrderOptions = [
  { label: "Từ lớn đến bé", value: "desc" },
  { label: "Từ bé đến lớn", value: "asc" },
];

function handleSearch() {
  page.current = 1;
  // TODO: call API
}

function handleReset() {
  searchForm.username = "";
  searchForm.dateRange = [];
  searchForm.status = "";
  searchForm.sortField = "";
  searchForm.sortOrder = "";
}
</script>

<template>
  <div>
    <!-- Search form -->
    <lay-card title="Quản lí hội viên thuộc cấp">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Tên tài khoản:</span>
          <lay-input v-model="searchForm.username" placeholder="Nhập tên tài khoản" style="width: 200px" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Thời gian nạp đầu:</span>
          <lay-date-picker v-model="searchForm.dateRange" range single-panel :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" :allow-clear="true" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Trạng thái:</span>
          <lay-select v-model="searchForm.status" style="width: 212px">
            <lay-select-option v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Sắp xếp theo trường:</span>
          <lay-select v-model="searchForm.sortField" style="width: 150px">
            <lay-select-option v-for="opt in sortFieldOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Sắp xếp theo hướng:</span>
          <lay-select v-model="searchForm.sortOrder" style="width: 150px">
            <lay-select-option v-for="opt in sortOrderOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
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
        <template #toolbar>
          <lay-button type="normal" size="xs">+ Thêm hội viên</lay-button>
          <lay-button type="normal" size="xs">+ Đại lý mới thêm</lay-button>
          <lay-button type="normal" size="xs">Cài đặt hoàn trả</lay-button>
        </template>
        <template #action>
          <lay-button size="xs" type="normal">Cài đặt hoàn trả</lay-button>
        </template>
      </lay-table>
      <lay-page
        v-model="page.current"
        :limit="page.limit"
        :total="page.total"
        :layout="['prev', 'page', 'next', 'skip', 'count', 'limits']"
      />
    </lay-card>
  </div>
</template>

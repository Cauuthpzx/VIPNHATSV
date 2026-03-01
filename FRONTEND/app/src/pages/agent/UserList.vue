<script setup lang="ts">
import { reactive, onMounted } from "vue";
import { useListPage } from "@/composables/useListPage";
import { fetchUserList } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dataSource, loading, page, handlePageChange: _pageChange, handleLimitChange: _limitChange } = useListPage();

const searchForm = reactive({
  username: "",
  dateRange: [] as string[],
  status: "",
  sortField: "",
  sortOrder: "",
});

const columns = [
  { title: "Hội viên", key: "username" },
  { title: "Loại hình hội viên", key: "type_format" },
  { title: "Tài khoản đại lý", key: "parent_user" },
  { title: "Số dư", key: "money" },
  { title: "Lần nạp", key: "deposit_count" },
  { title: "Lần rút", key: "withdrawal_count" },
  { title: "Tổng tiền nạp", key: "deposit_amount" },
  { title: "Tổng tiền rút", key: "withdrawal_amount" },
  { title: "Thời gian đăng nhập cuối", key: "login_time" },
  { title: "Thời gian đăng ký", key: "register_time" },
  { title: "Trạng thái", key: "status_format" },
  { title: "Thao tác", key: "action" },
];

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

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchUserList({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      status: searchForm.status || undefined,
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
  searchForm.username = "";
  searchForm.dateRange = [];
  searchForm.status = "";
  searchForm.sortField = "";
  searchForm.sortOrder = "";
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

onMounted(() => loadData());
</script>

<template>
  <div>
    <!-- Search form -->
    <lay-card title="Quản lí hội viên thuộc cấp">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Tên tài khoản:</span>
          <lay-input v-model="searchForm.username" placeholder="Nhập tên tài khoản" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Thời gian nạp đầu:</span>
          <lay-date-picker v-model="searchForm.dateRange" range single-panel range-separator="-" :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" :allow-clear="true" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Trạng thái:</span>
          <lay-select v-model="searchForm.status">
            <lay-select-option v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Sắp xếp theo trường:</span>
          <lay-select v-model="searchForm.sortField">
            <lay-select-option v-for="opt in sortFieldOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Sắp xếp theo hướng:</span>
          <lay-select v-model="searchForm.sortOrder">
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
        @change="handlePageChange"
        @limit-change="handleLimitChange"
      />
    </lay-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";

const searchForm = reactive({
  dateAdded: [] as string[],
  dateMemberLogin: [] as string[],
  inviteCode: "",
});

const columns = [
  { title: "Mã giới thiệu", key: "inviteCode" },
  { title: "Loại hình giới thiệu", key: "inviteType" },
  { title: "Tổng số đã đăng ký", key: "totalRegistered" },
  { title: "Số lượng người dùng đã đăng ký", key: "registeredUserCount" },
  { title: "Số người nạp tiền", key: "depositUserCount" },
  { title: "Nạp đầu trong ngày", key: "firstDeposit" },
  { title: "Nạp đầu trong ngày (số tiền)", key: "firstDepositAmount" },
  { title: "Ghi chú", key: "note" },
  { title: "Thời gian thêm vào", key: "addedTime" },
  { title: "Thao tác", key: "action" },
];

const dataSource = ref([]);
const loading = ref(false);
const page = reactive({ current: 1, limit: 10, total: 0 });

function handleSearch() {
  page.current = 1;
  // TODO: call API
}

function handleReset() {
  searchForm.dateAdded = [];
  searchForm.dateMemberLogin = [];
  searchForm.inviteCode = "";
}
</script>

<template>
  <div>
    <!-- Search form -->
    <lay-card title="Danh sách liên kết giới thiệu">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Thời gian thêm vào:</span>
          <lay-date-picker v-model="searchForm.dateAdded" range single-panel range-separator="-" placeholder="Ngày bắt đầu - Ngày kết thúc" :allow-clear="true" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Thời gian hội viên đăng nhập:</span>
          <lay-date-picker v-model="searchForm.dateMemberLogin" range single-panel range-separator="-" placeholder="Ngày bắt đầu - Ngày kết thúc" :allow-clear="true" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Mã giới thiệu:</span>
          <lay-input v-model="searchForm.inviteCode" placeholder="Nhập đầy đủ mã giới thiệu" style="width: 240px" />
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
          <lay-button type="normal" size="xs">+ Thêm mã giới thiệu</lay-button>
          <lay-button type="normal" size="xs">Copy đường link</lay-button>
          <lay-button type="normal" size="xs">Xem cài đặt</lay-button>
        </template>
        <template #action>
          <lay-button size="xs" type="primary">Chi tiết</lay-button>
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

<script setup lang="ts">
import { reactive, onMounted } from "vue";
import { useListPage } from "@/composables/useListPage";
import { fetchInviteList } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dataSource, loading, page, handlePageChange: _pageChange, handleLimitChange: _limitChange } = useListPage();

const searchForm = reactive({
  dateAdded: [] as string[],
  dateMemberLogin: [] as string[],
  inviteCode: "",
});

const columns = [
  { title: "Mã giới thiệu", key: "invite_code" },
  { title: "Loại hình giới thiệu", key: "user_type" },
  { title: "Tổng số đã đăng ký", key: "reg_count" },
  { title: "Số lượng người dùng đã đăng ký", key: "scope_reg_count" },
  { title: "Số người nạp tiền", key: "recharge_count" },
  { title: "Nạp đầu trong ngày", key: "first_recharge_count" },
  { title: "Nạp đầu trong ngày (số tiền)", key: "register_recharge_count" },
  { title: "Ghi chú", key: "remark" },
  { title: "Thời gian thêm vào", key: "create_time" },
  { title: "Thao tác", key: "action" },
];

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchInviteList({
      page: page.current,
      limit: page.limit,
      invite_code: searchForm.inviteCode || undefined,
      create_time: searchForm.dateAdded?.length === 2 ? `${searchForm.dateAdded[0]} - ${searchForm.dateAdded[1]}` : undefined,
      user_register_time: searchForm.dateMemberLogin?.length === 2 ? `${searchForm.dateMemberLogin[0]} - ${searchForm.dateMemberLogin[1]}` : undefined,
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

function handlePageChange(val: { current: number }) {
  _pageChange(val);
  loadData();
}

function handleLimitChange(limit: number) {
  _limitChange(limit);
  loadData();
}

function handleReset() {
  searchForm.dateAdded = [];
  searchForm.dateMemberLogin = [];
  searchForm.inviteCode = "";
}

onMounted(() => loadData());
</script>

<template>
  <div>
    <!-- Search form -->
    <lay-card title="Danh sách liên kết giới thiệu">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Thời gian thêm vào:</span>
          <lay-date-picker v-model="searchForm.dateAdded" range single-panel range-separator="-" :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" :allow-clear="true" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Thời gian hội viên đăng nhập:</span>
          <lay-date-picker v-model="searchForm.dateMemberLogin" range single-panel range-separator="-" :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" :allow-clear="true" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Mã giới thiệu:</span>
          <lay-input v-model="searchForm.inviteCode" placeholder="Nhập đầy đủ mã giới thiệu" />
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
        @change="handlePageChange"
        @limit-change="handleLimitChange"
      />
    </lay-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from "vue";
import { useListPage } from "@/composables/useListPage";
import { fetchInviteList } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dataSource, loading, page } = useListPage();

const searchForm = reactive({
  dateAdded: [] as string[],
  dateMemberLogin: [] as string[],
  inviteCode: "",
});

const columns = [
  { title: "Mã giới thiệu", key: "invite_code", ellipsisTooltip: true },
  { title: "Loại hình giới thiệu", key: "user_type", ellipsisTooltip: true },
  { title: "Tổng số đã đăng ký", key: "reg_count", ellipsisTooltip: true },
  { title: "Số lượng người dùng đã đăng ký", key: "scope_reg_count", ellipsisTooltip: true },
  { title: "Số người nạp tiền", key: "recharge_count", ellipsisTooltip: true },
  { title: "Nạp đầu trong ngày", key: "first_recharge_count", ellipsisTooltip: true },
  { title: "Nạp đầu trong ngày (số tiền)", key: "register_recharge_count", ellipsisTooltip: true },
  { title: "Ghi chú", key: "remark", ellipsisTooltip: true },
  { title: "Thời gian thêm vào", key: "create_time", ellipsisTooltip: true },
  { title: "Thao tác", key: "action", customSlot: "action" },
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

function change(p: { current: number; limit: number }) {
  page.current = p.current;
  page.limit = p.limit;
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
    <lay-card>
      <lay-field title="Danh sách mã giới thiệu">
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
      </lay-field>

      <div class="table-container">
        <lay-table
          :page="page"
          :resize="true"
          :max-height="'100%'"
          :columns="columns"
          :loading="loading"
          :default-toolbar="true"
          :data-source="dataSource"
          @change="change"
        >
          <template v-slot:toolbar>
            <lay-button type="normal" size="xs">+ Thêm mã giới thiệu</lay-button>
            <lay-button type="normal" size="xs">Copy đường link</lay-button>
            <lay-button type="normal" size="xs">Xem cài đặt</lay-button>
          </template>
          <template v-slot:action>
            <lay-button size="xs" type="primary">Chi tiết</lay-button>
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

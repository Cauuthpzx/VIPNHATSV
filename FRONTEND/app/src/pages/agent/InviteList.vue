<script setup lang="ts">
import { reactive } from "vue";
import { useListPage } from "@/composables/useListPage";
import { fetchInviteList } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";
import { useAgentFilter } from "@/composables/useAgentFilter";
import { useAuthStore } from "@/stores/auth";
import { PERMISSIONS } from "@/constants/permissions";

const authStore = useAuthStore();
const canWrite = authStore.hasPermission(PERMISSIONS.INVITE_WRITE);

const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();

const searchForm = reactive({
  dateAdded: [] as string[],
  inviteCode: "",
});

const columns = [
  { title: "Nhân viên", key: "_agentName", ellipsisTooltip: true },
  { title: "Mã giới thiệu", key: "invite_code", ellipsisTooltip: true },
  { title: "Loại hình giới thiệu", key: "user_type", ellipsisTooltip: true },
  { title: "Tổng số đã đăng ký", key: "reg_count", customSlot: "num", ellipsisTooltip: true },
  { title: "Số lượng người dùng đã đăng ký", key: "scope_reg_count", customSlot: "num", ellipsisTooltip: true },
  { title: "Số người nạp tiền", key: "recharge_count", customSlot: "num", ellipsisTooltip: true },
  { title: "Nạp đầu trong ngày", key: "first_recharge_count", customSlot: "num", ellipsisTooltip: true },
  { title: "Nạp đầu trong ngày (số tiền)", key: "register_recharge_count", customSlot: "num", ellipsisTooltip: true },
  { title: "Ghi chú", key: "remark", ellipsisTooltip: true },
  { title: "Thời gian thêm vào", key: "create_time", ellipsisTooltip: true },
  { title: "Thao tác", key: "action", customSlot: "action" },
];

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  try {
    const res = await fetchInviteList({
      page: page.current,
      limit: page.limit,
      invite_code: searchForm.inviteCode || undefined,
      create_time: searchForm.dateAdded?.length === 2 ? `${searchForm.dateAdded[0]} - ${searchForm.dateAdded[1]}` : undefined,
    });
    if (isStale()) return;
    dataSource.value = res.data.data.items;
    page.total = res.data.data.total;
  } catch {
    if (!isStale()) layer.msg("Lỗi tải dữ liệu", { icon: 2 });
  } finally {
    if (!isStale()) setLoading(false);
  }
}

const { handlePageChange, handleSearch } = bindLoadData(loadData, selectedAgentId);

function handleReset() {
  searchForm.dateAdded = [];
  searchForm.inviteCode = "";
}
</script>

<template>
  <div>
    <lay-card>
      <lay-field title="Danh sách mã giới thiệu">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Nhân viên :</span>
          <lay-select v-model="selectedAgentId" :style="{ width: agentWidth }">
            <lay-select-option v-for="opt in agentOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Thời gian thêm vào:</span>
          <lay-date-picker v-model="searchForm.dateAdded" range single-panel range-separator="-" :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" :allow-clear="true" />
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
          :columns="columns"
          :loading="loading"
          :default-toolbar="true"
          :data-source="dataSource"
          @change="handlePageChange"
        >
          <template v-slot:toolbar>
            <lay-button size="xs" type="normal">
              <i class="layui-icon layui-icon-chart-screen" style="margin-right: 4px"></i>
              <b>Dữ liệu local</b>
            </lay-button>
            <template v-if="canWrite">
              <lay-button type="normal" size="xs">+ Thêm mã giới thiệu</lay-button>
              <lay-button type="normal" size="xs">Copy đường link</lay-button>
              <lay-button type="normal" size="xs">Xem cài đặt</lay-button>
            </template>
          </template>
          <template #num="{ row, column }">
            <lay-count-up :end-val="Number(row[column.key]) || 0" :duration="600" :decimal-places="String(row[column.key]).includes('.') ? 2 : 0" :use-grouping="false" />
          </template>
          <template v-slot:action>
            <lay-button size="xs" type="primary">Chi tiết</lay-button>
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

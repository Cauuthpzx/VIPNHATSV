<script setup lang="ts">
import { reactive } from "vue";
import { useListPage } from "@/composables/useListPage";
import { fetchBankList } from "@/api/services/proxy";
import { createExportAllFn } from "@/composables/useExportAll";
import { layer } from "@layui/layui-vue";
import { useAgentFilter } from "@/composables/useAgentFilter";
import CookieBadge from "@/components/CookieBadge.vue";
import { useAuthStore } from "@/stores/auth";
import { PERMISSIONS } from "@/constants/permissions";

const authStore = useAuthStore();
const canWrite = authStore.hasPermission(PERMISSIONS.FINANCE_WRITE);

const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();

const searchForm = reactive({
  accountNumber: "",
});

const columns = [
  { title: "Nhân viên", key: "_agentName", ellipsisTooltip: true },
  { title: "Mã số", key: "id", ellipsisTooltip: true },
  { title: "Có cài đặt mặc định không", key: "is_default_format", ellipsisTooltip: true },
  { title: "Tên ngân hàng", key: "bank_name", ellipsisTooltip: true },
  { title: "Chi nhánh", key: "bank_branch", ellipsisTooltip: true },
  { title: "Số tài khoản", key: "card_no", ellipsisTooltip: true },
  { title: "Tên chủ tài khoản", key: "name", ellipsisTooltip: true },
  { title: "Thao tác", key: "operation", customSlot: "operation" },
];

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  try {
    const res = await fetchBankList({
      page: page.current,
      limit: page.limit,
      card_no: searchForm.accountNumber || undefined,
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

const exportAllFn = createExportAllFn((p, limit) =>
  fetchBankList({
    page: p, limit,
    card_no: searchForm.accountNumber || undefined,
  }).then(r => r.data.data),
);

function handleReset() {
  searchForm.accountNumber = "";
  page.current = 1;
  loadData();
}

function handleAdd() {
  // TODO: open add bank account dialog
}

function handleEdit(_row: Record<string, unknown>) {
  // TODO: open edit bank account dialog
}

function handleDelete(_row: Record<string, unknown>) {
  // TODO: open delete confirmation dialog
}
</script>

<template>
  <div>
    <lay-card>
      <lay-field title="Danh sách thẻ ngân hàng">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Nhân viên :</span>
          <lay-select v-model="selectedAgentId" :style="{ width: agentWidth }">
            <lay-select-option v-for="opt in agentOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Số tài khoản:</span>
          <lay-input v-model="searchForm.accountNumber" placeholder="Số tài khoản" />
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
          :export-all-fn="exportAllFn"
          @change="handlePageChange"
        >
          <template v-slot:toolbar>
            <CookieBadge />
            <lay-button v-if="canWrite" type="normal" size="xs" @click="handleAdd">+ Thêm tài khoản ngân hàng</lay-button>
          </template>
          <template #operation="{ row }">
            <lay-button v-if="canWrite" size="xs" type="primary" @click="handleEdit(row)">Sửa</lay-button>
            <lay-button v-if="canWrite" size="xs" type="danger" @click="handleDelete(row)">Xóa</lay-button>
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

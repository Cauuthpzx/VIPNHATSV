<script setup lang="ts">
import { reactive, onMounted } from "vue";
import { useListPage } from "@/composables/useListPage";
import { fetchBankList } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dataSource, loading, page, handlePageChange: _pageChange, handleLimitChange: _limitChange } = useListPage();

const searchForm = reactive({
  accountNumber: "",
});

const columns = [
  { title: "Mã số", key: "id", width: "282.5px", align: "center" },
  { title: "Có cài đặt mặc định không", key: "is_default_format", width: "283px", align: "center" },
  { title: "Tên ngân hàng", key: "bank_name", width: "283px", align: "center" },
  { title: "Chi nhánh", key: "bank_branch", width: "283px", align: "center" },
  { title: "Số tài khoản", key: "card_no", width: "283px", align: "center" },
  { title: "Tên chủ tài khoản", key: "name", align: "center" },
  { title: "Thao tác", key: "operation", customSlot: "operation", align: "center" },
];

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchBankList({
      page: page.current,
      limit: page.limit,
      card_no: searchForm.accountNumber || undefined,
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
  searchForm.accountNumber = "";
  page.current = 1;
  loadData();
}

function handleAdd() {
  // TODO: open add bank account dialog
}

function handleEdit(row: any) {
  // TODO: open edit dialog
  console.log("Edit:", row);
}

function handleDelete(row: any) {
  // TODO: delete bank account
  console.log("Delete:", row);
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
    <lay-card title="Danh sách thẻ ngân hàng">
      <div class="search-form-wrap">
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

      <lay-table :columns="columns" :data-source="dataSource" :default-toolbar="true" :loading="loading">
        <template #toolbar>
          <lay-button type="normal" size="xs" @click="handleAdd">+ Thêm tài khoản ngân hàng</lay-button>
        </template>
        <template #operation="{ row }">
          <lay-button size="xs" type="primary" @click="handleEdit(row)">Sửa</lay-button>
          <lay-button size="xs" type="danger" @click="handleDelete(row)">Xóa</lay-button>
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

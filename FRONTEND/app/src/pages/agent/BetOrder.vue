<script setup lang="ts">
import { reactive, onMounted } from "vue";
import { useListPage } from "@/composables/useListPage";
import { fetchBetOrder } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";

const { dataSource, loading, page, handlePageChange: _pageChange, handleLimitChange: _limitChange } = useListPage();

const searchForm = reactive({
  dateRange: [] as string[],
  serialNo: "",
  platformUsername: "",
});

const columns = [
  { title: "Mã giao dịch", key: "serial_no", width: "250.5px", align: "center" },
  { title: "Nhà cung cấp game bên thứ 3", key: "platform_id_name", width: "151px", align: "center" },
  { title: "Tên tài khoản thuộc nhà cái", key: "platform_username", width: "151px", align: "center" },
  { title: "Loại hình trò chơi", key: "c_name", width: "151px", align: "center" },
  { title: "Tên trò chơi bên thứ 3", key: "game_name", width: "151px", align: "center" },
  { title: "Tiền cược", key: "bet_amount", align: "center" },
  { title: "Tiền cược hợp lệ", key: "turnover", align: "center" },
  { title: "Tiền thưởng", key: "prize", align: "center" },
  { title: "Thắng/Thua", key: "win_lose", align: "center" },
  { title: "Thời gian cược", key: "bet_time", align: "center" },
];

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchBetOrder({
      page: page.current,
      limit: page.limit,
      serial_no: searchForm.serialNo || undefined,
      platform_username: searchForm.platformUsername || undefined,
      bet_time: searchForm.dateRange?.length === 2 ? `${searchForm.dateRange[0]} - ${searchForm.dateRange[1]}` : undefined,
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
  searchForm.dateRange = [];
  searchForm.serialNo = "";
  searchForm.platformUsername = "";
}

onMounted(() => loadData());
</script>

<template>
  <div>
    <!-- Search form -->
    <lay-card title="Đơn cược bên thứ 3">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Thời gian :</span>
          <lay-date-picker v-model="searchForm.dateRange" range single-panel range-separator="-" :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" :allow-clear="true" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Mã giao dịch :</span>
          <lay-input v-model="searchForm.serialNo" placeholder="Nhập mã giao dịch" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Tên tài khoản thuộc nhà cái :</span>
          <lay-input v-model="searchForm.platformUsername" placeholder="Nhập tên tài khoản" />
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

      <lay-table :columns="columns" :data-source="dataSource" :default-toolbar="true" :loading="loading" />
      <lay-page
        v-model="page.current"
        :limit="page.limit"
        :total="page.total"
        :layout="['prev', 'page', 'next', 'skip', 'count', 'limits']"
        style="margin-top: 10px"
        @change="handlePageChange"
        @limit-change="handleLimitChange"
      />
    </lay-card>
  </div>
</template>

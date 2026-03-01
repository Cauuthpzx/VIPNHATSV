<script setup lang="ts">
import { ref, reactive } from "vue";

const searchForm = reactive({
  dateRange: [] as string[],
  serialNo: "",
  platformUsername: "",
});

const columns = [
  { title: "Mã giao dịch", key: "serialNo", width: "250.5px", align: "center" },
  { title: "Nhà cung cấp game bên thứ 3", key: "provider", width: "151px", align: "center" },
  { title: "Tên tài khoản thuộc nhà cái", key: "platformUsername", width: "151px", align: "center" },
  { title: "Loại hình trò chơi", key: "gameType", width: "151px", align: "center" },
  { title: "Tên trò chơi bên thứ 3", key: "gameName", width: "151px", align: "center" },
  { title: "Tiền cược", key: "betAmount", align: "center" },
  { title: "Tiền cược hợp lệ", key: "validBetAmount", align: "center" },
  { title: "Tiền thưởng", key: "bonusAmount", align: "center" },
  { title: "Thắng/Thua", key: "winLoss", align: "center" },
  { title: "Thời gian cược", key: "betTime", align: "center" },
  { title: "Thời gian thanh toán", key: "settleTime", align: "center" },
];

const dataSource = ref([]);
const loading = ref(false);
const page = reactive({ current: 1, limit: 10, total: 0 });

function handleSearch() {
  page.current = 1;
  // TODO: call API
}

function handleReset() {
  searchForm.dateRange = [];
  searchForm.serialNo = "";
  searchForm.platformUsername = "";
}

function handlePageChange(val: { current: number }) {
  page.current = val.current;
}

function handleLimitChange(limit: number) {
  page.limit = limit;
  page.current = 1;
}
</script>

<template>
  <div>
    <!-- Search form -->
    <lay-card title="Đơn cược bên thứ 3">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Thời gian :</span>
          <lay-date-picker v-model="searchForm.dateRange" range single-panel range-separator="-" placeholder="Ngày bắt đầu - Ngày kết thúc" :allow-clear="true" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Mã giao dịch :</span>
          <lay-input v-model="searchForm.serialNo" placeholder="Nhập mã giao dịch" style="width: 200px" />
        </div>
        <div class="layui-inline">
          <span class="form-label">Tên tài khoản thuộc nhà cái :</span>
          <lay-input v-model="searchForm.platformUsername" placeholder="Nhập tên tài khoản" style="width: 182px" />
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

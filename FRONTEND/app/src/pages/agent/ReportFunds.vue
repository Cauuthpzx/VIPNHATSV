<script setup lang="ts">
import { reactive, ref } from "vue";
import { useDateRange } from "@/composables/useDateRange";
import { useListPage } from "@/composables/useListPage";
import { fetchReportFunds } from "@/api/services/proxy";
import { layer } from "@layui/layui-vue";
import { useAgentFilter } from "@/composables/useAgentFilter";
import CookieBadge from "@/components/CookieBadge.vue";

const { dateRange, dateQuickSelect, dateQuickOptions, dateQuickWidth, resetDateRange } = useDateRange("today");
const { dataSource, loading, page, setLoading, bindLoadData, guardStale } = useListPage();
const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();

const searchForm = reactive({
  username: "",
});

const columns = [
  { title: "Nhân viên", key: "_agentName", ellipsisTooltip: true },
  { title: "Tên tài khoản", key: "username", ellipsisTooltip: true },
  { title: "Thuộc đại lý", key: "user_parent_format", ellipsisTooltip: true },
  { title: "Số lần nạp", key: "deposit_count", customSlot: "num", ellipsisTooltip: true },
  { title: "Số tiền nạp", key: "deposit_amount", customSlot: "num", ellipsisTooltip: true },
  { title: "Số lần rút", key: "withdrawal_count", customSlot: "num", ellipsisTooltip: true },
  { title: "Số tiền rút", key: "withdrawal_amount", customSlot: "num", ellipsisTooltip: true },
  { title: "Phí dịch vụ", key: "charge_fee", customSlot: "num", ellipsisTooltip: true },
  { title: "Hoa hồng đại lý", key: "agent_commission", customSlot: "num", ellipsisTooltip: true },
  { title: "Ưu đãi", key: "promotion", customSlot: "num", ellipsisTooltip: true },
  { title: "Hoàn trả bên thứ 3", key: "third_rebate", customSlot: "num", ellipsisTooltip: true },
  { title: "Tiền thưởng từ bên thứ 3", key: "third_activity_amount", customSlot: "num", ellipsisTooltip: true },
  { title: "Thời gian", key: "date", ellipsisTooltip: true },
];

const summaryColumns = [
  { title: "Số tiền nạp", key: "total_deposit_amount", customSlot: "sumNum", ellipsisTooltip: true },
  { title: "Số tiền rút", key: "total_withdrawal_amount", customSlot: "sumNum", ellipsisTooltip: true },
  { title: "Phí dịch vụ", key: "total_charge_fee", customSlot: "sumNum", ellipsisTooltip: true },
  { title: "Hoa hồng đại lý", key: "total_agent_commission", customSlot: "sumNum", ellipsisTooltip: true },
  { title: "Ưu đãi", key: "total_promotion", customSlot: "sumNum", ellipsisTooltip: true },
  { title: "Hoàn trả bên thứ 3", key: "total_third_rebate", customSlot: "sumNum", ellipsisTooltip: true },
  { title: "Tiền thưởng từ bên thứ 3", key: "third_activity_amount", customSlot: "sumNum", ellipsisTooltip: true },
];

const summaryData = ref([
  {
    total_deposit_amount: "0.0000",
    total_withdrawal_amount: "0.0000",
    total_charge_fee: "0.0000",
    total_agent_commission: "0.0000",
    total_promotion: "0.0000",
    total_third_rebate: "0.0000",
    third_activity_amount: "0.0000",
  },
]);

async function loadData() {
  const isStale = guardStale();
  setLoading(true);
  try {
    const res = await fetchReportFunds({
      page: page.current,
      limit: page.limit,
      username: searchForm.username || undefined,
      date: dateRange.value?.length === 2 ? `${dateRange.value[0]} - ${dateRange.value[1]}` : undefined,
    });
    if (isStale()) return;
    dataSource.value = res.data.data.items;
    page.total = res.data.data.total;
    if (res.data.data.totalData) {
      summaryData.value = [res.data.data.totalData as any];
    }
  } catch {
    if (!isStale()) layer.msg("Lỗi tải dữ liệu", { icon: 2 });
  } finally {
    if (!isStale()) setLoading(false);
  }
}

const { handlePageChange, handleSearch } = bindLoadData(loadData, selectedAgentId);

function handleReset() {
  resetDateRange();
  searchForm.username = "";
}
</script>

<template>
  <div>
    <lay-card>
      <lay-field title="Sao kê giao dịch">
      <div class="search-form-wrap">
        <div class="layui-inline">
          <span class="form-label">Nhân viên :</span>
          <lay-select v-model="selectedAgentId" :style="{ width: agentWidth }">
            <lay-select-option v-for="opt in agentOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Thời gian :</span>
          <lay-date-picker v-model="dateRange" range single-panel range-separator="-" :placeholder="['Ngày bắt đầu', 'Ngày kết thúc']" />
        </div>
        <div class="layui-inline">
          <lay-select v-model="dateQuickSelect" :style="{ width: dateQuickWidth }">
            <lay-select-option v-for="opt in dateQuickOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
          </lay-select>
        </div>
        <div class="layui-inline">
          <span class="form-label">Tên tài khoản :</span>
          <lay-input v-model="searchForm.username" placeholder="Nhập tên tài khoản" />
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
            <CookieBadge />
          </template>
          <template #num="{ row, column }">
            <lay-count-up :end-val="Number(row[column.key]) || 0" :duration="600" :decimal-places="String(row[column.key]).includes('.') ? 2 : 0" :use-grouping="false" />
          </template>
        </lay-table>
        <lay-table :columns="summaryColumns" :data-source="summaryData" :default-toolbar="true">
          <template v-slot:toolbar>
            <lay-button size="sm" type="normal"><b>DỮ LIỆU TỔNG HỢP</b></lay-button>
          </template>
          <template #sumNum="{ row, column }">
            <lay-count-up :end-val="Number(row[column.key]) || 0" :duration="600" :decimal-places="String(row[column.key]).includes('.') ? 4 : 0" :use-grouping="false" />
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

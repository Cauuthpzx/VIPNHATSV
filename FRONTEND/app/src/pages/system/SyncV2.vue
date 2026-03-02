<script setup lang="ts">
import { ref, onMounted } from "vue";
import { layer } from "@layui/layui-vue";
import { api } from "@/api/client";
import { stopSync } from "@/api/services/sync";

interface AgentRow {
  id: string;
  name: string;
  extUsername: string;
}

const loading = ref(false);
const stopping = ref(false);
const agents = ref<AgentRow[]>([]);

const columns = [
  { title: "Nhân viên - Đại lý", key: "display", ellipsisTooltip: true },
];

async function loadAgents() {
  loading.value = true;
  try {
    const res = await api.get("/agents/");
    agents.value = (res.data.data || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      extUsername: a.extUsername,
      display: `${a.name} - ${a.extUsername}`,
    }));
  } catch {
    layer.msg("Lỗi tải danh sách đại lý", { icon: 2 });
  } finally {
    loading.value = false;
  }
}

async function handleStopSync() {
  stopping.value = true;
  try {
    const res = await stopSync();
    if (res.data.success) {
      layer.msg("Đã yêu cầu dừng đồng bộ", { icon: 1 });
    } else {
      layer.msg(res.data.message || "Không có sync đang chạy", { icon: 0 });
    }
  } catch {
    layer.msg("Lỗi khi dừng đồng bộ", { icon: 2 });
  } finally {
    stopping.value = false;
  }
}

onMounted(() => loadAgents());
</script>

<template>
  <div>
    <lay-card>
      <lay-field title="Sync V2" />

      <div class="table-container">
          <lay-table
            :columns="columns"
            :loading="loading"
            :data-source="agents"
            :default-toolbar="true"
          >
            <template v-slot:toolbar>
              <lay-button
                size="sm"
                type="danger"
                :loading="stopping"
                @click="handleStopSync"
              >
                <i class="layui-icon layui-icon-pause"></i> Dừng Sync
              </lay-button>
            </template>
          </lay-table>
        </div>
    </lay-card>
  </div>
</template>

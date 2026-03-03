<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import { api } from "@/api/client";
import { stopSync } from "@/api/services/sync";
import { useToolbarPermission } from "@/composables/useToolbarPermission";

const { t } = useI18n();
const { defaultToolbar } = useToolbarPermission();

interface AgentRow {
  id: string;
  name: string;
  extUsername: string;
}

const loading = ref(false);
const stopping = ref(false);
const agents = ref<AgentRow[]>([]);

const columns = computed(() => [{ title: t("syncV2.agentCol"), key: "display", ellipsisTooltip: true }]);

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
    layer.msg(t("syncV2.errorLoadAgents"), { icon: 2 });
  } finally {
    loading.value = false;
  }
}

async function handleStopSync() {
  stopping.value = true;
  try {
    const res = await stopSync();
    if (res.data.success) {
      layer.msg(t("syncV2.stopRequested"), { icon: 1 });
    } else {
      layer.msg(res.data.message || t("syncV2.noSyncRunning"), { icon: 0 });
    }
  } catch {
    layer.msg(t("syncV2.stopError"), { icon: 2 });
  } finally {
    stopping.value = false;
  }
}

onMounted(() => loadAgents());
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('syncV2.title')" />

      <div class="table-container">
        <lay-table
          :columns="columns"
          :loading="loading"
          :data-source="agents"
          :default-toolbar="defaultToolbar"
        >
          <template #toolbar>
            <lay-button size="sm" type="danger" :loading="stopping" @click="handleStopSync">
              <i class="layui-icon layui-icon-pause" /> {{ t("syncV2.stopSync") }}
            </lay-button>
          </template>
        </lay-table>
      </div>
    </lay-card>
  </div>
</template>

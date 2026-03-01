import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { fetchAgents } from "@/api/services/proxy";

export interface AgentItem {
  id: string;
  name: string;
  extUsername: string;
  status: string;
  isActive: boolean;
  cookieExpires: string | null;
  lastLoginAt: string | null;
  updatedAt: string;
}

const AGENT_KEY = "selected_agent_id";

export const useAgentStore = defineStore("agent", () => {
  const agents = ref<AgentItem[]>([]);
  const selectedAgentId = ref(localStorage.getItem(AGENT_KEY) || "");
  const loaded = ref(false);

  const activeAgents = computed(() =>
    agents.value.filter((a) => a.isActive && a.status === "active"),
  );

  const selectedAgent = computed(() =>
    agents.value.find((a) => a.id === selectedAgentId.value) || null,
  );

  /** Số cookies hoạt động / tổng số agent */
  const cookieStats = computed(() => {
    const total = agents.value.length;
    const active = activeAgents.value.length;
    return { valid: active, total };
  });

  async function loadAgents() {
    try {
      const res = await fetchAgents();
      agents.value = res.data.data as AgentItem[];
      loaded.value = true;

      // If saved agent no longer valid, clear selection (backend will use default)
      if (selectedAgentId.value) {
        const found = activeAgents.value.find((a) => a.id === selectedAgentId.value);
        if (!found) {
          selectedAgentId.value = "";
          localStorage.removeItem(AGENT_KEY);
        }
      }
    } catch {
      // ignore
    }
  }

  function selectAgent(agentId: string) {
    selectedAgentId.value = agentId;
    if (agentId) {
      localStorage.setItem(AGENT_KEY, agentId);
    } else {
      localStorage.removeItem(AGENT_KEY);
    }
  }

  return {
    agents,
    selectedAgentId,
    activeAgents,
    selectedAgent,
    cookieStats,
    loaded,
    loadAgents,
    selectAgent,
  };
});

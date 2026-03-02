import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { fetchAgents, fetchCookieHealth } from "@/api/services/proxy";

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
const COOKIE_HEALTH_CACHE = "cookie_health_cache";
const AGENTS_CACHE = "agents_cache";

function loadCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAgentStore = defineStore("agent", () => {
  // Khôi phục cache từ localStorage để tránh nhấp nháy khi reload
  const cachedAgents = loadCache<AgentItem[]>(AGENTS_CACHE);
  const cachedHealth = loadCache<Record<string, boolean>>(COOKIE_HEALTH_CACHE);

  const agents = ref<AgentItem[]>(cachedAgents || []);
  const selectedAgentId = ref(localStorage.getItem(AGENT_KEY) || "");
  const loaded = ref(!!cachedAgents);

  const activeAgents = computed(() =>
    agents.value.filter((a) => a.isActive && a.status === "active"),
  );

  const selectedAgent = computed(() =>
    agents.value.find((a) => a.id === selectedAgentId.value) || null,
  );

  // Cookie health check (thực tế gọi upstream)
  const cookieHealthMap = ref<Record<string, boolean>>(cachedHealth || {});
  const healthLoaded = ref(!!cachedHealth);

  /** Số cookies còn sống / tổng số agent active */
  const cookieStats = computed(() => {
    const list = activeAgents.value;
    const total = list.length;
    if (!healthLoaded.value) return { valid: 0, total };
    const valid = list.filter((a) => cookieHealthMap.value[a.id] === true).length;
    return { valid, total };
  });

  async function loadAgents() {
    try {
      const res = await fetchAgents();
      agents.value = res.data.data as AgentItem[];
      loaded.value = true;
      localStorage.setItem(AGENTS_CACHE, JSON.stringify(agents.value));

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

  async function loadCookieHealth() {
    try {
      const res = await fetchCookieHealth();
      const list = res.data.data as Array<{ id: string; alive: boolean }>;
      const map: Record<string, boolean> = {};
      for (const item of list) map[item.id] = item.alive;
      cookieHealthMap.value = map;
      healthLoaded.value = true;
      localStorage.setItem(COOKIE_HEALTH_CACHE, JSON.stringify(map));
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
    cookieHealthMap,
    healthLoaded,
    loaded,
    loadAgents,
    loadCookieHealth,
    selectAgent,
  };
});

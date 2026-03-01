import { computed, onMounted } from "vue";
import { useAgentStore } from "@/stores/agent";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";

export function useAgentFilter() {
  const agentStore = useAgentStore();

  onMounted(() => {
    if (!agentStore.loaded) agentStore.loadAgents();
  });

  const selectedAgentId = computed({
    get: () => agentStore.selectedAgentId,
    set: (v: string) => agentStore.selectAgent(v),
  });

  const agentOptions = computed(() => [
    { label: "Tất cả", value: "" },
    ...agentStore.activeAgents.map((a) => ({ label: a.name, value: a.id })),
  ]);

  const { selectWidth: agentWidth } = useAutoFitSelect(agentOptions, 120);

  return {
    selectedAgentId,
    agentOptions,
    agentWidth,
  };
}

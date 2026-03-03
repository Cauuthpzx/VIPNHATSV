import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAgentStore } from "@/stores/agent";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";

export function useAgentFilter() {
  const { t } = useI18n();
  const agentStore = useAgentStore();

  onMounted(() => {
    if (!agentStore.loaded) agentStore.loadAgents();
    if (!agentStore.healthLoaded) agentStore.loadCookieHealth();
  });

  const selectedAgentId = computed({
    get: () => agentStore.selectedAgentId,
    set: (v: string) => agentStore.selectAgent(v),
  });

  const agentOptions = computed(() => [
    { label: t("common.all"), value: "" },
    ...agentStore.activeAgents.map((a) => ({ label: a.name, value: a.id })),
  ]);

  const { selectWidth: agentWidth } = useAutoFitSelect(agentOptions, 120);

  const cookieStats = computed(() => agentStore.cookieStats);

  return {
    selectedAgentId,
    agentOptions,
    agentWidth,
    cookieStats,
  };
}

import { computed, onMounted } from "vue";
import { useAgentStore } from "@/stores/agent";
import { useAutoFitSelect } from "@/composables/useAutoFitSelect";
import { layer } from "@layui/layui-vue";

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

  const cookieStats = computed(() => agentStore.cookieStats);

  /** Hiện thông báo thành công với số cookies hoạt động */
  function notifySuccess(total: number) {
    const { valid, total: cookieTotal } = cookieStats.value;
    layer.msg(`<span style="color:#5fb878">&#10004;</span> Cookies: ${valid}/${cookieTotal} hoạt động`, {
      isHtmlFragment: true,
      time: 2000,
      skin: "hub-msg-dark",
    });
  }

  return {
    selectedAgentId,
    agentOptions,
    agentWidth,
    cookieStats,
    notifySuccess,
  };
}

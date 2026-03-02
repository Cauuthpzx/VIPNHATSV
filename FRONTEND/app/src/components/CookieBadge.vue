<script setup lang="ts">
import { computed } from "vue";
import { useAgentStore } from "@/stores/agent";

const agentStore = useAgentStore();
const stats = computed(() => agentStore.cookieStats);
const ready = computed(() => agentStore.healthLoaded);

const color = computed(() => {
  if (!ready.value) return "#999";
  if (stats.value.valid === stats.value.total) return "#16baaa";
  if (stats.value.valid === 0) return "#ff4d4f";
  return "#ffb800";
});
</script>

<template>
  <lay-tag :color="color" size="sm" bordered class="cookie-badge">
    <i class="layui-icon layui-icon-key"></i>
    <template v-if="ready">
      <lay-count-up :end-val="stats.valid" :duration="600" />/<lay-count-up :end-val="stats.total" :duration="600" />
    </template>
    <template v-else>…</template>
  </lay-tag>
</template>

<style scoped>
.cookie-badge {
  height: 26px;
  line-height: 26px;
  padding: 0 8px;
  font-size: 12px;
  vertical-align: middle;
  margin-right: 6px;
}

.cookie-badge .layui-icon {
  font-size: 12px;
  margin-right: 4px;
}
</style>

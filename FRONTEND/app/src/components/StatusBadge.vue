<script setup lang="ts">
defineProps<{
  status: string;
  map: Record<string, { label: string; color: string }>;
}>();
</script>

<template>
  <span v-if="map[status]" :style="{ color: map[status].color }">{{ map[status].label }}</span>
  <span v-else>{{ status }}</span>
</template>

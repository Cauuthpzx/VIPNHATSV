<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const ready = ref(false);
const router = useRouter();

// Router guard sẽ chạy auth init trước khi resolve route đầu tiên.
// Khi isReady() resolve → auth đã xong, route đã resolved → render layout.
onMounted(async () => {
  await router.isReady();
  ready.value = true;
});
</script>

<template>
  <router-view v-if="ready" />
  <!-- Trong khi chờ auth + route resolve, giữ nguyên loader từ index.html -->
</template>

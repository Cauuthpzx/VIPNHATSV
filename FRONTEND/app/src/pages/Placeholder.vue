<script setup lang="ts">
import { useRoute } from "vue-router";
const route = useRoute();
</script>

<template>
  <div class="placeholder-page">
    <lay-card>
      <div style="text-align:center;padding:40px;color:#999">
        <i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop" style="font-size:30px"></i>
        <p style="margin-top:10px">{{ route.meta.title }} - Đang phát triển...</p>
      </div>
    </lay-card>
  </div>
</template>

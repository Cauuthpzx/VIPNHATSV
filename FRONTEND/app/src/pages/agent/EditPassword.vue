<script setup lang="ts">
import AgentPasswordPage from "@/components/AgentPasswordPage.vue";
import { editUpstreamPassword } from "@/api/services/proxy";

async function handleSubmit(agentId: string, data: { oldPassword: string; newPassword: string }) {
  await editUpstreamPassword({
    old_password: data.oldPassword,
    new_password: data.newPassword,
    confirm_password: data.newPassword,
    agentId,
  });
}
</script>

<template>
  <AgentPasswordPage
    title="Đổi mật khẩu đăng nhập (Agent)"
    :on-submit="handleSubmit"
  />
</template>

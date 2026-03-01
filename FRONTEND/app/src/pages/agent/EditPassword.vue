<script setup lang="ts">
import PasswordForm from "@/components/PasswordForm.vue";
import { changePassword } from "@/api/services/proxy";

async function handleSubmit(data: { oldPassword: string; newPassword: string }) {
  await changePassword(data);
}
</script>

<template>
  <PasswordForm
    title="Đổi mật khẩu đăng nhập"
    :on-submit="handleSubmit"
  />
</template>

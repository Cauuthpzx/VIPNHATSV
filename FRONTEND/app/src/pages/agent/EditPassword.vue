<script setup lang="ts">
import PasswordForm from "@/components/PasswordForm.vue";

async function handleSubmit(data: { oldPassword: string; newPassword: string }) {
  // TODO: call API to change login password
  console.log("Change login password:", data);
}
</script>

<template>
  <PasswordForm
    title="Đổi mật khẩu đăng nhập"
    :on-submit="handleSubmit"
  />
</template>

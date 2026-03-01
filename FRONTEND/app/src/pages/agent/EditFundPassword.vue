<script setup lang="ts">
import PasswordForm from "@/components/PasswordForm.vue";
import { changeFundPassword } from "@/api/services/proxy";

async function handleSubmit(data: { oldPassword: string; newPassword: string }) {
  await changeFundPassword({ oldPassword: data.oldPassword || undefined, newPassword: data.newPassword });
}
</script>

<template>
  <PasswordForm
    title="Đổi mật khẩu giao dịch"
    old-password-label="Mật khẩu giao dịch cũ"
    old-password-placeholder="Bạn vẫn chưa cài đặt mật khẩu giao dịch"
    confirm-label="Xác nhận"
    validation-msg-old="Vui lòng nhập mật khẩu giao dịch cũ"
    success-msg="Đổi mật khẩu giao dịch thành công"
    :on-submit="handleSubmit"
  />
</template>

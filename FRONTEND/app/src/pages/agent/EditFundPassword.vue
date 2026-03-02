<script setup lang="ts">
import AgentPasswordPage from "@/components/AgentPasswordPage.vue";
import { editUpstreamFundPassword } from "@/api/services/proxy";

async function handleSubmit(agentId: string, data: { oldPassword: string; newPassword: string }) {
  await editUpstreamFundPassword({
    old_fund_password: data.oldPassword || undefined,
    new_fund_password: data.newPassword,
    confirm_fund_password: data.newPassword,
    agentId,
  });
}
</script>

<template>
  <AgentPasswordPage
    title="Đổi mật khẩu giao dịch (Agent)"
    old-password-label="Mật khẩu giao dịch cũ"
    old-password-placeholder="Bạn vẫn chưa cài đặt mật khẩu giao dịch"
    confirm-label="Xác nhận"
    validation-msg-old="Vui lòng nhập mật khẩu giao dịch cũ"
    success-msg="Đổi mật khẩu giao dịch thành công"
    :on-submit="handleSubmit"
  />
</template>

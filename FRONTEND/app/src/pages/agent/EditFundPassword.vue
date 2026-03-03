<script setup lang="ts">
import { useI18n } from "vue-i18n";
import AgentPasswordPage from "@/components/AgentPasswordPage.vue";
import { editUpstreamFundPassword } from "@/api/services/proxy";

const { t } = useI18n();

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
    :title="t('editPassword.agentFund')"
    :old-password-label="t('editPassword.fundOldLabel')"
    :old-password-placeholder="t('editPassword.fundOldPlaceholder')"
    :confirm-label="t('editPassword.fundConfirmLabel')"
    :validation-msg-old="t('editPassword.fundOldValidation')"
    :success-msg="t('editPassword.fundSuccess')"
    :on-submit="handleSubmit"
  />
</template>

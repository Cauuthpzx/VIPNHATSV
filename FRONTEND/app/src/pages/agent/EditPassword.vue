<script setup lang="ts">
import { useI18n } from "vue-i18n";
import AgentPasswordPage from "@/components/AgentPasswordPage.vue";
import { editUpstreamPassword } from "@/api/services/proxy";

const { t } = useI18n();

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
    :title="t('editPassword.agentLogin')"
    :on-submit="handleSubmit"
  />
</template>

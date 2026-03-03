<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import PasswordForm from "@/components/PasswordForm.vue";
import { useAgentFilter } from "@/composables/useAgentFilter";

const { t } = useI18n();

const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();

const props = withDefaults(
  defineProps<{
    title: string;
    oldPasswordLabel?: string;
    oldPasswordPlaceholder?: string;
    confirmLabel?: string;
    validationMsgOld?: string;
    successMsg?: string;
    onSubmit: (agentId: string, data: { oldPassword: string; newPassword: string }) => Promise<void>;
  }>(),
  {},
);

async function handleSubmit(data: { oldPassword: string; newPassword: string }) {
  if (!selectedAgentId.value) {
    layer.msg(t("editPassword.selectAgent"), { icon: 2 });
    return;
  }
  await props.onSubmit(selectedAgentId.value, data);
}
</script>

<template>
  <div>
    <div class="agent-select-bar">
      <label class="agent-select-label">{{ t('common.agentLabel') }}</label>
      <lay-select
        v-model="selectedAgentId"
        :style="{ width: agentWidth }"
        size="sm"
      >
        <lay-select-option
          v-for="opt in agentOptions.filter((o: any) => o.value)"
          :key="opt.value"
          :value="opt.value"
          :label="opt.label"
        />
      </lay-select>
    </div>
    <PasswordForm
      :title="title"
      :old-password-label="oldPasswordLabel"
      :old-password-placeholder="oldPasswordPlaceholder"
      :confirm-label="confirmLabel"
      :validation-msg-old="validationMsgOld"
      :success-msg="successMsg"
      :on-submit="handleSubmit"
    />
  </div>
</template>

<style scoped>
.agent-select-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.agent-select-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}
</style>

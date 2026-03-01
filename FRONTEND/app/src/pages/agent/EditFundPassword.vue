<script setup lang="ts">
import { layer } from "@layui/layui-vue";
import PasswordForm from "@/components/PasswordForm.vue";
import { editUpstreamFundPassword } from "@/api/services/proxy";
import { useAgentFilter } from "@/composables/useAgentFilter";

const { selectedAgentId, agentOptions, agentWidth } = useAgentFilter();

async function handleSubmit(data: { oldPassword: string; newPassword: string }) {
  if (!selectedAgentId.value) {
    layer.msg("Vui lòng chọn agent", { icon: 2 });
    return;
  }
  await editUpstreamFundPassword({
    old_fund_password: data.oldPassword || undefined,
    new_fund_password: data.newPassword,
    confirm_fund_password: data.newPassword,
    agentId: selectedAgentId.value,
  });
}
</script>

<template>
  <div>
    <div class="agent-select-bar">
      <label class="agent-select-label">Agent:</label>
      <lay-select
        v-model="selectedAgentId"
        :style="{ width: agentWidth }"
        size="sm"
      >
        <lay-select-option
          v-for="opt in agentOptions.filter(o => o.value)"
          :key="opt.value"
          :value="opt.value"
          :label="opt.label"
        />
      </lay-select>
    </div>
    <PasswordForm
      title="Đổi mật khẩu giao dịch (Agent)"
      old-password-label="Mật khẩu giao dịch cũ"
      old-password-placeholder="Bạn vẫn chưa cài đặt mật khẩu giao dịch"
      confirm-label="Xác nhận"
      validation-msg-old="Vui lòng nhập mật khẩu giao dịch cũ"
      success-msg="Đổi mật khẩu giao dịch thành công"
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

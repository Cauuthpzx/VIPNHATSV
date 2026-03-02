<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import { layer } from "@layui/layui-vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    oldPasswordLabel?: string;
    oldPasswordPlaceholder?: string;
    confirmLabel?: string;
    validationMsgOld?: string;
    successMsg?: string;
    requireOldPassword?: boolean;
    inline?: boolean;
    onSubmit?: (data: { oldPassword: string; newPassword: string }) => Promise<void>;
  }>(),
  {
    title: "",
    oldPasswordLabel: "Mật khẩu cũ",
    oldPasswordPlaceholder: "Nhập mật khẩu cũ",
    confirmLabel: "Xác nhận mật khẩu mới",
    validationMsgOld: "Vui lòng nhập mật khẩu cũ",
    successMsg: "Đổi mật khẩu thành công",
    requireOldPassword: true,
    inline: false,
  }
);

const formData = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const submitting = ref(false);

const strengthChecks = computed(() => {
  const p = formData.newPassword;
  return [
    { label: "8+ ký tự", pass: p.length >= 8 },
    { label: "Chữ hoa (A-Z)", pass: /[A-Z]/.test(p) },
    { label: "Chữ thường (a-z)", pass: /[a-z]/.test(p) },
    { label: "Số (0-9)", pass: /[0-9]/.test(p) },
    { label: "Ký tự đặc biệt (!@#...)", pass: /[^A-Za-z0-9]/.test(p) },
  ];
});

const passedCount = computed(() => strengthChecks.value.filter((c) => c.pass).length);
const allPassed = computed(() => passedCount.value === 5);

const strengthLabel = computed(() => {
  if (!formData.newPassword) return "";
  if (passedCount.value <= 2) return "Yếu";
  if (passedCount.value <= 3) return "Trung bình";
  if (passedCount.value <= 4) return "Khá";
  return "Mạnh";
});

const strengthColor = computed(() => {
  if (passedCount.value <= 2) return "#ff4d4f";
  if (passedCount.value <= 3) return "#faad14";
  if (passedCount.value <= 4) return "#1890ff";
  return "#52c41a";
});

async function handleSubmit() {
  if (props.requireOldPassword && !formData.oldPassword) {
    layer.msg(props.validationMsgOld, { icon: 2 });
    return;
  }
  if (!formData.newPassword) {
    layer.msg("Vui lòng nhập mật khẩu mới", { icon: 2 });
    return;
  }
  if (!allPassed.value) {
    layer.msg("Mật khẩu chưa đủ mạnh", { icon: 2 });
    return;
  }
  if (formData.newPassword !== formData.confirmPassword) {
    layer.msg("Xác nhận mật khẩu không khớp", { icon: 2 });
    return;
  }

  if (!props.onSubmit) return;

  submitting.value = true;
  try {
    await props.onSubmit({
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    });
    layer.msg(props.successMsg, { icon: 1 });
    Object.assign(formData, { oldPassword: "", newPassword: "", confirmPassword: "" });
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Thao tác thất bại, vui lòng thử lại";
    layer.msg(msg, { icon: 2 });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <lay-card v-if="!inline">
    <template #header>{{ title }}</template>
    <div class="pw-form-body">
      <div class="layui-form-item" v-if="requireOldPassword">
        <label class="layui-form-label">{{ oldPasswordLabel }}</label>
        <div class="layui-input-block">
          <lay-input v-model="formData.oldPassword" type="password" :placeholder="oldPasswordPlaceholder" />
        </div>
      </div>
      <div class="layui-form-item">
        <label class="layui-form-label">Mật khẩu mới</label>
        <div class="layui-input-block">
          <lay-input v-model="formData.newPassword" type="password" placeholder="Nhập mật khẩu mới" />
        </div>
      </div>
      <div class="pw-strength" v-if="formData.newPassword">
        <div class="pw-strength-bar">
          <div class="pw-strength-fill" :style="{ width: (passedCount / 5) * 100 + '%', background: strengthColor }" />
        </div>
        <span class="pw-strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
        <div class="pw-checks">
          <span v-for="check in strengthChecks" :key="check.label" class="pw-check-item" :class="{ passed: check.pass }">
            {{ check.pass ? '\u2713' : '\u2717' }} {{ check.label }}
          </span>
        </div>
      </div>
      <div class="layui-form-item">
        <label class="layui-form-label">{{ confirmLabel }}</label>
        <div class="layui-input-block">
          <lay-input v-model="formData.confirmPassword" type="password" placeholder="Nhập lại mật khẩu mới" />
        </div>
      </div>
      <div class="layui-form-item">
        <div class="layui-input-block">
          <lay-button type="normal" :loading="submitting" @click="handleSubmit">Xác nhận</lay-button>
        </div>
      </div>
    </div>
  </lay-card>
  <div v-else class="pw-form-body">
    <div class="layui-form-item" v-if="requireOldPassword">
      <label class="layui-form-label">{{ oldPasswordLabel }}</label>
      <div class="layui-input-block">
        <lay-input v-model="formData.oldPassword" type="password" :placeholder="oldPasswordPlaceholder" />
      </div>
    </div>
    <div class="layui-form-item">
      <label class="layui-form-label">Mật khẩu mới</label>
      <div class="layui-input-block">
        <lay-input v-model="formData.newPassword" type="password" placeholder="Nhập mật khẩu mới" />
      </div>
    </div>
    <div class="pw-strength" v-if="formData.newPassword">
      <div class="pw-strength-bar">
        <div class="pw-strength-fill" :style="{ width: (passedCount / 5) * 100 + '%', background: strengthColor }" />
      </div>
      <span class="pw-strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
      <div class="pw-checks">
        <span v-for="check in strengthChecks" :key="check.label" class="pw-check-item" :class="{ passed: check.pass }">
          {{ check.pass ? '\u2713' : '\u2717' }} {{ check.label }}
        </span>
      </div>
    </div>
    <div class="layui-form-item">
      <label class="layui-form-label">{{ confirmLabel }}</label>
      <div class="layui-input-block">
        <lay-input v-model="formData.confirmPassword" type="password" placeholder="Nhập lại mật khẩu mới" />
      </div>
    </div>
    <div class="layui-form-item">
      <div class="layui-input-block">
        <lay-button type="normal" :loading="submitting" @click="handleSubmit">Xác nhận</lay-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pw-form-body {
  padding: 15px;
}

.pw-strength {
  padding: 0 0 12px 110px;
}

.pw-strength-bar {
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 6px;
}

.pw-strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s, background 0.3s;
}

.pw-strength-label {
  font-size: 12px;
  font-weight: 600;
}

.pw-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 6px;
}

.pw-check-item {
  font-size: 11px;
  color: #999;
  transition: color 0.2s;
}

.pw-check-item.passed {
  color: #52c41a;
}
</style>

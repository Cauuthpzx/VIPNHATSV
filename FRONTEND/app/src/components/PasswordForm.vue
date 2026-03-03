<script setup lang="ts">
import { reactive, ref, toRef, computed } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import { usePasswordStrength } from "@/composables/usePasswordStrength";

const { t } = useI18n();

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
    oldPasswordLabel: undefined,
    oldPasswordPlaceholder: undefined,
    confirmLabel: undefined,
    validationMsgOld: undefined,
    successMsg: undefined,
    requireOldPassword: true,
    inline: false,
  },
);

// Computed defaults with i18n
const resolvedOldPasswordLabel = computed(() => props.oldPasswordLabel ?? t("password.oldPassword"));
const resolvedOldPasswordPlaceholder = computed(
  () => props.oldPasswordPlaceholder ?? t("password.oldPasswordPlaceholder"),
);
const resolvedConfirmLabel = computed(() => props.confirmLabel ?? t("password.confirmPassword"));
const resolvedValidationMsgOld = computed(() => props.validationMsgOld ?? t("password.enterOld"));
const resolvedSuccessMsg = computed(() => props.successMsg ?? t("password.changeSuccess"));

const formData = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const submitting = ref(false);

// Password strength (shared composable)
const {
  checks: strengthChecks,
  passedCount,
  allPassed,
  label: strengthLabel,
  color: strengthColor,
} = usePasswordStrength(toRef(formData, "newPassword"));

async function handleSubmit() {
  if (props.requireOldPassword && !formData.oldPassword) {
    layer.msg(resolvedValidationMsgOld.value, { icon: 2 });
    return;
  }
  if (!formData.newPassword) {
    layer.msg(t("password.enterNew"), { icon: 2 });
    return;
  }
  if (!allPassed.value) {
    layer.msg(t("password.notStrong"), { icon: 2 });
    return;
  }
  if (formData.newPassword !== formData.confirmPassword) {
    layer.msg(t("password.mismatch"), { icon: 2 });
    return;
  }

  if (!props.onSubmit) return;

  submitting.value = true;
  try {
    await props.onSubmit({
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    });
    layer.msg(resolvedSuccessMsg.value, { icon: 1 });
    Object.assign(formData, { oldPassword: "", newPassword: "", confirmPassword: "" });
  } catch (err: any) {
    const msg = err?.response?.data?.message || t("common.operationFailedRetry");
    layer.msg(msg, { icon: 2 });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <lay-card v-if="!inline">
    <template #header>
      {{ title }}
    </template>
    <div class="pw-form-body">
      <div v-if="requireOldPassword" class="layui-form-item">
        <label class="layui-form-label">{{ resolvedOldPasswordLabel }}</label>
        <div class="layui-input-block">
          <lay-input
            v-model="formData.oldPassword"
            type="password"
            :placeholder="resolvedOldPasswordPlaceholder"
          />
        </div>
      </div>
      <div class="layui-form-item">
        <label class="layui-form-label">{{ t("password.newPassword") }}</label>
        <div class="layui-input-block">
          <lay-input
            v-model="formData.newPassword"
            type="password"
            :placeholder="t('password.newPasswordPlaceholder')"
          />
        </div>
      </div>
      <div v-if="formData.newPassword" class="pw-strength">
        <div class="pw-strength-bar">
          <div
            class="pw-strength-fill"
            :style="{ width: (passedCount / 5) * 100 + '%', background: strengthColor }"
          />
        </div>
        <span class="pw-strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
        <div class="pw-checks">
          <span
            v-for="check in strengthChecks"
            :key="check.label"
            class="pw-check-item"
            :class="{ passed: check.pass }"
          >
            {{ check.pass ? "\u2713" : "\u2717" }} {{ check.label }}
          </span>
        </div>
      </div>
      <div class="layui-form-item">
        <label class="layui-form-label">{{ resolvedConfirmLabel }}</label>
        <div class="layui-input-block">
          <lay-input
            v-model="formData.confirmPassword"
            type="password"
            :placeholder="t('password.confirmPasswordPlaceholder')"
          />
        </div>
      </div>
      <div class="layui-form-item">
        <div class="layui-input-block">
          <lay-button type="normal" :loading="submitting" @click="handleSubmit">
            {{ t("common.confirm") }}
          </lay-button>
        </div>
      </div>
    </div>
  </lay-card>
  <div v-else class="pw-form-body">
    <div v-if="requireOldPassword" class="layui-form-item">
      <label class="layui-form-label">{{ resolvedOldPasswordLabel }}</label>
      <div class="layui-input-block">
        <lay-input
          v-model="formData.oldPassword"
          type="password"
          :placeholder="resolvedOldPasswordPlaceholder"
        />
      </div>
    </div>
    <div class="layui-form-item">
      <label class="layui-form-label">{{ t("password.newPassword") }}</label>
      <div class="layui-input-block">
        <lay-input
          v-model="formData.newPassword"
          type="password"
          :placeholder="t('password.newPasswordPlaceholder')"
        />
      </div>
    </div>
    <div v-if="formData.newPassword" class="pw-strength">
      <div class="pw-strength-bar">
        <div
          class="pw-strength-fill"
          :style="{ width: (passedCount / 5) * 100 + '%', background: strengthColor }"
        />
      </div>
      <span class="pw-strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
      <div class="pw-checks">
        <span
          v-for="check in strengthChecks"
          :key="check.label"
          class="pw-check-item"
          :class="{ passed: check.pass }"
        >
          {{ check.pass ? "\u2713" : "\u2717" }} {{ check.label }}
        </span>
      </div>
    </div>
    <div class="layui-form-item">
      <label class="layui-form-label">{{ resolvedConfirmLabel }}</label>
      <div class="layui-input-block">
        <lay-input
          v-model="formData.confirmPassword"
          type="password"
          :placeholder="t('password.confirmPasswordPlaceholder')"
        />
      </div>
    </div>
    <div class="layui-form-item">
      <div class="layui-input-block">
        <lay-button type="normal" :loading="submitting" @click="handleSubmit">
          {{ t("common.confirm") }}
        </lay-button>
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
  transition:
    width 0.3s,
    background 0.3s;
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

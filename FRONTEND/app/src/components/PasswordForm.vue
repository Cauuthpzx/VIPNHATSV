<script setup lang="ts">
import { reactive } from "vue";
import { layer } from "@layui/layui-vue";

const props = withDefaults(
  defineProps<{
    title: string;
    oldPasswordLabel?: string;
    oldPasswordPlaceholder?: string;
    confirmLabel?: string;
    validationMsgOld?: string;
    successMsg?: string;
  }>(),
  {
    oldPasswordLabel: "Mật khẩu cũ",
    oldPasswordPlaceholder: "Nhập mật khẩu cũ",
    confirmLabel: "Xác nhận mật khẩu mới",
    validationMsgOld: "Vui lòng nhập mật khẩu cũ",
    successMsg: "Đổi mật khẩu thành công",
  }
);

const emit = defineEmits<{
  (e: "submit", data: { oldPassword: string; newPassword: string }): void;
}>();

const formData = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

function handleSubmit() {
  if (!formData.oldPassword) {
    layer.msg(props.validationMsgOld, { icon: 2 });
    return;
  }
  if (!formData.newPassword) {
    layer.msg("Vui lòng nhập mật khẩu mới", { icon: 2 });
    return;
  }
  if (formData.newPassword.length < 6) {
    layer.msg("Mật khẩu mới phải có ít nhất 6 ký tự", { icon: 2 });
    return;
  }
  if (formData.newPassword !== formData.confirmPassword) {
    layer.msg("Xác nhận mật khẩu không khớp", { icon: 2 });
    return;
  }

  emit("submit", {
    oldPassword: formData.oldPassword,
    newPassword: formData.newPassword,
  });

  layer.msg(props.successMsg, { icon: 1 });
  Object.assign(formData, {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
}
</script>

<template>
  <div>
    <lay-card>
      <template #header>
        {{ title }}
      </template>
      <div class="password-form" style="padding: 15px;">
        <div class="layui-form-item">
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
        <div class="layui-form-item">
          <label class="layui-form-label">{{ confirmLabel }}</label>
          <div class="layui-input-block">
            <lay-input v-model="formData.confirmPassword" type="password" placeholder="Nhập lại mật khẩu mới" />
          </div>
        </div>
        <div class="layui-form-item">
          <div class="layui-input-block">
            <lay-button type="normal" @click="handleSubmit">Gửi đi</lay-button>
          </div>
        </div>
      </div>
    </lay-card>
  </div>
</template>

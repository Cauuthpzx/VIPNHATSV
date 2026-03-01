<script setup lang="ts">
import { reactive } from "vue";
import { layer } from "@layui/layui-vue";

const formData = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

function handleSubmit() {
  if (!formData.oldPassword) {
    layer.msg("Vui lòng nhập mật khẩu giao dịch cũ", { icon: 2 });
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

  // TODO: call API to change fund/transaction password
  layer.msg("Đổi mật khẩu giao dịch thành công", { icon: 1 });
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
        Đổi mật khẩu giao dịch
      </template>
      <div class="password-form" style="padding: 15px;">
        <div class="layui-form-item">
          <label class="layui-form-label">Mật khẩu giao dịch cũ</label>
          <div class="layui-input-block">
            <lay-input v-model="formData.oldPassword" type="password" placeholder="Bạn vẫn chưa cài đặt mật khẩu giao dịch" />
          </div>
        </div>
        <div class="layui-form-item">
          <label class="layui-form-label">Mật khẩu mới</label>
          <div class="layui-input-block">
            <lay-input v-model="formData.newPassword" type="password" placeholder="Nhập mật khẩu mới" />
          </div>
        </div>
        <div class="layui-form-item">
          <label class="layui-form-label">Xác nhận</label>
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

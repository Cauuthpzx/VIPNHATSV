<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const username = ref("");
const password = ref("");
const loading = ref(false);

async function handleLogin() {
  if (!username.value || !password.value) return;
  loading.value = true;
  // TODO: call API POST /auth/login { username, password }
  // On success: save token, redirect
  loading.value = false;
  router.push("/agent/welcome");
}
</script>

<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-title">Hệ thống quản lí</div>
      <div class="login-form">
        <div class="login-form-item">
          <lay-input
            v-model="username"
            placeholder="Tên đăng nhập"
            prefix-icon="layui-icon-username"
            style="width: 100%"
          />
        </div>
        <div class="login-form-item">
          <lay-input
            v-model="password"
            type="password"
            placeholder="Mật khẩu"
            prefix-icon="layui-icon-password"
            style="width: 100%"
            @keyup.enter="handleLogin"
          />
        </div>
        <div class="login-form-item">
          <lay-button
            type="normal"
            :loading="loading"
            style="width: 100%; height: 42px; font-size: 15px"
            @click="handleLogin"
          >
            Đăng nhập
          </lay-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #20222a;
}

.login-box {
  width: 380px;
  background: #fff;
  border-radius: 4px;
  padding: 35px 30px 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.login-title {
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 30px;
}

.login-form-item {
  margin-bottom: 18px;
}
</style>

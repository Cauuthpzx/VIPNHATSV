<template>
  <div class="login-page">
    <!-- Canvas Texture Overlay -->
    <div class="canvas-texture"></div>

    <!-- Animated SVG Background -->
    <div class="login-bg">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
        <rect x="1300" y="400" rx="40" ry="40" width="300" height="300" fill="#16B777" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0 1450 550" to="360 1450 550" dur="35s" repeatCount="indefinite" />
        </rect>
        <path d="M 100 350 A 150 150 0 1 1 400 350 Q400 370 380 370 L 250 370 L 120 370 Q100 370 100 350" fill="#FFB800" opacity="0.6">
          <animateMotion path="M 800 -200 L 800 -300 L 800 -200" dur="20s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="rotate" values="0 210 530;-30 210 530;0 210 530" keyTimes="0;0.5;1" dur="30s" repeatCount="indefinite" />
        </path>
        <circle cx="220" cy="140" r="72" fill="#16baaa" opacity="0.5">
          <animateMotion path="M 0 0 L 40 20 Z" dur="5s" repeatCount="indefinite" />
        </circle>
        <path d="M 165 580 L 270 580 Q275 578 270 570 L 223 483 Q220 480 217 483 L 165 570 Q160 578 165 580" fill="#FF5722" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0 210 530" to="360 210 530" dur="35s" repeatCount="indefinite" />
        </path>
        <rect x="400" y="600" rx="40" ry="40" width="120" height="120" fill="#1E9FFF" opacity="0.5">
          <animateTransform attributeName="transform" type="rotate" from="-30 550 750" to="330 550 750" dur="35s" repeatCount="indefinite" />
        </rect>
      </svg>
    </div>

    <!-- Login Card -->
    <div class="login-wrapper">
      <!-- Top Logo -->
      <svg class="top-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50">
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ff2d55"/><stop offset="40%" stop-color="#e91e3a"/><stop offset="100%" stop-color="#c4122a"/></linearGradient>
          <linearGradient id="gl" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#fff" stop-opacity="0.5"/><stop offset="45%" stop-color="#fff" stop-opacity="0.1"/><stop offset="55%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.08"/></linearGradient>
          <linearGradient id="ig" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ff2d55"/><stop offset="100%" stop-color="#c4122a"/></linearGradient>
          <filter id="bs"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#c4122a" flood-opacity="0.4"/></filter>
        </defs>
        <g transform="translate(8,7)">
          <path d="M18 0 L36 18 L18 36 L0 18 Z" fill="url(#ig)" opacity="0.15"/>
          <path d="M7 26 L7 12 L12 12 L18 20 L24 12 L29 12 L29 26" fill="none" stroke="url(#ig)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="7" cy="10" r="2.8" fill="#ff2d55"/><circle cx="29" cy="10" r="2.8" fill="#e91e3a"/>
          <circle cx="18" cy="4" r="2.2" fill="#ff2d55" opacity="0.85"/>
          <path d="M13 6 Q18 1 23 6" fill="none" stroke="#ff2d55" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
          <path d="M10 8 Q18 -1 26 8" fill="none" stroke="#ff2d55" stroke-width="1.3" stroke-linecap="round" opacity="0.35"/>
        </g>
        <g class="max-spin"><text x="50" y="34" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="30" font-weight="900" fill="#111" letter-spacing="-0.5">Max</text></g>
        <g transform="translate(117,10)" filter="url(#bs)">
          <rect width="76" height="30" rx="6" fill="url(#rg)"/><rect width="76" height="15" rx="6" fill="url(#gl)"/>
          <text x="38" y="22" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="20" font-weight="900" fill="#fff" text-anchor="middle" letter-spacing="3.5">HUB</text>
        </g>
        <line x1="50" y1="39" x2="113" y2="39" stroke="#e91e3a" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
      </svg>

      <div class="login-container">
        <!-- Left: Branding -->
        <div class="login-brand">
          <div class="brand-text">
            <h1>Max HUB Admin – Trung tâm Điều hành Thông minh</h1>
            <p>Công cụ quản trị hiện đại dành riêng cho Admin, tích hợp các tính năng thông minh giúp theo dõi, phân tích và tối ưu hóa trải nghiệm người dùng trên hệ sinh thái Max HUB.</p>
          </div>
          <img :src="loginBgUrl" alt="" class="brand-illustration" />
        </div>

        <!-- Right: Form -->
        <div class="login-form-panel">
          <span class="form-title">Đăng nhập</span>

          <form @submit.prevent="handleLogin">
            <div class="input-group">
              <i class="icon layui-icon">&#xe770;</i>
              <input v-model="loginForm.email" type="text" class="login-input" placeholder="Email" autocomplete="off" />
            </div>
            <div class="input-group">
              <i class="icon layui-icon">&#xe673;</i>
              <input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" class="login-input" placeholder="Mật khẩu" autocomplete="off" @keyup.enter="handleLogin" />
              <i class="icon-suffix layui-icon" @click="showPassword = !showPassword">{{ showPassword ? '\ue696' : '\ue695' }}</i>
            </div>
            <div v-if="captchaRequired" class="captcha-row">
              <div class="input-group captcha-input-wrap">
                <i class="icon layui-icon">&#xe672;</i>
                <input v-model="loginForm.captchaAnswer" type="text" class="login-input" placeholder="Mã xác nhận" autocomplete="off" />
              </div>
              <div class="captcha-img" @click="loadCaptcha">
                <div v-if="captchaSvg" v-html="captchaSvg"></div>
                <span v-else class="captcha-placeholder">Tải...</span>
              </div>
            </div>
            <label class="remember-row">
              <input v-model="loginForm.remember" type="checkbox" /> <span>Ghi nhớ mật khẩu</span>
            </label>
            <button type="submit" class="login-btn" :disabled="loginLoading">
              <span v-if="loginLoading" class="btn-spinner"></span>
              {{ loginLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
            </button>
          </form>

          <div class="login-divider"><span>Đăng nhập bằng</span></div>
          <div class="social-row">
            <div class="social-item">
              <img :src="iconZalo" alt="Zalo" />
              <span>Zalo</span>
            </div>
            <div class="social-item">
              <img :src="iconFacebook" alt="Facebook" />
              <span>Facebook</span>
            </div>
            <div class="social-item">
              <img :src="iconTelegram" alt="Telegram" />
              <span>Telegram</span>
            </div>
            <div class="social-item">
              <img :src="iconDiscord" alt="Discord" />
              <span>Discord</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { layer } from "@layui/layui-vue";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/api/client";
import loginBgUrl from "@/assets/login/login-bg.svg";
import iconZalo from "@/assets/login/social/icon-zalo.svg";
import iconFacebook from "@/assets/login/social/icon-facebook.png";
import iconTelegram from "@/assets/login/social/icon-telegram.png";
import iconDiscord from "@/assets/login/social/icon-discord.png";

const router = useRouter();
const authStore = useAuthStore();

const showPassword = ref(false);
const loginLoading = ref(false);
const captchaRequired = ref(false);
const captchaSvg = ref("");
const captchaId = ref("");

const loginForm = reactive({
  email: "",
  password: "",
  captchaAnswer: "",
  remember: false,
});

async function loadCaptcha() {
  try {
    const res = await api.get("/auth/captcha");
    if (res.data.code === 0) {
      captchaSvg.value = res.data.data.captchaSvg;
      captchaId.value = res.data.data.captchaId;
    }
  } catch {
    // ignore
  }
}

async function handleLogin() {
  if (!loginForm.email || !loginForm.password) {
    layer.msg("Vui lòng nhập tài khoản và mật khẩu", { icon: 2, time: 2000 });
    return;
  }
  if (captchaRequired.value && !loginForm.captchaAnswer) {
    layer.msg("Vui lòng nhập mã xác nhận", { icon: 2, time: 2000 });
    return;
  }

  loginLoading.value = true;

  try {
    await authStore.login(loginForm.email, loginForm.password);
    layer.msg("Đăng nhập thành công!", { icon: 1, time: 1500 });
    setTimeout(() => router.push("/agent/welcome"), 500);
  } catch (err: any) {
    const data = err.response?.data;
    if (data?.error === "CAPTCHA_REQUIRED" || data?.error === "CAPTCHA_INVALID") {
      captchaRequired.value = true;
      loginForm.captchaAnswer = "";
      loadCaptcha();
    }
    layer.msg(data?.msg || err.message || "Đăng nhập thất bại", { icon: 2, time: 2500 });
  } finally {
    loginLoading.value = false;
  }
}
</script>

<style lang="less" scoped>
/* ── Page ── */
.login-page {
  position: relative; width: 100vw; height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #e8e0d4 0%, #d4c9b8 100%);
  overflow: hidden;
}

/* ── Canvas Texture ── */
.canvas-texture {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect width='6' height='6' fill='%23000' fill-opacity='0.04'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23000' fill-opacity='0.06'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23000' fill-opacity='0.06'/%3E%3Crect x='1' y='4' width='1' height='1' fill='%23fff' fill-opacity='0.04'/%3E%3Crect x='4' y='1' width='1' height='1' fill='%23fff' fill-opacity='0.04'/%3E%3C/svg%3E");
}

/* ── Animated BG ── */
.login-bg {
  position: absolute; inset: 0; z-index: 0;
  :deep(svg) { width: 100%; height: 100%; }
}

/* ── Card Wrapper ── */
.login-wrapper {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; align-items: center;
}

/* ── Top Logo ── */
.top-logo {
  height: 90px; margin-bottom: 24px;
  filter: drop-shadow(0 4px 14px rgba(0,0,0,0.25));
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect width='6' height='6' fill='%23000' fill-opacity='0.03'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23000' fill-opacity='0.05'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23000' fill-opacity='0.05'/%3E%3C/svg%3E"),
    linear-gradient(135deg, #f5f0e8 0%, #ece4d6 100%);
  padding: 10px 16px;
  border-radius: 10px;
}
.max-spin {
  transform-origin: 78px 22px;
  animation: maxSpin 6s ease-in-out infinite;
}
@keyframes maxSpin {
  0%   { transform: rotate(0deg); }
  8%   { transform: rotate(2160deg); }
  12%  { transform: rotate(2160deg); }
  100% { transform: rotate(2160deg); }
}

/* ── Card ── */
.login-container {
  position: relative;
  display: flex;
  width: 920px; min-height: 480px; border-radius: 10px; overflow: hidden;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect width='6' height='6' fill='%23000' fill-opacity='0.03'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23000' fill-opacity='0.05'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23000' fill-opacity='0.05'/%3E%3Crect x='1' y='4' width='1' height='1' fill='%23fff' fill-opacity='0.03'/%3E%3Crect x='4' y='1' width='1' height='1' fill='%23fff' fill-opacity='0.03'/%3E%3C/svg%3E"),
    rgba(250,245,237,0.92);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08);
}

/* ── Left Brand ── */
.login-brand {
  flex: 1;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect width='6' height='6' fill='%23000' fill-opacity='0.06'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23000' fill-opacity='0.08'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23000' fill-opacity='0.08'/%3E%3Crect x='1' y='4' width='1' height='1' fill='%23fff' fill-opacity='0.05'/%3E%3Crect x='4' y='1' width='1' height='1' fill='%23fff' fill-opacity='0.05'/%3E%3C/svg%3E"),
    linear-gradient(160deg, #0f9b8e 0%, #0a7d72 100%);
  padding: 36px 30px 20px;
  display: flex; flex-direction: column; color: #fff;
}
.brand-text h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
.brand-text p { font-size: 13px; opacity: 0.85; line-height: 1.6; }
.brand-illustration {
  margin-top: auto; width: 100%; max-height: 300px;
  object-fit: contain; object-position: bottom;
}

/* ── Right Form ── */
.login-form-panel {
  flex: 1; padding: 28px 36px;
  display: flex; flex-direction: column; overflow-y: auto;
}
.form-title { font-size: 22px; font-weight: 600; color: #333; margin-bottom: 20px; }

/* ── Inputs ── */
.input-group {
  position: relative; margin-bottom: 16px;
  .icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    z-index: 2; font-size: 22px; color: #999; line-height: 1;
    -webkit-font-smoothing: antialiased;
    padding-right: 10px; border-right: 1px solid #ddd;
  }
  .icon-suffix {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    z-index: 2; font-size: 22px; color: #999; cursor: pointer; line-height: 1;
    -webkit-font-smoothing: antialiased;
    &:hover { color: #16baaa; }
  }
}
.login-input {
  width: 100%; height: 42px; padding: 0 36px 0 48px;
  border: 1px solid #ddd; border-radius: 4px; font-size: 14px;
  outline: none; transition: border-color 0.2s; background: #fff;
  &:focus { border-color: #16baaa; }
  &::placeholder { color: #bbb; }
}

/* ── Captcha ── */
.captcha-row { display: flex; gap: 10px; margin-bottom: 16px; }
.captcha-input-wrap { flex: 1; margin-bottom: 0; }
.captcha-img {
  flex-shrink: 0; width: 110px; height: 42px;
  border: 1px solid #ddd; border-radius: 4px; overflow: hidden; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  &:hover { border-color: #16baaa; }
  :deep(svg) { width: 100%; height: 100%; }
}
.captcha-placeholder { font-size: 12px; color: #999; }

/* ── Remember ── */
.remember-row {
  display: flex; align-items: center; gap: 6px;
  margin: 4px 0 18px; font-size: 13px; color: #666; cursor: pointer;
  input { accent-color: #16baaa; width: 15px; height: 15px; }
}

/* ── Button ── */
.login-btn {
  width: 100%; height: 44px; border: none; border-radius: 4px;
  background: linear-gradient(135deg, #16baaa 0%, #13a89a 100%);
  color: #fff; font-size: 16px; font-weight: 500; letter-spacing: 2px;
  cursor: pointer; transition: all 0.25s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  &:hover { background: linear-gradient(135deg, #13a89a 0%, #0f9b8e 100%); }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
}

.btn-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Divider ── */
.login-divider {
  display: flex; align-items: center; margin: 20px 0; color: #aaa; font-size: 12px;
  &::before, &::after { content: ''; flex: 1; height: 1px; background: #e8e8e8; }
  span { padding: 0 12px; white-space: nowrap; }
}

/* ── Social ── */
.social-row { display: flex; justify-content: center; gap: 28px; }
.social-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer; transition: transform 0.2s;
  &:hover { transform: translateY(-2px); }
  img { width: 32px; height: 32px; }
  span { font-size: 11px; color: #888; }
}

/* ── Responsive ── */
@media (max-width: 960px) {
  .login-container { width: calc(100vw - 24px); flex-direction: column; min-height: auto; max-height: calc(100vh - 80px); }
  .login-brand { flex: 0 0 auto; padding: 24px 20px; }
  .brand-illustration { max-height: 140px; }
  .top-logo { height: 56px; margin-bottom: 16px; }
}
@media (max-width: 600px) {
  .login-brand { display: none; }
  .login-form-panel { padding: 24px 20px; }
  .top-logo { height: 48px; margin-bottom: 12px; }
}
</style>

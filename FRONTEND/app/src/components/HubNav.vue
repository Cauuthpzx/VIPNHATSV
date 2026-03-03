<script setup lang="ts">
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { layer } from "@layui/layui-vue";

const { t } = useI18n();
const router = useRouter();
const store = useAppStore();
const authStore = useAuthStore();

async function onAction(action: string) {
  if (action === "profile") {
    router.push("/agent/profile");
  } else if (action === "settings") {
    layer.msg(t("nav.settingsWip"), { icon: 0 });
  } else if (action === "logout") {
    store.closeAllTabs();
    await authStore.logout();
    router.push("/login");
  }
}
</script>

<template>
  <lay-dropdown trigger="hover" placement="bottom-end">
    <a href="javascript:;" class="header-account-trigger">
      <span class="header-avatar">{{ store.username?.charAt(0)?.toUpperCase() }}</span>
      <span>{{ store.username }}</span>
      <svg
        class="header-account-arrow"
        xmlns="http://www.w3.org/2000/svg"
        width="25"
        height="25"
        viewBox="0 0 24 24"
      >
        <path d="m7 10 5 5 5-5z" fill="currentColor" />
      </svg>
    </a>
    <template #content>
      <div class="header-account-panel">
        <div class="header-account-item" @click="onAction('profile')">
          <i class="layui-icon layui-icon-username" />
          <span>{{ t("nav.profile") }}</span>
        </div>
        <div class="header-account-item" @click="onAction('settings')">
          <i class="layui-icon layui-icon-set" />
          <span>{{ t("nav.settings") }}</span>
        </div>
        <div class="header-account-divider" />
        <div class="header-account-item" @click="onAction('logout')">
          <i class="layui-icon layui-icon-logout" />
          <span>{{ t("nav.logout") }}</span>
        </div>
      </div>
    </template>
  </lay-dropdown>
</template>

<style scoped>
.header-account-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 50px;
  padding: 0 15px;
  color: #666;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.header-account-trigger:hover {
  background: #f6f6f6;
}

.header-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #009688;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-account-arrow {
  flex-shrink: 0;
  transform: rotate(-90deg);
  transition: transform 0.3s;
}

.header-account-trigger:hover .header-account-arrow {
  transform: rotate(0deg);
}

.header-account-panel {
  min-width: 180px;
  padding: 5px 0;
  background: #fff;
}

.header-account-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.header-account-item:hover {
  background: #f6f6f6;
  color: #009688;
}

.header-account-item .layui-icon {
  font-size: 16px;
}

.header-account-divider {
  margin: 5px 0;
  border-top: 1px solid #eee;
}
</style>

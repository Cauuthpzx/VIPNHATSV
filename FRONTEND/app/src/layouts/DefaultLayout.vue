<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import HubNav from "@/components/HubNav.vue";
import HubNotification from "@/components/HubNotification.vue";
import { useNotificationStore } from "@/stores/notification";
import LayoutSidebar from "./LayoutSidebar.vue";
import LayoutTabs from "./LayoutTabs.vue";

const router = useRouter();
const route = useRoute();
const store = useAppStore();

const sideWidth = computed(() => (store.collapsed ? 60 : 200));

function handleRefresh() {
  router.go(0);
}

// Seed demo notifications on first visit
const notificationStore = useNotificationStore();
notificationStore.seedDemoIfEmpty();
</script>

<template>
  <div class="layui-layout layui-layout-admin">
    <!-- ===== SIDEBAR ===== -->
    <LayoutSidebar />

    <!-- ===== HEADER ===== -->
    <lay-header class="admin-header" :style="{ left: sideWidth + 'px' }">
      <div class="admin-header-left">
        <a href="javascript:;" @click="store.toggleCollapse()" :title="store.collapsed ? 'Mở rộng' : 'Kéo sang bên'">
          <i class="layui-icon" :class="store.collapsed ? 'layui-icon-spread-left' : 'layui-icon-shrink-right'"></i>
        </a>
        <a href="javascript:;" @click="handleRefresh" title="Làm mới trang">
          <i class="layui-icon layui-icon-refresh-3"></i>
        </a>
      </div>
      <div class="admin-header-right">
        <HubNotification />
        <HubNav />
      </div>
    </lay-header>

    <!-- ===== TABS ===== -->
    <LayoutTabs :side-width="sideWidth" />

    <!-- ===== BODY ===== -->
    <div class="layui-body" :style="{ left: sideWidth + 'px' }">
      <div class="layadmin-tabsbody-item layui-show">
        <router-view v-slot="{ Component }">
          <transition name="page-upbit" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style>
/* Header */
.layui-layout-admin > .admin-header.layui-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  height: 50px;
  background: #fff;
  border-bottom: 1px solid #f6f6f6;
  transition: left 0.3s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.admin-header-left {
  display: flex;
  align-items: center;
  height: 50px;
}

.admin-header-left > a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  color: #666;
  text-decoration: none;
  transition: background 0.2s;
}

.admin-header-left > a:hover {
  background: #f6f6f6;
}

.admin-header-left > a .layui-icon {
  font-size: 16px;
}

.admin-header-right {
  height: 50px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 50px;
}

/* Body */
.layui-layout-admin > .layui-body {
  position: fixed;
  top: 90px;
  right: 0;
  bottom: 0;
  height: auto;
  min-height: 0;
  z-index: 998;
  overflow-y: auto;
  overflow-x: hidden;
  background: #f2f2f2;
  transition: left 0.3s;
}

.layadmin-tabsbody-item {
  padding: 15px;
}

/* Page transition */
.page-upbit-enter-active {
  animation: page-upbit-anim 0.3s ease-out;
}

.page-upbit-leave-active {
  animation: page-upbit-anim 0.2s ease-in reverse;
}

@keyframes page-upbit-anim {
  from {
    opacity: 0;
    transform: translate3d(0, 30px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
</style>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import HubNav from "@/components/HubNav.vue";
import HubNotification from "@/components/HubNotification.vue";
import { useNotificationStore } from "@/stores/notification";
import { useWsBus } from "@/composables/useWsBus";
import LayoutSidebar from "./LayoutSidebar.vue";
import LayoutTabs from "./LayoutTabs.vue";

const router = useRouter();
const route = useRoute();
const store = useAppStore();

// Skip page transition lần đầu load — tránh nhấp nháy opacity 0→1
const transitionReady = ref(false);
const authStore = useAuthStore();

const sideWidth = computed(() => (store.collapsed ? 60 : 200));

function handleRefresh() {
  router.go(0);
}

// Notification polling (API-backed)
const notificationStore = useNotificationStore();
const wsBus = useWsBus();

// WebSocket for real-time notifications
const ws = ref<WebSocket | null>(null);

function connectWs() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const socket = new WebSocket(`${protocol}//${host}/ws`);

  socket.addEventListener("open", () => {
    if (authStore.accessToken) {
      socket.send(JSON.stringify({ type: "auth", token: authStore.accessToken }));
    }
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      // Dispatch tất cả WS messages vào bus cho mọi component lắng nghe
      if (data.type) wsBus.emit(data);
      // Notification riêng
      if (data.type === "notifications") {
        notificationStore.onWsNotification();
      }
    } catch {
      // ignore non-JSON messages
    }
  });

  socket.addEventListener("close", () => {
    setTimeout(() => {
      if (ws.value === socket) connectWs();
    }, 5000);
  });

  ws.value = socket;
}

onMounted(() => {
  notificationStore.startPolling();
  connectWs();
  // Bật transition sau frame đầu tiên — lần đầu render không animate
  nextTick(() => { transitionReady.value = true; });
});

onBeforeUnmount(() => {
  notificationStore.stopPolling();
  if (ws.value) {
    ws.value.close();
    ws.value = null;
  }
});
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
          <transition :name="transitionReady ? 'page-upbit' : ''" mode="out-in">
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
  background: var(--bg-texture-image), var(--bg-color);
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

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useAgentStore } from "@/stores/agent";
import { menuData } from "@/config/menu";
import HubNav from "@/components/HubNav.vue";

const router = useRouter();
const route = useRoute();
const store = useAppStore();
const agentStore = useAgentStore();

// Key counter to force re-render when agent changes
const pageKey = ref(0);

onMounted(() => {
  agentStore.loadAgents();
});

function onAgentChange(agentId: string) {
  agentStore.selectAgent(agentId);
  // Force re-render all child pages so they reload data with new agent
  pageKey.value++;
}

const openKeys = ref<string[]>([]);
const selectedKey = computed({
  get() {
    for (const group of menuData) {
      for (const child of group.children) {
        if (child.path === route.path) return child.id;
      }
    }
    return "";
  },
  set(val: string) {
    onMenuClick(val);
  },
});

function onMenuClick(childId: string) {
  for (const group of menuData) {
    const child = group.children.find((c) => c.id === childId);
    if (child) {
      store.addTab({ title: child.title, path: child.path, closable: true });
      router.push(child.path);
      return;
    }
  }
}

function onTabClick(path: string) {
  store.activeTab = path;
  router.push(path);
}

function onTabClose(path: string, e: Event) {
  e.stopPropagation();
  const oldActive = store.activeTab;
  store.removeTab(path);
  if (oldActive === path) {
    router.push(store.activeTab);
  }
}

function handleRefresh() {
  router.go(0);
}

const sideWidth = computed(() => (store.collapsed ? 60 : 200));


// Tabs scroll
const tabsInner = ref<HTMLElement>();
function scrollLeft() {
  if (tabsInner.value) tabsInner.value.scrollLeft -= 200;
}
function scrollRight() {
  if (tabsInner.value) tabsInner.value.scrollLeft += 200;
}

const showTabMenu = ref(false);
function toggleTabMenu() {
  showTabMenu.value = !showTabMenu.value;
}
function closeTabMenu() {
  showTabMenu.value = false;
}
</script>

<template>
  <div class="layui-layout layui-layout-admin">
    <!-- ===== SIDEBAR ===== -->
    <div
      class="layui-side layui-side-menu"
      :style="{ width: sideWidth + 'px' }"
    >
      <div class="layui-side-scroll">
        <div class="layui-logo">
          <div v-show="!store.collapsed" class="logo-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" width="200" height="50">
              <defs>
                <linearGradient id="redGloss" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#ff2d55"/><stop offset="40%" stop-color="#e91e3a"/><stop offset="100%" stop-color="#c4122a"/>
                </linearGradient>
                <linearGradient id="gloss" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/><stop offset="45%" stop-color="#ffffff" stop-opacity="0.1"/>
                  <stop offset="55%" stop-color="#ffffff" stop-opacity="0"/><stop offset="100%" stop-color="#000000" stop-opacity="0.08"/>
                </linearGradient>
                <linearGradient id="iconGloss" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#ff2d55"/><stop offset="100%" stop-color="#c4122a"/>
                </linearGradient>
                <filter id="badgeShadow"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#c4122a" flood-opacity="0.4"/></filter>
              </defs>
              <g transform="translate(8, 7)">
                <path d="M18 0 L36 18 L18 36 L0 18 Z" fill="url(#iconGloss)" opacity="0.15"/>
                <path d="M7 26 L7 12 L12 12 L18 20 L24 12 L29 12 L29 26" fill="none" stroke="url(#iconGloss)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="7" cy="10" r="2.8" fill="#ff2d55"/><circle cx="29" cy="10" r="2.8" fill="#e91e3a"/>
                <circle cx="18" cy="4" r="2.2" fill="#ff2d55" opacity="0.85"/>
                <path d="M13 6 Q18 1 23 6" fill="none" stroke="#ff2d55" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
                <path d="M10 8 Q18 -1 26 8" fill="none" stroke="#ff2d55" stroke-width="1.3" stroke-linecap="round" opacity="0.35"/>
              </g>
              <g class="max-spin-group">
                <text x="82" y="34" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="30" font-weight="900" fill="#ffffff" letter-spacing="-0.5" text-anchor="middle">Max</text>
              </g>
              <g transform="translate(117, 10)" filter="url(#badgeShadow)">
                <rect x="0" y="0" width="76" height="30" rx="6" fill="url(#redGloss)"/>
                <rect x="0" y="0" width="76" height="15" rx="6" fill="url(#gloss)"/>
                <text x="38" y="22" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3.5">HUB</text>
              </g>
              <line x1="52" y1="39" x2="113" y2="39" stroke="#e91e3a" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
            </svg>
          </div>
          <div v-show="store.collapsed" class="logo-collapsed">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36" class="logo-m-spin">
              <defs>
                <linearGradient id="iconGlossSmall" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#ff2d55"/><stop offset="100%" stop-color="#c4122a"/>
                </linearGradient>
              </defs>
              <path d="M18 0 L36 18 L18 36 L0 18 Z" fill="url(#iconGlossSmall)" opacity="0.15"/>
              <path d="M7 26 L7 12 L12 12 L18 20 L24 12 L29 12 L29 26" fill="none" stroke="url(#iconGlossSmall)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="7" cy="10" r="2.8" fill="#ff2d55"/><circle cx="29" cy="10" r="2.8" fill="#e91e3a"/>
              <circle cx="18" cy="4" r="2.2" fill="#ff2d55" opacity="0.85"/>
              <path d="M13 6 Q18 1 23 6" fill="none" stroke="#ff2d55" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
            </svg>
          </div>
        </div>
        <lay-menu
          v-model:selected-key="selectedKey"
          v-model:open-keys="openKeys"
          :tree="true"
          :collapse="store.collapsed"
          theme="dark"
        >
          <lay-sub-menu
            v-for="group in menuData"
            :key="group.id"
            :id="group.id"
          >
            <template #icon>
              <i :class="['layui-icon', group.icon]"></i>
            </template>
            <template #title>{{ group.title }}</template>
            <lay-menu-item
              v-for="child in group.children"
              :key="child.id"
              :id="child.id"
            >
              <template #title>{{ child.title }}</template>
            </lay-menu-item>
          </lay-sub-menu>
        </lay-menu>
      </div>
    </div>

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
        <div class="agent-selector">
          <i class="layui-icon layui-icon-group"></i>
          <lay-select
            v-model="agentStore.selectedAgentId"
            :style="{ width: '180px' }"
            size="sm"
            @change="onAgentChange"
          >
            <lay-select-option value="" label="Mặc định (tự động)" />
            <lay-select-option
              v-for="agent in agentStore.activeAgents"
              :key="agent.id"
              :value="agent.id"
              :label="agent.name"
            />
          </lay-select>
        </div>
        <HubNav />
      </div>
    </lay-header>

    <!-- ===== TABS ===== -->
    <div class="layadmin-pagetabs" :style="{ left: sideWidth + 'px' }">
      <div class="layui-icon layadmin-tabs-control layui-icon-prev" @click="scrollLeft"></div>
      <div class="layui-icon layadmin-tabs-control layui-icon-next" @click="scrollRight"></div>
      <div class="layui-icon layadmin-tabs-control layui-icon-down" @click="toggleTabMenu">
        <ul v-show="showTabMenu" class="layadmin-tabs-select" @mouseleave="closeTabMenu">
          <li><a href="javascript:;" @click="onTabClose(store.activeTab, $event)">Đóng trang hiện đang đánh dấu</a></li>
          <li><a href="javascript:;" @click="store.closeOtherTabs(); closeTabMenu()">Đóng trang đánh dấu khác</a></li>
          <li><a href="javascript:;" @click="store.closeAllTabs(); router.push(store.activeTab); closeTabMenu()">Đóng toàn bộ trang đánh dấu</a></li>
        </ul>
      </div>
      <div class="layui-tab" ref="tabsInner">
        <ul class="layui-tab-title">
          <li
            v-for="tab in store.tabs"
            :key="tab.path"
            :class="{ 'layui-this': store.activeTab === tab.path }"
            @click="onTabClick(tab.path)"
          >
            <svg v-if="!tab.closable" class="tab-home-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M4 10h3v7H4zm6.5 0h3v7h-3zM2 19h20v3H2zm15-9h3v7h-3zm-5-9L2 6v2h20V6z" fill="currentColor"/></svg>
            <template v-else>{{ tab.title }}</template>
            <i
              v-if="tab.closable"
              class="layui-icon layui-tab-close"
              @click="onTabClose(tab.path, $event)"
            >&#x1006;</i>
          </li>
        </ul>
      </div>
    </div>

    <!-- ===== BODY ===== -->
    <div class="layui-body" :style="{ left: sideWidth + 'px' }">
      <div class="layadmin-tabsbody-item layui-show">
        <router-view v-slot="{ Component }">
          <transition name="page-upbit" mode="out-in">
            <component :is="Component" :key="`${route.path}-${pageKey}`" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style>
/* ===== LAYUI-ADMIN LAYOUT ===== */

/* Sidebar - set CSS variables for nav theming (source uses these) */
.layui-side-menu {
  --nav-bg-color: #20222a;
  --nav-text-color: rgba(255, 255, 255, 0.7);
  --nav-text-color-active: #fff;
  --nav-child-bg-color: #191b20;
  --nav-active-bg-color: #009688;

  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1001;
  background: var(--nav-bg-color);
  overflow: hidden;
  transition: width 0.3s;
  box-shadow: 1px 0 2px 0 rgba(0, 0, 0, 0.05);
}

.layui-side-menu .layui-side-scroll {
  position: relative;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.layui-side-menu .layui-side-scroll::-webkit-scrollbar {
  width: 0;
}

.layui-side-menu .layui-logo {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--nav-bg-color);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.layui-side-menu .layui-logo .logo-full {
  display: flex;
  align-items: center;
  justify-content: center;
}

.layui-side-menu .layui-logo .logo-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
}

.layui-side-menu .layui-logo .logo-m-spin {
  animation: logo-spin 3s linear infinite;
}

.layui-side-menu .layui-logo .max-spin-group {
  transform-origin: 82px 25px;
  animation: max-text-spin 3s linear infinite;
}

@keyframes logo-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes max-text-spin {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}

/* Sidebar menu - no !important needed, source reads CSS variables */
.layui-side-menu .layui-nav {
  padding: 0;
}

.layui-side-menu .layui-nav .layui-nav-item > a {
  height: 50px;
  line-height: 50px;
  font-size: 14px;
  transition: all 0.3s;
}

.layui-side-menu .layui-nav-tree .layui-nav-child {
  padding: 0;
}

.layui-side-menu .layui-nav-tree .layui-nav-child dd a {
  padding-left: 50px;
  height: 40px;
  line-height: 40px;
  font-size: 14px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.layui-side-menu .layui-nav-tree .layui-nav-child dd a > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.layui-side-menu .layui-nav-bar {
  display: none;
}

.layui-side-menu .layui-sub-menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
}

.layui-side-menu .layui-sub-menu-icon .layui-icon {
  font-size: 16px;
}

/* Sidebar collapsed state — center icons */
.layui-side-menu .layui-nav-tree.layui-nav-collapse {
  width: 60px;
}

.layui-side-menu .layui-nav-tree.layui-nav-collapse .layui-nav-item > a {
  padding: 0;
  text-align: center;
  height: 50px;
  line-height: 50px;
}

.layui-side-menu .layui-nav-tree.layui-nav-collapse .layui-sub-menu-icon {
  margin: 0;
  width: 60px;
  text-align: center;
}

.layui-side-menu .layui-nav-tree.layui-nav-collapse .layui-sub-menu-icon .layui-icon {
  font-size: 18px;
}

/* Header - uses <lay-header> component, override height to 50px */
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
  margin-right: 50px;
  gap: 4px;
}

.agent-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 50px;
  border-right: 1px solid #f2f2f2;
}

.agent-selector .layui-icon {
  font-size: 16px;
  color: #666;
}


/* Tabs */
.layadmin-pagetabs {
  position: fixed;
  top: 50px;
  right: 0;
  z-index: 999;
  height: 40px;
  line-height: 40px;
  padding: 0 80px 0 40px;
  background: #fff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
  transition: left 0.3s;
}

.layadmin-tabs-control {
  position: absolute;
  top: 0;
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: background 0.2s;
}

.layadmin-tabs-control:hover {
  background: #f6f6f6;
}

.layadmin-tabs-control.layui-icon-prev {
  left: 0;
  border-right: 1px solid #f2f2f2;
}

.layadmin-tabs-control.layui-icon-next {
  right: 40px;
  border-left: 1px solid #f2f2f2;
}

.layadmin-tabs-control.layui-icon-down {
  right: 0;
  border-left: 1px solid #f2f2f2;
}

.layadmin-tabs-select {
  position: absolute;
  top: 40px;
  right: 0;
  background: #fff;
  border: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  min-width: 200px;
  list-style: none;
  padding: 5px 0;
  margin: 0;
  z-index: 9999;
}

.layadmin-tabs-select li a {
  display: block;
  padding: 8px 20px;
  color: #333;
  font-size: 13px;
  text-decoration: none;
  white-space: nowrap;
  font-style: normal;
}

.layadmin-tabs-select li a:hover {
  background: #f6f6f6;
  color: #009688;
}

.layadmin-pagetabs .layui-tab {
  margin: 0;
  overflow-x: auto;
  overflow-y: hidden;
  height: 40px;
}

.layadmin-pagetabs .layui-tab::-webkit-scrollbar {
  display: none;
}

.layadmin-pagetabs .layui-tab-title {
  display: flex;
  border: none;
  height: 40px;
  white-space: nowrap;
  list-style: none;
  margin: 0;
  padding: 0;
}

.layadmin-pagetabs .layui-tab-title li {
  display: inline-flex;
  align-items: center;
  height: 40px;
  line-height: 40px;
  padding: 0 15px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  border-right: 1px solid #f2f2f2;
  position: relative;
  gap: 5px;
  transition: background 0.2s;
}

.layadmin-pagetabs .layui-tab-title li:hover {
  background: #f6f6f6;
}

.layadmin-pagetabs .layui-tab-title li.layui-this {
  color: #000;
  background: #fff;
}

.layadmin-pagetabs .layui-tab-title li.layui-this::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #5fb878;
}

.layadmin-pagetabs .layui-tab-close {
  font-size: 12px;
  color: #999;
  cursor: pointer;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-style: normal;
}

.layadmin-pagetabs .layui-tab-close:hover {
  background: #ff5722;
  color: #fff;
}

.layadmin-pagetabs .layui-tab-title li:has(.tab-home-icon) {
  justify-content: center;
  padding: 0 10px;
}

.tab-home-icon {
  display: block;
}

/* Body */
.layui-layout-admin > .layui-body {
  position: fixed;
  top: 90px;
  right: 0;
  bottom: 0;
  z-index: 998;
  overflow-y: auto;
  overflow-x: hidden;
  background: #f2f2f2;
  transition: left 0.3s;
}

.layadmin-tabsbody-item {
  padding: 15px;
}

/* Page transition - layui-anim-upbit style */
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

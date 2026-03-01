<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import { menuData } from "@/config/menu";

const router = useRouter();
const route = useRoute();
const store = useAppStore();

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

// Account nav
const accountSelectedKey = ref("");
function onAccountSelect(key: string) {
  if (key === "edit-password") {
    router.push("/agent/edit-password");
  } else if (key === "edit-fund-password") {
    router.push("/agent/edit-fund-password");
  } else if (key === "logout") {
    store.closeAllTabs();
    router.push("/login");
  }
  accountSelectedKey.value = "";
}

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
        <div class="layui-logo" v-show="!store.collapsed">
          <span>Hệ thống quản lí</span>
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
      <ul class="layui-nav layui-layout-left">
        <li class="layui-nav-item layadmin-flexible" @click="store.toggleCollapse()">
          <a href="javascript:;" :title="store.collapsed ? 'Mở rộng' : 'Kéo sang bên'">
            <i class="layui-icon" :class="store.collapsed ? 'layui-icon-spread-left' : 'layui-icon-shrink-right'"></i>
          </a>
        </li>
        <li class="layui-nav-item" @click="handleRefresh">
          <a href="javascript:;" title="Làm mới trang">
            <i class="layui-icon layui-icon-refresh-3"></i>
          </a>
        </li>
      </ul>
      <ul class="layui-nav layui-layout-right">
        <lay-menu
          v-model:selected-key="accountSelectedKey"
          @change-selected-key="onAccountSelect"
        >
          <lay-sub-menu id="account">
            <template #icon><i class="layui-icon layui-icon-user"></i></template>
            <template #title>{{ store.username }}</template>
            <lay-menu-item id="edit-password">
              <template #title>Đổi mật khẩu đăng nhập</template>
            </lay-menu-item>
            <lay-menu-item id="edit-fund-password">
              <template #title>Đổi mật khẩu giao dịch</template>
            </lay-menu-item>
            <lay-menu-item id="logout">
              <template #icon><i class="layui-icon layui-icon-logout"></i></template>
              <template #title>Đăng xuất</template>
            </lay-menu-item>
          </lay-sub-menu>
        </lay-menu>
      </ul>
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
            <i v-if="!tab.closable" class="layui-icon layui-icon-home"></i>
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
            <component :is="Component" :key="route.path" />
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
  height: 50px;
  line-height: 50px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  font-weight: 300;
  padding: 0 15px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  overflow: hidden;
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
}

.layui-side-menu .layui-nav-bar {
  display: none;
}

.layui-side-menu .layui-sub-menu-icon {
  display: inline-block;
  width: 20px;
  margin-right: 10px;
  text-align: center;
}

.layui-side-menu .layui-nav-more {
  transition: transform 0.3s;
}

.layui-side-menu .layui-nav-mored {
  transform: rotate(180deg);
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
  font-size: 18px;
  text-align: center;
}

/* Header - uses <lay-header> component, override height to 50px */
.layui-layout-admin > .admin-header.layui-header {
  --nav-bg-color: transparent;
  --nav-text-color: #666;
  --nav-text-color-active: #666;

  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  height: 50px;
  background: #fff;
  border-bottom: 1px solid #f6f6f6;
  transition: left 0.3s;
}

.admin-header .layui-layout-left {
  position: absolute;
  left: 0;
  top: 0;
  height: 50px;
  line-height: 50px;
  padding: 0 10px;
  background: transparent;
}

.admin-header .layui-nav .layui-nav-item {
  line-height: 50px;
}

.admin-header .layui-nav .layui-nav-item > a {
  font-size: 14px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  height: 50px;
  text-decoration: none;
}

.admin-header .layui-nav .layui-nav-item > a:hover {
  background: #f6f6f6;
}

.admin-header .layui-nav .layui-nav-item > a .layui-icon {
  font-size: 16px;
}

.admin-header .layui-nav .layui-nav-bar {
  display: none;
}

.admin-header .layui-layout-right {
  position: absolute;
  right: 0;
  top: 0;
  height: 50px;
  line-height: 50px;
  padding: 0;
  list-style: none;
  margin: 0;
}

.admin-header .layui-layout-right .layui-nav {
  background: transparent;
  padding: 0;
}

.admin-header .layui-layout-right .layui-nav .layui-nav-item > a {
  height: 50px;
  line-height: 50px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

.admin-header .layui-layout-right .layui-nav .layui-nav-item > a cite {
  font-style: normal;
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

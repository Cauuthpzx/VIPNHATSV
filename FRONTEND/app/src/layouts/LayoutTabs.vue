<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useTabsSlider } from "@/composables/useSidebarSlider";

const router = useRouter();
const store = useAppStore();

defineProps<{ sideWidth: number }>();

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

useTabsSlider();
</script>

<template>
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
</template>

<style>
/* ===== TABS ===== */
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

.layadmin-pagetabs .layui-tab-title li::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: #5fb878;
  transform: scaleX(0);
  transform-origin: var(--bar-origin, left);
  transition: transform 0.3s ease;
}

.layadmin-pagetabs .layui-tab-title li:hover::after,
.layadmin-pagetabs .layui-tab-title li.layui-this::after {
  transform: scaleX(1);
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
</style>

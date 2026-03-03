<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { menuData } from "@/config/menu";
import type { MenuItem } from "@/config/menu";
import { useSidebarSlider } from "@/composables/useSidebarSlider";

const { t } = useI18n();

const router = useRouter();
const route = useRoute();
const store = useAppStore();
const authStore = useAuthStore();

const filteredMenuData = computed<MenuItem[]>(() => {
  return menuData
    .map((group) => {
      const visibleChildren = group.children.filter((child) => {
        if (!child.permission) return true;
        return authStore.hasPermission(child.permission);
      });
      return { ...group, children: visibleChildren };
    })
    .filter((group) => {
      // Menu đơn (có path, không children): check permission trực tiếp
      if (group.path && group.children.length === 0) {
        if (!group.permission) return true;
        return authStore.hasPermission(group.permission);
      }
      return group.children.length > 0;
    });
});

const openKeys = ref<string[]>([]);
const selectedKey = computed({
  get() {
    for (const group of filteredMenuData.value) {
      // Menu đơn
      if (group.path && group.path === route.path) return group.id;
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
  for (const group of filteredMenuData.value) {
    // Menu đơn
    if (group.path && group.id === childId) {
      store.addTab({ titleKey: group.titleKey, path: group.path, closable: true });
      router.push(group.path);
      return;
    }
    const child = group.children.find((c) => c.id === childId);
    if (child) {
      store.addTab({ titleKey: child.titleKey, path: child.path, closable: true });
      router.push(child.path);
      return;
    }
  }
}

useSidebarSlider(openKeys);

defineExpose({ sideWidth: computed(() => (store.collapsed ? 60 : 200)) });
</script>

<template>
  <div
    class="layui-side layui-side-menu"
    :style="{ width: (store.collapsed ? 60 : 200) + 'px' }"
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
        <template v-for="group in filteredMenuData" :key="group.id">
          <!-- Menu đơn (không sub) -->
          <lay-menu-item
            v-if="group.path && group.children.length === 0"
            :id="group.id"
          >
            <template #icon>
              <i :class="['layui-icon', group.icon]"></i>
            </template>
            <template #title>{{ t(group.titleKey) }}</template>
          </lay-menu-item>
          <!-- Menu có sub -->
          <lay-sub-menu v-else :id="group.id">
            <template #icon>
              <i :class="['layui-icon', group.icon]"></i>
            </template>
            <template #title>{{ t(group.titleKey) }}</template>
            <lay-menu-item
              v-for="child in group.children"
              :key="child.id"
              :id="child.id"
            >
              <template #title>{{ t(child.titleKey) }}</template>
            </lay-menu-item>
          </lay-sub-menu>
        </template>
      </lay-menu>
    </div>
  </div>
</template>

<style>
/* ===== SIDEBAR ===== */
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
  position: relative;
}

.layui-side-menu .layui-logo::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #fff;
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

.layui-side-menu .layui-nav {
  padding: 0;
}

.layui-side-menu .layui-nav .layui-nav-item > a {
  height: 50px;
  line-height: 50px;
  font-size: 14px;
  position: relative;
  transition: all 0.3s;
}

.layui-side-menu .layui-nav .layui-nav-item > a::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 5px;
  height: 100%;
  border-radius: 0 3px 3px 0;
  background: #009688;
  transform: scaleY(0);
  transform-origin: var(--bar-origin, top);
  transition: transform 0.3s ease;
}

.layui-side-menu .layui-nav .layui-nav-item > a:hover::before {
  transform: scaleY(1);
}

.layui-side-menu .layui-nav-tree .layui-nav-child {
  padding: 0;
}

.layui-side-menu .layui-nav-tree .layui-nav-child .layui-nav-item a {
  padding-left: 50px;
  height: 40px;
  line-height: 40px;
  font-size: 14px;
  display: flex;
  align-items: center;
  overflow: hidden;
  position: relative;
  transition: all 0.3s;
}

.layui-side-menu .layui-nav-tree .layui-nav-child .layui-nav-item a > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.layui-side-menu .layui-nav-tree .layui-nav-child .layui-nav-item a:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.layui-side-menu .layui-nav-tree .layui-nav-child .layui-nav-item a::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 5px;
  height: 100%;
  border-radius: 0 3px 3px 0;
  background: #009688;
  transform: scaleY(0);
  transform-origin: var(--bar-origin, top);
  transition: transform 0.3s ease;
}

.layui-side-menu .layui-nav-tree .layui-nav-child .layui-nav-item a:hover::before,
.layui-side-menu .layui-nav-tree .layui-nav-child .layui-nav-item.layui-this a::before {
  transform: scaleY(1);
}

.layui-side-menu .layui-nav .layui-nav-item > a:hover {
  background: rgba(255, 255, 255, 0.05);
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
</style>

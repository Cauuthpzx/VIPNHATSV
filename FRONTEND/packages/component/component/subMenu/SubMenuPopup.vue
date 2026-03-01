<script setup lang="ts">
import type { DropdownTeleportProps } from "../dropdown/interface";

import { computed, inject, Ref } from "vue";
import LayDropdown from "../dropdown/index.vue";
import useLevel from "../menu/useLevel";

export interface SubMenuPopupProps {
  id?: string;
  title?: string;
  teleportProps?: DropdownTeleportProps;
}

defineOptions({
  name: "SubMenuPopup",
});

const props = defineProps<SubMenuPopupProps>();

const { level } = useLevel();
const isTree: Ref<boolean> = inject("isTree") as Ref<boolean>;
const theme = inject("menuTheme") as Ref<string>;

const computedTheme = computed(() => {
  return theme.value === "light" ? "-light" : "";
});

const isExpandDown = computed(() => {
  if (isTree.value) return false;
  return level.value === 2;
});

const computedPlacement = computed(() => {
  return !isTree.value && level.value === 2 ? "bottom" : "right-start";
});
</script>

<template>
  <lay-dropdown
    trigger="hover"
    :placement="computedPlacement"
    :autoFitMinWidth="false"
    :teleportProps="teleportProps"
    :contentOffset="3"
  >
    <li class="layui-nav-item layui-sub-menu-popup">
      <a href="javascript:void(0)" style="justify-content: space-between">
        <div>
          <i v-if="$slots.icon" class="layui-sub-menu-icon">
            <slot name="icon"></slot>
          </i>
          <span v-if="$slots.title">
            <slot name="title"></slot>
          </span>
        </div>
        <span v-if="$slots.expandIcon" class="layui-nav-more">
          <slot name="expandIcon"></slot>
        </span>
        <span v-else class="layui-nav-more" :style="{ transform: isExpandDown ? 'rotate(0deg)' : 'rotate(-90deg)' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5z" fill="currentColor"/></svg>
        </span>
      </a>
    </li>
    <template #content>
      <div
        :class="[
          'layui-sub-menu-popup-content',
          `layui-sub-menu-popup-theme${computedTheme}`,
        ]"
      >
        <slot></slot>
      </div>
    </template>
  </lay-dropdown>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { saveLocale } from "@/i18n";
import { computed } from "vue";

const { locale, t } = useI18n();

// Layui's locale ref uses vi_VN/zh_CN — map to simple "vi"/"zh" for template
const REVERSE: Record<string, string> = { vi_VN: "vi", zh_CN: "zh" };
const appLocale = computed(() => REVERSE[locale.value] || "vi");

function switchLang(lang: string) {
  saveLocale(lang); // handles mapping to vi_VN/zh_CN and syncing Layui
}
</script>

<template>
  <lay-dropdown trigger="hover" placement="bottom-end">
    <a href="javascript:;" class="lang-trigger">
      <i class="layui-icon layui-icon-website" />
      <span class="lang-label">{{ appLocale === "vi" ? "VI" : "中" }}</span>
    </a>
    <template #content>
      <div class="lang-panel">
        <div class="lang-item" :class="{ active: appLocale === 'vi' }" @click="switchLang('vi')">
          <span>{{ t("language.vi") }}</span>
          <i v-if="appLocale === 'vi'" class="layui-icon layui-icon-ok lang-check" />
        </div>
        <div class="lang-item" :class="{ active: appLocale === 'zh' }" @click="switchLang('zh')">
          <span>{{ t("language.zh") }}</span>
          <i v-if="appLocale === 'zh'" class="layui-icon layui-icon-ok lang-check" />
        </div>
      </div>
    </template>
  </lay-dropdown>
</template>

<style scoped>
.lang-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 50px;
  padding: 0 10px;
  color: #666;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.lang-trigger:hover {
  background: #f6f6f6;
}

.lang-trigger .layui-icon {
  font-size: 16px;
}

.lang-label {
  font-weight: 600;
  font-size: 12px;
}

.lang-panel {
  min-width: 140px;
  padding: 5px 0;
  background: #fff;
}

.lang-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.lang-item:hover {
  background: #f6f6f6;
  color: #009688;
}

.lang-item.active {
  color: #009688;
  font-weight: 600;
}

.lang-check {
  font-size: 14px;
  color: #009688;
}
</style>

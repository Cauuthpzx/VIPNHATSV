import { getCurrentInstance } from "vue";
import { createI18n, useI18n as __useI18n__ } from "vue-i18n";
import zh_CN from "./locales/zh_CN";
import en_US from "./locales/en_US";
import vi_VN from "./locales/vi_VN";

const savedLocale =
  typeof localStorage !== "undefined"
    ? localStorage.getItem("app-locale")
    : null;
const localeMap: Record<string, string> = {
  vi: "vi_VN",
  en: "en_US",
  zh: "zh_CN",
};
const initialLocale = localeMap[savedLocale || "vi"] || "vi_VN";

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  messages: {
    zh_CN: zh_CN,
    en_US: en_US,
    vi_VN: vi_VN,
  },
});

// "vue-i18n": "9.6.3"
// https://github.com/microsoft/TypeScript/issues/47663#issuecomment-1519138189
export function useI18n(): ReturnType<typeof __useI18n__> {
  let i18nInstance;
  const app = getCurrentInstance()?.appContext.app;

  try {
    i18nInstance = __useI18n__();
  } catch (e) {
    app?.use(i18n);
    i18nInstance = __useI18n__();
  }

  return i18nInstance;
}

/**
 * Switch the layui-vue component locale.
 * Call this when the app locale changes.
 */
export function setLayuiLocale(appLocale: string) {
  const mapped = localeMap[appLocale] || "vi_VN";
  (i18n.global.locale as any).value = mapped;
}

export default i18n;

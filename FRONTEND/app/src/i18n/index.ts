/**
 * App i18n — merges app translations into Layui-Vue's i18n instance.
 *
 * Layui-Vue already calls `app.use(i18n)` in its install function,
 * so we do NOT create a second i18n instance. Instead we:
 * 1. Import Layui's existing i18n instance
 * 2. Merge our app-specific translations into each locale
 * 3. Export helpers for switching locale
 */
import { layuiI18n, setLayuiLocale } from "@layui/layui-vue";
import vi from "./locales/vi";
import zh from "./locales/zh";

// Layui uses vi_VN / zh_CN locale codes internally
const LOCALE_MAP: Record<string, string> = { vi: "vi_VN", zh: "zh_CN" };
const REVERSE_MAP: Record<string, string> = { vi_VN: "vi", zh_CN: "zh" };
const LOCALE_KEY = "app-locale"; // same key Layui uses

// Merge app translations into Layui's i18n messages
layuiI18n.global.mergeLocaleMessage("vi_VN", vi);
layuiI18n.global.mergeLocaleMessage("zh_CN", zh);

/**
 * Get saved app locale code ("vi" or "zh")
 */
export function getSavedLocale(): string {
  try {
    return localStorage.getItem(LOCALE_KEY) || "vi";
  } catch {
    return "vi";
  }
}

/**
 * Switch locale globally — syncs both app and Layui component locale.
 */
export function saveLocale(appLocale: string) {
  try {
    localStorage.setItem(LOCALE_KEY, appLocale);
  } catch {
    // ignore
  }
  const mapped = LOCALE_MAP[appLocale] || "vi_VN";
  (layuiI18n.global.locale as any).value = mapped;
  setLayuiLocale(appLocale);
}

/**
 * Get current app locale code ("vi" or "zh") from Layui's i18n global.
 */
export function getCurrentAppLocale(): string {
  const layuiLocale = (layuiI18n.global.locale as any).value || "vi_VN";
  return REVERSE_MAP[layuiLocale] || "vi";
}

// Re-export the Layui i18n instance (for components that need it directly)
export const i18n = layuiI18n;
export default layuiI18n;

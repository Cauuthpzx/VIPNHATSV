import { ref, computed } from "vue";
import vi from "./vi";
import en from "./en";
import zh from "./zh";

export type AppLocale = "vi" | "en" | "zh";

const messages: Record<AppLocale, any> = { vi, en, zh };

const savedLocale = (typeof localStorage !== "undefined"
  ? localStorage.getItem("app-locale")
  : null) as AppLocale | null;

export const currentLocale = ref<AppLocale>(savedLocale || "vi");

export function setLocale(locale: AppLocale) {
  currentLocale.value = locale;
  localStorage.setItem("app-locale", locale);
}

/**
 * Composable for using app-level translations in components.
 * Returns a t() function that looks up keys in the current locale messages.
 *
 * Usage: const { t } = useAppI18n();
 *        t("menu.memberList") => "Danh sách hội viên"
 */
export function useAppI18n() {
  const t = (key: string, fallback?: string): string => {
    const parts = key.split(".");
    let val: any = messages[currentLocale.value];
    for (const part of parts) {
      if (val == null) break;
      val = val[part];
    }
    if (typeof val === "string") return val;
    // Fallback to Vietnamese
    val = messages.vi;
    for (const part of parts) {
      if (val == null) break;
      val = val[part];
    }
    return typeof val === "string" ? val : fallback || key;
  };

  return { t, locale: currentLocale };
}

export const languageOptions = [
  { value: "vi" as AppLocale, label: "Tiếng Việt" },
  { value: "en" as AppLocale, label: "English" },
  { value: "zh" as AppLocale, label: "简体中文" },
];

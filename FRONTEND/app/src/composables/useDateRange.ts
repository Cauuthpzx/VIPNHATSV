import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useAutoFitSelect } from "./useAutoFitSelect";

export type DateQuickType = "today" | "yesterday" | "thisWeek" | "thisMonth" | "lastMonth";

export interface DateQuickOption {
  label: string;
  value: DateQuickType;
}

const DATE_QUICK_KEYS: DateQuickType[] = ["today", "yesterday", "thisWeek", "thisMonth", "lastMonth"];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeDateRange(type: DateQuickType): [string, string] {
  const today = new Date();
  let start = formatDate(today);
  let end = formatDate(today);

  switch (type) {
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      start = formatDate(y);
      end = formatDate(y);
      break;
    }
    case "thisWeek": {
      const day = today.getDay() || 7;
      const mon = new Date(today);
      mon.setDate(today.getDate() - day + 1);
      start = formatDate(mon);
      break;
    }
    case "thisMonth": {
      start = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
      break;
    }
    case "lastMonth": {
      start = formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
      end = formatDate(new Date(today.getFullYear(), today.getMonth(), 0));
      break;
    }
  }

  return [start, end];
}

export function useDateRange(initial: DateQuickType = "today") {
  const { t } = useI18n();
  let isResetting = false;
  const dateQuickSelect = ref<DateQuickType>(initial);
  const dateQuickOptions = computed<DateQuickOption[]>(() =>
    DATE_QUICK_KEYS.map((key) => ({ label: t(`dateRange.${key}`), value: key })),
  );
  const dateRange = ref<string[]>(computeDateRange(initial));

  watch(dateQuickSelect, (val) => {
    if (isResetting) return;
    dateRange.value = computeDateRange(val);
  });

  function resetDateRange() {
    isResetting = true;
    dateQuickSelect.value = initial;
    dateRange.value = [];
    isResetting = false;
  }

  const { selectWidth: dateQuickWidth } = useAutoFitSelect(dateQuickOptions);

  return {
    dateRange,
    dateQuickSelect,
    dateQuickOptions,
    dateQuickWidth,
    resetDateRange,
  };
}

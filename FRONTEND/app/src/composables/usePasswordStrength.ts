import { computed, type Ref } from "vue";
import { useI18n } from "vue-i18n";

export interface StrengthCheck {
  label: string;
  pass: boolean;
}

export function usePasswordStrength(password: Ref<string>) {
  const { t } = useI18n();

  const checks = computed<StrengthCheck[]>(() => {
    const p = password.value;
    return [
      { label: t("password.minLength"), pass: p.length >= 8 },
      { label: t("password.uppercase"), pass: /[A-Z]/.test(p) },
      { label: t("password.lowercase"), pass: /[a-z]/.test(p) },
      { label: t("password.number"), pass: /[0-9]/.test(p) },
      { label: t("password.special"), pass: /[^A-Za-z0-9]/.test(p) },
    ];
  });

  const passedCount = computed(() => checks.value.filter((c) => c.pass).length);
  const allPassed = computed(() => passedCount.value === 5);

  const label = computed(() => {
    if (!password.value) return "";
    if (passedCount.value <= 2) return t("password.weak");
    if (passedCount.value <= 3) return t("password.medium");
    if (passedCount.value <= 4) return t("password.fair");
    return t("password.strong");
  });

  const color = computed(() => {
    if (passedCount.value <= 2) return "#ff4d4f";
    if (passedCount.value <= 3) return "#faad14";
    if (passedCount.value <= 4) return "#1890ff";
    return "#52c41a";
  });

  return { checks, passedCount, allPassed, label, color };
}

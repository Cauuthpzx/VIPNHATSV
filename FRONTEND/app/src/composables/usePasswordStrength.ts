import { computed, type Ref } from "vue";

export interface StrengthCheck {
  label: string;
  pass: boolean;
}

export function usePasswordStrength(password: Ref<string>) {
  const checks = computed<StrengthCheck[]>(() => {
    const p = password.value;
    return [
      { label: "8+ ký tự", pass: p.length >= 8 },
      { label: "Chữ hoa (A-Z)", pass: /[A-Z]/.test(p) },
      { label: "Chữ thường (a-z)", pass: /[a-z]/.test(p) },
      { label: "Số (0-9)", pass: /[0-9]/.test(p) },
      { label: "Ký tự đặc biệt (!@#...)", pass: /[^A-Za-z0-9]/.test(p) },
    ];
  });

  const passedCount = computed(() => checks.value.filter((c) => c.pass).length);
  const allPassed = computed(() => passedCount.value === 5);

  const label = computed(() => {
    if (!password.value) return "";
    if (passedCount.value <= 2) return "Yếu";
    if (passedCount.value <= 3) return "Trung bình";
    if (passedCount.value <= 4) return "Khá";
    return "Mạnh";
  });

  const color = computed(() => {
    if (passedCount.value <= 2) return "#ff4d4f";
    if (passedCount.value <= 3) return "#faad14";
    if (passedCount.value <= 4) return "#1890ff";
    return "#52c41a";
  });

  return { checks, passedCount, allPassed, label, color };
}

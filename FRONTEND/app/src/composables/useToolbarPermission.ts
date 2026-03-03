import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";

/**
 * Trả về config toolbar phù hợp theo quyền user.
 * - Admin/Manager: hiển thị đầy đủ (filter, export, print)
 * - Viewer: chỉ hiển thị filter (ẩn export, print)
 */
export function useToolbarPermission() {
  const authStore = useAuthStore();

  const defaultToolbar = computed(() => {
    if (authStore.isAdmin) return true;
    // Chỉ giữ filter cho user không phải admin
    return ["filter"] as ("filter" | "export" | "print")[];
  });

  const canExport = computed(() => authStore.isAdmin);

  return { defaultToolbar, canExport };
}

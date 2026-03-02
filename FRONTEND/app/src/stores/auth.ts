import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { api } from "@/api/client";

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: { id: string; name: string; type: string; permissions: string[] };
  lastLoginAt: string | null;
  lastLoginIp: string | null;
}

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref(localStorage.getItem(TOKEN_KEY) || "");
  const refreshToken = ref(localStorage.getItem(REFRESH_KEY) || "");
  const user = ref<AuthUser | null>(null);
  const isLoggedIn = computed(() => !!accessToken.value && user.value !== null);
  const initialized = ref(false);

  // Sync tokens to localStorage whenever they change
  watch(accessToken, (val) => {
    val ? localStorage.setItem(TOKEN_KEY, val) : localStorage.removeItem(TOKEN_KEY);
  });
  watch(refreshToken, (val) => {
    val ? localStorage.setItem(REFRESH_KEY, val) : localStorage.removeItem(REFRESH_KEY);
  });

  const permissions = computed(() => user.value?.role?.permissions ?? []);
  const isAdmin = computed(() => permissions.value.includes("*"));

  function hasPermission(...required: string[]): boolean {
    const perms = permissions.value;
    if (perms.includes("*")) return true;
    return required.every((p) => perms.includes(p));
  }

  async function login(username: string, password: string) {
    const res = await api.post("/auth/login", { username, password });
    const data = res.data;
    if (!data.success) {
      throw new Error(data.message || "Đăng nhập thất bại");
    }
    accessToken.value = data.data.accessToken;
    refreshToken.value = data.data.refreshToken;
    // Login response returns incomplete user (role as string).
    // Fetch full user data including role object with permissions.
    await fetchMe();
  }

  async function refreshAccessToken(): Promise<boolean> {
    try {
      if (!refreshToken.value) return false;
      const res = await api.post("/auth/refresh", { refreshToken: refreshToken.value });
      if (res.data.success) {
        accessToken.value = res.data.data.accessToken;
        refreshToken.value = res.data.data.refreshToken;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function fetchMe() {
    try {
      const res = await api.get("/auth/me");
      if (res.data.success) {
        user.value = res.data.data;
      }
    } catch {
      // ignore
    }
  }

  async function logout() {
    try {
      if (refreshToken.value) {
        await api.post("/auth/logout", { refreshToken: refreshToken.value });
      }
    } catch {
      // ignore
    }
    accessToken.value = "";
    refreshToken.value = "";
    user.value = null;
  }

  async function init() {
    if (initialized.value) return;

    if (accessToken.value) {
      // Try current accessToken first
      await fetchMe();

      // If fetchMe failed (token expired), try refresh
      if (!user.value && refreshToken.value) {
        const ok = await refreshAccessToken();
        if (ok) {
          await fetchMe();
        }
      }

      // If still no user after all attempts, clear stale tokens
      if (!user.value) {
        accessToken.value = "";
        refreshToken.value = "";
      }
    }

    initialized.value = true;
  }

  return {
    accessToken,
    refreshToken,
    user,
    isLoggedIn,
    initialized,
    permissions,
    isAdmin,
    hasPermission,
    login,
    refreshAccessToken,
    fetchMe,
    logout,
    init,
  };
});

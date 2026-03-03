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

// Clean up legacy refresh_token from localStorage (now httpOnly cookie)
localStorage.removeItem("refresh_token");

export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref(localStorage.getItem(TOKEN_KEY) || "");
  const user = ref<AuthUser | null>(null);
  const isLoggedIn = computed(() => !!accessToken.value && user.value !== null);
  const initialized = ref(false);

  // Sync access token to localStorage
  watch(accessToken, (val) => {
    if (val) {
      localStorage.setItem(TOKEN_KEY, val);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  });
  // Refresh token is managed via httpOnly cookie — no localStorage needed

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
      throw new Error(data.message || "Login failed");
    }
    accessToken.value = data.data.accessToken;
    // Refresh token is set via httpOnly cookie by the server
    // Fetch full user data including role object with permissions.
    await fetchMe();
  }

  async function refreshAccessToken(): Promise<boolean> {
    try {
      // Refresh token is sent via httpOnly cookie automatically
      const res = await api.post("/auth/refresh");
      if (res.data.success) {
        accessToken.value = res.data.data.accessToken;
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
      // Refresh token is sent via httpOnly cookie automatically
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    accessToken.value = "";
    user.value = null;
  }

  async function init() {
    if (initialized.value) return;

    if (accessToken.value) {
      // Try current accessToken first
      await fetchMe();

      // If fetchMe failed (token expired), try refresh via httpOnly cookie
      if (!user.value) {
        const ok = await refreshAccessToken();
        if (ok) {
          await fetchMe();
        }
      }

      // If still no user after all attempts, clear stale token
      if (!user.value) {
        accessToken.value = "";
      }
    }

    initialized.value = true;
  }

  return {
    accessToken,
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

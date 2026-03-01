import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { api } from "@/api/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref(localStorage.getItem(TOKEN_KEY) || "");
  const refreshToken = ref(localStorage.getItem(REFRESH_KEY) || "");
  const user = ref<AuthUser | null>(null);
  const isLoggedIn = computed(() => !!accessToken.value);
  const initialized = ref(false);

  // Sync tokens to localStorage whenever they change
  watch(accessToken, (val) => {
    val ? localStorage.setItem(TOKEN_KEY, val) : localStorage.removeItem(TOKEN_KEY);
  });
  watch(refreshToken, (val) => {
    val ? localStorage.setItem(REFRESH_KEY, val) : localStorage.removeItem(REFRESH_KEY);
  });

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    const data = res.data;
    if (!data.success) {
      throw new Error(data.message || "Đăng nhập thất bại");
    }
    accessToken.value = data.data.accessToken;
    refreshToken.value = data.data.refreshToken;
    user.value = data.data.user;
    return data.data;
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
    const ok = await refreshAccessToken();
    if (ok) {
      await fetchMe();
    }
    initialized.value = true;
  }

  return {
    accessToken,
    refreshToken,
    user,
    isLoggedIn,
    initialized,
    login,
    refreshAccessToken,
    fetchMe,
    logout,
    init,
  };
});

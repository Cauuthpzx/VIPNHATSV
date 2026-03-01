import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

// Lazy import to avoid circular dependency
let _authStore: ReturnType<typeof import("@/stores/auth").useAuthStore> | null = null;
async function getAuthStore() {
  if (!_authStore) {
    const { useAuthStore } = await import("@/stores/auth");
    _authStore = useAuthStore();
  }
  return _authStore;
}

api.interceptors.request.use(async (config) => {
  const authStore = await getAuthStore();
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      const authStore = await getAuthStore();
      const ok = await authStore.refreshAccessToken();

      if (ok) {
        const newToken = authStore.accessToken;
        pendingRequests.forEach((cb) => cb(newToken));
        pendingRequests = [];
        isRefreshing = false;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      pendingRequests = [];
      isRefreshing = false;
      authStore.accessToken = "";
      authStore.refreshToken = "";
      authStore.user = null;
      window.location.href = "/login";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

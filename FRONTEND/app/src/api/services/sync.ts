import { api } from "@/api/client";

export function fetchSyncStatus() {
  return api.get("/sync/status");
}

export function fetchSyncConfig() {
  return api.get("/sync/config");
}

export function triggerSync() {
  return api.post("/sync/trigger");
}

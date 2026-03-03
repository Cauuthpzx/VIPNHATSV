import { api } from "@/api/client";

export function fetchSyncStatus() {
  return api.get("/sync/status");
}

export function fetchSyncConfig() {
  return api.get("/sync/config");
}

/** Stop current sync */
export function stopSync() {
  return api.post("/sync/stop");
}

/** Trigger full sync (all agents) */
export function triggerSync() {
  return api.post("/sync/trigger");
}

/** Trigger sync for a single agent */
export function triggerAgentSync(agentId: string) {
  return api.post(`/sync/trigger/${agentId}`);
}

/** Trigger sync for a single agent + single endpoint (table) */
export function triggerAgentEndpointSync(agentId: string, table: string) {
  return api.post(`/sync/trigger/${agentId}/${table}`);
}

/** Purge ALL proxy data from all tables */
export function purgeAllData() {
  return api.delete("/sync/purge");
}

/** Purge proxy data for a single agent */
export function purgeAgentData(agentId: string) {
  return api.delete(`/sync/purge/${agentId}`);
}

/** Set auto sync interval (ms) — legacy: set tất cả endpoint cùng 1 giá trị */
export function setSyncInterval(intervalMs: number) {
  return api.put("/sync/interval", { intervalMs });
}

/** Set per-endpoint sync intervals (batch) */
export function setSyncIntervals(intervals: Record<string, number>) {
  return api.put("/sync/intervals", { intervals });
}

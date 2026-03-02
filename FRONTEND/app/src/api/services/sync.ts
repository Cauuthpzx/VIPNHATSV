import { api } from "@/api/client";

export function fetchSyncStatus() {
  return api.get("/sync/status");
}

export function fetchSyncConfig() {
  return api.get("/sync/config");
}

/** Trigger full sync (all agents) */
export function triggerSync() {
  return api.post("/sync/trigger");
}

/** Trigger sync for a single agent */
export function triggerAgentSync(agentId: string) {
  return api.post(`/sync/trigger/${agentId}`);
}

/** Purge ALL proxy data from all tables */
export function purgeAllData() {
  return api.delete("/sync/purge");
}

/** Purge proxy data for a single agent */
export function purgeAgentData(agentId: string) {
  return api.delete(`/sync/purge/${agentId}`);
}

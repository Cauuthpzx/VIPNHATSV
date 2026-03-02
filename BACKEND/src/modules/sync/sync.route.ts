import type { FastifyInstance } from "fastify";
import { authorize } from "../../middlewares/authorize.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import {
  syncStatusHandler,
  syncConfigHandler,
  syncTriggerHandler,
  syncTriggerAgentHandler,
  syncPurgeAllHandler,
  syncPurgeAgentHandler,
} from "./sync.controller.js";

export async function syncRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  // Read-only
  app.get("/status", { preHandler: [authorize(PERMISSIONS.SYNC_READ)] }, syncStatusHandler);
  app.get("/config", { preHandler: [authorize(PERMISSIONS.SYNC_READ)] }, syncConfigHandler);

  // Write: sync triggers
  app.post("/trigger", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncTriggerHandler);
  app.post("/trigger/:agentId", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncTriggerAgentHandler);

  // Write: purge data
  app.delete("/purge", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncPurgeAllHandler);
  app.delete("/purge/:agentId", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncPurgeAgentHandler);
}

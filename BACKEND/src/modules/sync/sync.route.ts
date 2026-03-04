import type { FastifyInstance } from "fastify";
import { authorize } from "../../middlewares/authorize.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import {
  syncStatusHandler,
  syncConfigHandler,
  syncTriggerHandler,
  syncTriggerAgentHandler,
  syncTriggerAgentEndpointHandler,
  syncStopHandler,
  syncSetIntervalHandler,
  syncSetIntervalsHandler,
  syncAutoStatusHandler,
  syncAutoToggleHandler,
  syncPurgeAllHandler,
  syncPurgeAgentHandler,
} from "./sync.controller.js";

export async function syncRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  // Read-only
  app.get("/status", { preHandler: [authorize(PERMISSIONS.SYNC_READ)] }, syncStatusHandler);
  app.get("/config", { preHandler: [authorize(PERMISSIONS.SYNC_READ)] }, syncConfigHandler);

  // Write: sync triggers + settings
  app.post("/stop", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncStopHandler);
  app.put("/interval", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncSetIntervalHandler);
  app.put("/intervals", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncSetIntervalsHandler);
  app.get("/auto", { preHandler: [authorize(PERMISSIONS.SYNC_READ)] }, syncAutoStatusHandler);
  app.put("/auto", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncAutoToggleHandler);
  app.post("/trigger", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncTriggerHandler);
  app.post("/trigger/:agentId", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncTriggerAgentHandler);
  app.post(
    "/trigger/:agentId/:table",
    { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] },
    syncTriggerAgentEndpointHandler,
  );

  // Write: purge data
  app.delete("/purge", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncPurgeAllHandler);
  app.delete("/purge/:agentId", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncPurgeAgentHandler);
}

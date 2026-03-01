import type { FastifyInstance } from "fastify";
import { authorize } from "../../middlewares/authorize.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import {
  syncStatusHandler,
  syncConfigHandler,
  syncTriggerHandler,
} from "./sync.controller.js";

export async function syncRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/status", { preHandler: [authorize(PERMISSIONS.SYNC_READ)] }, syncStatusHandler);
  app.get("/config", { preHandler: [authorize(PERMISSIONS.SYNC_READ)] }, syncConfigHandler);
  app.post("/trigger", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, syncTriggerHandler);
}

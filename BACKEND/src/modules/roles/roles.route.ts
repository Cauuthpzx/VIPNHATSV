import type { FastifyInstance } from "fastify";
import { authorize } from "../../middlewares/authorize.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from "./roles.controller.js";

export async function rolesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/", { preHandler: [authorize(PERMISSIONS.ROLES_READ)] }, listHandler);
  app.get("/:id", { preHandler: [authorize(PERMISSIONS.ROLES_READ)] }, getHandler);
  app.post("/", { preHandler: [authorize(PERMISSIONS.ROLES_WRITE)] }, createHandler);
  app.put("/:id", { preHandler: [authorize(PERMISSIONS.ROLES_WRITE)] }, updateHandler);
  app.delete("/:id", { preHandler: [authorize(PERMISSIONS.ROLES_DELETE)] }, deleteHandler);
}

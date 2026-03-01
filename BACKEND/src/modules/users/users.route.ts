import type { FastifyInstance } from "fastify";
import { authorize } from "../../middlewares/authorize.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from "./users.controller.js";

export async function usersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/", { preHandler: [authorize(PERMISSIONS.USERS_READ)] }, listHandler);
  app.get("/:id", { preHandler: [authorize(PERMISSIONS.USERS_READ)] }, getHandler);
  app.post("/", { preHandler: [authorize(PERMISSIONS.USERS_WRITE)] }, createHandler);
  app.put("/:id", { preHandler: [authorize(PERMISSIONS.USERS_WRITE)] }, updateHandler);
  app.delete("/:id", { preHandler: [authorize(PERMISSIONS.USERS_DELETE)] }, deleteHandler);
}

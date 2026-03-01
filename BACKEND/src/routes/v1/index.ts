import type { FastifyInstance } from "fastify";
import { authRoutes } from "../../modules/auth/auth.route.js";
import { usersRoutes } from "../../modules/users/users.route.js";
import { rolesRoutes } from "../../modules/roles/roles.route.js";

export async function v1Routes(app: FastifyInstance) {
  app.register(authRoutes, { prefix: "/auth" });
  app.register(usersRoutes, { prefix: "/users" });
  app.register(rolesRoutes, { prefix: "/roles" });
}

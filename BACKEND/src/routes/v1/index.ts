import type { FastifyInstance } from "fastify";
import { authRoutes } from "../../modules/auth/auth.route.js";
import { usersRoutes } from "../../modules/users/users.route.js";
import { rolesRoutes } from "../../modules/roles/roles.route.js";
import { proxyRoutes, agentRoutes } from "../../modules/proxy/proxy.route.js";
import { syncRoutes } from "../../modules/sync/sync.route.js";
import { ee88AuthRoutes } from "../../modules/ee88-auth/ee88-auth.route.js";
import { notificationRoutes } from "../../modules/notification/notification.route.js";

export async function v1Routes(app: FastifyInstance) {
  app.register(authRoutes, { prefix: "/auth" });
  app.register(usersRoutes, { prefix: "/users" });
  app.register(rolesRoutes, { prefix: "/roles" });
  app.register(proxyRoutes, { prefix: "/proxy" });
  app.register(agentRoutes, { prefix: "/agents" });
  app.register(syncRoutes, { prefix: "/sync" });
  app.register(ee88AuthRoutes, { prefix: "/ee88-auth" });
  app.register(notificationRoutes, { prefix: "/notifications" });
}

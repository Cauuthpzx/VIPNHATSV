import type { FastifyInstance } from "fastify";
import {
  loginHandler,
  registerHandler,
  refreshHandler,
  logoutHandler,
  logoutAllHandler,
  meHandler,
  updateProfileHandler,
  changePasswordHandler,
  changeFundPasswordHandler,
  listSessionsHandler,
  revokeSessionHandler,
} from "./auth.controller.js";

const authRateLimit = {
  config: {
    rateLimit: {
      max: 30,
      timeWindow: 60_000, // 30 requests per minute per IP
    },
  },
};

const registerRateLimit = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: 60_000, // 5 requests per minute per IP (strict)
    },
  },
};

export async function authRoutes(app: FastifyInstance) {
  // Public (rate-limited)
  app.post("/login", authRateLimit, loginHandler);
  app.post("/register", registerRateLimit, registerHandler);
  app.post("/refresh", authRateLimit, refreshHandler);

  // Authenticated
  app.post("/logout", { preHandler: [app.authenticate] }, logoutHandler);
  app.post("/logout-all", { preHandler: [app.authenticate] }, logoutAllHandler);
  app.get("/me", { preHandler: [app.authenticate] }, meHandler);
  app.put("/profile", { preHandler: [app.authenticate] }, updateProfileHandler);
  app.put("/change-password", { preHandler: [app.authenticate] }, changePasswordHandler);
  app.put("/change-fund-password", { preHandler: [app.authenticate] }, changeFundPasswordHandler);

  // Session management
  app.get("/sessions", { preHandler: [app.authenticate] }, listSessionsHandler);
  app.delete("/sessions/:id", { preHandler: [app.authenticate] }, revokeSessionHandler);
}

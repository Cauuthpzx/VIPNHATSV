import type { FastifyInstance } from "fastify";
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
  updateProfileHandler,
  changePasswordHandler,
  changeFundPasswordHandler,
} from "./auth.controller.js";

const authRateLimit = {
  config: {
    rateLimit: {
      max: 30,
      timeWindow: 60_000, // 30 requests per minute per IP
    },
  },
};

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", authRateLimit, loginHandler);
  app.post("/refresh", authRateLimit, refreshHandler);
  app.post("/logout", logoutHandler);
  app.get("/me", { preHandler: [app.authenticate] }, meHandler);
  app.put("/profile", { preHandler: [app.authenticate] }, updateProfileHandler);
  app.put("/change-password", { preHandler: [app.authenticate] }, changePasswordHandler);
  app.put("/change-fund-password", { preHandler: [app.authenticate] }, changeFundPasswordHandler);
}

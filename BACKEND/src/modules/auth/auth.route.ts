import type { FastifyInstance } from "fastify";
import { loginHandler, refreshHandler, logoutHandler, meHandler } from "./auth.controller.js";

const authRateLimit = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: 60_000, // 5 requests per minute per IP
    },
  },
};

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", authRateLimit, loginHandler);
  app.post("/refresh", authRateLimit, refreshHandler);
  app.post("/logout", logoutHandler);
  app.get("/me", { preHandler: [app.authenticate] }, meHandler);
}

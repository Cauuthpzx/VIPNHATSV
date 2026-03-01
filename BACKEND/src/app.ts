import Fastify from "fastify";
import { appConfig } from "./config/app.js";

// Plugins
import prismaPlugin from "./plugins/prisma.js";
import corsPlugin from "./plugins/cors.js";
import helmetPlugin from "./plugins/helmet.js";
import rateLimitPlugin from "./plugins/rateLimit.js";
import jwtPlugin from "./plugins/jwt.js";
import websocketPlugin from "./plugins/websocket.js";

// Middlewares
import { requestIdHook } from "./middlewares/requestId.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { authenticate } from "./middlewares/authenticate.js";

// Routes
import { healthRoutes } from "./health/index.js";
import { v1Routes } from "./routes/v1/index.js";
import { wsRoutes } from "./websocket/ws.handler.js";

export async function buildApp() {
  const app = Fastify({
    logger: false,
    disableRequestLogging: true,
  });

  // Hooks
  await app.register(requestIdHook);
  await app.register(errorHandler);

  // Plugins
  await app.register(prismaPlugin);
  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(rateLimitPlugin);
  await app.register(jwtPlugin);
  await app.register(websocketPlugin);

  // Auth decorator
  await app.register(authenticate);

  // Routes
  await app.register(healthRoutes);
  await app.register(v1Routes, { prefix: "/api/v1" });
  await app.register(wsRoutes);

  return app;
}

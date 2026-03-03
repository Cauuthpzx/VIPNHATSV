import Fastify from "fastify";
import { appConfig } from "./config/app.js";

// Plugins
import prismaPlugin from "./plugins/prisma.js";
import redisPlugin from "./plugins/redis.js";
import corsPlugin from "./plugins/cors.js";
import helmetPlugin from "./plugins/helmet.js";
import rateLimitPlugin from "./plugins/rateLimit.js";
import jwtPlugin from "./plugins/jwt.js";
import websocketPlugin from "./plugins/websocket.js";
import swaggerPlugin from "./plugins/swagger.js";
import sentryPlugin from "./plugins/sentry.js";
import compressPlugin from "./plugins/compress.js";
import cookiePlugin from "./plugins/cookie.js";
import multipartPlugin from "@fastify/multipart";

// Middlewares
import { requestIdHook } from "./middlewares/requestId.js";
import requestLoggerPlugin from "./middlewares/requestLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { authenticate } from "./middlewares/authenticate.js";

// Routes
import { healthRoutes } from "./health/index.js";
import { v1Routes } from "./routes/v1/index.js";
import { wsRoutes } from "./websocket/ws.handler.js";

// L1 cache cleanup
import { destroyProxyL1Cache } from "./modules/proxy/proxy.service.js";
import { destroyDashboardL1Cache } from "./modules/dashboard/dashboard.service.js";

export async function buildApp() {
  const app = Fastify({
    logger: false,
    disableRequestLogging: true,
  });

  // Sentry (must be first for error capturing)
  await app.register(sentryPlugin);

  // Hooks
  await app.register(requestIdHook);
  await app.register(requestLoggerPlugin);
  await app.register(errorHandler);

  // Plugins
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(corsPlugin);
  await app.register(cookiePlugin);
  await app.register(swaggerPlugin);
  await app.register(helmetPlugin);
  await app.register(compressPlugin);
  await app.register(multipartPlugin, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  });
  await app.register(rateLimitPlugin);
  await app.register(jwtPlugin);
  await app.register(websocketPlugin);

  // Auth decorator
  await app.register(authenticate);

  // Routes
  await app.register(healthRoutes);
  await app.register(v1Routes, { prefix: "/api/v1" });
  await app.register(wsRoutes);

  // Cleanup L1 cache timers on graceful shutdown
  app.addHook("onClose", async () => {
    destroyProxyL1Cache();
    destroyDashboardL1Cache();
  });

  return app;
}

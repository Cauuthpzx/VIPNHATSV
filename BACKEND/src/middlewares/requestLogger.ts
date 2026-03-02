import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { logger } from "../utils/logger.js";

async function requestLoggerPlugin(app: FastifyInstance) {
  app.addHook("onRequest", (request, _reply, done) => {
    (request as any)._startTime = process.hrtime.bigint();
    done();
  });

  app.addHook("onResponse", (request, reply, done) => {
    // Skip health check endpoints to reduce log noise
    if (request.url === "/health" || request.url === "/ready") {
      done();
      return;
    }

    const startTime = (request as any)._startTime as bigint | undefined;
    const durationMs = startTime
      ? Number(process.hrtime.bigint() - startTime) / 1_000_000
      : 0;

    const statusCode = reply.statusCode;
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    const logData: Record<string, unknown> = {
      requestId: (request as any).requestId,
      method: request.method,
      url: request.url,
      statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    };

    // Log request body size for POST/PUT/PATCH
    const contentLength = request.headers["content-length"];
    if (contentLength && ["POST", "PUT", "PATCH"].includes(request.method)) {
      logData.bodyBytes = parseInt(contentLength, 10);
    }

    logger[level]("request completed", logData);

    done();
  });
}

export default fp(requestLoggerPlugin, { name: "request-logger" });

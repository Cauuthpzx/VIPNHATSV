import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { logger } from "../utils/logger.js";

async function requestLoggerPlugin(app: FastifyInstance) {
  app.addHook("onRequest", (request, _reply, done) => {
    (request as any)._startTime = process.hrtime.bigint();
    done();
  });

  app.addHook("onResponse", (request, reply, done) => {
    const startTime = (request as any)._startTime as bigint | undefined;
    const durationMs = startTime
      ? Number(process.hrtime.bigint() - startTime) / 1_000_000
      : 0;

    const statusCode = reply.statusCode;
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    logger[level]("request completed", {
      requestId: (request as any).requestId,
      method: request.method,
      url: request.url,
      statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });

    done();
  });
}

export default fp(requestLoggerPlugin, { name: "request-logger" });

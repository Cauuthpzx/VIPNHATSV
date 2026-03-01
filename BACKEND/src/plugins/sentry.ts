import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import * as Sentry from "@sentry/node";
import { appConfig } from "../config/app.js";
import { env } from "../config/env.js";

async function sentryPlugin(app: FastifyInstance) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    app.log.info("Sentry DSN not configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn,
    environment: env.NODE_ENV,
    enabled: appConfig.isProduction,
    tracesSampleRate: 0.1,
  });

  // Capture unhandled errors
  app.addHook("onError", (_request, _reply, error, done) => {
    Sentry.captureException(error);
    done();
  });

  // Graceful flush on close
  app.addHook("onClose", async () => {
    await Sentry.close(2000);
  });
}

export default fp(sentryPlugin, { name: "sentry" });

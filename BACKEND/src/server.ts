import { buildApp } from "./app.js";
import { appConfig } from "./config/app.js";
import { logger } from "./utils/logger.js";

async function main() {
  const app = await buildApp();

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    process.on(signal, () => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      setTimeout(() => {
        logger.error("Graceful shutdown timed out, forcing exit");
        process.exit(1);
      }, appConfig.gracefulShutdownTimeout);

      app.close().then(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  }

  process.on("unhandledRejection", (reason) => {
    logger.fatal("Unhandled rejection", { reason: String(reason) });
    process.exit(1);
  });

  process.on("uncaughtException", (error) => {
    logger.fatal("Uncaught exception", { error: error.message, stack: error.stack });
    process.exit(1);
  });

  try {
    await app.listen({ host: appConfig.host, port: appConfig.port });
    logger.info(`Server listening on ${appConfig.host}:${appConfig.port}`, {
      env: appConfig.isProduction ? "production" : "development",
    });
  } catch (err) {
    logger.fatal("Failed to start server", { error: String(err) });
    process.exit(1);
  }
}

main();

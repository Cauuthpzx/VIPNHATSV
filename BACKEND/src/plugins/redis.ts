import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import Redis from "ioredis";
import { appConfig } from "../config/app.js";
import { logger } from "../utils/logger.js";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function redisPlugin(app: FastifyInstance) {
  const redis = new Redis(appConfig.redis.url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  await redis.connect();
  logger.info("Redis connected");

  app.decorate("redis", redis);

  app.addHook("onClose", async () => {
    await redis.quit();
    logger.info("Redis disconnected");
  });
}

export default fp(redisPlugin, { name: "redis" });

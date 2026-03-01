import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import fastifyRateLimit from "@fastify/rate-limit";
import { appConfig } from "../config/app.js";

async function rateLimitPlugin(app: FastifyInstance) {
  await app.register(fastifyRateLimit, {
    max: appConfig.rateLimit.max,
    timeWindow: appConfig.rateLimit.timeWindow,
  });
}

export default fp(rateLimitPlugin, { name: "rate-limit" });

import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import fastifyCors from "@fastify/cors";
import { appConfig } from "../config/app.js";

async function corsPlugin(app: FastifyInstance) {
  await app.register(fastifyCors, {
    origin: appConfig.cors.origin,
    credentials: true,
  });
}

export default fp(corsPlugin, { name: "cors" });

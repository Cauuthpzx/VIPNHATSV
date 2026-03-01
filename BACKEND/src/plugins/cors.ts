import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import fastifyCors from "@fastify/cors";
import { appConfig } from "../config/app.js";

async function corsPlugin(app: FastifyInstance) {
  const raw = appConfig.cors.origin;
  const origin = raw.includes(",") ? raw.split(",").map((s) => s.trim()) : raw;
  await app.register(fastifyCors, {
    origin,
    credentials: true,
  });
}

export default fp(corsPlugin, { name: "cors" });

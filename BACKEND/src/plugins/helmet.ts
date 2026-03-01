import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import fastifyHelmet from "@fastify/helmet";

async function helmetPlugin(app: FastifyInstance) {
  await app.register(fastifyHelmet);
}

export default fp(helmetPlugin, { name: "helmet" });

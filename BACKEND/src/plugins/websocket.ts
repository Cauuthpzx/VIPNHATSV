import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import fastifyWebsocket from "@fastify/websocket";

async function websocketPlugin(app: FastifyInstance) {
  await app.register(fastifyWebsocket);
}

export default fp(websocketPlugin, { name: "websocket" });

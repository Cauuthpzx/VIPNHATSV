import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import compress from "@fastify/compress";

async function compressPlugin(app: FastifyInstance) {
  await app.register(compress, {
    threshold: 1024, // Only compress responses > 1KB
  });
}

export default fp(compressPlugin, { name: "compress" });

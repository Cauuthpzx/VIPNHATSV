import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import cookie from "@fastify/cookie";

async function cookiePlugin(app: FastifyInstance) {
  await app.register(cookie);
}

export default fp(cookiePlugin, { name: "cookie" });

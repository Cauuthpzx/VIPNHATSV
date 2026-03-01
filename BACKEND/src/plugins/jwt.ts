import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { appConfig } from "../config/app.js";

async function jwtPlugin(app: FastifyInstance) {
  await app.register(fastifyJwt, {
    secret: appConfig.jwt.accessSecret,
  });
}

export default fp(jwtPlugin, { name: "jwt" });

import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

declare module "fastify" {
  interface FastifyRequest {
    requestId: string;
  }
}

export async function requestIdHook(app: FastifyInstance) {
  app.addHook("onRequest", async (request) => {
    request.requestId =
      (request.headers["x-request-id"] as string) || randomUUID();
  });
}

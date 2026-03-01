import type { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { ERROR_CODES } from "../constants/error-codes.js";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      userId: string;
      roleId: string;
      permissions: string[];
    };
  }
}

async function authenticatePlugin(app: FastifyInstance) {
  app.decorate("authenticate", async (request: FastifyRequest) => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid token", ERROR_CODES.TOKEN_INVALID);
    }

    const token = header.slice(7);
    try {
      const payload = app.jwt.verify<{
        userId: string;
        roleId: string;
        permissions: string[];
      }>(token);

      request.user = {
        userId: payload.userId,
        roleId: payload.roleId,
        permissions: payload.permissions,
      };
    } catch {
      throw new UnauthorizedError("Token expired or invalid", ERROR_CODES.TOKEN_EXPIRED);
    }
  });
}

export const authenticate = fp(authenticatePlugin, { name: "authenticate" });

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

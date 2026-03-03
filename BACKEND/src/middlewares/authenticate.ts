import type { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { ERROR_CODES } from "../constants/error-codes.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
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
        jti?: string;
        userId: string;
        roleId: string;
        permissions: string[];
        tokenVersion?: number;
      }>(token);

      // Check blacklist (jti present in new tokens, skip for legacy tokens)
      if (payload.jti) {
        try {
          const blacklisted = await app.redis.get(`auth:blacklist:${payload.jti}`);
          if (blacklisted) {
            throw new UnauthorizedError("Token has been revoked", ERROR_CODES.TOKEN_INVALID);
          }
        } catch (err) {
          if (err instanceof UnauthorizedError) throw err;
          // Redis error — fail open, log warning
          request.log.warn("Redis unavailable for blacklist check");
        }
      }

      // Check token version (mass invalidation on password change / logout-all)
      if (payload.tokenVersion !== undefined) {
        try {
          const currentVersion = await app.redis.get(`auth:token_version:${payload.userId}`);
          if (currentVersion !== null && payload.tokenVersion < parseInt(currentVersion, 10)) {
            throw new UnauthorizedError("Token has been revoked", ERROR_CODES.TOKEN_INVALID);
          }
        } catch (err) {
          if (err instanceof UnauthorizedError) throw err;
          // Redis error — fail open
          request.log.warn("Redis unavailable for token version check");
        }
      }

      request.user = {
        userId: payload.userId,
        roleId: payload.roleId,
        permissions: payload.permissions,
      };
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
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

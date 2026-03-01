import type { FastifyRequest } from "fastify";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { ALL_PERMISSIONS, type Permission } from "../constants/permissions.js";
import { ERROR_CODES } from "../constants/error-codes.js";

export function authorize(...requiredPermissions: Permission[]) {
  return async (request: FastifyRequest) => {
    const { permissions } = request.user;

    if (permissions.includes(ALL_PERMISSIONS)) return;

    const hasAll = requiredPermissions.every((p) => permissions.includes(p));
    if (!hasAll) {
      throw new UnauthorizedError("Insufficient permissions", ERROR_CODES.FORBIDDEN);
    }
  };
}

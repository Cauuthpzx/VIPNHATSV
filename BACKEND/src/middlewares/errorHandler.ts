import type { FastifyInstance } from "fastify";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/error-codes.js";
import { HTTP_STATUS } from "../constants/http.js";
import { logger } from "../utils/logger.js";

export async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    const requestId = request.requestId ?? "unknown";

    if (error instanceof AppError) {
      if (!error.isOperational) {
        logger.fatal("Non-operational error", {
          requestId,
          error: error.message,
          stack: error.stack,
        });
      } else {
        logger.warn("Operational error", {
          requestId,
          code: error.code,
          message: error.message,
        });
      }

      return reply.status(error.statusCode).send({
        success: false,
        requestId,
        code: error.code,
        message: error.message,
      });
    }

    // Fastify validation errors
    if ((error as any).validation) {
      return reply.status(HTTP_STATUS.BAD_REQUEST).send({
        success: false,
        requestId,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: (error as Error).message,
      });
    }

    logger.error("Unhandled error", {
      requestId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });

    return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
      success: false,
      requestId,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Internal server error",
    });
  });
}

import type { FastifyReply } from "fastify";
import type { HttpStatus } from "../constants/http.js";
import { HTTP_STATUS } from "../constants/http.js";
import type { ErrorCode } from "../constants/error-codes.js";

interface SuccessResponse<T = unknown> {
  success: true;
  requestId: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  requestId: string;
  code: ErrorCode;
  message: string;
}

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode: HttpStatus = HTTP_STATUS.OK,
): FastifyReply {
  const requestId = (reply.request as Record<string, unknown>).requestId as string;
  const body: SuccessResponse<T> = { success: true, requestId, data };
  return reply.status(statusCode).send(body);
}

export function sendError(
  reply: FastifyReply,
  statusCode: HttpStatus,
  code: ErrorCode,
  message: string,
): FastifyReply {
  const requestId = (reply.request as Record<string, unknown>).requestId as string;
  const body: ErrorResponse = { success: false, requestId, code, message };
  return reply.status(statusCode).send(body);
}

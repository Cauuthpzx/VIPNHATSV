import type { ErrorCode } from "../constants/error-codes.js";
import type { HttpStatus } from "../constants/http.js";
import { HTTP_STATUS } from "../constants/http.js";
import { ERROR_CODES } from "../constants/error-codes.js";

export class AppError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: HttpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

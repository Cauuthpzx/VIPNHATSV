import { ERROR_CODES } from "../constants/error-codes.js";
import { HTTP_STATUS } from "../constants/http.js";
import type { ErrorCode } from "../constants/error-codes.js";
import { AppError } from "./AppError.js";

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code: ErrorCode = ERROR_CODES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code);
  }
}

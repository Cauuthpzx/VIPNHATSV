import { ERROR_CODES } from "../constants/error-codes.js";
import { HTTP_STATUS } from "../constants/http.js";
import type { ErrorCode } from "../constants/error-codes.js";
import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", code: ErrorCode = ERROR_CODES.CONFLICT) {
    super(message, HTTP_STATUS.CONFLICT, code);
  }
}

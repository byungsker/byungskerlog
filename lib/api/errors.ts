import { NextResponse } from "next/server";

export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ApiErrorResponse {
  error: string;
  code: ErrorCodeType;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCodeType,
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }

  toResponse(): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
      {
        error: this.message,
        code: this.code,
        ...(this.details && { details: this.details }),
      },
      { status: this.statusCode }
    );
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(ErrorCode.UNAUTHORIZED, 401, message);
  }

  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(ErrorCode.FORBIDDEN, 403, message);
  }

  static notFound(resource = "Resource"): ApiError {
    return new ApiError(ErrorCode.NOT_FOUND, 404, `${resource} not found`);
  }

  static validationError(message = "Validation failed", details?: Record<string, unknown>): ApiError {
    return new ApiError(ErrorCode.VALIDATION_ERROR, 400, message, details);
  }

  static duplicateEntry(resource = "Entry", details?: Record<string, unknown>): ApiError {
    return new ApiError(
      ErrorCode.DUPLICATE_ENTRY,
      409,
      `A ${resource.toLowerCase()} with this identifier already exists`,
      details
    );
  }

  static badRequest(message = "Bad request"): ApiError {
    return new ApiError(ErrorCode.BAD_REQUEST, 400, message);
  }

  static payloadTooLarge(message = "Payload is too large"): ApiError {
    return new ApiError(ErrorCode.PAYLOAD_TOO_LARGE, 413, message);
  }

  static unsupportedMediaType(message = "Unsupported media type"): ApiError {
    return new ApiError(ErrorCode.UNSUPPORTED_MEDIA_TYPE, 415, message);
  }

  static internal(message = "Internal server error"): ApiError {
    return new ApiError(ErrorCode.INTERNAL_ERROR, 500, message);
  }
}

export function handleApiError(error: unknown, fallbackMessage: string): NextResponse<ApiErrorResponse> {
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  console.error(fallbackMessage, error);
  return ApiError.internal(fallbackMessage).toResponse();
}

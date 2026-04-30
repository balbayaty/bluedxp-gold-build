/**
 * Error Handler - Centralized error handling for digital signature services
 */

export class DigitalSignatureError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = "DigitalSignatureError";
  }
}

export class ValidationError extends DigitalSignatureError {
  constructor(
    message: string,
    public field?: string,
    details?: any,
  ) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends DigitalSignatureError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends DigitalSignatureError {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends DigitalSignatureError {
  constructor(message: string = "Forbidden") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends DigitalSignatureError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

/**
 * Handle Error - Convert to user-friendly error response
 */
export function handleError(error: unknown): {
  success: false;
  error: string;
  code?: string;
  statusCode: number;
  details?: any;
} {
  if (error instanceof DigitalSignatureError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      code: "INTERNAL_ERROR",
      statusCode: 500,
    };
  }

  return {
    success: false,
    error: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

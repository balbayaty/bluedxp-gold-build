/**
 * ETW Error Handler
 *
 * Centralized error handling for ETW module
 * Provides consistent error messages and logging
 */

export class ETWError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = "ETWError";
  }
}

export class ETWValidationError extends ETWError {
  constructor(message: string, details?: any) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ETWValidationError";
  }
}

export class ETWNotFoundError extends ETWError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} not found: ${id}` : `${resource} not found`,
      "NOT_FOUND",
      404,
    );
    this.name = "ETWNotFoundError";
  }
}

export class ETWPermissionError extends ETWError {
  constructor(message: string = "Permission denied") {
    super(message, "PERMISSION_DENIED", 403);
    this.name = "ETWPermissionError";
  }
}

/**
 * Handle errors consistently across ETW services
 */
export function handleETWError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
} {
  // Log error for debugging
  console.error("[ETW Error Handler]", error);

  // Handle known error types
  if (error instanceof ETWError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  // Handle Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    return {
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: error,
    };
  }

  // Handle Prisma errors
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as any;
    if (prismaError.code === "P2002") {
      return {
        message: "A record with this value already exists",
        code: "DUPLICATE_ERROR",
        statusCode: 409,
      };
    }
    if (prismaError.code === "P2025") {
      return {
        message: "Record not found",
        code: "NOT_FOUND",
        statusCode: 404,
      };
    }
  }

  // Handle standard Error
  if (error instanceof Error) {
    return {
      message: error.message || "An unexpected error occurred",
      code: "INTERNAL_ERROR",
      statusCode: 500,
    };
  }

  // Fallback for unknown errors
  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

/**
 * Safe async wrapper for service methods
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorMessage: string = "Operation failed",
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const handled = handleETWError(error);
    throw new ETWError(
      errorMessage,
      handled.code,
      handled.statusCode,
      handled.details,
    );
  }
}

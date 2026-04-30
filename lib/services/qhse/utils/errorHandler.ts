/**
 * QHSE Error Handler
 * Comprehensive error handling and logging for QHSE services
 */

export class QHSEError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = "QHSEError";
    Object.setPrototypeOf(this, QHSEError.prototype);
  }
}

export class ValidationError extends QHSEError {
  constructor(
    message: string,
    public validationErrors: string[],
  ) {
    super(message, "VALIDATION_ERROR", 400, { validationErrors });
    this.name = "ValidationError";
  }
}

export class NotFoundError extends QHSEError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, "NOT_FOUND", 404, {
      resource,
      id,
    });
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends QHSEError {
  constructor(message: string = "Unauthorized access") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ConflictError extends QHSEError {
  constructor(
    message: string,
    public conflictDetails?: any,
  ) {
    super(message, "CONFLICT", 409, conflictDetails);
    this.name = "ConflictError";
  }
}

export class ServiceUnavailableError extends QHSEError {
  constructor(service: string, message?: string) {
    super(
      message || `Service ${service} is currently unavailable`,
      "SERVICE_UNAVAILABLE",
      503,
      { service },
    );
    this.name = "ServiceUnavailableError";
  }
}

/**
 * Error handler utility
 */
export class QHSEErrorHandler {
  /**
   * Handle and log error
   */
  static handleError(error: unknown, context?: string): QHSEError {
    // Log error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[QHSE Error]${context ? ` [${context}]` : ""}:`, {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    // Convert to QHSEError if needed
    if (error instanceof QHSEError) {
      return error;
    }

    if (error instanceof Error) {
      return new QHSEError(error.message, "INTERNAL_ERROR", 500, {
        originalError: error.name,
      });
    }

    return new QHSEError("An unexpected error occurred", "INTERNAL_ERROR", 500);
  }

  /**
   * Create validation error
   */
  static createValidationError(errors: string[]): ValidationError {
    return new ValidationError("Validation failed", errors);
  }

  /**
   * Create not found error
   */
  static createNotFoundError(resource: string, id: string): NotFoundError {
    return new NotFoundError(resource, id);
  }

  /**
   * Create unauthorized error
   */
  static createUnauthorizedError(message?: string): UnauthorizedError {
    return new UnauthorizedError(message);
  }

  /**
   * Create conflict error
   */
  static createConflictError(message: string, details?: any): ConflictError {
    return new ConflictError(message, details);
  }

  /**
   * Create service unavailable error
   */
  static createServiceUnavailableError(
    service: string,
    message?: string,
  ): ServiceUnavailableError {
    return new ServiceUnavailableError(service, message);
  }

  /**
   * Format error for API response
   */
  static formatErrorResponse(error: QHSEError): {
    success: false;
    error: string;
    code: string;
    statusCode: number;
    details?: any;
  } {
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  /**
   * Safe async wrapper
   */
  static async safeAsync<T>(
    fn: () => Promise<T>,
    context?: string,
  ): Promise<
    { success: true; data: T } | { success: false; error: QHSEError }
  > {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const qhseError = this.handleError(error, context);
      return { success: false, error: qhseError };
    }
  }
}

/**
 * Error Handler for Intelligence & Analytics
 * Provides user-friendly error messages
 */

export class IntelligenceError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "IntelligenceError";
  }
}

export function handleIntelligenceError(error: unknown): {
  message: string;
  userMessage: string;
  code: string;
  statusCode: number;
} {
  if (error instanceof IntelligenceError) {
    return {
      message: error.message,
      userMessage: error.userMessage,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // Map common errors to user-friendly messages
    if (error.message.includes("tenant")) {
      return {
        message: error.message,
        userMessage: "Tenant access error. Please check your permissions.",
        code: "TENANT_ERROR",
        statusCode: 403,
      };
    }

    if (error.message.includes("not found")) {
      return {
        message: error.message,
        userMessage: "The requested resource was not found.",
        code: "NOT_FOUND",
        statusCode: 404,
      };
    }

    if (error.message.includes("timeout")) {
      return {
        message: error.message,
        userMessage: "Request timed out. Please try again.",
        code: "TIMEOUT",
        statusCode: 504,
      };
    }
  }

  // Default error
  return {
    message: "An unexpected error occurred",
    userMessage: "Something went wrong. Please try again or contact support.",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

export function createIntelligenceError(
  message: string,
  code: string,
  userMessage: string,
  statusCode: number = 500,
): IntelligenceError {
  return new IntelligenceError(message, code, userMessage, statusCode);
}

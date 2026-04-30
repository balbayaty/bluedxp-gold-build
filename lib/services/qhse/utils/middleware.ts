/**
 * QHSE API Middleware
 * Request validation, rate limiting, logging, and error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { QHSEValidator } from "./validation";
import { QHSEErrorHandler } from "./errorHandler";
import { qhseRateLimiter } from "./rateLimiter";
import { qhseLogger } from "./logger";
import { qhsePerformanceMonitor } from "./performance";

export interface MiddlewareContext {
  request: NextRequest;
  tenantId?: string;
  userId?: string;
  startTime: number;
}

/**
 * Create middleware chain
 */
export function createQHSEMiddleware(
  handlers: Array<(context: MiddlewareContext) => Promise<NextResponse | null>>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const context: MiddlewareContext = {
      request,
      startTime,
    };

    // Extract tenant ID and user ID from request
    const tenantId =
      request.headers.get("x-tenant-id") ||
      request.nextUrl.searchParams.get("tenantId") ||
      undefined;
    const userId = request.headers.get("x-user-id") || undefined;

    context.tenantId = tenantId;
    context.userId = userId;

    // Run middleware handlers
    for (const handler of handlers) {
      const response = await handler(context);
      if (response) {
        // Log request
        const duration = Date.now() - startTime;
        qhsePerformanceMonitor.record(
          `${request.method} ${request.nextUrl.pathname}`,
          duration,
          response.status < 400,
        );
        qhseLogger.info(
          "QHSE API",
          `${request.method} ${request.nextUrl.pathname}`,
          {
            tenantId,
            userId,
            status: response.status,
            duration,
          },
        );
        return response;
      }
    }

    // If no handler returned a response, return 404
    return NextResponse.json(
      QHSEErrorHandler.formatErrorResponse(
        QHSEErrorHandler.createNotFoundError(
          "Endpoint",
          request.nextUrl.pathname,
        ),
      ),
      { status: 404 },
    );
  };
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(limitKey: string) {
  return async (context: MiddlewareContext): Promise<NextResponse | null> => {
    const key = `${limitKey}:${context.tenantId || "anonymous"}`;
    const limit = qhseRateLimiter.isAllowed(key);

    if (!limit.allowed) {
      qhseLogger.warn("QHSE API", "Rate limit exceeded", {
        key,
        tenantId: context.tenantId,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (limit.resetTime - Date.now()) / 1000,
            ).toString(),
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": limit.remaining.toString(),
            "X-RateLimit-Reset": limit.resetTime.toString(),
          },
        },
      );
    }

    return null; // Continue to next middleware
  };
}

/**
 * Validation middleware
 */
export function validationMiddleware(
  validators: Array<(request: NextRequest) => ValidationResult>,
) {
  return async (context: MiddlewareContext): Promise<NextResponse | null> => {
    for (const validator of validators) {
      const result = validator(context.request);
      if (!result.valid) {
        const error = QHSEErrorHandler.createValidationError(result.errors);
        return NextResponse.json(QHSEErrorHandler.formatErrorResponse(error), {
          status: error.statusCode,
        });
      }
    }

    return null; // Continue to next middleware
  };
}

/**
 * Authentication middleware
 */
export function authMiddleware() {
  return async (context: MiddlewareContext): Promise<NextResponse | null> => {
    // In production, validate JWT token or session
    const authHeader = context.request.headers.get("authorization");

    if (!authHeader) {
      const error = QHSEErrorHandler.createUnauthorizedError(
        "Authentication required",
      );
      return NextResponse.json(QHSEErrorHandler.formatErrorResponse(error), {
        status: error.statusCode,
      });
    }

    // Extract user ID from token (in production, decode JWT)
    context.userId = authHeader.split(" ")[1] || undefined;

    return null; // Continue to next middleware
  };
}

/**
 * Tenant validation middleware
 */
export function tenantValidationMiddleware() {
  return async (context: MiddlewareContext): Promise<NextResponse | null> => {
    if (context.tenantId) {
      const validation = QHSEValidator.validateTenantId(context.tenantId);
      if (!validation.valid) {
        const error = QHSEErrorHandler.createValidationError(validation.errors);
        return NextResponse.json(QHSEErrorHandler.formatErrorResponse(error), {
          status: error.statusCode,
        });
      }
    }

    return null; // Continue to next middleware
  };
}

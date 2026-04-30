/**
 * Digital Signature API Middleware
 * Authentication, authorization, and rate limiting for signature APIs
 * Properly handles Next.js route handler signatures with and without params
 */

import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "./rateLimiter";
import { handleError } from "./errorHandler";
import { logger } from "./logger";

export interface SignatureAPIContext {
  userId?: string;
  tenantId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent?: string;
}

/**
 * Extract authentication from request
 */
async function extractAuth(req: NextRequest): Promise<{
  userId?: string;
  tenantId?: string;
  organizationId?: string;
}> {
  const authHeader = req.headers.get("authorization");
  const apiKey = req.headers.get("x-api-key");

  if (authHeader) {
    // Extract from Bearer token
    const token = authHeader.replace("Bearer ", "");

    try {
      // Use JWT service to verify and decode token
      const { verifyToken } = await import("@/lib/services/auth/jwtService");
      const payload = await verifyToken(token);

      return {
        userId: payload.userId,
        tenantId: payload.tenantId,
        organizationId: payload.organizationId as string | undefined,
      };
    } catch (error) {
      // If JWT verification fails, try session-based auth
      try {
        const { apiAuthMiddleware } = await import("@/middleware/apiAuth");
        const auth = await apiAuthMiddleware(req);
        if (auth.authorized && auth.context) {
          return {
            userId: auth.context.userId,
            tenantId: auth.context.tenantId,
          };
        }
      } catch (sessionError) {
        console.warn("JWT and session auth both failed:", error, sessionError);
      }
    }
  }

  if (apiKey) {
    // Validate API key and extract user info
    try {
      const { authenticateAPIKey } =
        await import("@/lib/services/api/authService");
      const ipAddress =
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown";
      const result = await authenticateAPIKey(apiKey, ipAddress);

      if (result.success && result.user) {
        return {
          userId: result.user.id,
          tenantId: result.user.tenantId,
        };
      }
    } catch (apiKeyError) {
      console.warn("API key authentication failed:", apiKeyError);
    }
  }

  return {};
}

/**
 * Create API context from request
 */
async function createContext(req: NextRequest): Promise<SignatureAPIContext> {
  const auth = await extractAuth(req);
  const ipAddress =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  return {
    ...auth,
    ipAddress,
    userAgent: req.headers.get("user-agent") || undefined,
  };
}

/**
 * Check rate limit
 */
function checkRateLimit(
  ipAddress: string,
  options: { maxRequests?: number; windowMs?: number },
): { allowed: boolean; remaining: number; resetAt: number } | null {
  const rateLimitResult = RateLimiter.check(ipAddress, {
    maxRequests: options.maxRequests || 100,
    windowMs: options.windowMs || 60000,
  });

  if (!rateLimitResult.allowed) {
    return {
      allowed: false,
      remaining: rateLimitResult.remaining,
      resetAt: rateLimitResult.resetAt,
    };
  }

  return null;
}

/**
 * Middleware options
 */
export interface MiddlewareOptions {
  requireAuth?: boolean;
  rateLimit?: boolean;
  maxRequests?: number;
  windowMs?: number;
}

/**
 * Wrapper for routes WITHOUT dynamic params
 */
export function withSignatureAPI(
  handler: (
    req: NextRequest,
    context: SignatureAPIContext,
  ) => Promise<NextResponse>,
  options: MiddlewareOptions = {},
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract auth
      const auth = await extractAuth(req);

      // Check authentication
      if (options.requireAuth !== false && !auth.userId) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication required",
            code: "UNAUTHORIZED",
          },
          { status: 401 },
        );
      }

      // Create context
      const context = await createContext(req);

      // Rate limiting
      if (options.rateLimit !== false) {
        const rateLimitError = checkRateLimit(context.ipAddress, {
          maxRequests: options.maxRequests,
          windowMs: options.windowMs,
        });

        if (rateLimitError) {
          return NextResponse.json(
            {
              success: false,
              error: "Rate limit exceeded",
              resetAt: new Date(rateLimitError.resetAt).toISOString(),
            },
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit": String(options.maxRequests || 100),
                "X-RateLimit-Remaining": String(rateLimitError.remaining),
                "X-RateLimit-Reset": String(rateLimitError.resetAt),
              },
            },
          );
        }
      }

      // Call handler
      return await handler(req, context);
    } catch (error) {
      logger.error(
        "API error",
        { path: req.url },
        error instanceof Error ? error : undefined,
      );
      const errorResponse = handleError(error);
      return NextResponse.json(
        {
          success: false,
          error: errorResponse.error,
          code: errorResponse.code,
          details: errorResponse.details,
        },
        { status: errorResponse.statusCode },
      );
    }
  };
}

/**
 * Wrapper for routes WITH dynamic params
 */
export function withSignatureAPIWithParams<T extends Record<string, string>>(
  handler: (
    req: NextRequest,
    context: SignatureAPIContext,
    { params }: { params: T },
  ) => Promise<NextResponse>,
  options: MiddlewareOptions = {},
): (req: NextRequest, context: { params: T }) => Promise<NextResponse> {
  return async (
    req: NextRequest,
    { params }: { params: T },
  ): Promise<NextResponse> => {
    try {
      // Extract auth
      const auth = await extractAuth(req);

      // Check authentication
      if (options.requireAuth !== false && !auth.userId) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication required",
            code: "UNAUTHORIZED",
          },
          { status: 401 },
        );
      }

      // Create context
      const context = await createContext(req);

      // Rate limiting
      if (options.rateLimit !== false) {
        const rateLimitError = checkRateLimit(context.ipAddress, {
          maxRequests: options.maxRequests,
          windowMs: options.windowMs,
        });

        if (rateLimitError) {
          return NextResponse.json(
            {
              success: false,
              error: "Rate limit exceeded",
              resetAt: new Date(rateLimitError.resetAt).toISOString(),
            },
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit": String(options.maxRequests || 100),
                "X-RateLimit-Remaining": String(rateLimitError.remaining),
                "X-RateLimit-Reset": String(rateLimitError.resetAt),
              },
            },
          );
        }
      }

      // Call handler with params
      return await handler(req, context, { params });
    } catch (error) {
      logger.error(
        "API error",
        { path: req.url },
        error instanceof Error ? error : undefined,
      );
      const errorResponse = handleError(error);
      return NextResponse.json(
        {
          success: false,
          error: errorResponse.error,
          code: errorResponse.code,
          details: errorResponse.details,
        },
        { status: errorResponse.statusCode },
      );
    }
  };
}

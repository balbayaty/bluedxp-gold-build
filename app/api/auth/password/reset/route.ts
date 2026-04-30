/**
 * Password Reset API Endpoints
 *
 * POST /api/auth/password/reset/request - Request password reset
 * POST /api/auth/password/reset/validate - Validate reset token
 * POST /api/auth/password/reset/complete - Complete password reset
 */

import { NextRequest, NextResponse } from "next/server";
import { passwordResetService } from "@/lib/services/auth/passwordResetService";
import { rateLimiter } from "@/lib/services/auth/rateLimiter";

/**
 * Request password reset
 * POST /api/auth/password/reset/request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, action } = body;

    // Determine action
    if (action === "validate") {
      return await handleValidateToken(request, body);
    } else if (action === "complete") {
      return await handleCompleteReset(request, body);
    } else {
      return await handleRequestReset(request, body);
    }
  } catch (error) {
    console.error("Password reset API error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
}

/**
 * Handle password reset request
 */
async function handleRequestReset(request: NextRequest, body: any) {
  const { email } = body;

  if (!email) {
    return NextResponse.json(
      { success: false, error: "Email is required" },
      { status: 400 },
    );
  }

  // Rate limit check
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateLimitResult = await rateLimiter.checkRateLimit(
    ipAddress,
    "/api/auth/password/reset",
    undefined,
    ipAddress,
  );

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error:
          rateLimitResult.reason ||
          "Too many requests. Please try again later.",
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimitResult.retryAfter?.toString() || "3600",
        },
      },
    );
  }

  const userAgent = request.headers.get("user-agent") || undefined;

  const result = await passwordResetService.requestPasswordReset({
    email,
    ipAddress,
    userAgent,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    message: result.message,
    // Only return token in development
    ...(process.env.NODE_ENV === "development" && result.token
      ? { token: result.token, expiresAt: result.expiresAt }
      : {}),
  });
}

/**
 * Handle token validation
 */
async function handleValidateToken(request: NextRequest, body: any) {
  const { token } = body;

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Token is required" },
      { status: 400 },
    );
  }

  const validation = await passwordResetService.validateResetToken(token);

  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: validation.error,
        expired: validation.expired,
        used: validation.used,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    valid: true,
    email: validation.email, // Masked email for security
  });
}

/**
 * Handle password reset completion
 */
async function handleCompleteReset(request: NextRequest, body: any) {
  const { token, newPassword } = body;

  if (!token || !newPassword) {
    return NextResponse.json(
      { success: false, error: "Token and new password are required" },
      { status: 400 },
    );
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || undefined;

  const result = await passwordResetService.completePasswordReset(
    token,
    newPassword,
    ipAddress,
    userAgent,
  );

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    message: result.message,
  });
}

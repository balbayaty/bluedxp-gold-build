/**
 * Request Password Reset API Route
 * Sends password reset email with secure token
 *
 * SECURITY: Rate limited, token-based, no user enumeration
 */

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth/authService";
import { logger } from "@/lib/services/observability/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    const result = await authService.requestPasswordReset(email);

    logger.info("Password reset requested", { email: email.toLowerCase() });

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    logger.error(
      "Error requesting password reset",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "auth",
        action: "request-password-reset",
      },
    );

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred. Please try again later.",
      },
      { status: 500 },
    );
  }
}

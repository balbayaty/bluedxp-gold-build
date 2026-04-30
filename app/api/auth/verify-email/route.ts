/**
 * Email Verification API Route
 * Verifies user email with secure token
 *
 * SECURITY: Token validation, one-time use
 */

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth/authService";
import { logger } from "@/lib/services/observability/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { success: false, error: "userId and token are required" },
        { status: 400 },
      );
    }

    const result = await authService.verifyEmail(userId, token);

    logger.info("Email verified", { userId });

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    logger.error(
      "Error verifying email",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "auth",
        action: "verify-email",
      },
    );

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to verify email",
      },
      { status: 400 },
    );
  }
}

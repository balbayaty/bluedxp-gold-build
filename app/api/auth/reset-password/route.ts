/**
 * Reset Password API Route
 * Completes password reset with token verification
 *
 * SECURITY: Token validation, password policy enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth/authService";
import { logger } from "@/lib/services/observability/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, newPassword } = body;

    if (!userId || !token || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "userId, token, and newPassword are required",
        },
        { status: 400 },
      );
    }

    await authService.resetPassword(userId, newPassword, token);

    logger.info("Password reset completed", { userId });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    logger.error(
      "Error resetting password",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "auth",
        action: "reset-password",
      },
    );

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to reset password",
      },
      { status: 400 },
    );
  }
}

/**
 * Resend Email Verification API Route
 * Resends verification email to user
 *
 * SECURITY: Rate limited, authenticated
 */

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth/authService";
import { logger } from "@/lib/services/observability/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 },
      );
    }

    const result = await authService.sendEmailVerification(userId);

    logger.info("Verification email resent", { userId });

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    logger.error(
      "Error resending verification email",
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "auth",
        action: "resend-verification",
      },
    );

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to resend verification email",
      },
      { status: 500 },
    );
  }
}

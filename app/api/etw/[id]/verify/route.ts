/**
 * ETW Verification API
 *
 * POST /api/etw/[id]/verify - Verify ETW document
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { etwQRVerificationService } from "@/lib/services/etw/qrVerificationService";

async function verifyETW(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    if (!context.userId) {
      return NextResponse.json(
        { success: false, error: "User authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 },
      );
    }

    // Get request metadata
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Verify token
    const result = await etwQRVerificationService.verifyToken(token, {
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: result.verified,
      data: result,
    });
  } catch (error) {
    console.error("[ETW API] Verify error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to verify ETW",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(verifyETW, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

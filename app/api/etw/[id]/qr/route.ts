/**
 * ETW QR Generation API
 *
 * POST /api/etw/[id]/qr - Generate QR code for ETW
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { etwQRVerificationService } from "@/lib/services/etw/qrVerificationService";

async function generateQR(
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

    const id =
      nextContext?.params?.id ||
      request.nextUrl.pathname.split("/").slice(0, -1).pop() ||
      "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ETW ID required" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const options = {
      accessPolicy: body.accessPolicy || "CUSTOMER",
      expiresInDays: body.expiresInDays || 365,
    };

    // Generate QR
    const result = await etwQRVerificationService.generateQR(
      id,
      context.tenantId,
      context.userId,
      options,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[ETW API] Generate QR error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate QR",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(generateQR, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

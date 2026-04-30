/**
 * QR Code Analytics API
 * Get analytics for QR codes
 */

import { NextRequest, NextResponse } from "next/server";
import { documentQRService } from "@/lib/services/qr/documentQRService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const qrId = searchParams.get("qrId");

    if (!qrId) {
      return NextResponse.json(
        { success: false, error: "QR ID is required" },
        { status: 400 },
      );
    }

    const analytics = await documentQRService.getAnalytics(qrId);

    if (!analytics) {
      return NextResponse.json(
        { success: false, error: "QR code not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    console.error("Error getting QR analytics:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get analytics" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.analytics",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

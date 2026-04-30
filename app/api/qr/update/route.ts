/**
 * Dynamic QR Code Update API
 * Update dynamic QR code content without reprinting
 */

import { NextRequest, NextResponse } from "next/server";
import { documentQRService } from "@/lib/services/qr/documentQRService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { qrId, updates } = body;

    if (!qrId || !updates) {
      return NextResponse.json(
        { success: false, error: "QR ID and updates are required" },
        { status: 400 },
      );
    }

    const success = await documentQRService.updateDynamicQR(qrId, updates);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update QR code or QR is not dynamic",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "QR code updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating QR code:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update QR code" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.update",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

/**
 * MSDS QR Code Generation API
 * Generate QR codes specifically for MSDS documents
 * Includes full MSDS data in QR payload for offline access
 */

import { NextRequest, NextResponse } from "next/server";
import { documentQRService } from "@/lib/services/qr/documentQRService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { msdsId, options } = body;

    if (!msdsId) {
      return NextResponse.json(
        { success: false, error: "MSDS ID is required" },
        { status: 400 },
      );
    }

    // Generate QR code with MSDS data included
    const result = await documentQRService.generateMSDSQR(msdsId, {
      dynamic: options?.dynamic !== false, // Default to true
      includeFullData: options?.includeFullData !== false, // Default to true - include MSDS data
      analytics: options?.analytics !== false, // Default to true - enable tracking
    });

    return NextResponse.json({
      success: true,
      qrCode: result.qrCode,
      qrImageUrl: result.qrImageUrl,
      downloadUrl: result.downloadUrl,
      qrId: result.qrId,
      msdsIncluded: !!result.msdsData,
      message: result.msdsData
        ? "QR code generated with MSDS data included for offline access"
        : "QR code generated (MSDS data could not be loaded)",
    });
  } catch (error: any) {
    console.error("Error generating MSDS QR code:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate MSDS QR code",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.msds",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

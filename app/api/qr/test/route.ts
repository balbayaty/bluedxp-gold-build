/**
 * QR Code Testing & Verification API
 * Test QR code generation and verification
 */

import { NextRequest, NextResponse } from "next/server";
import { documentQRService } from "@/lib/services/qr/documentQRService";
import { verifyQRCode } from "@/lib/utils/qrVerification";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, msdsId, qrCode } = body;

    if (action === "verify") {
      if (!qrCode) {
        return NextResponse.json(
          { success: false, error: "QR code is required for verification" },
          { status: 400 },
        );
      }

      const verification = verifyQRCode(qrCode);
      return NextResponse.json({
        success: true,
        verification,
      });
    }

    if (action === "test-msds") {
      if (!msdsId) {
        return NextResponse.json(
          { success: false, error: "MSDS ID is required" },
          { status: 400 },
        );
      }

      // Generate QR code
      const result = await documentQRService.generateMSDSQR(msdsId, {
        includeFullData: true,
        analytics: true,
      });

      // Verify it
      const verification = verifyQRCode(result.qrCode);

      return NextResponse.json({
        success: true,
        qrCode: result.qrCode,
        qrId: result.qrId,
        qrImageUrl: result.qrImageUrl,
        msdsIncluded: !!result.msdsData,
        verification,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "verify" or "test-msds"' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR test:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to test QR code" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.test",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

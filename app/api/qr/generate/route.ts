/**
 * QR Code Generation API
 * Generate QR codes for documents, containers, chemicals
 */

import { NextRequest, NextResponse } from "next/server";
import { documentQRService } from "@/lib/services/qr/documentQRService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { documentId, documentType, documentUrl, options } = body;

    if (!documentId || !documentType) {
      return NextResponse.json(
        { success: false, error: "Document ID and type are required" },
        { status: 400 },
      );
    }

    const result = await documentQRService.generateDocumentQR({
      documentId,
      documentType,
      documentUrl,
      dynamic: options?.dynamic || true,
      analytics: options?.analytics || true,
      accessLevel: options?.accessLevel || "internal",
      customData: options?.customData,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate QR code" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.generate",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

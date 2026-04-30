/**
 * ETW Proof Bundle Export API
 *
 * GET /api/etw/[id]/export/proof-bundle - Export proof bundle (PDF + JSON + signature + logs)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { etwQRVerificationService, etwPDFService } from "@/lib/services/etw";

async function exportProofBundle(
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

    const id =
      nextContext?.params?.id ||
      request.nextUrl.pathname.split("/").slice(0, -2).pop() ||
      "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ETW ID required" },
        { status: 400 },
      );
    }

    // Generate proof bundle
    const bundle = await etwQRVerificationService.generateProofBundle(
      id,
      context.tenantId,
    );

    // Generate PDF
    const pdfBuffer = await etwPDFService.generatePDF(bundle.etw, {
      includeQR: true,
      includeSignature: true,
      language: "en",
    });

    // Create ZIP file using Node.js built-in zlib (no external dependency needed)
    // For simplicity, return JSON response with download links
    // In production, use a proper ZIP library like 'archiver' or 'jszip'
    const proofData = {
      etw: bundle.etw,
      events: bundle.events,
      verificationPayload: bundle.verificationPayload,
      signature: bundle.signature,
      timestamp: bundle.timestamp.toISOString(),
      pdfBase64: pdfBuffer.toString("base64"),
    };

    // Return JSON for now (can be enhanced with actual ZIP later)
    return NextResponse.json(proofData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="ETW-${bundle.etw.etwNumber}-proof-bundle.json"`,
      },
    });
  } catch (error) {
    console.error("[ETW API] Proof bundle export error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to export proof bundle",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(exportProofBundle, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "export",
  requireAuth: true,
  rateLimit: true,
});

/**
 * ETW PDF Export API
 *
 * GET /api/etw/[id]/export/pdf - Export ETW as PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { etwService, etwPDFService } from "@/lib/services/etw";

async function exportPDF(
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

    // Get ETW
    const etw = await etwService.get(id, context.tenantId);
    if (!etw) {
      return NextResponse.json(
        { success: false, error: "ETW not found" },
        { status: 404 },
      );
    }

    // Get options from query params
    const { searchParams } = new URL(request.url);
    const includeQR = searchParams.get("includeQR") !== "false";
    const includeSignature = searchParams.get("includeSignature") !== "false";
    const language = (searchParams.get("language") || "en") as "en" | "ar";

    // Generate PDF
    const pdfBuffer = await etwPDFService.generatePDF(etw, {
      includeQR,
      includeSignature,
      language,
    });

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ETW-${etw.etwNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[ETW API] PDF export error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to export PDF",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(exportPDF, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "export",
  requireAuth: true,
  rateLimit: true,
});

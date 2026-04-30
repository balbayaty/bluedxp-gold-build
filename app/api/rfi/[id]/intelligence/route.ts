/**
 * RFI Intelligence API Route
 * Get intelligent recommendations, risk predictions, and insights
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { rfiService } from "@/lib/services/proposals/RFIService";
import { rfiIntelligenceService } from "@/lib/services/proposals/rfiIntelligenceService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function GETHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const rfiId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";

    if (!rfiId) {
      return NextResponse.json(
        { success: false, error: "RFI ID is required" },
        { status: 400 },
      );
    }

    const rfi = await rfiService.getRFI(rfiId, tenantId);

    if (!rfi) {
      return NextResponse.json(
        { success: false, error: "RFI not found" },
        { status: 404 },
      );
    }

    const analysis = await rfiService.analyzeRFI(rfiId, tenantId);
    const intelligence = await rfiIntelligenceService.getIntelligence(
      rfi,
      analysis,
    );

    return NextResponse.json({
      success: true,
      data: intelligence,
    });
  } catch (error) {
    console.error("Error getting RFI intelligence:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(GETHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.rfi",
  action: "read",
  requireAuth: true,
});

/**
 * RFI Analysis API Route
 * Get intelligent analysis of RFI
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { rfiService } from "@/lib/services/proposals/RFIService";
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

    const analysis = await rfiService.analyzeRFI(rfiId, tenantId);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Error analyzing RFI:", error);
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

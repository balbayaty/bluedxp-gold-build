/**
 * RFI to Proposal Generation API Route
 * Automatically generate Proposal from RFI
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { rfiService } from "@/lib/services/proposals/RFIService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function POSTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const rfiId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const userId = context.userId || "system";

    if (!rfiId) {
      return NextResponse.json(
        { success: false, error: "RFI ID is required" },
        { status: 400 },
      );
    }

    const result = await rfiService.generateProposalFromRFI(
      rfiId,
      tenantId,
      userId,
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: "Proposal generated successfully from RFI",
    });
  } catch (error) {
    console.error("Error generating Proposal from RFI:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(POSTHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.rfi",
  action: "write",
  requireAuth: true,
});

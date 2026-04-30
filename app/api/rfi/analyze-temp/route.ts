/**
 * Temporary RFI Analysis API
 * Analyzes RFI data without creating a record
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { rfiService } from "@/lib/services/proposals/RFIService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    // Use the public analyzeRFIDataDirect method for efficient temporary analysis
    // This doesn't require creating/deleting RFIs
    const analysis = rfiService.analyzeRFIDataDirect(body);

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

export const POST = withAPIGateway(POSTHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.rfi",
  action: "read",
  requireAuth: true,
});

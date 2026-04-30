/**
 * Period Closing Initialization API
 * POST /api/finance/period-closing/initialize
 */

import { NextRequest, NextResponse } from "next/server";
import { periodClosingService } from "@/lib/services/finance/periodClosingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { periodId } = body;

    if (!periodId) {
      return NextResponse.json(
        {
          success: false,
          error: "Period ID is required",
        },
        { status: 400 },
      );
    }

    const closing = await periodClosingService.initializePeriodClosing(
      tenantId,
      periodId,
    );

    return NextResponse.json({
      success: true,
      data: closing,
    });
  } catch (error: any) {
    console.error("Error initializing period closing:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to initialize period closing",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.period-closing",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

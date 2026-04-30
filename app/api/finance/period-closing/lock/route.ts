/**
 * Lock Period API
 * POST /api/finance/period-closing/lock
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

    const period = await periodClosingService.lockPeriod(
      tenantId,
      periodId,
      context.userId,
    );

    return NextResponse.json({
      success: true,
      data: period,
    });
  } catch (error: any) {
    console.error("Error locking period:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to lock period",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.period-closing",
  action: "approve",
  requireAuth: true,
  rateLimit: true,
});

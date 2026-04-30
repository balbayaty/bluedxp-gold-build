/**
 * Variance Analysis API
 * GET /api/finance/fpa/variance
 */

import { NextRequest, NextResponse } from "next/server";
import { fpaService } from "@/lib/services/finance/fpaService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const planId = searchParams.get("planId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!planId || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Plan ID, start date, and end date are required",
        },
        { status: 400 },
      );
    }

    const variance = await fpaService.analyzeVariance(tenantId, planId, {
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: variance,
    });
  } catch (error: any) {
    console.error("Error analyzing variance:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze variance",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.fpa.variance",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

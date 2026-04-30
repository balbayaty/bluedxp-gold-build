/**
 * Consolidation API
 * POST /api/finance/consolidation/consolidate
 */

import { NextRequest, NextResponse } from "next/server";
import { consolidationService } from "@/lib/services/finance/consolidationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { consolidationPeriodId, action } = body;

    if (!consolidationPeriodId) {
      return NextResponse.json(
        {
          success: false,
          error: "Consolidation period ID is required",
        },
        { status: 400 },
      );
    }

    if (action === "complete") {
      const period = await consolidationService.completeConsolidation(
        tenantId,
        consolidationPeriodId,
        context.userId,
      );
      return NextResponse.json({
        success: true,
        data: period,
      });
    } else if (action === "generate-statements") {
      const statements =
        await consolidationService.generateConsolidatedStatements(
          tenantId,
          consolidationPeriodId,
        );
      return NextResponse.json({
        success: true,
        data: statements,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action",
        },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error("Error processing consolidation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process consolidation",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.consolidation",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

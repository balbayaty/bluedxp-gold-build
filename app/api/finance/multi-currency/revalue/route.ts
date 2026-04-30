/**
 * Currency Revaluation API
 * POST /api/finance/multi-currency/revalue
 */

import { NextRequest, NextResponse } from "next/server";
import { multiCurrencyService } from "@/lib/services/finance/multiCurrencyService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { revaluationDate, accountCode, currency } = body;

    if (!revaluationDate || !accountCode || !currency) {
      return NextResponse.json(
        {
          success: false,
          error: "Revaluation date, account code, and currency are required",
        },
        { status: 400 },
      );
    }

    const revaluation = await multiCurrencyService.revalueCurrencyBalances(
      tenantId,
      revaluationDate,
      accountCode,
      currency,
    );

    return NextResponse.json({
      success: true,
      data: revaluation,
    });
  } catch (error: any) {
    console.error("Error revaluing currency:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to revalue currency",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.multi-currency",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

/**
 * Tax Calculation API
 * POST /api/finance/tax/calculate
 */

import { NextRequest, NextResponse } from "next/server";
import { taxManagementService } from "@/lib/services/finance/taxManagementService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { taxableAmount, taxType, transactionType, date } = body;

    if (!taxableAmount || !taxType || !transactionType || !date) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Taxable amount, tax type, transaction type, and date are required",
        },
        { status: 400 },
      );
    }

    const result = await taxManagementService.calculateTax(
      tenantId,
      taxableAmount,
      taxType,
      transactionType,
      date,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error calculating tax:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to calculate tax",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.tax",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

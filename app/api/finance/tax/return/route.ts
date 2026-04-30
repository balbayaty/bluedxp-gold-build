/**
 * Tax Return API
 * POST /api/finance/tax/return
 */

import { NextRequest, NextResponse } from "next/server";
import { taxManagementService } from "@/lib/services/finance/taxManagementService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { returnType, period, action } = body;

    if (!returnType || !period) {
      return NextResponse.json(
        {
          success: false,
          error: "Return type and period are required",
        },
        { status: 400 },
      );
    }

    if (action === "generate") {
      const taxReturn = await taxManagementService.generateTaxReturn(
        tenantId,
        returnType,
        period,
      );
      return NextResponse.json({
        success: true,
        data: taxReturn,
      });
    } else if (action === "submit") {
      const { returnId } = body;
      if (!returnId) {
        return NextResponse.json(
          {
            success: false,
            error: "Return ID is required for submission",
          },
          { status: 400 },
        );
      }
      const taxReturn = await taxManagementService.submitTaxReturn(
        tenantId,
        returnId,
      );
      return NextResponse.json({
        success: true,
        data: taxReturn,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use "generate" or "submit"',
        },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error("Error processing tax return:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process tax return",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.tax.return",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

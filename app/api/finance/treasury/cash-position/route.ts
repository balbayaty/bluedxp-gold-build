/**
 * Cash Position API
 * GET /api/finance/treasury/cash-position
 */

import { NextRequest, NextResponse } from "next/server";
import { treasuryService } from "@/lib/services/finance/treasuryService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const bankAccountId = searchParams.get("bankAccountId") || "";
    const date = searchParams.get("date") || new Date().toISOString();

    if (!bankAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Bank account ID is required",
        },
        { status: 400 },
      );
    }

    const position = await treasuryService.getCashPosition(
      tenantId,
      bankAccountId,
      date,
    );

    return NextResponse.json({
      success: true,
      data: position,
    });
  } catch (error: any) {
    console.error("Error getting cash position:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get cash position",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.treasury.cash-position",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

/**
 * Currency Exposure API
 * GET /api/procurement/currency/exposure
 */

import { NextRequest, NextResponse } from "next/server";
import { currencyManagementService } from "@/lib/services/procurement/currencyManagementService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const currency = searchParams.get("currency") || "USD";

    const exposure = await currencyManagementService.calculateCurrencyExposure(
      tenantId,
      currency,
    );

    return NextResponse.json({
      success: true,
      data: exposure,
    });
  } catch (error: any) {
    console.error("Error calculating currency exposure:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to calculate currency exposure",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.currency.exposure",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

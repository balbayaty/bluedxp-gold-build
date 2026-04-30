/**
 * Early Payment Discount Opportunities API
 * GET /api/procurement/payments/discount-opportunities
 */

import { NextRequest, NextResponse } from "next/server";
import { paymentProcessingService } from "@/lib/services/procurement/paymentProcessingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";
    const daysAhead = parseInt(searchParams.get("daysAhead") || "30");

    const opportunities =
      await paymentProcessingService.getEarlyPaymentDiscountOpportunities(
        tenantId,
        daysAhead,
      );

    return NextResponse.json({
      success: true,
      data: opportunities,
    });
  } catch (error: any) {
    console.error("Error getting discount opportunities:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get discount opportunities",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "procurement",
  featureId: "procurement.payments.discount-opportunities",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

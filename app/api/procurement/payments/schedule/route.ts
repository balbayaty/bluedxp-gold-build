/**
 * Payment Schedule API
 * POST /api/procurement/payments/schedule
 */

import { NextRequest, NextResponse } from "next/server";
import { paymentProcessingService } from "@/lib/services/procurement/paymentProcessingService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, invoiceId, paymentTerm } = body;

    if (!tenantId || !invoiceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID and invoice ID are required",
        },
        { status: 400 },
      );
    }

    const schedule = await paymentProcessingService.schedulePayment(
      tenantId,
      invoiceId,
      paymentTerm,
    );

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    console.error("Error scheduling payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to schedule payment",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.payments.schedule",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

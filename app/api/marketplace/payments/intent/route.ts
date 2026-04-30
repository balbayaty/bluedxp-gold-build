import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/lib/services/marketplace/paymentService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { bookingId, amount, method, metadata } = body;

    if (!bookingId || !amount || !method) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: bookingId, amount, method",
        },
        { status: 400 },
      );
    }

    const intent = await paymentService.createPaymentIntent(
      bookingId,
      amount,
      method,
      metadata,
    );

    return NextResponse.json({
      success: true,
      data: intent,
    });
  } catch (error: any) {
    console.error("Failed to create payment intent:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create payment intent",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.payments.intent",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

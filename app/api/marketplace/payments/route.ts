import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/lib/services/marketplace/paymentService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get("bookingId");
    const customerId = searchParams.get("customerId");
    const providerId = searchParams.get("providerId");

    if (bookingId) {
      const payments = await paymentService.getPaymentsByBooking(bookingId);
      return NextResponse.json({
        success: true,
        data: payments,
        count: payments.length,
      });
    }

    if (customerId) {
      const payments = await paymentService.getPaymentsByCustomer(customerId);
      return NextResponse.json({
        success: true,
        data: payments,
        count: payments.length,
      });
    }

    if (providerId) {
      const stats = await paymentService.getPaymentStats(providerId);
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    return NextResponse.json(
      { success: false, error: "Missing required parameter" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Failed to get payments:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get payments" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { intentId, paymentData } = body;

    if (!intentId || !paymentData) {
      return NextResponse.json(
        { success: false, error: "Missing intentId or paymentData" },
        { status: 400 },
      );
    }

    const payment = await paymentService.processPayment(intentId, paymentData);

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error("Failed to process payment:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process payment" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.payments",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.payments",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

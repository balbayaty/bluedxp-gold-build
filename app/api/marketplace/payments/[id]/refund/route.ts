import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/lib/services/marketplace/paymentService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { amount, reason } = body;

    if (!amount) {
      return NextResponse.json(
        { success: false, error: "Missing refund amount" },
        { status: 400 },
      );
    }

    const refundedPayment = await paymentService.refundPayment(
      id,
      amount,
      reason,
    );

    if (!refundedPayment) {
      return NextResponse.json(
        { success: false, error: "Payment not found or refund failed" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: refundedPayment,
    });
  } catch (error: any) {
    console.error("Failed to refund payment:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to refund payment" },
      { status: 500 },
    );
  }
}

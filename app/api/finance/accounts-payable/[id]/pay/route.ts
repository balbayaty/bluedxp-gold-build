/**
 * Accounts Payable Payment API
 * POST /api/finance/accounts-payable/[id]/pay - Record payment for AP invoice
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { amount, paymentMethod, reference, paymentDate } = body;

    // In production, this would:
    // 1. Validate the payment amount
    // 2. Create a payment record
    // 3. Update the invoice status
    // 4. Create GL entries for the payment
    // 5. Update cash/bank account

    const payment = {
      id: `PAY-${Date.now()}`,
      invoiceId: params.id,
      amount,
      paymentMethod: paymentMethod || "BANK_TRANSFER",
      reference: reference || `Payment for invoice ${params.id}`,
      paymentDate: paymentDate || new Date().toISOString(),
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: payment,
      message: "Payment recorded successfully",
    });
  } catch (error: any) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record payment" },
      { status: 500 },
    );
  }
}

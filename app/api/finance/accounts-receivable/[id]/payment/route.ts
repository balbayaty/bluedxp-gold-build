/**
 * Accounts Receivable Payment API
 * POST /api/finance/accounts-receivable/[id]/payment - Record payment received for AR invoice
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { amount, paymentMethod, reference, receivedDate } = body;

    // In production, this would:
    // 1. Validate the payment amount
    // 2. Create a receipt record
    // 3. Update the invoice status
    // 4. Create GL entries for the receipt
    // 5. Update cash/bank account

    const receipt = {
      id: `REC-${Date.now()}`,
      invoiceId: params.id,
      amount,
      paymentMethod: paymentMethod || "BANK_TRANSFER",
      reference: reference || `Payment received for invoice ${params.id}`,
      receivedDate: receivedDate || new Date().toISOString(),
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: receipt,
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

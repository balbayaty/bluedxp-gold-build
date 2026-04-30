/**
 * 💰 BILLING PAYMENTS API
 * 
 * Payment processing
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { billingService } from "@/lib/services/billing/billingService";

// POST - Process payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, amount, paymentMethod, paymentMethodId, paymentMethodDetails } = body;

    if (!invoiceId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "invoiceId, amount, and paymentMethod are required" },
        { status: 400 }
      );
    }

    const payment = await billingService.processPayment({
      invoiceId,
      amount,
      paymentMethod,
      paymentMethodId,
      paymentMethodDetails,
    });

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("[Billing] Error processing payment:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}

/**
 * 💰 BILLING INVOICE DETAIL API
 * 
 * Get, void, send invoice
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { billingService } from "@/lib/services/billing/billingService";
import { prisma } from "@/lib/services/database/prismaClient";

// GET - Get invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await billingService.getInvoice(params.id);

    // Check authorization
    if (invoice.userId !== session.user.id && !["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN", "FINANCE_ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("[Billing] Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

// DELETE - Void invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason");

    const invoice = await billingService.voidInvoice(params.id, reason || undefined);

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("[Billing] Error voiding invoice:", error);
    return NextResponse.json(
      { error: "Failed to void invoice" },
      { status: 500 }
    );
  }
}

// POST - Send invoice
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await billingService.sendInvoice(params.id);

    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully",
    });
  } catch (error) {
    console.error("[Billing] Error sending invoice:", error);
    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 }
    );
  }
}

/**
 * 💰 BILLING INVOICES API
 * 
 * Invoice management
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { billingService } from "@/lib/services/billing/billingService";
import { prisma } from "@/lib/services/database/prismaClient";

// GET - List invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow demo mode if no session
    const tenantId = session?.user?.tenantId || 
                     request.headers.get("x-tenant-id") || 
                     process.env.BOOTSTRAP_TENANT_ID || 
                     "default-tenant";
    const userId = session?.user?.id || 
                   request.headers.get("x-user-id") || 
                   "demo-user";

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    const invoices = await prisma.billing_invoices.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.billing_invoices.count({ where });

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("[Billing] Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST - Generate invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const invoice = await billingService.generateInvoice({
      tenantId: session.user.tenantId || "",
      userId: session.user.id,
      subscriptionId: body.subscriptionId,
      type: body.type || "subscription",
      lineItems: body.lineItems || [],
      dueDate: body.dueDate,
      discounts: body.discounts,
      credits: body.credits,
      metadata: body.metadata,
    });

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("[Billing] Error generating invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}

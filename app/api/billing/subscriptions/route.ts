/**
 * 💰 BILLING SUBSCRIPTIONS API
 * 
 * Comprehensive subscription management
 * Inspired by OpenAI, Claude, Stripe, Vercel billing interfaces
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { billingService } from "@/lib/services/billing/billingService";
import { prisma } from "@/lib/services/database/prismaClient";

// GET - List subscriptions
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

    // Get subscriptions
    const subscriptions = await prisma.billing_subscriptions.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error("[Billing] Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

// POST - Create subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, billingCycle, quantity, addons, paymentMethodId, trialDays } = body;

    if (!planId || !billingCycle) {
      return NextResponse.json(
        { error: "planId and billingCycle are required" },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await billingService.createSubscription({
      tenantId: session.user.tenantId || "",
      userId: session.user.id,
      planId,
      billingCycle,
      quantity,
      addons,
      paymentMethodId,
      trialDays,
    });

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("[Billing] Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

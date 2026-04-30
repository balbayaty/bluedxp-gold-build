/**
 * 💳 BILLING MANAGEMENT ENDPOINT - PRODUCTION
 * 
 * UPDATED: Now uses comprehensive billing system
 * Backward compatible with old billing_info table
 * 
 * Full database integration with:
 * - Subscription management (uses billing_subscriptions)
 * - Payment method handling
 * - Invoice history (uses billing_invoices)
 * - Plan upgrades/downgrades
 * 
 * BlueDXP Platform - Production Ready
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/services/database/prismaClient";
import { billingService } from "@/lib/services/billing/billingService";
import { subscriptionService } from "@/lib/services/billing/subscriptionService";
import crypto from "crypto";

// Plan definitions
const PLANS = {
  FREE: {
    id: "FREE",
    name: "Free Plan",
    price: 0,
    features: ["5 users", "Basic analytics", "Email support"],
    limits: { users: 5, apiCalls: 1000, storage: 1073741824 },
  },
  STARTER: {
    id: "STARTER",
    name: "Starter Plan",
    price: 49,
    features: ["25 users", "Advanced analytics", "Priority support", "API access"],
    limits: { users: 25, apiCalls: 50000, storage: 10737418240 },
  },
  PROFESSIONAL: {
    id: "PROFESSIONAL",
    name: "Professional Plan",
    price: 199,
    features: ["100 users", "Full analytics", "24/7 support", "Unlimited API", "Custom integrations"],
    limits: { users: 100, apiCalls: 500000, storage: 107374182400 },
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise Plan",
    price: 999,
    features: ["Unlimited users", "Enterprise analytics", "Dedicated support", "SLA", "Custom development"],
    limits: { users: -1, apiCalls: -1, storage: -1 },
  },
};

// GET - Fetch billing info for user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = params.id;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Check authorization
    const isOwnData = session?.user?.id === userId;
    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN", "FINANCE_ADMIN"].includes(
      session?.user?.role as string
    );

    if (!isOwnData && !isAdmin && session?.user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Try to get subscription from new billing system first
    let subscription = await prisma.billing_subscriptions.findFirst({
      where: {
        userId,
        status: {
          not: "canceled",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fallback to old billing_info if no subscription exists
    let billingInfo = null;
    if (!subscription) {
      billingInfo = await prisma.billing_info.findUnique({
        where: { userId },
      });

      // Create default subscription if neither exists
      if (!billingInfo) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { tenantId: true },
        });

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create subscription in new system
        subscription = await subscriptionService.createSubscription({
          tenantId: user.tenantId,
          userId: user.id,
          planId: "free",
          planName: "Free Plan",
          billingCycle: "monthly",
          basePrice: 0,
          totalPrice: 0,
          currency: "SAR",
        });
      } else {
        // Migrate old billing_info to new system
        subscription = await subscriptionService.createSubscription({
          tenantId: billingInfo.tenantId,
          userId: billingInfo.userId,
          planId: billingInfo.plan || "free",
          planName: billingInfo.planDisplayName || "Free Plan",
          billingCycle: (billingInfo.billingCycle || "MONTHLY").toLowerCase(),
          basePrice: Number(billingInfo.nextInvoiceAmount) || 0,
          totalPrice: Number(billingInfo.nextInvoiceAmount) || 0,
          currency: billingInfo.currency || "SAR",
          paymentMethodId: billingInfo.paymentMethodId,
          autoRenew: billingInfo.autoRenew ?? true,
        });
      }
    }

    // Get plan details
    const planId = subscription.planId.toUpperCase();
    const planDetails = PLANS[planId as keyof typeof PLANS] || PLANS.FREE;

    // Get usage for current period
    const now = new Date();
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    
    const usageMetrics = await prisma.usage_metrics.groupBy({
      by: ["metricType"],
      where: {
        userId,
        billingMonth,
      },
      _sum: {
        quantity: true,
        totalCost: true,
      },
    });

    const usage = usageMetrics.reduce((acc, m) => {
      acc[m.metricType] = {
        quantity: m._sum.quantity || 0,
        cost: m._sum.totalCost || 0,
      };
      return acc;
    }, {} as Record<string, { quantity: number; cost: number }>);

    // Get invoices from new system
    const invoices = await prisma.billing_invoices.findMany({
      where: {
        userId,
      },
      orderBy: {
        invoiceDate: "desc",
      },
      take: 10,
    });

    // Get payment method from subscription or old billing_info
    let paymentMethod = null;
    if (subscription.paymentMethodId) {
      // Try to get from payment methods table or use subscription metadata
      paymentMethod = {
        last4: (subscription.metadata as any)?.paymentMethodLast4,
        brand: (subscription.metadata as any)?.paymentMethodBrand,
      };
    } else if (billingInfo?.paymentMethodId) {
      paymentMethod = {
        last4: billingInfo.paymentMethodLast4,
        brand: billingInfo.paymentMethodBrand,
      };
    }

    // Build response (backward compatible format)
    const response = {
      plan: {
        id: subscription.planId,
        name: planDetails.name,
        price: planDetails.price,
        features: planDetails.features,
        limits: planDetails.limits,
      },
      subscription: {
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        autoRenew: subscription.autoRenew,
      },
      paymentMethod,
      usage,
      nextInvoice: {
        amount: Number(subscription.totalPrice) || planDetails.price,
        currency: subscription.currency,
        dueDate: subscription.currentPeriodEnd,
      },
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.invoiceDate,
        amount: Number(inv.total),
        status: inv.status,
      })),
      availablePlans: Object.values(PLANS),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("[Billing] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing info" },
      { status: 500 }
    );
  }
}

// PUT - Update billing info (upgrade/downgrade plan)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    const body = await request.json();

    // Check authorization
    const isOwnData = session.user.id === userId;
    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN", "FINANCE_ADMIN"].includes(
      session.user.role as string
    );

    if (!isOwnData && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { plan, billingCycle, autoRenew, paymentMethod } = body;

    // Get existing billing info
    const existing = await prisma.billing_info.findUnique({
      where: { userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Billing info not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};

    if (plan && PLANS[plan as keyof typeof PLANS]) {
      const planDetails = PLANS[plan as keyof typeof PLANS];
      updateData.plan = plan;
      updateData.planDisplayName = planDetails.name;
    }

    if (billingCycle && ["MONTHLY", "ANNUAL"].includes(billingCycle)) {
      updateData.billingCycle = billingCycle;
    }

    if (autoRenew !== undefined) {
      updateData.autoRenew = autoRenew;
    }

    if (paymentMethod) {
      updateData.paymentMethodId = paymentMethod.id;
      updateData.paymentMethodLast4 = paymentMethod.last4;
      updateData.paymentMethodBrand = paymentMethod.brand;
    }

    const updated = await prisma.billing_info.update({
      where: { userId },
      data: updateData,
    });

    // Log to audit
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId: session.user.id,
        tenantId: existing.tenantId,
        eventType: "BILLING_UPDATED",
        eventCategory: "BILLING",
        action: "UPDATE",
        resource: "billing_info",
        resourceId: updated.id,
        description: `Billing updated: ${JSON.stringify(updateData)}`,
        metadata: { previousPlan: existing.plan, newPlan: updated.plan },
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Billing info updated",
      data: updated,
    });
  } catch (error) {
    console.error("[Billing] Error updating:", error);
    return NextResponse.json(
      { error: "Failed to update billing info" },
      { status: 500 }
    );
  }
}

// POST - Add payment method
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    const body = await request.json();

    const isOwnData = session.user.id === userId;
    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN", "FINANCE_ADMIN"].includes(
      session.user.role as string
    );

    if (!isOwnData && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { paymentMethodToken, last4, brand } = body;

    if (!paymentMethodToken || !last4 || !brand) {
      return NextResponse.json(
        { error: "paymentMethodToken, last4, and brand are required" },
        { status: 400 }
      );
    }

    // Update billing info with new payment method
    const updated = await prisma.billing_info.update({
      where: { userId },
      data: {
        paymentMethodId: paymentMethodToken,
        paymentMethodLast4: last4,
        paymentMethodBrand: brand,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment method added",
      data: {
        last4: updated.paymentMethodLast4,
        brand: updated.paymentMethodBrand,
      },
    });
  } catch (error) {
    console.error("[Billing] Error adding payment method:", error);
    return NextResponse.json(
      { error: "Failed to add payment method" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason");

    const isOwnData = session.user.id === userId;
    const isAdmin = ["SYSTEM_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN"].includes(
      session.user.role as string
    );

    if (!isOwnData && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.billing_info.findUnique({
      where: { userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Billing info not found" }, { status: 404 });
    }

    // Cancel subscription
    const updated = await prisma.billing_info.update({
      where: { userId },
      data: {
        status: "CANCELLED",
        autoRenew: false,
        cancelledAt: new Date(),
        cancelReason: reason || "User requested cancellation",
      },
    });

    // Log to audit
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId: session.user.id,
        tenantId: existing.tenantId,
        eventType: "SUBSCRIPTION_CANCELLED",
        eventCategory: "BILLING",
        action: "CANCEL",
        resource: "billing_info",
        resourceId: updated.id,
        description: `Subscription cancelled: ${reason || "User requested"}`,
        metadata: { plan: existing.plan, reason },
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled",
      data: {
        status: updated.status,
        accessUntil: updated.currentPeriodEnd,
      },
    });
  } catch (error) {
    console.error("[Billing] Error cancelling:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

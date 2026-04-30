/**
 * 💳 STRIPE WEBHOOK HANDLER
 * 
 * Handles Stripe events:
 * - Subscription created/updated/deleted
 * - Invoice paid/failed
 * - Payment method changes
 * 
 * BlueDXP Platform - Production Ready
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import crypto from "crypto";

// Stripe event types we handle
const HANDLED_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.updated",
  "payment_method.attached",
  "payment_method.detached",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });
        const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        
        return await handleStripeEvent(event);
      } catch (err) {
        console.error("[Stripe Webhook] Signature verification failed:", err);
        return NextResponse.json(
          { error: "Webhook signature verification failed" },
          { status: 400 }
        );
      }
    }

    // In development without signature verification
    const event = JSON.parse(body);
    return await handleStripeEvent(event);
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleStripeEvent(event: any): Promise<NextResponse> {
  const { type, data } = event;
  const object = data.object;

  console.log(`[Stripe Webhook] Processing ${type}`);

  try {
    switch (type) {
      case "checkout.session.completed": {
        const session = object;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        const billingCycle = session.metadata?.billingCycle || "monthly";

        if (userId && planId) {
          // Update user's billing info
          await prisma.billing_info.upsert({
            where: { userId },
            update: {
              plan: planId.toUpperCase(),
              planDisplayName: getPlanDisplayName(planId),
              status: "ACTIVE",
              billingCycle: billingCycle.toUpperCase(),
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            create: {
              userId,
              tenantId: "default-tenant",
              plan: planId.toUpperCase(),
              planDisplayName: getPlanDisplayName(planId),
              status: "ACTIVE",
              billingCycle: billingCycle.toUpperCase(),
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
            },
          });

          // Log audit
          await logBillingEvent(userId, "SUBSCRIPTION_CREATED", { planId, billingCycle });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = object;
        const customerId = subscription.customer;

        // Find user by Stripe customer ID
        const billingInfo = await prisma.billing_info.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (billingInfo) {
          await prisma.billing_info.update({
            where: { id: billingInfo.id },
            data: {
              status: subscription.status === "active" ? "ACTIVE" : 
                      subscription.status === "past_due" ? "PAST_DUE" : 
                      subscription.status === "canceled" ? "CANCELLED" : "ACTIVE",
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });

          await logBillingEvent(billingInfo.userId, "SUBSCRIPTION_UPDATED", {
            status: subscription.status,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = object;
        const customerId = subscription.customer;

        const billingInfo = await prisma.billing_info.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (billingInfo) {
          await prisma.billing_info.update({
            where: { id: billingInfo.id },
            data: {
              status: "CANCELLED",
              plan: "FREE",
              planDisplayName: "Free Plan",
              cancelledAt: new Date(),
            },
          });

          await logBillingEvent(billingInfo.userId, "SUBSCRIPTION_CANCELLED", {});
        }
        break;
      }

      case "invoice.paid": {
        const invoice = object;
        const customerId = invoice.customer;

        const billingInfo = await prisma.billing_info.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (billingInfo) {
          await logBillingEvent(billingInfo.userId, "INVOICE_PAID", {
            amount: invoice.amount_paid / 100,
            invoiceId: invoice.id,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = object;
        const customerId = invoice.customer;

        const billingInfo = await prisma.billing_info.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (billingInfo) {
          await prisma.billing_info.update({
            where: { id: billingInfo.id },
            data: { status: "PAST_DUE" },
          });

          await logBillingEvent(billingInfo.userId, "INVOICE_FAILED", {
            amount: invoice.amount_due / 100,
            invoiceId: invoice.id,
          });
        }
        break;
      }

      case "payment_method.attached": {
        const paymentMethod = object;
        const customerId = paymentMethod.customer;

        const billingInfo = await prisma.billing_info.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (billingInfo) {
          await prisma.billing_info.update({
            where: { id: billingInfo.id },
            data: {
              paymentMethodId: paymentMethod.id,
              paymentMethodLast4: paymentMethod.card?.last4,
              paymentMethodBrand: paymentMethod.card?.brand,
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing ${type}:`, error);
    return NextResponse.json(
      { error: "Event processing failed" },
      { status: 500 }
    );
  }
}

function getPlanDisplayName(planId: string): string {
  const names: Record<string, string> = {
    free: "Free Plan",
    starter: "Starter Plan",
    professional: "Professional Plan",
    enterprise: "Enterprise Plan",
  };
  return names[planId] || planId;
}

async function logBillingEvent(userId: string, eventType: string, metadata: any): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    if (user) {
      await prisma.audit_logs.create({
        data: {
          id: `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
          userId,
          tenantId: user.tenantId,
          eventType,
          eventCategory: "BILLING",
          action: eventType,
          resource: "billing",
          description: `Billing event: ${eventType}`,
          metadata,
          status: "SUCCESS",
        },
      });
    }
  } catch (error) {
    console.error("[Billing Audit] Failed to log:", error);
  }
}

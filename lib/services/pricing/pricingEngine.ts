/**
 * Pricing Engine Service
 * Subscription pricing, usage-based pricing, discounts, and invoicing
 */

import { prisma } from "@/lib/services/database/prismaClient";

export interface PricingCalculation {
  basePrice: number;
  usageCharges: number;
  discounts: number;
  taxes: number;
  total: number;
  currency: string;
}

export interface SubscriptionOptions {
  tenantId: string;
  planId: string;
  startDate: Date;
  endDate?: Date;
  autoRenew?: boolean;
}

export class PricingEngine {
  /**
   * Calculate pricing for a plan
   */
  async calculatePricing(
    planId: string,
    usage?: Record<string, number>,
  ): Promise<PricingCalculation> {
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error(`Pricing plan ${planId} not found`);
    }

    let basePrice = Number(plan.price);
    let usageCharges = 0;
    let discounts = 0;

    // Calculate usage-based charges if provided
    if (usage && plan.features) {
      const features = plan.features as any;
      for (const [feature, amount] of Object.entries(usage)) {
        if (features[feature]?.unitPrice) {
          usageCharges += amount * features[feature].unitPrice;
        }
      }
    }

    // Calculate taxes (15% VAT in Saudi Arabia)
    const subtotal = basePrice + usageCharges - discounts;
    const taxes = subtotal * 0.15;

    return {
      basePrice,
      usageCharges,
      discounts,
      taxes,
      total: subtotal + taxes,
      currency: plan.currency,
    };
  }

  /**
   * Create subscription
   */
  async createSubscription(options: SubscriptionOptions) {
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: options.planId },
    });

    if (!plan) {
      throw new Error(`Pricing plan ${options.planId} not found`);
    }

    if (!plan.isActive) {
      throw new Error(`Pricing plan ${options.planId} is not active`);
    }

    // Calculate end date if not provided (default to 1 month for monthly, 1 year for yearly)
    let endDate = options.endDate;
    if (!endDate) {
      const duration = plan.interval === "YEARLY" ? 365 : 30;
      endDate = new Date(options.startDate);
      endDate.setDate(endDate.getDate() + duration);
    }

    return prisma.subscription.create({
      data: {
        tenantId: options.tenantId,
        planId: options.planId,
        status: "ACTIVE",
        startDate: options.startDate,
        endDate,
        autoRenew: options.autoRenew ?? true,
      },
    });
  }

  /**
   * Get active subscription for tenant
   */
  async getActiveSubscription(tenantId: string) {
    return prisma.subscription.findFirst({
      where: {
        tenantId,
        status: "ACTIVE",
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string) {
    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED" },
    });
  }

  /**
   * Renew subscription
   */
  async renewSubscription(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (subscription.status !== "ACTIVE") {
      throw new Error("Subscription is not active");
    }

    const duration = subscription.plan.interval === "YEARLY" ? 365 : 30;
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + duration);

    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        startDate: new Date(),
        endDate: newEndDate,
        status: "ACTIVE",
      },
    });
  }

  /**
   * Apply discount
   */
  applyDiscount(basePrice: number, discountPercent: number): number {
    return basePrice * (discountPercent / 100);
  }

  /**
   * Generate invoice
   */
  async generateInvoice(
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const pricing = await this.calculatePricing(subscription.planId);

    return {
      subscriptionId,
      tenantId: subscription.tenantId,
      periodStart,
      periodEnd,
      items: [
        {
          description: subscription.plan.name,
          quantity: 1,
          unitPrice: pricing.basePrice,
          total: pricing.basePrice,
        },
      ],
      subtotal: pricing.basePrice + pricing.usageCharges - pricing.discounts,
      tax: pricing.taxes,
      total: pricing.total,
      currency: pricing.currency,
      status: "PENDING",
      createdAt: new Date(),
    };
  }
}

export const pricingEngine = new PricingEngine();

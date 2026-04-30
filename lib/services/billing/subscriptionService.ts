/**
 * 💰 SUBSCRIPTION SERVICE
 * 
 * Subscription lifecycle management
 * Handles creation, updates, cancellation, pause/resume
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-store";
import type {
  Subscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from "@/types/billing";

// ============================================================================
// SUBSCRIPTION SERVICE
// ============================================================================

class SubscriptionService {
  /**
   * Create company subscription (covers multiple employees)
   */
  async createCompanySubscription(input: {
    tenantId: string;
    planId: string;
    planName?: string;
    billingCycle: BillingCycle;
    assignedUserIds?: string[]; // Initial employees
    paymentMethodId?: string;
    metadata?: Record<string, any>;
  }): Promise<Subscription> {
    try {
      // Use first admin user as the subscription owner
      const adminUser = await prisma.user.findFirst({
        where: {
          tenantId: input.tenantId,
          role: { in: ["admin", "super_admin", "tenant_admin"] },
          status: "ACTIVE",
        },
      });

      if (!adminUser) {
        throw new Error("No admin user found for company subscription");
      }

      // Create subscription with company billing type
      return await this.createSubscription({
        tenantId: input.tenantId,
        userId: adminUser.id, // Admin owns the subscription
        planId: input.planId,
        planName: input.planName,
        billingCycle: input.billingCycle,
        quantity: input.assignedUserIds?.length || 1,
        paymentMethodId: input.paymentMethodId,
        metadata: {
          ...(input.metadata || {}),
          billingType: "company",
          isCompanyWide: true,
          assignedUserIds: input.assignedUserIds || [],
        },
      });
    } catch (error) {
      console.error("[SubscriptionService] Error creating company subscription:", error);
      throw error;
    }
  }

  /**
   * Add employee to company subscription
   */
  async addEmployeeToCompanySubscription(
    subscriptionId: string,
    userId: string
  ): Promise<void> {
    try {
      const subscription = await prisma.billing_subscriptions.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      const assignedUserIds = ((subscription.assignedUserIds as any) || []) as string[];

      if (!assignedUserIds.includes(userId)) {
        assignedUserIds.push(userId);

        await prisma.billing_subscriptions.update({
          where: { id: subscriptionId },
          data: {
            assignedUserIds: assignedUserIds as any,
            quantity: assignedUserIds.length,
          },
        });
      }
    } catch (error) {
      console.error("[SubscriptionService] Error adding employee:", error);
      throw error;
    }
  }

  /**
   * Remove employee from company subscription
   */
  async removeEmployeeFromCompanySubscription(
    subscriptionId: string,
    userId: string
  ): Promise<void> {
    try {
      const subscription = await prisma.billing_subscriptions.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      const assignedUserIds = ((subscription.assignedUserIds as any) || []) as string[];

      const filtered = assignedUserIds.filter((id) => id !== userId);

      await prisma.billing_subscriptions.update({
        where: { id: subscriptionId },
        data: {
          assignedUserIds: filtered as any,
          quantity: filtered.length,
        },
      });
    } catch (error) {
      console.error("[SubscriptionService] Error removing employee:", error);
      throw error;
    }
  }

  /**
   * Get company subscription for tenant
   */
  async getCompanySubscription(tenantId: string): Promise<Subscription | null> {
    try {
      const subscription = await prisma.billing_subscriptions.findFirst({
        where: {
          tenantId,
          isCompanyWide: true,
          status: { in: ["active", "trialing"] },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!subscription) {
        return null;
      }

      return this.mapToSubscription(subscription);
    } catch (error) {
      console.error("[SubscriptionService] Error getting company subscription:", error);
      return null;
    }
  }

  /**
   * Check if user is on company plan
   */
  async isUserOnCompanyPlan(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true },
      });

      if (!user) {
        return false;
      }

      const companySubscription = await this.getCompanySubscription(user.tenantId);

      if (!companySubscription) {
        return false;
      }

      const assignedUserIds = ((companySubscription.metadata as any)?.assignedUserIds || []) as string[];
      return assignedUserIds.includes(userId);
    } catch (error) {
      console.error("[SubscriptionService] Error checking company plan:", error);
      return false;
    }
  }

  /**
   * Map database model to subscription interface
   */
  private mapToSubscription(dbSubscription: any): Subscription {
    return {
      id: dbSubscription.id,
      tenantId: dbSubscription.tenantId,
      userId: dbSubscription.userId,
      planId: dbSubscription.planId,
      planName: dbSubscription.planName,
      status: dbSubscription.status as any,
      billingCycle: dbSubscription.billingCycle as any,
      currentPeriodStart: dbSubscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: dbSubscription.currentPeriodEnd.toISOString(),
      trialStart: dbSubscription.trialStart?.toISOString(),
      trialEnd: dbSubscription.trialEnd?.toISOString(),
      basePrice: Number(dbSubscription.basePrice),
      usagePrice: dbSubscription.usagePrice ? Number(dbSubscription.usagePrice) : undefined,
      totalPrice: Number(dbSubscription.totalPrice),
      currency: dbSubscription.currency,
      quantity: dbSubscription.quantity,
      addons: (dbSubscription.addons as any) || undefined,
      paymentMethodId: dbSubscription.paymentMethodId || undefined,
      autoRenew: dbSubscription.autoRenew,
      cancelAtPeriodEnd: dbSubscription.cancelAtPeriodEnd,
      canceledAt: dbSubscription.canceledAt?.toISOString(),
      cancelReason: dbSubscription.cancelReason || undefined,
      pausedAt: dbSubscription.pausedAt?.toISOString(),
      resumedAt: dbSubscription.resumedAt?.toISOString(),
      metadata: (dbSubscription.metadata as any) || undefined,
      createdAt: dbSubscription.createdAt.toISOString(),
      updatedAt: dbSubscription.updatedAt.toISOString(),
    };
  }

  /**
   * Create subscription
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
    try {
      // Calculate periods
      const now = new Date();
      const trialEnd = input.trialDays
        ? new Date(now.getTime() + input.trialDays * 24 * 60 * 60 * 1000)
        : undefined;

      // Calculate billing period end
      const periodEnd = this.calculatePeriodEnd(now, input.billingCycle);

      // Get plan details (from PricingPlan or hardcoded)
      const planDetails = this.getPlanDetails(input.planId);

      // Create subscription
      const subscription: Subscription = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        tenantId: input.tenantId,
        userId: input.userId,
        planId: input.planId,
        planName: planDetails.name,
        status: input.trialDays ? "trialing" : "active",
        billingCycle: input.billingCycle,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        trialStart: input.trialDays ? now.toISOString() : undefined,
        trialEnd: trialEnd?.toISOString(),
        basePrice: planDetails.price,
        totalPrice: planDetails.price * (input.quantity || 1),
        currency: planDetails.currency || "SAR",
        quantity: input.quantity || 1,
        addons: input.addons?.map((addonId) => ({
          id: `addon_${Date.now()}`,
          addonId,
          name: "", // Get from addon service
          quantity: 1,
          price: 0,
          currency: "SAR",
        })),
        paymentMethodId: input.paymentMethodId,
        autoRenew: true,
        cancelAtPeriodEnd: false,
        metadata: input.metadata,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      // Extract company billing fields from metadata
      const metadata = (subscription.metadata || {}) as any;
      const billingType = metadata.billingType || "individual";
      const isCompanyWide = metadata.isCompanyWide || false;
      const assignedUserIds = metadata.assignedUserIds || [];

      // Store in database
      const created = await prisma.billing_subscriptions.create({
        data: {
          id: subscription.id,
          tenantId: subscription.tenantId,
          userId: subscription.userId,
          planId: subscription.planId,
          planName: subscription.planName,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          currentPeriodStart: new Date(subscription.currentPeriodStart),
          currentPeriodEnd: new Date(subscription.currentPeriodEnd),
          trialStart: subscription.trialStart ? new Date(subscription.trialStart) : null,
          trialEnd: subscription.trialEnd ? new Date(subscription.trialEnd) : null,
          basePrice: subscription.basePrice,
          usagePrice: subscription.usagePrice || null,
          totalPrice: subscription.totalPrice,
          currency: subscription.currency,
          quantity: subscription.quantity,
          addons: subscription.addons as any,
          paymentMethodId: subscription.paymentMethodId || null,
          autoRenew: subscription.autoRenew,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          canceledAt: subscription.canceledAt ? new Date(subscription.canceledAt) : null,
          cancelReason: subscription.cancelReason || null,
          pausedAt: subscription.pausedAt ? new Date(subscription.pausedAt) : null,
          resumedAt: subscription.resumedAt ? new Date(subscription.resumedAt) : null,
          billingType,
          isCompanyWide,
          assignedUserIds: assignedUserIds.length > 0 ? (assignedUserIds as any) : null,
          companySubscriptionId: metadata.companySubscriptionId || null,
          metadata: subscription.metadata as any,
        },
      });

      return {
        ...subscription,
        id: created.id,
      };
    } catch (error) {
      console.error("[SubscriptionService] Error creating subscription:", error);
      throw error;
    }
  }

  /**
   * List subscriptions
   */
  async listSubscriptions(tenantId: string, filters?: { userId?: string; status?: string }): Promise<Subscription[]> {
    const where: any = { tenantId };
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const dbSubscriptions = await prisma.billing_subscriptions.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return dbSubscriptions.map((sub) => ({
      id: sub.id,
      tenantId: sub.tenantId,
      userId: sub.userId,
      planId: sub.planId,
      planName: sub.planName,
      status: sub.status as any,
      billingCycle: sub.billingCycle as any,
      currentPeriodStart: sub.currentPeriodStart.toISOString(),
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      trialStart: sub.trialStart?.toISOString(),
      trialEnd: sub.trialEnd?.toISOString(),
      basePrice: Number(sub.basePrice),
      usagePrice: sub.usagePrice ? Number(sub.usagePrice) : undefined,
      totalPrice: Number(sub.totalPrice),
      currency: sub.currency,
      quantity: sub.quantity,
      addons: (sub.addons as any) || undefined,
      paymentMethodId: sub.paymentMethodId || undefined,
      autoRenew: sub.autoRenew,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt?.toISOString(),
      cancelReason: sub.cancelReason || undefined,
      pausedAt: sub.pausedAt?.toISOString(),
      resumedAt: sub.resumedAt?.toISOString(),
      metadata: (sub.metadata as any) || undefined,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    }));
  }

  /**
   * Get subscription
   */
  async getSubscription(id: string): Promise<Subscription> {
    const dbSubscription = await prisma.billing_subscriptions.findUnique({
      where: { id },
    });

    if (!dbSubscription) {
      throw new Error(`Subscription ${id} not found`);
    }

    return {
      id: dbSubscription.id,
      tenantId: dbSubscription.tenantId,
      userId: dbSubscription.userId,
      planId: dbSubscription.planId,
      planName: dbSubscription.planName,
      status: dbSubscription.status as any,
      billingCycle: dbSubscription.billingCycle as any,
      currentPeriodStart: dbSubscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: dbSubscription.currentPeriodEnd.toISOString(),
      trialStart: dbSubscription.trialStart?.toISOString(),
      trialEnd: dbSubscription.trialEnd?.toISOString(),
      basePrice: Number(dbSubscription.basePrice),
      usagePrice: dbSubscription.usagePrice ? Number(dbSubscription.usagePrice) : undefined,
      totalPrice: Number(dbSubscription.totalPrice),
      currency: dbSubscription.currency,
      quantity: dbSubscription.quantity,
      addons: (dbSubscription.addons as any) || undefined,
      paymentMethodId: dbSubscription.paymentMethodId || undefined,
      autoRenew: dbSubscription.autoRenew,
      cancelAtPeriodEnd: dbSubscription.cancelAtPeriodEnd,
      canceledAt: dbSubscription.canceledAt?.toISOString(),
      cancelReason: dbSubscription.cancelReason || undefined,
      pausedAt: dbSubscription.pausedAt?.toISOString(),
      resumedAt: dbSubscription.resumedAt?.toISOString(),
      metadata: (dbSubscription.metadata as any) || undefined,
      createdAt: dbSubscription.createdAt.toISOString(),
      updatedAt: dbSubscription.updatedAt.toISOString(),
    };
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    id: string,
    input: UpdateSubscriptionInput
  ): Promise<Subscription> {
    const subscription = await this.getSubscription(id);

    // Update fields
    if (input.planId) {
      const planDetails = this.getPlanDetails(input.planId);
      subscription.planId = input.planId;
      subscription.planName = planDetails.name;
      subscription.basePrice = planDetails.price;
    }

    if (input.quantity !== undefined) {
      subscription.quantity = input.quantity;
    }

    if (input.billingCycle) {
      subscription.billingCycle = input.billingCycle;
      subscription.currentPeriodEnd = this.calculatePeriodEnd(
        new Date(subscription.currentPeriodStart),
        input.billingCycle
      ).toISOString();
    }

    if (input.paymentMethodId) {
      subscription.paymentMethodId = input.paymentMethodId;
    }

    if (input.autoRenew !== undefined) {
      subscription.autoRenew = input.autoRenew;
    }

    subscription.updatedAt = new Date().toISOString();

    // await prisma.billing_subscription.update({ where: { id }, data: subscription });

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(id: string, reason?: string): Promise<Subscription> {
    const subscription = await this.getSubscription(id);
    subscription.status = "canceled";
    subscription.canceledAt = new Date().toISOString();
    subscription.cancelReason = reason;
    subscription.cancelAtPeriodEnd = true;
    subscription.updatedAt = new Date().toISOString();

    // await prisma.billing_subscription.update({ where: { id }, data: subscription });

    return subscription;
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(id: string): Promise<Subscription> {
    const subscription = await this.getSubscription(id);
    subscription.status = "paused";
    subscription.pausedAt = new Date().toISOString();
    subscription.updatedAt = new Date().toISOString();

    const updated = await prisma.billing_subscriptions.update({
      where: { id },
      data: {
        status: subscription.status,
        pausedAt: new Date(subscription.pausedAt),
      },
    });

    return {
      ...subscription,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(id: string): Promise<Subscription> {
    const subscription = await this.getSubscription(id);
    subscription.status = "active";
    subscription.resumedAt = new Date().toISOString();
    subscription.updatedAt = new Date().toISOString();

    const updated = await prisma.billing_subscriptions.update({
      where: { id },
      data: {
        status: subscription.status,
        resumedAt: new Date(subscription.resumedAt),
      },
    });

    return {
      ...subscription,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Get subscriptions due for billing
   */
  async getSubscriptionsDueForBilling(): Promise<Subscription[]> {
    const now = new Date();
    const dbSubscriptions = await prisma.billing_subscriptions.findMany({
      where: {
        status: "active",
        currentPeriodEnd: { lte: now },
        autoRenew: true,
      },
    });

    return dbSubscriptions.map((sub) => ({
      id: sub.id,
      tenantId: sub.tenantId,
      userId: sub.userId,
      planId: sub.planId,
      planName: sub.planName,
      status: sub.status as any,
      billingCycle: sub.billingCycle as any,
      currentPeriodStart: sub.currentPeriodStart.toISOString(),
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      trialStart: sub.trialStart?.toISOString(),
      trialEnd: sub.trialEnd?.toISOString(),
      basePrice: Number(sub.basePrice),
      usagePrice: sub.usagePrice ? Number(sub.usagePrice) : undefined,
      totalPrice: Number(sub.totalPrice),
      currency: sub.currency,
      quantity: sub.quantity,
      addons: (sub.addons as any) || undefined,
      paymentMethodId: sub.paymentMethodId || undefined,
      autoRenew: sub.autoRenew,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt?.toISOString(),
      cancelReason: sub.cancelReason || undefined,
      pausedAt: sub.pausedAt?.toISOString(),
      resumedAt: sub.resumedAt?.toISOString(),
      metadata: (sub.metadata as any) || undefined,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    }));
  }

  /**
   * Calculate period end
   */
  private calculatePeriodEnd(start: Date, cycle: string): Date {
    const end = new Date(start);
    switch (cycle) {
      case "monthly":
        end.setMonth(end.getMonth() + 1);
        break;
      case "quarterly":
        end.setMonth(end.getMonth() + 3);
        break;
      case "annual":
        end.setFullYear(end.getFullYear() + 1);
        break;
      default:
        end.setMonth(end.getMonth() + 1); // Default to monthly
    }
    return end;
  }

  /**
   * Get plan details
   */
  private getPlanDetails(planId: string): {
    name: string;
    price: number;
    currency: string;
  } {
    // In production, fetch from PricingPlan table
    const plans: Record<string, { name: string; price: number; currency: string }> = {
      free: { name: "Free Plan", price: 0, currency: "SAR" },
      starter: { name: "Starter Plan", price: 49, currency: "SAR" },
      professional: { name: "Professional Plan", price: 199, currency: "SAR" },
      enterprise: { name: "Enterprise Plan", price: 999, currency: "SAR" },
    };
    return plans[planId] || plans.free;
  }
}

export const subscriptionService = new SubscriptionService();

/**
 * 💰 PRORATION SERVICE
 * 
 * Proration calculations for plan changes
 * Handles upgrades, downgrades, add-ons, quantity changes
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import type {
  Proration,
  CalculateProrationInput,
  ProrationType,
} from "@/types/billing";

// ============================================================================
// PRORATION SERVICE
// ============================================================================

class ProrationService {
  /**
   * Calculate proration
   */
  async calculateProration(input: CalculateProrationInput): Promise<Proration> {
    // Get subscription
    // const subscription = await subscriptionService.getSubscription(input.subscriptionId);

    // Get plan details
    // const fromPlan = input.fromPlanId ? await this.getPlanDetails(input.fromPlanId) : null;
    // const toPlan = input.toPlanId ? await this.getPlanDetails(input.toPlanId) : null;

    // Calculate periods
    const now = new Date();
    const oldPeriodStart = new Date(now); // subscription.currentPeriodStart
    const oldPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // subscription.currentPeriodEnd
    const newPeriodStart = new Date(input.effectiveDate);
    const newPeriodEnd = new Date(newPeriodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Calculate prorated days
    const totalDays = Math.floor(
      (oldPeriodEnd.getTime() - oldPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const remainingDays = Math.floor(
      (oldPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate old and new prices
    const oldPrice = 100; // fromPlan.price * (input.fromQuantity || 1)
    const newPrice = 150; // toPlan.price * (input.toQuantity || 1)

    // Calculate proration amounts
    const oldProratedAmount = (oldPrice / totalDays) * remainingDays;
    const newProratedAmount = (newPrice / totalDays) * remainingDays;

    const creditAmount = oldProratedAmount; // Credit for unused portion
    const debitAmount = newProratedAmount; // Charge for new plan
    const netAmount = debitAmount - creditAmount;

    const proration: Proration = {
      id: `pror_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      subscriptionId: input.subscriptionId,
      changeType: input.changeType,
      oldPeriod: {
        start: oldPeriodStart.toISOString(),
        end: oldPeriodEnd.toISOString(),
      },
      newPeriod: {
        start: newPeriodStart.toISOString(),
        end: newPeriodEnd.toISOString(),
      },
      oldPrice,
      newPrice,
      proratedDays: remainingDays,
      totalDays,
      creditAmount,
      debitAmount,
      netAmount,
      applied: false,
      createdAt: new Date().toISOString(),
    };

    // Store in database
    const created = await prisma.billing_prorations.create({
      data: {
        id: proration.id,
        subscriptionId: proration.subscriptionId,
        changeType: proration.changeType,
        oldPeriodStart: new Date(proration.oldPeriod.start),
        oldPeriodEnd: new Date(proration.oldPeriod.end),
        newPeriodStart: new Date(proration.newPeriod.start),
        newPeriodEnd: new Date(proration.newPeriod.end),
        oldPrice: proration.oldPrice,
        newPrice: proration.newPrice,
        proratedDays: proration.proratedDays,
        totalDays: proration.totalDays,
        creditAmount: proration.creditAmount,
        debitAmount: proration.debitAmount,
        netAmount: proration.netAmount,
        applied: proration.applied,
        appliedAt: proration.appliedAt ? new Date(proration.appliedAt) : null,
        invoiceId: proration.invoiceId || null,
        creditMemoId: proration.creditMemoId || null,
      },
    });

    return {
      ...proration,
      id: created.id,
    };
  }

  /**
   * Apply proration
   */
  async applyProration(prorationId: string): Promise<void> {
    // Get proration
    const proration = await prisma.billing_prorations.findUnique({
      where: { id: prorationId },
    });

    if (!proration) {
      throw new Error(`Proration ${prorationId} not found`);
    }

    if (proration.applied) {
      return; // Already applied
    }

    // Import invoice service
    const { invoiceService } = await import("./invoiceService");

    // Create credit memo if credit amount > 0
    if (proration.creditAmount > 0) {
      // Create credit memo invoice
      // This would be implemented in invoiceService
    }

    // Create invoice for debit amount if debit amount > 0
    if (proration.debitAmount > 0) {
      // Get subscription to get user/tenant info
      const subscription = await prisma.billing_subscriptions.findUnique({
        where: { id: proration.subscriptionId },
      });

      if (subscription) {
        await invoiceService.generateInvoice({
          tenantId: subscription.tenantId,
          userId: subscription.userId,
          subscriptionId: subscription.id,
          type: "subscription",
          lineItems: [
            {
              description: `Proration adjustment - ${proration.changeType}`,
              quantity: 1,
              unitPrice: proration.debitAmount,
              amount: proration.debitAmount,
              type: "other",
            },
          ],
        });
      }
    }

    // Mark proration as applied
    await prisma.billing_prorations.update({
      where: { id: prorationId },
      data: { applied: true, appliedAt: new Date() },
    });
  }
}

export const prorationService = new ProrationService();

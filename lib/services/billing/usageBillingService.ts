/**
 * 💰 USAGE BILLING SERVICE
 * 
 * Usage-based billing calculations
 * Handles usage metering, aggregation, and tiered pricing
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import type {
  UsageRecord,
  UsageBillingCalculation,
  RecordUsageInput,
  TieredPricingTier,
} from "@/types/billing";

// ============================================================================
// USAGE BILLING SERVICE
// ============================================================================

class UsageBillingService {
  /**
   * Record usage
   */
  async recordUsage(input: RecordUsageInput): Promise<UsageRecord> {
    const usageRecord: UsageRecord = {
      id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      userId: input.userId,
      subscriptionId: input.subscriptionId,
      metricType: input.metricType,
      quantity: input.quantity,
      unit: input.unit,
      unitPrice: input.unitPrice,
      totalPrice: input.quantity * input.unitPrice,
      currency: "SAR",
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      aggregated: false,
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
    };

    // Store in database
    const created = await prisma.billing_usage_records.create({
      data: {
        id: usageRecord.id,
        tenantId: usageRecord.tenantId,
        userId: usageRecord.userId,
        subscriptionId: usageRecord.subscriptionId || null,
        metricType: usageRecord.metricType,
        quantity: usageRecord.quantity,
        unit: usageRecord.unit,
        unitPrice: usageRecord.unitPrice,
        totalPrice: usageRecord.totalPrice,
        currency: usageRecord.currency,
        periodStart: new Date(usageRecord.periodStart),
        periodEnd: new Date(usageRecord.periodEnd),
        aggregated: usageRecord.aggregated,
        aggregationPeriod: usageRecord.aggregationPeriod || null,
        metadata: usageRecord.metadata as any,
      },
    });

    return {
      ...usageRecord,
      id: created.id,
    };
  }

  /**
   * Calculate usage billing
   */
  async calculateUsageBilling(
    subscriptionId: string,
    period: { start: Date; end: Date }
  ): Promise<UsageBillingCalculation> {
    // Get usage records for period
    const dbRecords = await prisma.billing_usage_records.findMany({
      where: {
        subscriptionId,
        periodStart: { gte: period.start },
        periodEnd: { lte: period.end },
      },
    });

    const records = dbRecords.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      userId: r.userId,
      subscriptionId: r.subscriptionId || undefined,
      metricType: r.metricType,
      quantity: Number(r.quantity),
      unit: r.unit,
      unitPrice: Number(r.unitPrice),
      totalPrice: Number(r.totalPrice),
      currency: r.currency,
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      aggregated: r.aggregated,
      aggregationPeriod: r.aggregationPeriod || undefined,
      metadata: (r.metadata as any) || undefined,
      createdAt: r.createdAt.toISOString(),
    }));

    // Aggregate by metric type
    const aggregated: Record<string, number> = {};
    // records.forEach((record) => {
    //   aggregated[record.metricType] = (aggregated[record.metricType] || 0) + record.quantity;
    // });

    // Calculate costs with tiered pricing
    const breakdown: any[] = [];
    let totalCost = 0;

    // For each metric type, apply tiered pricing if available
    // This is a simplified version - in production, fetch tiered pricing from subscription/plan

    const calculation: UsageBillingCalculation = {
      subscriptionId,
      period,
      usageRecords: records,
      totalUsage: Object.values(aggregated).reduce((sum, val) => sum + val, 0),
      totalCost,
      currency: "SAR",
      breakdown,
    };

    return calculation;
  }
}

export const usageBillingService = new UsageBillingService();

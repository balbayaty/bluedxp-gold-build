/**
 * 💰 DISCOUNT SERVICE
 * 
 * Discount and promotion management
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import type { Discount } from "@/types/billing";

// ============================================================================
// DISCOUNT SERVICE
// ============================================================================

class DiscountService {
  /**
   * Get discounts
   */
  async getDiscounts(ids: string[]): Promise<Discount[]> {
    const dbDiscounts = await prisma.billing_discounts.findMany({
      where: { id: { in: ids } },
    });

    return dbDiscounts.map((d) => ({
      id: d.id,
      code: d.code || undefined,
      name: d.name,
      type: d.type as any,
      value: Number(d.value),
      currency: d.currency || undefined,
      applicableTo: d.applicableTo as any,
      minAmount: d.minAmount ? Number(d.minAmount) : undefined,
      maxAmount: d.maxAmount ? Number(d.maxAmount) : undefined,
      validFrom: d.validFrom.toISOString(),
      validUntil: d.validUntil?.toISOString(),
      maxUses: d.maxUses || undefined,
      usedCount: d.usedCount,
      active: d.active,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  }

  /**
   * Calculate discount
   */
  async calculateDiscount(discount: Discount, amount: number): Promise<number> {
    switch (discount.type) {
      case "percentage":
        return (amount * discount.value) / 100;
      case "fixed_amount":
        return Math.min(discount.value, amount);
      default:
        return 0;
    }
  }
}

export const discountService = new DiscountService();

import type { MarketplaceListing } from "@/types/marketplace";

export interface PricingTier {
  id: string;
  name: string;
  minQuantity: number;
  maxQuantity?: number;
  price: number;
  discount?: number;
}

export interface DynamicPricingRule {
  id: string;
  listingId: string;
  type: "demand" | "time" | "quantity" | "location";
  conditions: Record<string, any>;
  adjustment: number; // Percentage adjustment
  enabled: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  applicableCategories?: string[];
  applicableProviders?: string[];
  usageLimit?: number;
  usedCount: number;
  enabled: boolean;
}

export interface PriceHistory {
  listingId: string;
  price: number;
  timestamp: string;
  reason?: string;
}

class PricingService {
  private pricingTiers: Map<string, PricingTier[]> = new Map();
  private dynamicPricingRules: Map<string, DynamicPricingRule[]> = new Map();
  private promotions: Map<string, Promotion> = new Map();
  private priceHistory: PriceHistory[] = [];

  /**
   * Calculate price for a listing with all factors
   */
  async calculatePrice(
    listing: MarketplaceListing,
    options: {
      quantity?: number;
      location?: string;
      date?: string;
      promotionCode?: string;
    },
  ): Promise<{
    basePrice: number;
    quantity: number;
    subtotal: number;
    discount: number;
    promotionDiscount: number;
    finalPrice: number;
    breakdown: {
      item: string;
      amount: number;
    }[];
  }> {
    const quantity = options.quantity || 1;
    const basePrice = listing.price || 0;

    // Apply quantity-based pricing tiers
    const tiers = this.pricingTiers.get(listing.id) || [];
    let tierPrice = basePrice;
    let tierDiscount = 0;

    for (const tier of tiers.sort((a, b) => b.minQuantity - a.minQuantity)) {
      if (
        quantity >= tier.minQuantity &&
        (!tier.maxQuantity || quantity <= tier.maxQuantity)
      ) {
        tierPrice = tier.price;
        tierDiscount = tier.discount || 0;
        break;
      }
    }

    const subtotal = tierPrice * quantity;

    // Apply dynamic pricing rules
    let dynamicAdjustment = 0;
    const rules = this.dynamicPricingRules.get(listing.id) || [];
    for (const rule of rules.filter((r) => r.enabled)) {
      if (this.matchesRule(rule, options)) {
        dynamicAdjustment += rule.adjustment;
      }
    }

    const adjustedSubtotal = subtotal * (1 + dynamicAdjustment / 100);

    // Apply promotion code
    let promotionDiscount = 0;
    if (options.promotionCode) {
      const promotion = await this.getPromotion(options.promotionCode);
      if (
        promotion &&
        this.isPromotionValid(promotion, listing, adjustedSubtotal)
      ) {
        if (promotion.type === "percentage") {
          promotionDiscount = adjustedSubtotal * (promotion.value / 100);
          if (promotion.maxDiscount) {
            promotionDiscount = Math.min(
              promotionDiscount,
              promotion.maxDiscount,
            );
          }
        } else if (promotion.type === "fixed") {
          promotionDiscount = promotion.value;
        }
      }
    }

    const finalPrice = Math.max(0, adjustedSubtotal - promotionDiscount);

    const breakdown = [
      { item: "Base Price", amount: basePrice },
      { item: "Quantity", amount: quantity },
      { item: "Subtotal", amount: subtotal },
    ];

    if (tierDiscount > 0) {
      breakdown.push({
        item: "Tier Discount",
        amount: -tierDiscount * quantity,
      });
    }

    if (dynamicAdjustment !== 0) {
      breakdown.push({
        item: "Dynamic Adjustment",
        amount: adjustedSubtotal - subtotal,
      });
    }

    if (promotionDiscount > 0) {
      breakdown.push({
        item: "Promotion Discount",
        amount: -promotionDiscount,
      });
    }

    breakdown.push({ item: "Final Price", amount: finalPrice });

    return {
      basePrice,
      quantity,
      subtotal,
      discount: tierDiscount * quantity,
      promotionDiscount,
      finalPrice,
      breakdown,
    };
  }

  /**
   * Add pricing tiers for a listing
   */
  async addPricingTiers(
    listingId: string,
    tiers: PricingTier[],
  ): Promise<void> {
    this.pricingTiers.set(listingId, tiers);
  }

  /**
   * Add dynamic pricing rule
   */
  async addDynamicPricingRule(rule: DynamicPricingRule): Promise<void> {
    const rules = this.dynamicPricingRules.get(rule.listingId) || [];
    rules.push(rule);
    this.dynamicPricingRules.set(rule.listingId, rules);
  }

  /**
   * Create a promotion
   */
  async createPromotion(
    promotion: Omit<Promotion, "id" | "usedCount">,
  ): Promise<Promotion> {
    const id = `promo_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const fullPromotion: Promotion = {
      ...promotion,
      id,
      usedCount: 0,
    };

    this.promotions.set(id, fullPromotion);
    return fullPromotion;
  }

  /**
   * Get promotion by code
   */
  async getPromotion(code: string): Promise<Promotion | null> {
    const promotions = Array.from(this.promotions.values());
    return (
      promotions.find((p) => p.code.toLowerCase() === code.toLowerCase()) ||
      null
    );
  }

  /**
   * Validate and apply promotion
   */
  async applyPromotion(
    code: string,
    listing: MarketplaceListing,
    amount: number,
  ): Promise<{ valid: boolean; discount: number; message?: string }> {
    const promotion = await this.getPromotion(code);

    if (!promotion) {
      return { valid: false, discount: 0, message: "Promotion code not found" };
    }

    if (!promotion.enabled) {
      return {
        valid: false,
        discount: 0,
        message: "Promotion code is not active",
      };
    }

    const now = new Date();
    if (
      new Date(promotion.validFrom) > now ||
      new Date(promotion.validTo) < now
    ) {
      return {
        valid: false,
        discount: 0,
        message: "Promotion code has expired",
      };
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return {
        valid: false,
        discount: 0,
        message: "Promotion code usage limit reached",
      };
    }

    if (promotion.minPurchase && amount < promotion.minPurchase) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum purchase of ${promotion.minPurchase} SAR required`,
      };
    }

    if (
      promotion.applicableCategories &&
      !promotion.applicableCategories.includes(listing.category)
    ) {
      return {
        valid: false,
        discount: 0,
        message: "Promotion code not applicable to this category",
      };
    }

    if (
      promotion.applicableProviders &&
      !promotion.applicableProviders.includes(listing.providerId)
    ) {
      return {
        valid: false,
        discount: 0,
        message: "Promotion code not applicable to this provider",
      };
    }

    let discount = 0;
    if (promotion.type === "percentage") {
      discount = amount * (promotion.value / 100);
      if (promotion.maxDiscount) {
        discount = Math.min(discount, promotion.maxDiscount);
      }
    } else if (promotion.type === "fixed") {
      discount = promotion.value;
    }

    // Increment usage count
    promotion.usedCount++;
    this.promotions.set(promotion.id, promotion);

    return {
      valid: true,
      discount,
      message: "Promotion code applied successfully",
    };
  }

  /**
   * Track price history
   */
  async trackPriceChange(
    listingId: string,
    newPrice: number,
    reason?: string,
  ): Promise<void> {
    this.priceHistory.push({
      listingId,
      price: newPrice,
      timestamp: new Date().toISOString(),
      reason,
    });
  }

  /**
   * Get price history for a listing
   */
  async getPriceHistory(listingId: string): Promise<PriceHistory[]> {
    return this.priceHistory.filter((h) => h.listingId === listingId);
  }

  /**
   * Compare prices across listings
   */
  async comparePrices(
    listingIds: string[],
    quantity: number = 1,
  ): Promise<
    {
      listingId: string;
      price: number;
      bestValue: boolean;
    }[]
  > {
    const comparisons = await Promise.all(
      listingIds.map(async (id) => {
        // This would fetch the actual listing
        // For now, return placeholder
        return {
          listingId: id,
          price: 0,
          bestValue: false,
        };
      }),
    );

    const prices = comparisons.map((c) => c.price);
    const minPrice = Math.min(...prices);

    return comparisons.map((c) => ({
      ...c,
      bestValue: c.price === minPrice,
    }));
  }

  private matchesRule(rule: DynamicPricingRule, options: any): boolean {
    switch (rule.type) {
      case "demand":
        // Check demand conditions
        return true; // Simplified
      case "time":
        // Check time conditions
        return true; // Simplified
      case "quantity":
        return options.quantity >= (rule.conditions.minQuantity || 0);
      case "location":
        return options.location === rule.conditions.location;
      default:
        return false;
    }
  }

  private isPromotionValid(
    promotion: Promotion,
    listing: MarketplaceListing,
    amount: number,
  ): boolean {
    if (!promotion.enabled) return false;

    const now = new Date();
    if (
      new Date(promotion.validFrom) > now ||
      new Date(promotion.validTo) < now
    ) {
      return false;
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return false;
    }

    if (promotion.minPurchase && amount < promotion.minPurchase) {
      return false;
    }

    if (
      promotion.applicableCategories &&
      !promotion.applicableCategories.includes(listing.category)
    ) {
      return false;
    }

    if (
      promotion.applicableProviders &&
      !promotion.applicableProviders.includes(listing.providerId)
    ) {
      return false;
    }

    return true;
  }
}

export const pricingService = new PricingService();

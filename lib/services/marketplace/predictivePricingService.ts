/**
 * Predictive Pricing Service
 * AI-powered pricing optimization and market analysis
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import type {
  MarketplaceServiceListing,
  MarketplaceServiceCategory,
  MarketplaceBooking,
} from "@/types/marketplace";
import { marketplaceService } from "./marketplaceService";
import { mlModelRegistry } from "@/lib/services/ml-registry";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// CACHING
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const priceEstimateCache: Map<string, CacheEntry<any>> = new Map();
const PRICE_CACHE_TTL = 3600000; // 1 hour

function getPriceCacheKey(params: {
  category: string;
  requirement: any;
}): string {
  // Use a more flexible cache key that works for both use cases
  if (params.requirement.location) {
    return `price:${params.category}:${JSON.stringify(params.requirement.location)}:${params.requirement.timeline?.startDate}`;
  }
  return `price:${params.category}:${JSON.stringify(params.requirement)}`;
}

function getCachedPrice<T>(key: string): T | null {
  const entry = priceEstimateCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    priceEstimateCache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCachedPrice<T>(
  key: string,
  data: T,
  ttl: number = PRICE_CACHE_TTL,
): void {
  priceEstimateCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

// ============================================================================
// TYPES
// ============================================================================

export interface PricingRecommendation {
  listingId: string;
  currentPrice: number;
  recommendedPrice: number;
  confidence: number; // 0-100
  reasoning: string[];
  factors: {
    marketAverage: number;
    competitorPrices: number[];
    demandLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
    seasonality: number; // -100 to 100
    historicalPerformance: number;
  };
  expectedImpact: {
    bookingsChange?: number; // %
    revenueChange?: number; // %
    conversionChange?: number; // %
  };
  alternatives: Array<{
    price: number;
    expectedOutcome: string;
    confidence: number;
  }>;
}

export interface MarketAnalysis {
  category: MarketplaceServiceCategory;
  period: {
    start: string;
    end: string;
  };
  marketAverage: number;
  priceRange: {
    min: number;
    max: number;
    median: number;
    q1: number;
    q3: number;
  };
  trends: {
    direction: "UP" | "DOWN" | "STABLE";
    changePercent: number;
    confidence: number;
  };
  demandLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  competitorCount: number;
  recommendations: string[];
}

// ============================================================================
// PREDICTIVE PRICING SERVICE
// ============================================================================

export class PredictivePricingService {
  /**
   * Get pricing recommendation for a listing
   */
  async getPricingRecommendation(
    listingId: string,
  ): Promise<PricingRecommendation> {
    const listing = await marketplaceService.getListing(listingId);
    if (!listing) {
      throw new Error(`Listing not found: ${listingId}`);
    }

    const category = this.getListingCategory(listing);
    const currentPrice =
      "pricing" in listing ? (listing.pricing as any).basePrice : 0;

    // 1. Get market analysis
    const marketAnalysis = await this.analyzeMarket(category);

    // 2. Get competitor prices
    const competitorPrices = await this.getCompetitorPrices(listing, category);

    // 3. Analyze demand
    const demandLevel = await this.analyzeDemand(category);

    // 4. Check seasonality
    const seasonality = await this.getSeasonalityFactor(category);

    // 5. Get historical performance
    const historicalPerformance =
      await this.getHistoricalPerformance(listingId);

    // 6. Calculate recommended price using ML if available
    let recommendedPrice = currentPrice;
    let confidence = 70;
    const reasoning: string[] = [];

    try {
      const mlPrice = await this.getMLPriceRecommendation(
        listing,
        marketAnalysis,
        demandLevel,
      );
      if (mlPrice > 0) {
        recommendedPrice = mlPrice;
        confidence = 85;
        reasoning.push("ML model recommendation");
      } else {
        // Rule-based recommendation
        recommendedPrice = this.calculateOptimalPrice(
          currentPrice,
          marketAnalysis,
          competitorPrices,
          demandLevel,
          seasonality,
          historicalPerformance,
        );
        confidence = 70;
        reasoning.push("Rule-based calculation");
      }
    } catch (error) {
      console.warn("ML pricing failed, using rule-based:", error);
      recommendedPrice = this.calculateOptimalPrice(
        currentPrice,
        marketAnalysis,
        competitorPrices,
        demandLevel,
        seasonality,
        historicalPerformance,
      );
      confidence = 65;
      reasoning.push("Rule-based calculation (ML unavailable)");
    }

    // 7. Generate reasoning
    if (recommendedPrice > currentPrice) {
      reasoning.push(
        `Market average (${marketAnalysis.marketAverage}) is higher`,
      );
      if (demandLevel === "HIGH" || demandLevel === "VERY_HIGH") {
        reasoning.push("High demand supports price increase");
      }
    } else if (recommendedPrice < currentPrice) {
      reasoning.push(
        `Market average (${marketAnalysis.marketAverage}) is lower`,
      );
      if (demandLevel === "LOW") {
        reasoning.push("Lower demand suggests price reduction");
      }
    } else {
      reasoning.push("Current price aligns with market");
    }

    // 8. Calculate expected impact
    const expectedImpact = await this.calculateExpectedImpact(
      listingId,
      currentPrice,
      recommendedPrice,
      demandLevel,
    );

    // 9. Generate alternatives
    const alternatives = this.generatePriceAlternatives(
      currentPrice,
      recommendedPrice,
      marketAnalysis,
    );

    return {
      listingId,
      currentPrice,
      recommendedPrice: Math.round(recommendedPrice * 100) / 100,
      confidence,
      reasoning,
      factors: {
        marketAverage: marketAnalysis.marketAverage,
        competitorPrices,
        demandLevel,
        seasonality,
        historicalPerformance,
      },
      expectedImpact,
      alternatives,
    };
  }

  /**
   * Analyze market for a category
   */
  async analyzeMarket(
    category: MarketplaceServiceCategory,
  ): Promise<MarketAnalysis> {
    const listings = await marketplaceService.searchListings({ category });
    const prices = listings
      .map((l) => ("pricing" in l ? (l.pricing as any).basePrice : 0))
      .filter((p) => p > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      return {
        category,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        marketAverage: 0,
        priceRange: { min: 0, max: 0, median: 0, q1: 0, q3: 0 },
        trends: { direction: "STABLE", changePercent: 0, confidence: 0 },
        demandLevel: "MEDIUM",
        competitorCount: 0,
        recommendations: [],
      };
    }

    const marketAverage = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const min = prices[0];
    const max = prices[prices.length - 1];
    const median = prices[Math.floor(prices.length / 2)];
    const q1 = prices[Math.floor(prices.length / 4)];
    const q3 = prices[Math.floor((prices.length * 3) / 4)];

    // Get bookings to analyze trends
    const bookings = await marketplaceService.searchBookings({ category });
    const recentBookings = bookings.filter((b) => {
      const date = new Date(b.createdAt);
      return date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    });

    const olderBookings = bookings.filter((b) => {
      const date = new Date(b.createdAt);
      return (
        date >= new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) &&
        date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
    });

    const recentAvg =
      recentBookings.length > 0
        ? recentBookings.reduce((sum, b) => sum + (b.pricing?.total || 0), 0) /
          recentBookings.length
        : marketAverage;
    const olderAvg =
      olderBookings.length > 0
        ? olderBookings.reduce((sum, b) => sum + (b.pricing?.total || 0), 0) /
          olderBookings.length
        : marketAverage;

    const changePercent =
      olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    const direction: "UP" | "DOWN" | "STABLE" =
      changePercent > 5 ? "UP" : changePercent < -5 ? "DOWN" : "STABLE";

    const demandLevel = this.calculateDemandLevel(
      recentBookings.length,
      olderBookings.length,
    );

    const recommendations: string[] = [];
    if (direction === "UP" && changePercent > 10) {
      recommendations.push(
        "Market prices are rising - consider increasing your price",
      );
    } else if (direction === "DOWN" && changePercent < -10) {
      recommendations.push(
        "Market prices are falling - consider reducing your price",
      );
    }

    return {
      category,
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      marketAverage: Math.round(marketAverage * 100) / 100,
      priceRange: {
        min,
        max,
        median,
        q1,
        q3,
      },
      trends: {
        direction,
        changePercent: Math.round(changePercent * 100) / 100,
        confidence: Math.min(100, Math.abs(changePercent) * 10),
      },
      demandLevel,
      competitorCount: listings.length,
      recommendations,
    };
  }

  /**
   * Get competitor prices
   */
  private async getCompetitorPrices(
    listing: MarketplaceServiceListing,
    category: MarketplaceServiceCategory,
  ): Promise<number[]> {
    const listings = await marketplaceService.searchListings({ category });
    return listings
      .filter((l) => l.id !== listing.id && l.providerId !== listing.providerId)
      .map((l) => ("pricing" in l ? (l.pricing as any).basePrice : 0))
      .filter((p) => p > 0)
      .slice(0, 10); // Top 10 competitors
  }

  /**
   * Analyze demand level
   */
  private async analyzeDemand(
    category: MarketplaceServiceCategory,
  ): Promise<"LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"> {
    const recentBookings = await marketplaceService.searchBookings({
      category,
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    });

    const olderBookings = await marketplaceService.searchBookings({
      category,
      dateRange: {
        start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    return this.calculateDemandLevel(
      recentBookings.length,
      olderBookings.length,
    );
  }

  /**
   * Calculate demand level
   */
  private calculateDemandLevel(
    recent: number,
    older: number,
  ): "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" {
    const change = older > 0 ? ((recent - older) / older) * 100 : 0;

    if (recent > older * 1.5 || change > 50) {
      return "VERY_HIGH";
    }
    if (recent > older * 1.2 || change > 20) {
      return "HIGH";
    }
    if (recent < older * 0.8 || change < -20) {
      return "LOW";
    }
    return "MEDIUM";
  }

  /**
   * Get seasonality factor
   */
  private async getSeasonalityFactor(
    category: MarketplaceServiceCategory,
  ): Promise<number> {
    const now = new Date();
    const month = now.getMonth(); // 0-11

    // Simple seasonality - would use ML model in production
    const seasonalFactors: Record<number, number> = {
      0: 10, // January
      1: 5,
      2: 0,
      3: -5,
      4: 0,
      5: 5,
      6: 10, // July
      7: 15,
      8: 10,
      9: 5,
      10: 0,
      11: 5, // December
    };

    return seasonalFactors[month] || 0;
  }

  /**
   * Get historical performance
   */
  private async getHistoricalPerformance(listingId: string): Promise<number> {
    const bookings = await marketplaceService.searchBookings({
      serviceId: listingId,
    });
    if (bookings.length === 0) {
      return 0;
    }

    const completed = bookings.filter((b) => b.status === "COMPLETED");
    if (completed.length === 0) {
      return 0;
    }

    const avgRating =
      completed
        .filter((b) => b.rating)
        .map((b) => b.rating!)
        .reduce((sum, r) => sum + r, 0) /
      completed.filter((b) => b.rating).length;

    return avgRating || 0;
  }

  /**
   * Get ML price recommendation
   */
  private async getMLPriceRecommendation(
    listing: MarketplaceServiceListing,
    marketAnalysis: MarketAnalysis,
    demandLevel: string,
  ): Promise<number> {
    try {
      const models = await mlModelRegistry.getAllModels();
      const pricingModel = models.find(
        (m) =>
          m.name === "marketplace-pricing" &&
          m.status === "deployed" &&
          m.type === "regression",
      );

      if (pricingModel) {
        // Use ML model for pricing
        // This would call the actual ML model
        // For now, return 0 to use rule-based
        return 0;
      }
    } catch (error) {
      console.warn("ML pricing model not available:", error);
    }

    return 0;
  }

  /**
   * Calculate optimal price (rule-based)
   */
  private calculateOptimalPrice(
    currentPrice: number,
    marketAnalysis: MarketAnalysis,
    competitorPrices: number[],
    demandLevel: string,
    seasonality: number,
    historicalPerformance: number,
  ): number {
    let price = currentPrice;

    // Adjust based on market average
    if (marketAnalysis.marketAverage > 0) {
      const marketDiff =
        (marketAnalysis.marketAverage - currentPrice) / currentPrice;
      if (Math.abs(marketDiff) > 0.1) {
        price = price * (1 + marketDiff * 0.5); // Move 50% towards market average
      }
    }

    // Adjust based on competitor prices
    if (competitorPrices.length > 0) {
      const competitorAvg =
        competitorPrices.reduce((sum, p) => sum + p, 0) /
        competitorPrices.length;
      const competitorDiff = (competitorAvg - price) / price;
      if (Math.abs(competitorDiff) > 0.1) {
        price = price * (1 + competitorDiff * 0.3); // Move 30% towards competitor average
      }
    }

    // Adjust based on demand
    const demandMultiplier: Record<string, number> = {
      VERY_HIGH: 1.15,
      HIGH: 1.08,
      MEDIUM: 1.0,
      LOW: 0.92,
    };
    price = price * (demandMultiplier[demandLevel] || 1.0);

    // Adjust based on seasonality
    price = price * (1 + seasonality / 100);

    // Adjust based on historical performance
    if (historicalPerformance > 4.5) {
      price = price * 1.05; // Premium for high performance
    } else if (historicalPerformance < 3.5) {
      price = price * 0.95; // Discount for lower performance
    }

    return price;
  }

  /**
   * Calculate expected impact
   */
  private async calculateExpectedImpact(
    listingId: string,
    currentPrice: number,
    recommendedPrice: number,
    demandLevel: string,
  ): Promise<PricingRecommendation["expectedImpact"]> {
    const priceChange =
      ((recommendedPrice - currentPrice) / currentPrice) * 100;

    // Price elasticity estimation
    const elasticity = -1.5; // Typical price elasticity
    const bookingsChange = priceChange * elasticity;

    // Revenue change
    const revenueChange = priceChange + bookingsChange;

    // Conversion change (simplified)
    const conversionChange =
      priceChange > 0 ? -priceChange * 0.5 : -priceChange * 0.3;

    return {
      bookingsChange: Math.round(bookingsChange * 100) / 100,
      revenueChange: Math.round(revenueChange * 100) / 100,
      conversionChange: Math.round(conversionChange * 100) / 100,
    };
  }

  /**
   * Generate price alternatives
   */
  private generatePriceAlternatives(
    currentPrice: number,
    recommendedPrice: number,
    marketAnalysis: MarketAnalysis,
  ): Array<{ price: number; expectedOutcome: string; confidence: number }> {
    const alternatives: Array<{
      price: number;
      expectedOutcome: string;
      confidence: number;
    }> = [];

    // Conservative option (5% below recommended)
    alternatives.push({
      price: Math.round(recommendedPrice * 0.95 * 100) / 100,
      expectedOutcome: "Conservative pricing - lower risk, steady bookings",
      confidence: 80,
    });

    // Aggressive option (5% above recommended)
    alternatives.push({
      price: Math.round(recommendedPrice * 1.05 * 100) / 100,
      expectedOutcome: "Premium pricing - higher margin, fewer bookings",
      confidence: 60,
    });

    // Market average option
    if (marketAnalysis.marketAverage > 0) {
      alternatives.push({
        price: Math.round(marketAnalysis.marketAverage * 100) / 100,
        expectedOutcome: "Market average - competitive positioning",
        confidence: 75,
      });
    }

    return alternatives;
  }

  /**
   * Estimate price for a requirement
   */
  async estimatePrice(params: {
    category: MarketplaceServiceCategory;
    requirement: any;
  }): Promise<{
    priceRange: { min: number; max: number; currency: string };
    confidence: number;
    breakdown?: Record<string, number>;
    factors: string[];
  }> {
    const { category, requirement } = params;

    // Check cache first
    const cacheKey = getPriceCacheKey(params);
    const cached = getCachedPrice<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get market analysis for price estimation
    const marketAnalysis = await this.analyzeMarket(category);

    // Base price from market average
    const basePrice =
      marketAnalysis.marketAverage || this.getBasePrice(category);

    // Calculate adjustments
    let minPrice = basePrice * 0.8;
    let maxPrice = basePrice * 1.2;

    const factors: string[] = [];
    const breakdown: Record<string, number> = {
      basePrice,
    };

    // Adjust based on capacity/quantity
    if (requirement.capacity?.value) {
      const capacityMultiplier =
        Math.log10(requirement.capacity.value / 100) + 1;
      minPrice *= capacityMultiplier;
      maxPrice *= capacityMultiplier;
      factors.push("Capacity");
      breakdown.capacity = capacityMultiplier * basePrice;
    }

    // Adjust based on duration
    if (requirement.timeline?.duration) {
      const durationMultiplier = Math.min(
        requirement.timeline.duration / 30,
        2,
      );
      minPrice *= durationMultiplier;
      maxPrice *= durationMultiplier;
      factors.push("Duration");
      breakdown.duration = durationMultiplier * basePrice;
    }

    // Adjust based on location
    if (requirement.location?.city) {
      const locationPremium = this.getLocationPremium(
        requirement.location.city,
      );
      minPrice *= locationPremium;
      maxPrice *= locationPremium;
      factors.push("Location");
      breakdown.location = locationPremium * basePrice;
    }

    // Adjust based on urgency
    if (requirement.urgency) {
      const urgencyMultiplier =
        {
          URGENT: 1.3,
          HIGH: 1.15,
          MEDIUM: 1.0,
          LOW: 0.9,
        }[requirement.urgency] || 1.0;
      minPrice *= urgencyMultiplier;
      maxPrice *= urgencyMultiplier;
      factors.push("Urgency");
      breakdown.urgency = urgencyMultiplier * basePrice;
    }

    const result = {
      priceRange: {
        min: Math.round(minPrice),
        max: Math.round(maxPrice),
        currency: requirement.budget?.currency || "SAR",
      },
      confidence: marketAnalysis.marketAverage > 0 ? 80 : 60,
      breakdown,
      factors,
    };

    // Cache the result
    setCachedPrice(cacheKey, result);

    return result;
  }

  /**
   * Get base price for category
   */
  private getBasePrice(category: MarketplaceServiceCategory): number {
    const basePrices: Record<MarketplaceServiceCategory, number> = {
      STORAGE: 5000,
      TRANSPORTATION: 10000,
      FREIGHT: 20000,
      CONSULTING: 50000,
      MANPOWER: 30000,
      TRANSLATION: 5000,
      CROSSDOCKING: 10000,
      WAREHOUSE_NETWORK: 100000,
      OTHER: 10000,
    };
    return basePrices[category] || 10000;
  }

  /**
   * Get location premium
   */
  private getLocationPremium(city: string): number {
    const premiums: Record<string, number> = {
      Riyadh: 1.2,
      Jeddah: 1.15,
      Dammam: 1.1,
      Khobar: 1.1,
    };
    return premiums[city] || 1.0;
  }

  /**
   * Get listing category
   */
  private getListingCategory(
    listing: MarketplaceServiceListing,
  ): MarketplaceServiceCategory {
    if ("serviceType" in listing) {
      const type = (listing as any).serviceType;
      if (
        type === "GENERAL_STORAGE" ||
        type === "COLD_STORAGE" ||
        type === "HAZMAT_STORAGE"
      ) {
        return "STORAGE";
      }
      if (type === "FTL" || type === "LTL" || type === "EXPRESS") {
        return "TRANSPORTATION";
      }
      if (type === "FCL" || type === "LCL" || type === "AIR_FREIGHT") {
        return "FREIGHT";
      }
      if (
        type === "CIVIL_DEFENSE" ||
        type === "SAUDIZATION" ||
        type === "COMPLIANCE"
      ) {
        return "CONSULTING";
      }
      if (type === "WAREHOUSE_STAFF" || type === "DRIVERS") {
        return "MANPOWER";
      }
    }
    if ("dockDoors" in listing) {
      return "CROSSDOCKING";
    }
    if ("languages" in listing) {
      return "TRANSLATION";
    }
    if ("warehouses" in listing) {
      return "WAREHOUSE_NETWORK";
    }
    return "OTHER";
  }
}

// Singleton instance
export const predictivePricingService = new PredictivePricingService();

/**
 * Demand Forecasting Service
 * AI-powered demand prediction and capacity planning
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import type {
  MarketplaceServiceCategory,
  MarketplaceBooking,
} from "@/types/marketplace";
import { marketplaceService } from "./marketplaceService";
import { mlModelRegistry } from "@/lib/services/ml-registry";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface DemandForecast {
  category: MarketplaceServiceCategory;
  period: {
    start: string;
    end: string;
    type: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  };
  forecast: {
    totalBookings: number;
    confidence: number; // 0-100
    breakdown: Array<{
      date: string;
      bookings: number;
      confidence: number;
    }>;
  };
  factors: {
    historicalTrend: number; // %
    seasonality: number; // -100 to 100
    marketGrowth: number; // %
    competition: number; // -100 to 100
  };
  recommendations: string[];
  riskFactors: Array<{
    factor: string;
    impact: "LOW" | "MEDIUM" | "HIGH";
    probability: number; // 0-100
  }>;
}

export interface CapacityRecommendation {
  category: MarketplaceServiceCategory;
  currentCapacity: number;
  recommendedCapacity: number;
  utilization: number; // %
  peakPeriods: Array<{
    period: string;
    expectedDemand: number;
    capacityNeeded: number;
    recommendation: string;
  }>;
  scalingStrategy: {
    immediate: string[];
    shortTerm: string[]; // 1-3 months
    longTerm: string[]; // 3-12 months
  };
}

// ============================================================================
// DEMAND FORECASTING SERVICE
// ============================================================================

export class DemandForecastingService {
  /**
   * Forecast demand for a category
   */
  async forecastDemand(
    category: MarketplaceServiceCategory,
    period: {
      start: string;
      end: string;
      type: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    },
  ): Promise<DemandForecast> {
    // 1. Get historical data
    const historicalBookings = await this.getHistoricalBookings(
      category,
      period.start,
    );

    // 2. Analyze trends
    const historicalTrend = this.analyzeTrend(historicalBookings);

    // 3. Get seasonality
    const seasonality = this.getSeasonalityFactor(category, period);

    // 4. Estimate market growth
    const marketGrowth = await this.estimateMarketGrowth(category);

    // 5. Analyze competition
    const competition = await this.analyzeCompetition(category);

    // 6. Generate forecast using ML if available
    let forecast: DemandForecast["forecast"];
    try {
      const mlForecast = await this.getMLForecast(
        category,
        historicalBookings,
        period,
      );
      if (mlForecast) {
        forecast = mlForecast;
      } else {
        forecast = this.generateRuleBasedForecast(
          historicalBookings,
          period,
          historicalTrend,
          seasonality,
        );
      }
    } catch (error) {
      console.warn("ML forecasting failed, using rule-based:", error);
      forecast = this.generateRuleBasedForecast(
        historicalBookings,
        period,
        historicalTrend,
        seasonality,
      );
    }

    // 7. Generate recommendations
    const recommendations = this.generateRecommendations(
      forecast,
      historicalTrend,
      seasonality,
      marketGrowth,
    );

    // 8. Identify risk factors
    const riskFactors = this.identifyRiskFactors(
      forecast,
      historicalTrend,
      competition,
    );

    return {
      category,
      period,
      forecast,
      factors: {
        historicalTrend,
        seasonality,
        marketGrowth,
        competition,
      },
      recommendations,
      riskFactors,
    };
  }

  /**
   * Get capacity recommendations
   */
  async getCapacityRecommendations(
    category: MarketplaceServiceCategory,
  ): Promise<CapacityRecommendation> {
    const listings = await marketplaceService.searchListings({ category });
    const currentCapacity = this.calculateCurrentCapacity(listings, category);

    // Forecast next 12 months
    const forecast = await this.forecastDemand(category, {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      type: "MONTHLY",
    });

    const utilization =
      currentCapacity > 0
        ? (forecast.forecast.totalBookings / (currentCapacity * 12)) * 100
        : 0;

    const recommendedCapacity = Math.ceil(
      (forecast.forecast.totalBookings / 12) * 1.2,
    ); // 20% buffer

    // Identify peak periods
    const peakPeriods = this.identifyPeakPeriods(forecast.forecast.breakdown);

    // Generate scaling strategy
    const scalingStrategy = this.generateScalingStrategy(
      currentCapacity,
      recommendedCapacity,
      utilization,
      peakPeriods,
    );

    return {
      category,
      currentCapacity,
      recommendedCapacity,
      utilization: Math.round(utilization * 100) / 100,
      peakPeriods,
      scalingStrategy,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async getHistoricalBookings(
    category: MarketplaceServiceCategory,
    startDate: string,
  ): Promise<MarketplaceBooking[]> {
    const endDate = new Date().toISOString();
    const start = new Date(startDate);
    const historicalStart = new Date(
      start.getTime() - 365 * 24 * 60 * 60 * 1000,
    ); // 1 year back

    return await marketplaceService.searchBookings({
      category,
      dateRange: {
        start: historicalStart.toISOString(),
        end: endDate,
      },
    });
  }

  private analyzeTrend(bookings: MarketplaceBooking[]): number {
    if (bookings.length < 2) return 0;

    // Split into two halves
    const sorted = bookings.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    const firstAvg = firstHalf.length;
    const secondAvg = secondHalf.length;

    if (firstAvg === 0) return 0;
    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }

  private getSeasonalityFactor(
    category: MarketplaceServiceCategory,
    period: { start: string; end: string },
  ): number {
    const start = new Date(period.start);
    const month = start.getMonth();

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

  private async estimateMarketGrowth(
    category: MarketplaceServiceCategory,
  ): Promise<number> {
    // Would use market data and ML model
    // For now, return a default growth rate
    return 5; // 5% annual growth
  }

  private async analyzeCompetition(
    category: MarketplaceServiceCategory,
  ): Promise<number> {
    const listings = await marketplaceService.searchListings({ category });
    const count = listings.length;

    // Competition score: -100 (no competition) to 100 (very competitive)
    if (count < 5) return -50;
    if (count < 10) return 0;
    if (count < 20) return 50;
    return 100;
  }

  private async getMLForecast(
    category: MarketplaceServiceCategory,
    historicalBookings: MarketplaceBooking[],
    period: { start: string; end: string; type: string },
  ): Promise<DemandForecast["forecast"] | null> {
    try {
      const models = await mlModelRegistry.getAllModels();
      const forecastModel = models.find(
        (m) =>
          m.name === "marketplace-demand-forecast" &&
          m.status === "deployed" &&
          m.type === "time_series",
      );

      if (forecastModel) {
        // Use ML model for forecasting
        // This would call the actual ML model
        // For now, return null to use rule-based
        return null;
      }
    } catch (error) {
      console.warn("ML forecast model not available:", error);
    }

    return null;
  }

  private generateRuleBasedForecast(
    historicalBookings: MarketplaceBooking[],
    period: { start: string; end: string; type: string },
    trend: number,
    seasonality: number,
  ): DemandForecast["forecast"] {
    // Calculate average bookings per period
    const periodDays = this.getPeriodDays(period.type);
    const historicalAvg = historicalBookings.length / (365 / periodDays);

    // Apply trend
    const trendAdjusted = historicalAvg * (1 + trend / 100);

    // Apply seasonality
    const seasonalAdjusted = trendAdjusted * (1 + seasonality / 100);

    // Generate breakdown
    const start = new Date(period.start);
    const end = new Date(period.end);
    const breakdown: Array<{
      date: string;
      bookings: number;
      confidence: number;
    }> = [];

    let current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      const bookings = Math.round(
        seasonalAdjusted * (0.8 + Math.random() * 0.4),
      ); // Add some variance
      breakdown.push({
        date: dateStr,
        bookings,
        confidence: 70,
      });

      // Move to next period
      if (period.type === "DAILY") {
        current.setDate(current.getDate() + 1);
      } else if (period.type === "WEEKLY") {
        current.setDate(current.getDate() + 7);
      } else if (period.type === "MONTHLY") {
        current.setMonth(current.getMonth() + 1);
      } else if (period.type === "QUARTERLY") {
        current.setMonth(current.getMonth() + 3);
      } else {
        current.setFullYear(current.getFullYear() + 1);
      }
    }

    const totalBookings = breakdown.reduce((sum, b) => sum + b.bookings, 0);

    return {
      totalBookings,
      confidence: 70,
      breakdown,
    };
  }

  private getPeriodDays(type: string): number {
    const days: Record<string, number> = {
      DAILY: 1,
      WEEKLY: 7,
      MONTHLY: 30,
      QUARTERLY: 90,
      YEARLY: 365,
    };
    return days[type] || 30;
  }

  private generateRecommendations(
    forecast: DemandForecast["forecast"],
    trend: number,
    seasonality: number,
    marketGrowth: number,
  ): string[] {
    const recommendations: string[] = [];

    if (trend > 10) {
      recommendations.push(
        "Strong upward trend - consider increasing capacity",
      );
    } else if (trend < -10) {
      recommendations.push(
        "Declining trend - review pricing and marketing strategy",
      );
    }

    if (seasonality > 10) {
      recommendations.push(
        "Peak season approaching - prepare for increased demand",
      );
    } else if (seasonality < -10) {
      recommendations.push("Low season - consider promotional pricing");
    }

    if (marketGrowth > 5) {
      recommendations.push("Market is growing - good time to expand");
    }

    if (forecast.confidence < 60) {
      recommendations.push(
        "Forecast confidence is low - gather more historical data",
      );
    }

    return recommendations;
  }

  private identifyRiskFactors(
    forecast: DemandForecast["forecast"],
    trend: number,
    competition: number,
  ): Array<{
    factor: string;
    impact: "LOW" | "MEDIUM" | "HIGH";
    probability: number;
  }> {
    const risks: Array<{
      factor: string;
      impact: "LOW" | "MEDIUM" | "HIGH";
      probability: number;
    }> = [];

    if (trend < -20) {
      risks.push({
        factor: "Declining demand trend",
        impact: "HIGH",
        probability: 70,
      });
    }

    if (competition > 50) {
      risks.push({
        factor: "High competition",
        impact: "MEDIUM",
        probability: 80,
      });
    }

    if (forecast.confidence < 60) {
      risks.push({
        factor: "Low forecast confidence",
        impact: "MEDIUM",
        probability: 100,
      });
    }

    return risks;
  }

  private calculateCurrentCapacity(listings: any[], category: string): number {
    if (category === "STORAGE") {
      return listings.reduce((sum, l) => {
        if ("capacity" in l && l.capacity) {
          return sum + (l.capacity.available || 0);
        }
        return sum;
      }, 0);
    }
    return listings.length;
  }

  private identifyPeakPeriods(
    breakdown: Array<{ date: string; bookings: number }>,
  ): Array<{
    period: string;
    expectedDemand: number;
    capacityNeeded: number;
    recommendation: string;
  }> {
    const avg =
      breakdown.reduce((sum, b) => sum + b.bookings, 0) / breakdown.length;
    const peaks = breakdown
      .filter((b) => b.bookings > avg * 1.2)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 3);

    return peaks.map((peak) => ({
      period: peak.date,
      expectedDemand: peak.bookings,
      capacityNeeded: Math.ceil(peak.bookings * 1.2),
      recommendation: `Increase capacity by ${Math.ceil((peak.bookings - avg) * 1.2)} units for this period`,
    }));
  }

  private generateScalingStrategy(
    current: number,
    recommended: number,
    utilization: number,
    peakPeriods: any[],
  ): CapacityRecommendation["scalingStrategy"] {
    const strategy: CapacityRecommendation["scalingStrategy"] = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
    };

    if (utilization > 90) {
      strategy.immediate.push(
        "Urgent: Capacity is at 90%+ utilization - add capacity immediately",
      );
    } else if (utilization > 75) {
      strategy.immediate.push(
        "High utilization - monitor closely and prepare to scale",
      );
    }

    if (recommended > current * 1.2) {
      strategy.shortTerm.push(
        `Increase capacity by ${Math.ceil((recommended - current) * 0.5)} units in next 1-3 months`,
      );
    }

    if (recommended > current) {
      strategy.longTerm.push(
        `Plan to reach ${recommended} units capacity within 12 months`,
      );
    }

    if (peakPeriods.length > 0) {
      strategy.shortTerm.push(
        "Prepare for peak periods with temporary capacity",
      );
    }

    return strategy;
  }
}

// Singleton instance
export const demandForecastingService = new DemandForecastingService();

/**
 * Pricing Intelligence Service
 *
 * Market rate tracking, freight rate indexes, price predictions, and recommendations
 * Integrates with market data sources and provides pricing insights
 */

import type {
  Location,
  FreightRateIndex,
  PricingIntelligence,
  TransportMode,
  ShipmentType,
} from "@/types/tms";
import { assertRealInProduction } from "./strictMode";

export interface PricingIntelligenceRequest {
  origin: Location;
  destination: Location;
  mode: TransportMode;
  type: ShipmentType;
  cargo: {
    weight: number; // kg
    volume: number; // m³
    value: number;
  };
  date?: Date | string;
}

export class PricingIntelligenceService {
  private rateIndexes: Map<string, FreightRateIndex> = new Map();

  /**
   * Get pricing intelligence for a shipment
   */
  async getPricingIntelligence(
    request: PricingIntelligenceRequest,
  ): Promise<PricingIntelligence> {
    const { origin, destination, mode, type, cargo, date } = request;

    // Get or create rate index for this lane
    const rateIndex = await this.getRateIndex(origin, destination, mode, type);

    // Calculate market rate
    const marketRate = await this.calculateMarketRate(
      origin,
      destination,
      mode,
      type,
      cargo,
    );

    // Get benchmark rate (historical average)
    const benchmarkRate = await this.getBenchmarkRate(
      origin,
      destination,
      mode,
      type,
      cargo,
    );

    // Get historical average
    const historicalAverage = await this.getHistoricalAverage(
      origin,
      destination,
      mode,
      type,
      cargo,
    );

    // Calculate comparisons
    const comparison = {
      vsMarket: {
        difference: marketRate - (request as any).yourRate || 0,
        percentage: request.yourRate
          ? ((marketRate - request.yourRate) / request.yourRate) * 100
          : 0,
        status: request.yourRate
          ? request.yourRate < marketRate
            ? "BELOW"
            : request.yourRate > marketRate
              ? "ABOVE"
              : "AT_MARKET"
          : ("AT_MARKET" as const),
      },
      vsBenchmark: {
        difference: marketRate - benchmarkRate,
        percentage: ((marketRate - benchmarkRate) / benchmarkRate) * 100,
      },
      vsHistorical: {
        average: historicalAverage,
        difference: marketRate - historicalAverage,
        percentage:
          ((marketRate - historicalAverage) / historicalAverage) * 100,
      },
    };

    // Get rate trend
    const rateTrend = await this.getRateTrend(origin, destination, mode, type);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      marketRate,
      benchmarkRate,
      comparison,
      rateTrend,
    );

    // Get forecast
    const forecast = await this.getForecast(origin, destination, mode, type);

    return {
      route: {
        origin,
        destination,
        mode,
        type,
      },
      cargo,
      marketRate,
      marketRateIndex: rateIndex,
      benchmarkRate,
      comparison,
      rateTrend,
      recommendations,
      forecast,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get or create rate index for a lane
   */
  async getRateIndex(
    origin: Location,
    destination: Location,
    mode: TransportMode,
    type: ShipmentType,
  ): Promise<FreightRateIndex> {
    const lane = `${origin.address.countryCode}-${destination.address.countryCode}`;
    const indexKey = `${mode}-${type}-${lane}`;

    // Check if index exists
    let index = this.rateIndexes.get(indexKey);

    if (!index) {
      // Create new index
      index = await this.createRateIndex(origin, destination, mode, type, lane);
      this.rateIndexes.set(indexKey, index);
    } else {
      // Update if stale (older than 24 hours)
      const lastUpdated = new Date(index.lastUpdated);
      const now = new Date();
      const hoursSinceUpdate =
        (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate > 24) {
        index = await this.updateRateIndex(index);
        this.rateIndexes.set(indexKey, index);
      }
    }

    return index;
  }

  /**
   * Create new rate index
   */
  private async createRateIndex(
    origin: Location,
    destination: Location,
    mode: TransportMode,
    type: ShipmentType,
    lane: string,
  ): Promise<FreightRateIndex> {
    // In production, fetch from market data provider or calculate from historical data
    const baseRates: Record<string, number> = {
      "AIR-AIR_EXPRESS": 5.0, // USD per kg
      "AIR-AIR_STANDARD": 3.5,
      "AIR-AIR_ECONOMY": 2.5,
      "SEA-FCL": 2000, // USD per container
      "SEA-LCL": 150, // USD per CBM
      "LAND-FTL": 2.0, // USD per km
      "LAND-LTL": 0.5, // USD per kg per 100km
      "RAIL-BULK": 0.3, // USD per ton per 100km
    };

    const key = `${mode}-${type}`;
    const baseRate = baseRates[key] || 1.0;

    // Add regional adjustments
    const regionalMultiplier = this.getRegionalMultiplier(origin, destination);
    const currentRate = baseRate * regionalMultiplier;

    return {
      id: `index-${lane}-${mode}-${type}`,
      name: `${mode} ${type} Rate Index - ${lane}`,
      type: "MARKET",
      mode,
      region: lane,
      lane,
      currentRate,
      currency: "USD",
      unit:
        mode === "SEA" ? "PER_CONTAINER" : mode === "AIR" ? "PER_KG" : "PER_KM",
      indexValue: 100, // Baseline
      baselineDate: new Date().toISOString(),
      baselineValue: currentRate,
      trend: {
        period: "MONTH",
        direction: "STABLE",
        change: 0,
        volatility: 5,
      },
      source: "INTERNAL",
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Update existing rate index
   */
  private async updateRateIndex(
    index: FreightRateIndex,
  ): Promise<FreightRateIndex> {
    // Simulate market fluctuations
    assertRealInProduction(
      "tms.pricing.marketIndex",
      "Market index updates are simulated. Configure pricing feeds/indices for production.",
    );
    const change = (Math.random() - 0.5) * 0.1; // ±5% change
    const newRate = index.currentRate * (1 + change);

    return {
      ...index,
      previousRate: index.currentRate,
      currentRate: newRate,
      change: change * 100,
      changeDirection: change > 0 ? "UP" : change < 0 ? "DOWN" : "STABLE",
      indexValue: index.indexValue ? index.indexValue * (1 + change) : 100,
      trend: {
        ...index.trend,
        direction: change > 0.02 ? "UP" : change < -0.02 ? "DOWN" : "STABLE",
        change: change * 100,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Calculate market rate for shipment
   */
  private async calculateMarketRate(
    origin: Location,
    destination: Location,
    mode: TransportMode,
    type: ShipmentType,
    cargo: { weight: number; volume: number; value: number },
  ): Promise<number> {
    const index = await this.getRateIndex(origin, destination, mode, type);

    // Calculate based on cargo characteristics
    let rate = 0;

    if (mode === "AIR") {
      // Air freight: per kg or volumetric weight (whichever is higher)
      const volumetricWeight = cargo.volume * 167; // 1 m³ = 167 kg
      const chargeableWeight = Math.max(cargo.weight, volumetricWeight);
      rate = chargeableWeight * index.currentRate;
    } else if (mode === "SEA") {
      if (type === "FCL") {
        rate = index.currentRate; // Per container
      } else if (type === "LCL") {
        rate = cargo.volume * index.currentRate; // Per CBM
      }
    } else if (mode === "LAND") {
      const distance = this.calculateDistance(origin, destination);
      if (type === "FTL") {
        rate = distance * index.currentRate; // Per km
      } else if (type === "LTL") {
        rate = (cargo.weight / 1000) * distance * index.currentRate; // Per ton per 100km
      }
    } else if (mode === "RAIL") {
      const distance = this.calculateDistance(origin, destination);
      rate = (cargo.weight / 1000) * (distance / 100) * index.currentRate; // Per ton per 100km
    }

    // Add fuel surcharge (typically 10-15%)
    const fuelSurcharge = rate * 0.12;
    return rate + fuelSurcharge;
  }

  /**
   * Get benchmark rate (historical average)
   */
  private async getBenchmarkRate(
    origin: Location,
    destination: Location,
    mode: TransportMode,
    type: ShipmentType,
    cargo: { weight: number; volume: number; value: number },
  ): Promise<number> {
    // In production, calculate from historical data
    const marketRate = await this.calculateMarketRate(
      origin,
      destination,
      mode,
      type,
      cargo,
    );
    return marketRate * 0.95; // Assume benchmark is 5% below current market
  }

  /**
   * Get historical average rate
   */
  private async getHistoricalAverage(
    origin: Location,
    destination: Location,
    mode: TransportMode,
    type: ShipmentType,
    cargo: { weight: number; volume: number; value: number },
  ): Promise<number> {
    // In production, calculate from historical data
    const marketRate = await this.calculateMarketRate(
      origin,
      destination,
      mode,
      type,
      cargo,
    );
    return marketRate * 0.98; // Assume historical average is 2% below current
  }

  /**
   * Get rate trend
   */
  private async getRateTrend(
    origin: Location,
    destination: Location,
    mode: TransportMode,
    type: ShipmentType,
  ): Promise<{
    direction: "UP" | "DOWN" | "STABLE";
    change: number;
    period: string;
    factors?: string[];
  }> {
    const index = await this.getRateIndex(origin, destination, mode, type);

    return {
      direction: index.trend?.direction || "STABLE",
      change: index.trend?.change || 0,
      period: index.trend?.period || "MONTH",
      factors: [
        "FUEL_PRICES",
        "DEMAND_SUPPLY",
        "SEASONAL_FACTORS",
        "GEO_POLITICAL",
      ],
    };
  }

  /**
   * Generate pricing recommendations
   */
  private generateRecommendations(
    marketRate: number,
    benchmarkRate: number,
    comparison: PricingIntelligence["comparison"],
    rateTrend: PricingIntelligence["rateTrend"],
  ): PricingIntelligence["recommendations"] {
    const recommendations: PricingIntelligence["recommendations"] = [];

    if (comparison.vsMarket.status === "ABOVE") {
      recommendations.push({
        action: "NEGOTIATE",
        reason: `Your rate is ${comparison.vsMarket.percentage.toFixed(1)}% above market rate`,
        suggestedRate: marketRate * 0.95,
        potentialSavings: comparison.vsMarket.difference,
      });
    } else if (comparison.vsMarket.status === "BELOW") {
      recommendations.push({
        action: "ACCEPT",
        reason: `Your rate is ${Math.abs(comparison.vsMarket.percentage).toFixed(1)}% below market rate - good deal!`,
      });
    }

    if (rateTrend?.direction === "UP" && rateTrend.change > 5) {
      recommendations.push({
        action: "ACCEPT",
        reason: `Rates are trending up (${rateTrend.change.toFixed(1)}%) - consider booking now`,
      });
    } else if (rateTrend?.direction === "DOWN" && rateTrend.change < -5) {
      recommendations.push({
        action: "WAIT",
        reason: `Rates are trending down (${rateTrend.change.toFixed(1)}%) - consider waiting`,
      });
    }

    if (comparison.vsBenchmark.percentage > 10) {
      recommendations.push({
        action: "SHOP_AROUND",
        reason: `Market rate is ${comparison.vsBenchmark.percentage.toFixed(1)}% above benchmark - get multiple quotes`,
      });
    }

    return recommendations.length > 0 ? recommendations : undefined;
  }

  /**
   * Get price forecast
   */
  private async getForecast(
    origin: Location,
    destination: Location,
    mode: TransportMode,
    type: ShipmentType,
  ): Promise<PricingIntelligence["forecast"]> {
    const index = await this.getRateIndex(origin, destination, mode, type);
    const trend = index.trend;

    // Simple forecast based on trend
    const currentRate = index.currentRate;
    const monthlyChange = trend?.change || 0;

    return {
      next30Days: currentRate * (1 + monthlyChange / 100),
      next90Days: currentRate * (1 + (monthlyChange * 3) / 100),
      confidence: 0.7,
      factors: ["HISTORICAL_TRENDS", "SEASONAL_PATTERNS", "MARKET_DYNAMICS"],
    };
  }

  /**
   * Get regional multiplier for pricing
   */
  private getRegionalMultiplier(
    origin: Location,
    destination: Location,
  ): number {
    // In production, use actual regional pricing data
    // For now, return base multiplier
    return 1.0;
  }

  /**
   * Calculate distance between locations
   */
  private calculateDistance(origin: Location, destination: Location): number {
    if (!origin.coordinates || !destination.coordinates) {
      // Fallback: estimate based on country codes
      return 1000; // Default 1000 km
    }

    const R = 6371; // Earth's radius in km
    const lat1 = origin.coordinates.lat;
    const lon1 = origin.coordinates.lng;
    const lat2 = destination.coordinates.lat;
    const lon2 = destination.coordinates.lng;

    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const pricingIntelligenceService = new PricingIntelligenceService();

/**
 * Carrier Network Management Service
 *
 * Carrier segmentation, rating, capacity tracking, network coverage analysis
 * Integrates with existing carrier and marketplace services
 */

import type { Carrier } from "@/types/tms";
import { eventBus } from "@/lib/services/event-store";

export interface CarrierSegment {
  id: string;
  name: string;
  criteria: {
    fleetType?: string[];
    region?: string[];
    minRating?: number;
    minOnTimeRate?: number;
    serviceTypes?: string[];
  };
  carriers: string[]; // carrier IDs
}

export interface CarrierRating {
  carrierId: string;
  overallRating: number; // 0-100
  categories: {
    onTimePerformance: number;
    cost: number;
    reliability: number;
    communication: number;
    damageRate: number;
    customerService: number;
  };
  totalShipments: number;
  lastUpdated: Date | string;
}

export interface CarrierCapacity {
  carrierId: string;
  mode: string;
  availableCapacity: {
    weight: number; // kg
    volume: number; // m³
    containers?: number;
    vehicles?: number;
  };
  utilization: number; // %
  forecastedCapacity: {
    next7Days: number;
    next30Days: number;
  };
  lastUpdated: Date | string;
}

export interface NetworkCoverage {
  region: string;
  carriers: string[];
  coverageScore: number; // 0-100
  gaps: {
    area: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    recommendedCarriers?: string[];
  }[];
}

export class CarrierNetworkService {
  private carriers: Map<string, Carrier> = new Map();
  private segments: Map<string, CarrierSegment> = new Map();
  private ratings: Map<string, CarrierRating> = new Map();
  private capacities: Map<string, CarrierCapacity> = new Map();

  /**
   * Create carrier segment
   */
  async createSegment(
    segment: Omit<CarrierSegment, "id" | "carriers">,
  ): Promise<string> {
    const segmentId = `segment-${Date.now()}`;

    const newSegment: CarrierSegment = {
      id: segmentId,
      ...segment,
      carriers: [],
    };

    // Auto-populate carriers based on criteria
    const matchingCarriers = await this.findCarriersByCriteria(
      segment.criteria,
    );
    newSegment.carriers = matchingCarriers.map((c) => c.id);

    this.segments.set(segmentId, newSegment);

    await eventBus.publish("transportation.carrier.segment.created", {
      segmentId,
      carriersCount: newSegment.carriers.length,
    });

    return segmentId;
  }

  /**
   * Rate carrier
   */
  async rateCarrier(carrierId: string): Promise<CarrierRating> {
    const carrier = await this.getCarrier(carrierId);
    if (!carrier) {
      throw new Error("Carrier not found");
    }

    // Calculate ratings from performance data
    const onTimePerformance = carrier.performance?.onTimeDeliveryRate || 0;
    const cost = this.calculateCostRating(carrier);
    const reliability = this.calculateReliabilityRating(carrier);
    const communication = 80; // Would come from feedback
    const damageRate = this.calculateDamageRating(carrier);
    const customerService = 85; // Would come from feedback

    const overallRating =
      onTimePerformance * 0.3 +
      cost * 0.2 +
      reliability * 0.2 +
      communication * 0.1 +
      (100 - damageRate * 10) * 0.1 +
      customerService * 0.1;

    const rating: CarrierRating = {
      carrierId,
      overallRating: Math.round(overallRating),
      categories: {
        onTimePerformance,
        cost,
        reliability,
        communication,
        damageRate: carrier.performance?.damageRate || 0,
        customerService,
      },
      totalShipments: carrier.performance?.totalRevenue ? 100 : 0, // Would come from actual data
      lastUpdated: new Date().toISOString(),
    };

    this.ratings.set(carrierId, rating);

    return rating;
  }

  /**
   * Get carrier capacity
   */
  async getCarrierCapacity(
    carrierId: string,
    mode: string,
  ): Promise<CarrierCapacity | null> {
    const key = `${carrierId}-${mode}`;
    let capacity = this.capacities.get(key);

    if (!capacity) {
      // Create initial capacity record
      capacity = {
        carrierId,
        mode,
        availableCapacity: {
          weight: 100000, // kg
          volume: 1000, // m³
        },
        utilization: 0,
        forecastedCapacity: {
          next7Days: 100000,
          next30Days: 100000,
        },
        lastUpdated: new Date().toISOString(),
      };
      this.capacities.set(key, capacity);
    }

    return capacity;
  }

  /**
   * Update carrier capacity
   */
  async updateCapacity(
    carrierId: string,
    mode: string,
    capacity: Partial<CarrierCapacity["availableCapacity"]>,
  ): Promise<void> {
    const existing = await this.getCarrierCapacity(carrierId, mode);
    if (!existing) return;

    existing.availableCapacity = {
      ...existing.availableCapacity,
      ...capacity,
    };
    existing.utilization = this.calculateUtilization(existing);
    existing.lastUpdated = new Date().toISOString();

    this.capacities.set(`${carrierId}-${mode}`, existing);

    await eventBus.publish("transportation.carrier.capacity.updated", {
      carrierId,
      mode,
      capacity: existing.availableCapacity,
    });
  }

  /**
   * Analyze network coverage
   */
  async analyzeNetworkCoverage(region: string): Promise<NetworkCoverage> {
    // Get all carriers covering this region
    const carriers = Array.from(this.carriers.values()).filter(
      (c) =>
        c.coverage.local || c.coverage.regional || c.coverage.international,
    );

    // Calculate coverage score
    const coverageScore = this.calculateCoverageScore(carriers, region);

    // Identify gaps
    const gaps = await this.identifyCoverageGaps(region, carriers);

    return {
      region,
      carriers: carriers.map((c) => c.id),
      coverageScore,
      gaps,
    };
  }

  /**
   * Prioritize carriers based on performance
   */
  async prioritizeCarriers(criteria: {
    mode?: string;
    region?: string;
    minRating?: number;
    minCapacity?: number;
  }): Promise<Carrier[]> {
    // Get matching carriers
    const carriers = await this.findCarriersByCriteria(criteria);

    // Get ratings
    const carriersWithRatings = await Promise.all(
      carriers.map(async (carrier) => {
        const rating =
          this.ratings.get(carrier.id) || (await this.rateCarrier(carrier.id));
        return { carrier, rating };
      }),
    );

    // Sort by rating
    carriersWithRatings.sort(
      (a, b) => b.rating.overallRating - a.rating.overallRating,
    );

    return carriersWithRatings.map((c) => c.carrier);
  }

  /**
   * Find carriers by criteria
   */
  private async findCarriersByCriteria(criteria: {
    fleetType?: string[];
    region?: string[];
    minRating?: number;
    minOnTimeRate?: number;
    serviceTypes?: string[];
    mode?: string;
    minCapacity?: number;
  }): Promise<Carrier[]> {
    let carriers = Array.from(this.carriers.values());

    if (criteria.mode) {
      carriers = carriers.filter(
        (c) => c.type === criteria.mode || c.type === "MULTIMODAL",
      );
    }

    if (criteria.minRating) {
      carriers = carriers.filter((c) => {
        const rating = this.ratings.get(c.id);
        return rating && rating.overallRating >= criteria.minRating!;
      });
    }

    if (criteria.minOnTimeRate) {
      carriers = carriers.filter(
        (c) =>
          (c.performance?.onTimeDeliveryRate || 0) >= criteria.minOnTimeRate!,
      );
    }

    if (criteria.serviceTypes) {
      carriers = carriers.filter((c) =>
        criteria.serviceTypes!.some((st) => c.serviceTypes.includes(st)),
      );
    }

    return carriers;
  }

  /**
   * Calculate cost rating (lower cost = higher rating)
   */
  private calculateCostRating(carrier: Carrier): number {
    // In production, compare with market average
    // For now, use performance data
    const avgCost = carrier.performance?.costPerShipment || 0;
    if (avgCost === 0) return 50;

    // Normalize to 0-100 (lower is better, so invert)
    return Math.max(0, Math.min(100, 100 - (avgCost / 1000) * 10));
  }

  /**
   * Calculate reliability rating
   */
  private calculateReliabilityRating(carrier: Carrier): number {
    const onTimeRate = carrier.performance?.onTimeDeliveryRate || 0;
    const damageRate = carrier.performance?.damageRate || 0;
    const lossRate = carrier.performance?.lossRate || 0;

    // Combine factors
    return (
      onTimeRate * 0.7 +
      (100 - damageRate * 10) * 0.2 +
      (100 - lossRate * 100) * 0.1
    );
  }

  /**
   * Calculate damage rating
   */
  private calculateDamageRating(carrier: Carrier): number {
    return carrier.performance?.damageRate || 0;
  }

  /**
   * Calculate utilization
   */
  private calculateUtilization(capacity: CarrierCapacity): number {
    // In production, calculate from actual usage
    return 0;
  }

  /**
   * Calculate coverage score
   */
  private calculateCoverageScore(carriers: Carrier[], region: string): number {
    // In production, analyze actual coverage
    // For now, return based on carrier count
    return Math.min(100, carriers.length * 10);
  }

  /**
   * Identify coverage gaps
   */
  private async identifyCoverageGaps(
    region: string,
    carriers: Carrier[],
  ): Promise<NetworkCoverage["gaps"]> {
    // In production, analyze geographic coverage
    // For now, return empty
    return [];
  }

  /**
   * Get carrier
   */
  private async getCarrier(carrierId: string): Promise<Carrier | null> {
    return this.carriers.get(carrierId) || null;
  }
}

export const carrierNetworkService = new CarrierNetworkService();

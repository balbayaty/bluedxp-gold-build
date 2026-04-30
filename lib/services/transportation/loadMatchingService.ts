/**
 * Transportation Load Matching Service
 *
 * Intelligent load matching for transportation marketplace
 * Integrates with existing marketplace AI matching service
 * No duplication - extends marketplace capabilities for transportation
 */

import type {
  Shipment,
  Location,
  TransportMode,
  ShipmentType,
} from "@/types/tms";
import type { Carrier } from "@/types/tms";
import { assertRealInProduction } from "./strictMode";
import { aiMatchingService } from "@/lib/services/marketplace/aiMatchingService";
import { eventBus } from "@/lib/services/event-store";
import type { ServiceRequirement } from "@/types/marketplace-requirements";

export interface LoadMatchingRequest {
  origin: Location;
  destination: Location;
  cargo: {
    weight: number; // kg
    volume: number; // m³
    type: ShipmentType;
    value?: number;
  };
  mode: TransportMode;
  pickupDate?: Date | string;
  deliveryDate?: Date | string;
  preferences?: {
    maxPrice?: number;
    minReliability?: number; // %
    preferredCarriers?: string[];
    excludeCarriers?: string[];
    specialRequirements?: string[];
  };
}

export interface LoadMatch {
  carrier: Carrier;
  matchScore: number; // 0-100
  confidence: number; // 0-100
  estimatedPrice: number;
  estimatedTransitTime: number; // hours
  reliability: number; // %
  reasons: string[];
  strengths: string[];
  considerations: string[];
  availability: boolean;
  bookingDeadline?: Date | string;
}

export interface LoadMatchingResult {
  request: LoadMatchingRequest;
  matches: LoadMatch[];
  topMatch?: LoadMatch;
  recommendations: {
    alternativeModes?: TransportMode[];
    priceOptimization?: string[];
    timingOptimization?: string[];
  };
  generatedAt: Date | string;
}

export class LoadMatchingService {
  /**
   * Find matching carriers for a load
   */
  async findMatches(request: LoadMatchingRequest): Promise<LoadMatchingResult> {
    // Convert to marketplace service requirement
    const requirement: ServiceRequirement = {
      id: `load-${Date.now()}`,
      category: "TRANSPORTATION",
      serviceType: this.mapShipmentTypeToServiceType(request.cargo.type),
      route: {
        origin: {
          address: request.origin.address.street,
          city: request.origin.address.city,
          country: request.origin.address.country,
          coordinates: request.origin.coordinates,
        },
        destination: {
          address: request.destination.address.street,
          city: request.destination.address.city,
          country: request.destination.address.country,
          coordinates: request.destination.coordinates,
        },
      },
      cargo: {
        weight: request.cargo.weight,
        volume: request.cargo.volume,
        type: [request.cargo.type],
      },
      serviceLevel: {
        pickupDate: request.pickupDate?.toString(),
        deliveryDate: request.deliveryDate?.toString(),
      },
    };

    // Use existing marketplace AI matching
    const marketplaceMatches = await aiMatchingService.findMatches(requirement);

    // Convert marketplace matches to load matches
    const loadMatches: LoadMatch[] = await Promise.all(
      marketplaceMatches.matches
        .filter((m) => m.listing.category === "TRANSPORTATION")
        .map(async (match) => {
          const carrier = await this.getCarrierFromListing(match.listing);
          return this.createLoadMatch(match, carrier, request);
        }),
    );

    // Filter by preferences
    const filteredMatches = this.applyPreferences(
      loadMatches,
      request.preferences,
    );

    // Sort by match score
    filteredMatches.sort((a, b) => b.matchScore - a.matchScore);

    // Get top match
    const topMatch = filteredMatches[0];

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      filteredMatches,
      request,
    );

    // Publish event
    await eventBus.publish("transportation.load.matched", {
      requestId: requirement.id,
      matchesCount: filteredMatches.length,
      topMatch: topMatch?.carrier.id,
    });

    return {
      request,
      matches: filteredMatches,
      topMatch,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Match load with specific carrier
   */
  async matchWithCarrier(
    request: LoadMatchingRequest,
    carrierId: string,
  ): Promise<LoadMatch | null> {
    // Get carrier
    const carrier = await this.getCarrierById(carrierId);
    if (!carrier) return null;

    // Check availability
    const availability = await this.checkCarrierAvailability(carrier, request);

    // Calculate match score
    const matchScore = await this.calculateCarrierMatchScore(carrier, request);

    // Get pricing
    const estimatedPrice = await this.estimatePrice(carrier, request);

    // Get transit time
    const estimatedTransitTime = await this.estimateTransitTime(
      carrier,
      request,
    );

    return {
      carrier,
      matchScore,
      confidence: 85,
      estimatedPrice,
      estimatedTransitTime,
      reliability: carrier.performance?.onTimeDeliveryRate || 85,
      reasons: this.generateMatchReasons(carrier, request),
      strengths: this.identifyStrengths(carrier, request),
      considerations: this.identifyConsiderations(carrier, request),
      availability,
    };
  }

  /**
   * Get real-time availability for carriers
   */
  async checkRealTimeAvailability(
    request: LoadMatchingRequest,
  ): Promise<
    Array<{ carrierId: string; available: boolean; capacity?: number }>
  > {
    // In production, check with carrier APIs or marketplace
    // For now, simulate availability
    assertRealInProduction(
      "tms.loadMatching.availability",
      "Real-time carrier availability is simulated. Configure marketplace/carrier APIs for production.",
    );
    return [];
  }

  /**
   * Map shipment type to marketplace service type
   */
  private mapShipmentTypeToServiceType(type: ShipmentType): string {
    const mapping: Record<ShipmentType, string> = {
      FCL: "FCL",
      LCL: "LCL",
      FTL: "FTL",
      LTL: "LTL",
      AIR_EXPRESS: "AIR_EXPRESS",
      AIR_STANDARD: "AIR_STANDARD",
      AIR_ECONOMY: "AIR_ECONOMY",
      BULK: "BULK",
      BREAK_BULK: "BREAK_BULK",
      RO_RO: "RO_RO",
      PROJECT_CARGO: "PROJECT_CARGO",
      REEFER: "REEFER",
      HAZMAT: "HAZMAT",
    };
    return mapping[type] || "FTL";
  }

  /**
   * Get carrier from marketplace listing
   */
  private async getCarrierFromListing(listing: any): Promise<Carrier> {
    // In production, fetch from database or carrier service
    // For now, create from listing data
    return {
      id: listing.providerId || `carrier-${Date.now()}`,
      code: listing.providerCode || "",
      name: listing.providerName || "Unknown Carrier",
      type: this.mapModeToCarrierType(listing.mode || "LAND"),
      contactPerson: "",
      email: "",
      phone: "",
      serviceTypes: [listing.serviceType || "FTL"],
      coverage: {
        local: true,
        regional: true,
        international: true,
      },
      rating: 4.0,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create load match from marketplace match
   */
  private createLoadMatch(
    marketplaceMatch: any,
    carrier: Carrier,
    request: LoadMatchingRequest,
  ): LoadMatch {
    return {
      carrier,
      matchScore: marketplaceMatch.matchScore,
      confidence: marketplaceMatch.confidence,
      estimatedPrice: marketplaceMatch.estimatedPrice || 0,
      estimatedTransitTime: 0, // Will be calculated
      reliability: carrier.performance?.onTimeDeliveryRate || 85,
      reasons: marketplaceMatch.reasons || [],
      strengths: marketplaceMatch.strengths || [],
      considerations: marketplaceMatch.considerations || [],
      availability: true,
    };
  }

  /**
   * Apply preferences to matches
   */
  private applyPreferences(
    matches: LoadMatch[],
    preferences?: LoadMatchingRequest["preferences"],
  ): LoadMatch[] {
    if (!preferences) return matches;

    return matches.filter((match) => {
      // Price filter
      if (preferences.maxPrice && match.estimatedPrice > preferences.maxPrice) {
        return false;
      }

      // Reliability filter
      if (
        preferences.minReliability &&
        match.reliability < preferences.minReliability
      ) {
        return false;
      }

      // Preferred carriers
      if (
        preferences.preferredCarriers &&
        preferences.preferredCarriers.length > 0
      ) {
        if (!preferences.preferredCarriers.includes(match.carrier.id)) {
          return false;
        }
      }

      // Excluded carriers
      if (
        preferences.excludeCarriers &&
        preferences.excludeCarriers.includes(match.carrier.id)
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    matches: LoadMatch[],
    request: LoadMatchingRequest,
  ): LoadMatchingResult["recommendations"] {
    const recommendations: LoadMatchingResult["recommendations"] = {};

    // Alternative modes if few matches
    if (matches.length < 3) {
      recommendations.alternativeModes = this.suggestAlternativeModes(
        request.mode,
      );
    }

    // Price optimization
    if (matches.length > 0) {
      const priceRange = matches.map((m) => m.estimatedPrice);
      const minPrice = Math.min(...priceRange);
      const maxPrice = Math.max(...priceRange);
      if (maxPrice - minPrice > minPrice * 0.2) {
        recommendations.priceOptimization = [
          `Price range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`,
          "Consider negotiating with top matches",
        ];
      }
    }

    return recommendations;
  }

  /**
   * Get carrier by ID
   */
  private async getCarrierById(carrierId: string): Promise<Carrier | null> {
    // In production, fetch from database
    return null;
  }

  /**
   * Check carrier availability
   */
  private async checkCarrierAvailability(
    carrier: Carrier,
    request: LoadMatchingRequest,
  ): Promise<boolean> {
    // In production, check with carrier API or marketplace
    return true;
  }

  /**
   * Calculate carrier match score
   */
  private async calculateCarrierMatchScore(
    carrier: Carrier,
    request: LoadMatchingRequest,
  ): Promise<number> {
    let score = 50; // Base score

    // Mode compatibility
    if (carrier.type === request.mode || carrier.type === "MULTIMODAL") {
      score += 20;
    }

    // Service type compatibility
    if (carrier.serviceTypes.includes(request.cargo.type)) {
      score += 15;
    }

    // Performance
    if (carrier.performance) {
      score += (carrier.performance.onTimeDeliveryRate / 100) * 10;
    }

    // Coverage
    if (carrier.coverage.international) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * Estimate price
   */
  private async estimatePrice(
    carrier: Carrier,
    request: LoadMatchingRequest,
  ): Promise<number> {
    // In production, use pricing intelligence service
    return 1000;
  }

  /**
   * Estimate transit time
   */
  private async estimateTransitTime(
    carrier: Carrier,
    request: LoadMatchingRequest,
  ): Promise<number> {
    // In production, use transit time prediction service
    return 24;
  }

  /**
   * Generate match reasons
   */
  private generateMatchReasons(
    carrier: Carrier,
    request: LoadMatchingRequest,
  ): string[] {
    const reasons: string[] = [];

    if (carrier.performance && carrier.performance.onTimeDeliveryRate > 90) {
      reasons.push("High on-time delivery rate");
    }

    if (carrier.coverage.international) {
      reasons.push("International coverage");
    }

    if (carrier.rating >= 4.5) {
      reasons.push("High carrier rating");
    }

    return reasons;
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(
    carrier: Carrier,
    request: LoadMatchingRequest,
  ): string[] {
    const strengths: string[] = [];

    if (carrier.performance) {
      strengths.push(
        `On-time rate: ${carrier.performance.onTimeDeliveryRate}%`,
      );
    }

    return strengths;
  }

  /**
   * Identify considerations
   */
  private identifyConsiderations(
    carrier: Carrier,
    request: LoadMatchingRequest,
  ): string[] {
    const considerations: string[] = [];

    if (carrier.performance && carrier.performance.damageRate > 1) {
      considerations.push("Higher than average damage rate");
    }

    return considerations;
  }

  /**
   * Suggest alternative modes
   */
  private suggestAlternativeModes(mode: TransportMode): TransportMode[] {
    const alternatives: Record<TransportMode, TransportMode[]> = {
      AIR: ["LAND", "SEA"],
      SEA: ["AIR", "LAND", "RAIL"],
      LAND: ["RAIL", "AIR"],
      RAIL: ["LAND", "SEA"],
      MULTIMODAL: ["AIR", "SEA", "LAND"],
      EXPRESS: ["AIR", "LAND"],
      COURIER: ["EXPRESS", "LAND"],
    };
    return alternatives[mode] || [];
  }

  /**
   * Map mode to carrier type
   */
  private mapModeToCarrierType(mode: TransportMode): Carrier["type"] {
    const mapping: Record<TransportMode, Carrier["type"]> = {
      AIR: "AIR",
      SEA: "SEA",
      LAND: "LAND",
      RAIL: "RAIL",
      MULTIMODAL: "MULTIMODAL",
      EXPRESS: "COURIER",
      COURIER: "COURIER",
    };
    return mapping[mode] || "LAND";
  }
}

export const loadMatchingService = new LoadMatchingService();

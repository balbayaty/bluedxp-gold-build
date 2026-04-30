/**
 * Multimodal Journey Planner
 *
 * Intelligent multimodal transportation planning:
 * - Route analysis
 * - Mode selection
 * - Leg optimization
 * - Intermodal planning
 * - Cost optimization
 * - Time optimization
 */

import type {
  LoadItem,
  MultimodalLoadPlan,
  MultimodalLeg,
  TransportMode,
  VehicleSpecification,
} from "@/types/load-design";
import { getAllVehicleSpecifications } from "../vehicleSpecifications";
import { binPacking3D } from "../algorithms/binPacking3D";

export interface MultimodalPlanningRequest {
  items: LoadItem[];
  origin: {
    address: string;
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  destination: {
    address: string;
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  constraints?: {
    maxTransitTime?: number; // hours
    maxCost?: number;
    preferredModes?: TransportMode[];
    avoidModes?: TransportMode[];
  };
  strategy?: "FASTEST" | "CHEAPEST" | "BALANCED";
}

/**
 * Multimodal Journey Planner Service
 */
export class MultimodalPlanner {
  /**
   * Plan multimodal journey
   */
  async planJourney(
    request: MultimodalPlanningRequest,
  ): Promise<MultimodalLoadPlan> {
    const {
      items,
      origin,
      destination,
      constraints,
      strategy = "BALANCED",
    } = request;

    // Analyze route
    const routeAnalysis = this.analyzeRoute(origin, destination);

    // Determine optimal modes
    const modes = this.determineOptimalModes(
      routeAnalysis,
      constraints,
      strategy,
    );

    // Plan legs
    const legs = await this.planLegs(
      items,
      origin,
      destination,
      modes,
      routeAnalysis,
    );

    // Calculate totals
    const totalTransitTime = legs.reduce(
      (sum, leg) => sum + (leg.estimatedDuration || 0),
      0,
    );
    const totalCost = legs.reduce(
      (sum, leg) => sum + (leg.cost?.total || 0),
      0,
    );

    // Distribute items across legs
    const itemDistribution = this.distributeItems(items, legs);

    return {
      id: `MM-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      loadNumber: `MM-${Date.now()}`,
      origin,
      destination,
      legs: legs.map((leg, index) => ({
        ...leg,
        itemIds: itemDistribution[index] || [],
      })),
      items,
      totalTransitTime,
      totalCost,
      currency: "USD",
      compliance: {
        status: "PENDING_VALIDATION",
        checks: [],
        warnings: [],
        errors: [],
      },
      status: "DRAFT",
      plannedDate: new Date().toISOString(),
    };
  }

  /**
   * Analyze route
   */
  private analyzeRoute(
    origin: { country: string; coordinates?: { lat: number; lng: number } },
    destination: {
      country: string;
      coordinates?: { lat: number; lng: number };
    },
  ): {
    isInternational: boolean;
    distance?: number; // km
    requiresSea: boolean;
    requiresAir: boolean;
    requiresRail: boolean;
    requiresLand: boolean;
    countries: string[];
  } {
    const isInternational = origin.country !== destination.country;
    const countries = [origin.country, destination.country];

    // Calculate distance if coordinates available
    let distance: number | undefined;
    if (origin.coordinates && destination.coordinates) {
      distance = this.calculateDistance(
        origin.coordinates,
        destination.coordinates,
      );
    }

    // Determine required modes
    const requiresSea = isInternational && (distance || 0) > 1000; // Long distance international
    const requiresAir = isInternational && (distance || 0) > 5000; // Very long distance
    const requiresRail = countries.some((c) =>
      ["US", "CA", "MX", "CN", "RU", "IN"].includes(c),
    );
    const requiresLand = true; // Always need land transport for first/last mile

    return {
      isInternational,
      distance,
      requiresSea,
      requiresAir,
      requiresRail,
      requiresLand,
      countries,
    };
  }

  /**
   * Calculate distance between coordinates
   */
  private calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    const lat1 = this.toRad(coord1.lat);
    const lat2 = this.toRad(coord2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Determine optimal transport modes
   */
  private determineOptimalModes(
    routeAnalysis: ReturnType<typeof this.analyzeRoute>,
    constraints?: MultimodalPlanningRequest["constraints"],
    strategy: "FASTEST" | "CHEAPEST" | "BALANCED" = "BALANCED",
  ): TransportMode[] {
    const modes: TransportMode[] = [];

    // First/last mile - always land
    if (routeAnalysis.requiresLand) {
      modes.push("LAND");
    }

    // Long distance
    if (routeAnalysis.isInternational) {
      if (
        strategy === "FASTEST" ||
        (strategy === "BALANCED" && routeAnalysis.requiresAir)
      ) {
        modes.push("AIR");
      } else if (routeAnalysis.requiresSea) {
        modes.push("SEA");
      } else if (routeAnalysis.requiresRail) {
        modes.push("RAIL");
      }
    } else {
      // Domestic
      if (routeAnalysis.requiresRail && (routeAnalysis.distance || 0) > 500) {
        modes.push("RAIL");
      } else {
        modes.push("LAND");
      }
    }

    // Apply constraints
    if (constraints?.preferredModes) {
      return constraints.preferredModes.filter((mode) => modes.includes(mode));
    }

    if (constraints?.avoidModes) {
      return modes.filter((mode) => !constraints.avoidModes!.includes(mode));
    }

    return modes;
  }

  /**
   * Plan legs for journey
   */
  private async planLegs(
    items: LoadItem[],
    origin: MultimodalPlanningRequest["origin"],
    destination: MultimodalPlanningRequest["destination"],
    modes: TransportMode[],
    routeAnalysis: ReturnType<typeof this.analyzeRoute>,
  ): Promise<MultimodalLeg[]> {
    const legs: MultimodalLeg[] = [];

    // Plan first mile (origin to port/airport/station)
    if (modes.length > 1 || routeAnalysis.isInternational) {
      legs.push(
        await this.createLeg(
          "LAND",
          origin,
          this.getPortLocation(origin),
          1,
          items,
        ),
      );
    }

    // Plan main transport
    if (modes.includes("AIR")) {
      const airOrigin = this.getPortLocation(origin);
      const airDest = this.getPortLocation(destination);
      legs.push(
        await this.createLeg("AIR", airOrigin, airDest, legs.length + 1, items),
      );
    } else if (modes.includes("SEA")) {
      const seaOrigin = this.getPortLocation(origin);
      const seaDest = this.getPortLocation(destination);
      legs.push(
        await this.createLeg("SEA", seaOrigin, seaDest, legs.length + 1, items),
      );
    } else if (modes.includes("RAIL")) {
      const railOrigin = this.getPortLocation(origin);
      const railDest = this.getPortLocation(destination);
      legs.push(
        await this.createLeg(
          "RAIL",
          railOrigin,
          railDest,
          legs.length + 1,
          items,
        ),
      );
    }

    // Plan last mile (port/airport/station to destination)
    if (modes.length > 1 || routeAnalysis.isInternational) {
      const lastMileOrigin =
        legs.length > 0 ? legs[legs.length - 1].destination : origin;
      legs.push(
        await this.createLeg(
          "LAND",
          lastMileOrigin,
          destination,
          legs.length + 1,
          items,
        ),
      );
    } else {
      // Direct land transport
      legs.push(await this.createLeg("LAND", origin, destination, 1, items));
    }

    return legs;
  }

  /**
   * Create leg
   */
  private async createLeg(
    mode: TransportMode,
    origin: {
      address: string;
      city: string;
      country: string;
      coordinates?: { lat: number; lng: number };
    },
    destination: {
      address: string;
      city: string;
      country: string;
      coordinates?: { lat: number; lng: number };
    },
    sequence: number,
    items: LoadItem[],
  ): Promise<MultimodalLeg> {
    // Get vehicle spec for mode
    const vehicleSpec = this.getVehicleSpecForMode(mode, items);

    // Optimize load for this leg
    const packingResult = binPacking3D.packItems(items, vehicleSpec, "SKYLINE");

    // Calculate distance and time
    const distance =
      origin.coordinates && destination.coordinates
        ? this.calculateDistance(origin.coordinates, destination.coordinates)
        : this.estimateDistance(mode, origin, destination);

    const estimatedDuration = this.estimateDuration(mode, distance);

    // Calculate cost
    const cost = this.calculateLegCost(mode, distance, vehicleSpec, items);

    return {
      id: `leg-${sequence}-${Date.now()}`,
      sequence,
      mode,
      origin,
      destination,
      vehicleSpec,
      itemIds: items.map((item) => item.id),
      itemPlacements: packingResult.placements,
      distance,
      estimatedDuration,
      cost,
      compliance: {
        status: "PENDING_VALIDATION",
        checks: [],
      },
      status: "PLANNED",
      plannedDate: new Date().toISOString(),
      estimatedArrival: new Date(
        Date.now() + estimatedDuration * 60 * 60 * 1000,
      ).toISOString(),
    };
  }

  /**
   * Get vehicle spec for mode
   */
  private getVehicleSpecForMode(
    mode: TransportMode,
    items: LoadItem[],
  ): VehicleSpecification {
    const specs = getAllVehicleSpecifications();

    switch (mode) {
      case "AIR":
        // Use largest ULD that fits
        return specs.get("PALLET_96X238") || specs.get("CONTAINER_M1")!;
      case "SEA":
        // Use container based on volume
        const totalVolume = items.reduce(
          (sum, item) => sum + item.volume * item.quantity,
          0,
        );
        if (totalVolume > 60) {
          return specs.get("40FT_STANDARD")!;
        }
        return specs.get("20FT_STANDARD")!;
      case "RAIL":
        return specs.get("BOX_CAR")!;
      case "LAND":
      default:
        const totalWeight = items.reduce(
          (sum, item) => sum + item.weight * item.quantity,
          0,
        );
        if (totalWeight > 15000) {
          return specs.get("LARGE_TRUCK")!;
        }
        return specs.get("TRUCK")!;
    }
  }

  /**
   * Get port/airport/station location
   */
  private getPortLocation(location: { city: string; country: string }): {
    address: string;
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  } {
    // TODO: Integrate with port/airport/station database
    return {
      address: `${location.city} Port/Airport`,
      city: location.city,
      country: location.country,
    };
  }

  /**
   * Estimate distance
   */
  private estimateDistance(
    mode: TransportMode,
    origin: { city: string; country: string },
    destination: { city: string; country: string },
  ): number {
    // Simplified estimation
    if (mode === "AIR") {
      return 2000; // Average air route
    } else if (mode === "SEA") {
      return 5000; // Average sea route
    } else if (mode === "RAIL") {
      return 1000; // Average rail route
    } else {
      return 500; // Average land route
    }
  }

  /**
   * Estimate duration
   */
  private estimateDuration(mode: TransportMode, distance: number): number {
    // Hours
    switch (mode) {
      case "AIR":
        return distance / 800 + 4; // 800 km/h + 4 hours handling
      case "SEA":
        return distance / 30 + 48; // 30 km/h + 48 hours port handling
      case "RAIL":
        return distance / 60 + 12; // 60 km/h + 12 hours handling
      case "LAND":
      default:
        return distance / 80 + 2; // 80 km/h + 2 hours handling
    }
  }

  /**
   * Calculate leg cost
   */
  private calculateLegCost(
    mode: TransportMode,
    distance: number,
    vehicleSpec: VehicleSpecification,
    items: LoadItem[],
  ): MultimodalLeg["cost"] {
    const baseCost = vehicleSpec.baseCost || 0;
    const costPerKm = vehicleSpec.costPerKm || 0;
    const totalWeight = items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0,
    );

    // Mode-specific multipliers
    let multiplier = 1;
    switch (mode) {
      case "AIR":
        multiplier = 5;
        break;
      case "SEA":
        multiplier = 0.5;
        break;
      case "RAIL":
        multiplier = 0.8;
        break;
      case "LAND":
      default:
        multiplier = 1;
        break;
    }

    const transportCost = baseCost + costPerKm * distance * multiplier;
    const weightCost = totalWeight * 0.1 * multiplier;

    return {
      base: baseCost,
      total: transportCost + weightCost,
      currency: vehicleSpec.currency || "USD",
    };
  }

  /**
   * Distribute items across legs
   */
  private distributeItems(
    items: LoadItem[],
    legs: MultimodalLeg[],
  ): string[][] {
    // For now, all items go through all legs
    // In future, could optimize item distribution
    return legs.map(() => items.map((item) => item.id));
  }
}

export const multimodalPlanner = new MultimodalPlanner();

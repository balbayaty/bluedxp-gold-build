/**
 * CO2 Emissions Calculation Service
 *
 * Comprehensive CO2e calculation for transportation with detailed breakdowns,
 * comparison, and offset options
 */

import type {
  Location,
  CO2EmissionsCalculation,
  TransportMode,
} from "@/types/tms";

export interface EmissionsCalculationRequest {
  origin: Location;
  destination: Location;
  distance: number; // km
  mode: TransportMode;
  cargo: {
    weight: number; // kg
    volume: number; // m³
  };
  options?: {
    calculationMethod?: "STANDARD" | "DETAILED" | "CERTIFIED" | "CUSTOM";
    standard?: "GHG_PROTOCOL" | "ISO_14064" | "EPA" | "DEFRA";
    includeEmptyReturn?: boolean;
    loadFactor?: number; // % of capacity utilized (0-1)
  };
}

export class CO2EmissionsService {
  // Emission factors (kg CO2e per km or per kg) - from DEFRA and EPA standards
  private emissionFactors: Record<
    TransportMode,
    {
      perKm: number; // kg CO2e per km (for full load)
      perKg: number; // kg CO2e per kg per 1000km
      perM3: number; // kg CO2e per m³ per 1000km
    }
  > = {
    AIR: {
      perKm: 0.5, // kg CO2e per km (for typical cargo aircraft)
      perKg: 0.5, // kg CO2e per kg per 1000km
      perM3: 0.3, // kg CO2e per m³ per 1000km
    },
    SEA: {
      perKm: 0.015, // kg CO2e per km (for container ship)
      perKg: 0.015, // kg CO2e per kg per 1000km
      perM3: 0.01, // kg CO2e per m³ per 1000km
    },
    LAND: {
      perKm: 0.2, // kg CO2e per km (for truck)
      perKg: 0.2, // kg CO2e per kg per 1000km
      perM3: 0.15, // kg CO2e per m³ per 1000km
    },
    RAIL: {
      perKm: 0.03, // kg CO2e per km (for freight train)
      perKg: 0.03, // kg CO2e per kg per 1000km
      perM3: 0.02, // kg CO2e per m³ per 1000km
    },
    MULTIMODAL: {
      perKm: 0.1, // Average
      perKg: 0.1,
      perM3: 0.07,
    },
    EXPRESS: {
      perKm: 0.25, // Similar to air but with more stops
      perKg: 0.25,
      perM3: 0.2,
    },
    COURIER: {
      perKm: 0.3, // Smaller vehicles, more stops
      perKg: 0.3,
      perM3: 0.25,
    },
  };

  /**
   * Calculate CO2 emissions for a shipment
   */
  async calculateEmissions(
    request: EmissionsCalculationRequest,
  ): Promise<CO2EmissionsCalculation> {
    const { origin, destination, distance, mode, cargo, options } = request;

    const factors = this.emissionFactors[mode];
    const loadFactor = options?.loadFactor || 0.85; // Default 85% utilization

    // Calculate emissions based on mode
    let totalCO2e = 0;
    const breakdown: CO2EmissionsCalculation["breakdown"] = [];

    if (mode === "AIR") {
      // Air freight: use weight-based calculation (volumetric weight if higher)
      const volumetricWeight = cargo.volume * 167; // 1 m³ = 167 kg
      const chargeableWeight = Math.max(cargo.weight, volumetricWeight);
      totalCO2e = (chargeableWeight / 1000) * (distance / 1000) * factors.perKg;

      breakdown.push({
        segment: "Air Transport",
        mode: "AIR",
        distance,
        co2e: totalCO2e,
        percentage: 100,
        emissionFactor: factors.perKg,
        source: "DEFRA",
      });
    } else if (mode === "SEA") {
      // Sea freight: use volume-based calculation
      totalCO2e = cargo.volume * (distance / 1000) * factors.perM3;

      breakdown.push({
        segment: "Sea Transport",
        mode: "SEA",
        distance,
        co2e: totalCO2e,
        percentage: 100,
        emissionFactor: factors.perM3,
        source: "DEFRA",
      });
    } else if (mode === "LAND") {
      // Road freight: use weight-based calculation
      totalCO2e = (cargo.weight / 1000) * (distance / 1000) * factors.perKg;

      breakdown.push({
        segment: "Road Transport",
        mode: "LAND",
        distance,
        co2e: totalCO2e,
        percentage: 100,
        emissionFactor: factors.perKg,
        source: "DEFRA",
      });
    } else if (mode === "RAIL") {
      // Rail freight: use weight-based calculation
      totalCO2e = (cargo.weight / 1000) * (distance / 1000) * factors.perKg;

      breakdown.push({
        segment: "Rail Transport",
        mode: "RAIL",
        distance,
        co2e: totalCO2e,
        percentage: 100,
        emissionFactor: factors.perKg,
        source: "DEFRA",
      });
    } else if (mode === "MULTIMODAL") {
      // Multimodal: calculate for each segment
      // Simplified: assume 50% sea, 30% land, 20% air
      const seaDistance = distance * 0.5;
      const landDistance = distance * 0.3;
      const airDistance = distance * 0.2;

      const seaCO2e =
        cargo.volume * (seaDistance / 1000) * this.emissionFactors.SEA.perM3;
      const landCO2e =
        (cargo.weight / 1000) *
        (landDistance / 1000) *
        this.emissionFactors.LAND.perKg;
      const airCO2e =
        (cargo.weight / 1000) *
        (airDistance / 1000) *
        this.emissionFactors.AIR.perKg;

      totalCO2e = seaCO2e + landCO2e + airCO2e;

      breakdown.push(
        {
          segment: "Sea Segment",
          mode: "SEA",
          distance: seaDistance,
          co2e: seaCO2e,
          percentage: (seaCO2e / totalCO2e) * 100,
          emissionFactor: this.emissionFactors.SEA.perM3,
          source: "DEFRA",
        },
        {
          segment: "Land Segment",
          mode: "LAND",
          distance: landDistance,
          co2e: landCO2e,
          percentage: (landCO2e / totalCO2e) * 100,
          emissionFactor: this.emissionFactors.LAND.perKg,
          source: "DEFRA",
        },
        {
          segment: "Air Segment",
          mode: "AIR",
          distance: airDistance,
          co2e: airCO2e,
          percentage: (airCO2e / totalCO2e) * 100,
          emissionFactor: this.emissionFactors.AIR.perKg,
          source: "DEFRA",
        },
      );
    } else {
      // Default calculation
      totalCO2e = (cargo.weight / 1000) * (distance / 1000) * factors.perKg;

      breakdown.push({
        segment: `${mode} Transport`,
        mode,
        distance,
        co2e: totalCO2e,
        percentage: 100,
        emissionFactor: factors.perKg,
        source: "DEFRA",
      });
    }

    // Adjust for load factor
    totalCO2e = totalCO2e / loadFactor;

    // Include empty return if specified
    if (options?.includeEmptyReturn) {
      const emptyReturnCO2e = distance * factors.perKm * 0.3; // 30% of full load
      totalCO2e += emptyReturnCO2e;
    }

    // Get comparison data
    const comparison = await this.getComparison(
      totalCO2e,
      mode,
      distance,
      cargo,
    );

    // Get offset options
    const offsetOptions = await this.getOffsetOptions(totalCO2e);

    return {
      route: {
        origin,
        destination,
        distance,
        mode,
      },
      cargo,
      totalCO2e: Math.round(totalCO2e * 100) / 100, // Round to 2 decimals
      breakdown: breakdown.map((b) => ({
        ...b,
        co2e: Math.round(b.co2e * 100) / 100,
        percentage: Math.round(b.percentage * 100) / 100,
      })),
      calculationMethod: {
        method: options?.calculationMethod || "STANDARD",
        standard: options?.standard || "DEFRA",
        factors: {
          loadFactor,
        },
      },
      comparison,
      offsetOptions,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get comparison data (vs average, best, worst)
   */
  private async getComparison(
    totalCO2e: number,
    mode: TransportMode,
    distance: number,
    cargo: { weight: number; volume: number },
  ): Promise<CO2EmissionsCalculation["comparison"]> {
    // Calculate average emissions for this mode
    const factors = this.emissionFactors[mode];
    const averageCO2e =
      (cargo.weight / 1000) * (distance / 1000) * factors.perKg;

    // Best case: 100% utilization, optimal route
    const bestCO2e = averageCO2e * 0.8;

    // Worst case: 50% utilization, suboptimal route
    const worstCO2e = averageCO2e * 1.5;

    return {
      vsAverage: {
        average: averageCO2e,
        difference: totalCO2e - averageCO2e,
        percentage: ((totalCO2e - averageCO2e) / averageCO2e) * 100,
      },
      vsBest: {
        best: bestCO2e,
        difference: totalCO2e - bestCO2e,
        percentage: ((totalCO2e - bestCO2e) / bestCO2e) * 100,
      },
      vsWorst: {
        worst: worstCO2e,
        difference: totalCO2e - worstCO2e,
        percentage: ((totalCO2e - worstCO2e) / worstCO2e) * 100,
      },
    };
  }

  /**
   * Get carbon offset options
   */
  private async getOffsetOptions(
    totalCO2e: number,
  ): Promise<CO2EmissionsCalculation["offsetOptions"]> {
    // In production, integrate with carbon offset providers
    const pricePerTon = 15; // USD per ton CO2e
    const cost = (totalCO2e / 1000) * pricePerTon;

    return [
      {
        provider: "Gold Standard",
        cost: Math.round(cost * 100) / 100,
        currency: "USD",
        certificate: true,
      },
      {
        provider: "Verified Carbon Standard",
        cost: Math.round(cost * 0.9 * 100) / 100,
        currency: "USD",
        certificate: true,
      },
      {
        provider: "Climate Action Reserve",
        cost: Math.round(cost * 0.95 * 100) / 100,
        currency: "USD",
        certificate: true,
      },
    ];
  }

  /**
   * Calculate emissions for multiple route options (for comparison)
   */
  async compareEmissions(
    requests: EmissionsCalculationRequest[],
  ): Promise<Array<CO2EmissionsCalculation & { routeId: string }>> {
    return Promise.all(
      requests.map(async (request, index) => {
        const calculation = await this.calculateEmissions(request);
        return {
          ...calculation,
          routeId: `route-${index}`,
        };
      }),
    );
  }
}

export const co2EmissionsService = new CO2EmissionsService();

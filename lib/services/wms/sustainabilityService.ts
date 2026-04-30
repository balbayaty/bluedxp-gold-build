/**
 * Sustainability & ESG Service
 * Carbon tracking, energy monitoring, sustainability reporting
 * 4IR & 5IR Aligned • Sustainability-First • Deep Architecture
 */

import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// SUSTAINABILITY TYPES
// ============================================================================

export interface CarbonFootprint {
  warehouseId: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  periodStart: Date | string;
  periodEnd: Date | string;
  totalEmissions: number; // kg CO2 equivalent
  emissionsBySource: {
    energy?: number;
    transportation?: number;
    waste?: number;
    packaging?: number;
    equipment?: number;
  };
  offset?: number;
  netEmissions?: number;
  reductionTarget?: number;
  progress?: number; // percentage towards target
}

export interface EnergyConsumption {
  warehouseId: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  periodStart: Date | string;
  periodEnd: Date | string;
  totalEnergy: number; // kWh
  energyBySource: {
    electricity?: number;
    gas?: number;
    solar?: number;
    other?: number;
  };
  cost: number;
  currency: string;
  efficiency: number; // kWh per unit processed
  reductionTarget?: number;
  progress?: number;
}

export interface WasteTracking {
  warehouseId: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  periodStart: Date | string;
  periodEnd: Date | string;
  totalWaste: number; // kg
  wasteByType: {
    packaging?: number;
    organic?: number;
    hazardous?: number;
    recyclable?: number;
    other?: number;
  };
  recycled: number;
  recycledPercentage: number;
  reductionTarget?: number;
  progress?: number;
}

export interface SustainabilityMetrics {
  warehouseId: string;
  carbonFootprint: CarbonFootprint;
  energyConsumption: EnergyConsumption;
  wasteTracking: WasteTracking;
  overallScore: number; // 0-100
  esgCompliance: {
    environmental: number;
    social: number;
    governance: number;
  };
  certifications: string[];
  improvements: Array<{
    area: string;
    action: string;
    expectedImpact: number;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
}

export interface GreenLogistics {
  shipmentId: string;
  routeOptimization: boolean;
  carbonEfficient: boolean;
  estimatedEmissions: number;
  alternativeOptions: Array<{
    method: string;
    emissions: number;
    cost: number;
    time: number;
    reliability?: number;
    score?: number;
  }>;
  selectedOption?: {
    method: string;
    emissions: number;
    cost: number;
    time: number;
    reason: string;
  };
}

export interface ShipmentRoute {
  distance: number; // km
  vehicleType?: "TRUCK" | "VAN" | "SHIP" | "PLANE" | "TRAIN";
  fuelType?: "DIESEL" | "PETROL" | "ELECTRIC" | "HYBRID" | "CNG" | "LNG";
  loadWeight?: number; // kg
  loadVolume?: number; // m³
  averageSpeed?: number; // km/h
  routeType?: "HIGHWAY" | "URBAN" | "MIXED";
  elevationGain?: number; // meters
}

export interface EmissionFactors {
  // kg CO2 per km per ton
  truck: {
    diesel: 0.15;
    petrol: 0.18;
    electric: 0.0;
    hybrid: 0.08;
    cng: 0.12;
    lng: 0.11;
  };
  van: {
    diesel: 0.12;
    petrol: 0.15;
    electric: 0.0;
    hybrid: 0.06;
    cng: 0.1;
    lng: 0.09;
  };
  ship: {
    heavyFuel: 0.008;
    marineDiesel: 0.01;
    lng: 0.007;
  };
  plane: {
    jetFuel: 0.25;
  };
  train: {
    diesel: 0.03;
    electric: 0.0;
  };
}

// ============================================================================
// SUSTAINABILITY SERVICE INTERFACE
// ============================================================================

export interface SustainabilityService {
  // Carbon Footprint
  calculateCarbonFootprint(
    warehouseId: string,
    period: CarbonFootprint["period"],
  ): Promise<CarbonFootprint>;
  trackCarbonFootprint(
    warehouseId: string,
    source: string,
    emissions: number,
    period?: CarbonFootprint["period"],
  ): Promise<void>;
  getCarbonFootprint(
    warehouseId: string,
    period: CarbonFootprint["period"],
  ): Promise<CarbonFootprint>;

  // Energy Consumption
  trackEnergyConsumption(
    warehouseId: string,
    source: string,
    consumption: number,
    period?: EnergyConsumption["period"],
  ): Promise<void>;
  getEnergyConsumption(
    warehouseId: string,
    period: EnergyConsumption["period"],
  ): Promise<EnergyConsumption>;
  optimizeEnergyUsage(
    warehouseId: string,
  ): Promise<Array<{ action: string; expectedSavings: number }>>;

  // Waste Tracking
  trackWaste(
    warehouseId: string,
    wasteType: string,
    quantity: number,
    period?: WasteTracking["period"],
  ): Promise<void>;
  getWasteTracking(
    warehouseId: string,
    period: WasteTracking["period"],
  ): Promise<WasteTracking>;

  // Sustainability Metrics
  getSustainabilityMetrics(
    warehouseId: string,
    period?: "MONTHLY" | "YEARLY",
  ): Promise<SustainabilityMetrics>;
  getSustainabilityReport(
    warehouseId: string,
    period: "MONTHLY" | "YEARLY",
  ): Promise<SustainabilityMetrics>;

  // Green Logistics
  calculateShipmentEmissions(
    shipmentId: string,
    route: ShipmentRoute,
  ): Promise<number>;
  optimizeForSustainability(
    shipmentId: string,
    options: Array<{
      method: string;
      emissions: number;
      cost: number;
      time: number;
      reliability?: number;
    }>,
  ): Promise<GreenLogistics>;

  // IoT Integration
  trackIoTEnergyData(
    warehouseId: string,
    sensorId: string,
    consumption: number,
  ): Promise<void>;

  // TMS Integration
  getTransportationEmissions(shipmentId: string): Promise<number>;
}

// ============================================================================
// SUSTAINABILITY SERVICE IMPLEMENTATION
// ============================================================================

class SustainabilityServiceImpl implements SustainabilityService {
  private carbonData: Map<string, CarbonFootprint> = new Map();
  private energyData: Map<string, EnergyConsumption> = new Map();
  private wasteData: Map<string, WasteTracking> = new Map();

  private readonly emissionFactors: EmissionFactors = {
    truck: {
      diesel: 0.15,
      petrol: 0.18,
      electric: 0.0,
      hybrid: 0.08,
      cng: 0.12,
      lng: 0.11,
    },
    van: {
      diesel: 0.12,
      petrol: 0.15,
      electric: 0.0,
      hybrid: 0.06,
      cng: 0.1,
      lng: 0.09,
    },
    ship: {
      heavyFuel: 0.008,
      marineDiesel: 0.01,
      lng: 0.007,
    },
    plane: {
      jetFuel: 0.25,
    },
    train: {
      diesel: 0.03,
      electric: 0.0,
    },
  };

  /**
   * Calculate period start and end dates
   */
  private calculatePeriodDates(
    period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
  ): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case "DAILY":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );
        break;
      case "WEEKLY":
        // Start of week (Monday)
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff);
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          diff + 6,
          23,
          59,
          59,
          999,
        );
        break;
      case "MONTHLY":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        break;
      case "YEARLY":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
    }

    return { start, end };
  }

  /**
   * Generate unique key for data storage
   */
  private getKey(warehouseId: string, period: string, date?: Date): string {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split("T")[0];
    return `${warehouseId}-${period}-${dateStr}`;
  }

  /**
   * Validate warehouse ID
   */
  private validateWarehouseId(warehouseId: string): void {
    if (
      !warehouseId ||
      typeof warehouseId !== "string" ||
      warehouseId.trim().length === 0
    ) {
      throw new Error("Invalid warehouseId: must be a non-empty string");
    }
  }

  /**
   * Validate numeric value
   */
  private validateNumeric(
    value: number,
    fieldName: string,
    min: number = 0,
  ): void {
    if (typeof value !== "number" || isNaN(value) || value < min) {
      throw new Error(`Invalid ${fieldName}: must be a number >= ${min}`);
    }
  }

  async calculateCarbonFootprint(
    warehouseId: string,
    period: CarbonFootprint["period"],
  ): Promise<CarbonFootprint> {
    this.validateWarehouseId(warehouseId);

    const { start, end } = this.calculatePeriodDates(period);
    const key = this.getKey(warehouseId, period, start);
    const existing = this.carbonData.get(key);

    if (existing) {
      return existing;
    }

    // Base emissions scaled by period
    const periodMultiplier =
      period === "DAILY"
        ? 1
        : period === "WEEKLY"
          ? 7
          : period === "MONTHLY"
            ? 30
            : 365;

    const footprint: CarbonFootprint = {
      warehouseId,
      period,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      totalEmissions: 0,
      emissionsBySource: {
        energy: 500 * (periodMultiplier / 30), // kg CO2
        transportation: 300 * (periodMultiplier / 30),
        waste: 50 * (periodMultiplier / 30),
        packaging: 100 * (periodMultiplier / 30),
        equipment: 50 * (periodMultiplier / 30),
      },
      reductionTarget: 1000 * (periodMultiplier / 30), // kg CO2
    };

    footprint.totalEmissions = Object.values(
      footprint.emissionsBySource,
    ).reduce((sum, val) => sum + (val || 0), 0);
    footprint.netEmissions = footprint.totalEmissions - (footprint.offset || 0);
    footprint.progress = footprint.reductionTarget
      ? Math.max(
          0,
          Math.min(
            100,
            ((footprint.reductionTarget - footprint.netEmissions!) /
              footprint.reductionTarget) *
              100,
          ),
        )
      : 0;

    this.carbonData.set(key, footprint);

    return footprint;
  }

  async trackCarbonFootprint(
    warehouseId: string,
    source: string,
    emissions: number,
    period: CarbonFootprint["period"] = "MONTHLY",
  ): Promise<void> {
    this.validateWarehouseId(warehouseId);
    this.validateNumeric(emissions, "emissions");

    if (!source || typeof source !== "string") {
      throw new Error("Invalid source: must be a non-empty string");
    }

    const footprint = await this.calculateCarbonFootprint(warehouseId, period);

    if (
      footprint.emissionsBySource[
        source as keyof typeof footprint.emissionsBySource
      ] !== undefined
    ) {
      footprint.emissionsBySource[
        source as keyof typeof footprint.emissionsBySource
      ] =
        (footprint.emissionsBySource[
          source as keyof typeof footprint.emissionsBySource
        ] || 0) + emissions;
    } else {
      footprint.emissionsBySource.other =
        (footprint.emissionsBySource.other || 0) + emissions;
    }

    footprint.totalEmissions = Object.values(
      footprint.emissionsBySource,
    ).reduce((sum, val) => sum + (val || 0), 0);
    footprint.netEmissions = footprint.totalEmissions - (footprint.offset || 0);
    if (footprint.reductionTarget) {
      footprint.progress = Math.max(
        0,
        Math.min(
          100,
          ((footprint.reductionTarget - footprint.netEmissions!) /
            footprint.reductionTarget) *
            100,
        ),
      );
    }

    const { start } = this.calculatePeriodDates(period);
    const key = this.getKey(warehouseId, period, start);
    this.carbonData.set(key, footprint);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "sustainability.carbon_tracked",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        warehouseId,
        source,
        emissions,
        period,
      },
      payload: {
        footprint,
      },
    });
  }

  async getCarbonFootprint(
    warehouseId: string,
    period: CarbonFootprint["period"],
  ): Promise<CarbonFootprint> {
    this.validateWarehouseId(warehouseId);
    return this.calculateCarbonFootprint(warehouseId, period);
  }

  async trackEnergyConsumption(
    warehouseId: string,
    source: string,
    consumption: number,
    period: EnergyConsumption["period"] = "MONTHLY",
  ): Promise<void> {
    this.validateWarehouseId(warehouseId);
    this.validateNumeric(consumption, "consumption");

    if (!source || typeof source !== "string") {
      throw new Error("Invalid source: must be a non-empty string");
    }

    const { start, end } = this.calculatePeriodDates(period);
    const key = this.getKey(warehouseId, period, start);
    let energy = this.energyData.get(key);

    if (!energy) {
      energy = {
        warehouseId,
        period,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        totalEnergy: 0,
        energyBySource: {},
        cost: 0,
        currency: "SAR",
        efficiency: 0,
      };
    }

    if (
      energy.energyBySource[source as keyof typeof energy.energyBySource] !==
      undefined
    ) {
      energy.energyBySource[source as keyof typeof energy.energyBySource] =
        (energy.energyBySource[source as keyof typeof energy.energyBySource] ||
          0) + consumption;
    } else {
      energy.energyBySource.other =
        (energy.energyBySource.other || 0) + consumption;
    }

    energy.totalEnergy = Object.values(energy.energyBySource).reduce(
      (sum, val) => sum + (val || 0),
      0,
    );
    energy.cost = energy.totalEnergy * 0.5; // Mock cost calculation - should integrate with pricing service

    this.energyData.set(key, energy);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "sustainability.energy_tracked",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        warehouseId,
        source,
        consumption,
        period,
      },
      payload: {
        energy,
      },
    });
  }

  async getEnergyConsumption(
    warehouseId: string,
    period: EnergyConsumption["period"],
  ): Promise<EnergyConsumption> {
    this.validateWarehouseId(warehouseId);

    const { start, end } = this.calculatePeriodDates(period);
    const key = this.getKey(warehouseId, period, start);
    let energy = this.energyData.get(key);

    if (!energy) {
      const periodMultiplier =
        period === "DAILY"
          ? 1
          : period === "WEEKLY"
            ? 7
            : period === "MONTHLY"
              ? 30
              : 365;
      energy = {
        warehouseId,
        period,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        totalEnergy: 10000 * (periodMultiplier / 30), // kWh
        energyBySource: {
          electricity: 8000 * (periodMultiplier / 30),
          gas: 1500 * (periodMultiplier / 30),
          solar: 500 * (periodMultiplier / 30),
        },
        cost: 5000 * (periodMultiplier / 30),
        currency: "SAR",
        efficiency: 2.5,
        reductionTarget: 8000 * (periodMultiplier / 30),
        progress: 20,
      };
      this.energyData.set(key, energy);
    }

    return energy;
  }

  async optimizeEnergyUsage(
    warehouseId: string,
  ): Promise<Array<{ action: string; expectedSavings: number }>> {
    this.validateWarehouseId(warehouseId);

    return [
      {
        action: "Install LED lighting",
        expectedSavings: 1500, // kWh
      },
      {
        action: "Optimize HVAC schedule",
        expectedSavings: 2000, // kWh
      },
      {
        action: "Install solar panels",
        expectedSavings: 3000, // kWh
      },
    ];
  }

  async trackWaste(
    warehouseId: string,
    wasteType: string,
    quantity: number,
    period: WasteTracking["period"] = "MONTHLY",
  ): Promise<void> {
    this.validateWarehouseId(warehouseId);
    this.validateNumeric(quantity, "quantity");

    if (!wasteType || typeof wasteType !== "string") {
      throw new Error("Invalid wasteType: must be a non-empty string");
    }

    const { start, end } = this.calculatePeriodDates(period);
    const key = this.getKey(warehouseId, period, start);
    let waste = this.wasteData.get(key);

    if (!waste) {
      waste = {
        warehouseId,
        period,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        totalWaste: 0,
        wasteByType: {},
        recycled: 0,
        recycledPercentage: 0,
      };
    }

    if (
      waste.wasteByType[wasteType as keyof typeof waste.wasteByType] !==
      undefined
    ) {
      waste.wasteByType[wasteType as keyof typeof waste.wasteByType] =
        (waste.wasteByType[wasteType as keyof typeof waste.wasteByType] || 0) +
        quantity;
    } else {
      waste.wasteByType.other = (waste.wasteByType.other || 0) + quantity;
    }

    waste.totalWaste = Object.values(waste.wasteByType).reduce(
      (sum, val) => sum + (val || 0),
      0,
    );
    waste.recycled = waste.totalWaste * 0.6; // Mock 60% recycling - should integrate with waste management system
    waste.recycledPercentage =
      waste.totalWaste > 0 ? (waste.recycled / waste.totalWaste) * 100 : 0;

    this.wasteData.set(key, waste);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "sustainability.waste_tracked",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        warehouseId,
        wasteType,
        quantity,
        period,
      },
      payload: {
        waste,
      },
    });
  }

  async getWasteTracking(
    warehouseId: string,
    period: WasteTracking["period"],
  ): Promise<WasteTracking> {
    this.validateWarehouseId(warehouseId);

    const { start, end } = this.calculatePeriodDates(period);
    const key = this.getKey(warehouseId, period, start);
    let waste = this.wasteData.get(key);

    if (!waste) {
      const periodMultiplier =
        period === "DAILY"
          ? 1
          : period === "WEEKLY"
            ? 7
            : period === "MONTHLY"
              ? 30
              : 365;
      waste = {
        warehouseId,
        period,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        totalWaste: 5000 * (periodMultiplier / 30), // kg
        wasteByType: {
          packaging: 2000 * (periodMultiplier / 30),
          organic: 1000 * (periodMultiplier / 30),
          recyclable: 1500 * (periodMultiplier / 30),
          other: 500 * (periodMultiplier / 30),
        },
        recycled: 3000 * (periodMultiplier / 30),
        recycledPercentage: 60,
        reductionTarget: 4000 * (periodMultiplier / 30),
        progress: 20,
      };
      this.wasteData.set(key, waste);
    }

    return waste;
  }

  async getSustainabilityMetrics(
    warehouseId: string,
    period: "MONTHLY" | "YEARLY" = "MONTHLY",
  ): Promise<SustainabilityMetrics> {
    this.validateWarehouseId(warehouseId);

    const carbonFootprint = await this.getCarbonFootprint(warehouseId, period);
    const energyConsumption = await this.getEnergyConsumption(
      warehouseId,
      period,
    );
    const wasteTracking = await this.getWasteTracking(warehouseId, period);

    // Calculate overall score (0-100)
    const carbonScore = carbonFootprint.progress || 0;
    const energyScore = energyConsumption.progress || 0;
    const wasteScore = wasteTracking.progress || 0;
    const overallScore = Math.round(
      (carbonScore + energyScore + wasteScore) / 3,
    );

    return {
      warehouseId,
      carbonFootprint,
      energyConsumption,
      wasteTracking,
      overallScore,
      esgCompliance: {
        environmental: overallScore,
        social: 85, // Mock - should integrate with HR/social metrics
        governance: 90, // Mock - should integrate with compliance metrics
      },
      certifications: ["ISO 14001", "LEED Certified"],
      improvements: [
        {
          area: "Energy",
          action: "Install solar panels",
          expectedImpact: 30,
          priority: "HIGH",
        },
        {
          area: "Waste",
          action: "Increase recycling program",
          expectedImpact: 15,
          priority: "MEDIUM",
        },
      ],
    };
  }

  async getSustainabilityReport(
    warehouseId: string,
    period: "MONTHLY" | "YEARLY",
  ): Promise<SustainabilityMetrics> {
    return this.getSustainabilityMetrics(warehouseId, period);
  }

  /**
   * Calculate shipment emissions based on route, vehicle type, fuel type, distance, and load
   */
  async calculateShipmentEmissions(
    shipmentId: string,
    route: ShipmentRoute,
  ): Promise<number> {
    if (!shipmentId || typeof shipmentId !== "string") {
      throw new Error("Invalid shipmentId: must be a non-empty string");
    }

    if (!route || typeof route !== "object") {
      throw new Error("Invalid route: must be an object");
    }

    this.validateNumeric(route.distance, "route.distance");

    const vehicleType = (
      route.vehicleType || "TRUCK"
    ).toLowerCase() as keyof EmissionFactors;
    const fuelType = (
      route.fuelType || "DIESEL"
    ).toLowerCase() as keyof EmissionFactors[typeof vehicleType];

    // Get emission factor
    const factors = this.emissionFactors[vehicleType];
    if (!factors) {
      throw new Error(`Unsupported vehicle type: ${route.vehicleType}`);
    }

    const emissionFactor = factors[fuelType as keyof typeof factors];
    if (emissionFactor === undefined) {
      throw new Error(
        `Unsupported fuel type ${route.fuelType} for vehicle type ${route.vehicleType}`,
      );
    }

    // Base calculation: emissions = distance × emission factor × load weight (in tons)
    const loadWeightTons = (route.loadWeight || 1000) / 1000; // Convert kg to tons
    let baseEmissions = route.distance * emissionFactor * loadWeightTons;

    // Adjustments based on route characteristics
    if (route.routeType === "URBAN") {
      // Urban routes typically have 20% higher emissions due to stop-and-go traffic
      baseEmissions *= 1.2;
    } else if (route.routeType === "HIGHWAY") {
      // Highway routes are more efficient
      baseEmissions *= 0.95;
    }

    // Elevation gain increases fuel consumption
    if (route.elevationGain && route.elevationGain > 0) {
      const elevationFactor = 1 + route.elevationGain / 10000; // 1% increase per 100m elevation
      baseEmissions *= elevationFactor;
    }

    // Average speed affects efficiency (optimal around 80-90 km/h for trucks)
    if (route.averageSpeed) {
      if (route.averageSpeed < 60) {
        // Low speed = more fuel per km
        baseEmissions *= 1.1;
      } else if (route.averageSpeed > 100) {
        // High speed = more fuel per km
        baseEmissions *= 1.15;
      }
    }

    return Math.round(baseEmissions * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Optimize for sustainability using multi-criteria decision analysis
   */
  async optimizeForSustainability(
    shipmentId: string,
    options: Array<{
      method: string;
      emissions: number;
      cost: number;
      time: number;
      reliability?: number;
    }>,
  ): Promise<GreenLogistics> {
    if (!shipmentId || typeof shipmentId !== "string") {
      throw new Error("Invalid shipmentId: must be a non-empty string");
    }

    if (!Array.isArray(options) || options.length === 0) {
      throw new Error("Invalid options: must be a non-empty array");
    }

    // Validate all options
    options.forEach((option, index) => {
      if (!option.method || typeof option.method !== "string") {
        throw new Error(
          `Invalid option[${index}].method: must be a non-empty string`,
        );
      }
      this.validateNumeric(option.emissions, `option[${index}].emissions`);
      this.validateNumeric(option.cost, `option[${index}].cost`);
      this.validateNumeric(option.time, `option[${index}].time`);
      if (option.reliability !== undefined) {
        if (option.reliability < 0 || option.reliability > 100) {
          throw new Error(
            `Invalid option[${index}].reliability: must be between 0 and 100`,
          );
        }
      }
    });

    // Normalize values for scoring (0-100 scale)
    const maxEmissions = Math.max(...options.map((o) => o.emissions));
    const maxCost = Math.max(...options.map((o) => o.cost));
    const maxTime = Math.max(...options.map((o) => o.time));
    const minEmissions = Math.min(...options.map((o) => o.emissions));
    const minCost = Math.min(...options.map((o) => o.cost));
    const minTime = Math.min(...options.map((o) => o.time));

    // Calculate scores for each option
    const scoredOptions = options.map((option) => {
      // Emissions score (lower is better) - weight: 40%
      const emissionsScore =
        maxEmissions > minEmissions
          ? 100 -
            ((option.emissions - minEmissions) /
              (maxEmissions - minEmissions)) *
              100
          : 100;

      // Cost score (lower is better) - weight: 30%
      const costScore =
        maxCost > minCost
          ? 100 - ((option.cost - minCost) / (maxCost - minCost)) * 100
          : 100;

      // Time score (lower is better) - weight: 20%
      const timeScore =
        maxTime > minTime
          ? 100 - ((option.time - minTime) / (maxTime - minTime)) * 100
          : 100;

      // Reliability score (higher is better) - weight: 10%
      const reliabilityScore =
        option.reliability !== undefined ? option.reliability : 80;

      // Weighted composite score
      const compositeScore =
        emissionsScore * 0.4 +
        costScore * 0.3 +
        timeScore * 0.2 +
        reliabilityScore * 0.1;

      return {
        ...option,
        reliability: option.reliability || 80,
        score: Math.round(compositeScore * 100) / 100,
        emissionsScore,
        costScore,
        timeScore,
        reliabilityScore,
      };
    });

    // Sort by composite score (highest first)
    scoredOptions.sort((a, b) => b.score - a.score);

    const bestOption = scoredOptions[0];
    const secondBest = scoredOptions.length > 1 ? scoredOptions[1] : null;

    // Determine reason for selection
    let reason = "Best overall sustainability score";
    if (bestOption.emissionsScore > 90) {
      reason = "Lowest carbon emissions";
    } else if (bestOption.costScore > 90 && bestOption.emissionsScore > 70) {
      reason = "Best balance of cost and emissions";
    } else if (bestOption.timeScore > 90 && bestOption.emissionsScore > 60) {
      reason = "Best balance of speed and emissions";
    }

    return {
      shipmentId,
      routeOptimization: true,
      carbonEfficient: bestOption.emissionsScore > 70,
      estimatedEmissions: bestOption.emissions,
      alternativeOptions: scoredOptions.map(
        ({
          emissionsScore,
          costScore,
          timeScore,
          reliabilityScore,
          score,
          ...option
        }) => option,
      ),
      selectedOption: {
        method: bestOption.method,
        emissions: bestOption.emissions,
        cost: bestOption.cost,
        time: bestOption.time,
        reason,
      },
    };
  }

  /**
   * Track energy consumption from IoT sensors
   */
  async trackIoTEnergyData(
    warehouseId: string,
    sensorId: string,
    consumption: number,
  ): Promise<void> {
    this.validateWarehouseId(warehouseId);
    this.validateNumeric(consumption, "consumption");

    if (!sensorId || typeof sensorId !== "string") {
      throw new Error("Invalid sensorId: must be a non-empty string");
    }

    // Determine energy source from sensor ID or type
    // In production, this would query IoT device registry
    let source = "electricity";
    if (sensorId.toLowerCase().includes("gas")) {
      source = "gas";
    } else if (sensorId.toLowerCase().includes("solar")) {
      source = "solar";
    }

    // Track with current period (defaults to MONTHLY)
    await this.trackEnergyConsumption(
      warehouseId,
      source,
      consumption,
      "MONTHLY",
    );

    // Publish IoT-specific event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "sustainability.iot_energy_tracked",
      aggregateId: warehouseId,
      aggregateType: "WAREHOUSE",
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {
        warehouseId,
        sensorId,
        consumption,
        source,
      },
      payload: {
        sensorId,
        consumption,
        source,
      },
    });
  }

  /**
   * Get transportation emissions from TMS integration
   */
  async getTransportationEmissions(shipmentId: string): Promise<number> {
    if (!shipmentId || typeof shipmentId !== "string") {
      throw new Error("Invalid shipmentId: must be a non-empty string");
    }

    try {
      // Dynamically import TMS service to avoid circular dependencies
      const { tmsCoreService } =
        await import("@/lib/services/tms/tmsCoreService");

      // Get shipment/job details from TMS
      const job = await tmsCoreService.getJob(shipmentId).catch(() => null);

      if (job) {
        // Build route from TMS job data
        const route: ShipmentRoute = {
          distance: job.estimatedDistance || job.actualDistance || 500,
          vehicleType: this.mapVehicleType(job.truckType || job.vehicleType),
          fuelType: this.mapFuelType(job.fuelType),
          loadWeight: job.totalWeight || job.cargoWeight || 5000,
          loadVolume: job.totalVolume || job.cargoVolume,
          routeType: this.determineRouteType(job),
        };

        return this.calculateShipmentEmissions(shipmentId, route);
      }
    } catch (error) {
      console.warn(
        "Could not fetch TMS data for emissions calculation:",
        error,
      );
    }

    // Fallback to mock data if TMS integration fails
    const mockRoute: ShipmentRoute = {
      distance: 500,
      vehicleType: "TRUCK",
      fuelType: "DIESEL",
      loadWeight: 5000,
      routeType: "MIXED",
    };

    return this.calculateShipmentEmissions(shipmentId, mockRoute);
  }

  /**
   * Map TMS vehicle type to emission calculation vehicle type
   */
  private mapVehicleType(
    tmsVehicleType?: string,
  ): ShipmentRoute["vehicleType"] {
    if (!tmsVehicleType) return "TRUCK";

    const type = tmsVehicleType.toLowerCase();
    if (type.includes("van") || type.includes("pickup")) return "VAN";
    if (
      type.includes("ship") ||
      type.includes("vessel") ||
      type.includes("container")
    )
      return "SHIP";
    if (
      type.includes("plane") ||
      type.includes("air") ||
      type.includes("cargo")
    )
      return "PLANE";
    if (type.includes("train") || type.includes("rail")) return "TRAIN";
    return "TRUCK";
  }

  /**
   * Map TMS fuel type to emission calculation fuel type
   */
  private mapFuelType(tmsFuelType?: string): ShipmentRoute["fuelType"] {
    if (!tmsFuelType) return "DIESEL";

    const type = tmsFuelType.toLowerCase();
    if (type.includes("electric") || type.includes("ev")) return "ELECTRIC";
    if (type.includes("hybrid")) return "HYBRID";
    if (type.includes("petrol") || type.includes("gasoline")) return "PETROL";
    if (type.includes("cng") || type.includes("natural gas")) return "CNG";
    if (type.includes("lng")) return "LNG";
    return "DIESEL";
  }

  /**
   * Determine route type from TMS job data
   */
  private determineRouteType(job: any): ShipmentRoute["routeType"] {
    // Check route characteristics
    if (job.routeType) {
      const type = job.routeType.toLowerCase();
      if (type.includes("highway") || type.includes("expressway"))
        return "HIGHWAY";
      if (type.includes("urban") || type.includes("city")) return "URBAN";
    }

    // Infer from distance - longer routes tend to be highway
    if (job.estimatedDistance || job.actualDistance) {
      const distance = job.estimatedDistance || job.actualDistance;
      if (distance > 200) return "HIGHWAY";
      if (distance < 50) return "URBAN";
    }

    return "MIXED";
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const sustainabilityService: SustainabilityService =
  new SustainabilityServiceImpl();

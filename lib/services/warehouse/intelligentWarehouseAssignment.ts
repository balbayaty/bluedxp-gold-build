/**
 * Intelligent Warehouse Assignment Service
 * World's most intelligent warehouse assignment based on NFPA, storage requirements, and business rules
 */

import { MSDSSubmission, ExtractedMSDSData } from "@/types/msds";

export interface NFPAStorageRequirements {
  health: number;
  flammability: number;
  reactivity: number;
  special: string[];
  requiresHazmatWarehouse: boolean;
  requiresTemperatureControl: boolean;
  requiresVentilation: boolean;
  requiresSecondaryContainment: boolean;
  requiresSegregation: boolean;
  incompatibleClasses: string[];
  storageTemperature?: {
    min?: number;
    max?: number;
    range?: string;
  };
  storageArea: {
    type:
      | "general"
      | "hazmat"
      | "cold"
      | "refrigerated"
      | "controlled"
      | "outdoor";
    requiredCapabilities: string[];
  };
  segregationDistance: number; // meters
  fireSuppression: string[];
  specialHandling: string[];
}

export interface WarehouseAssignment {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  area?: string;
  zone?: string;
  location?: string;
  confidence: number;
  reasoning: string[];
  warnings: string[];
  estimatedCost?: {
    monthly: number;
    currency: string;
  };
  complianceScore: number;
  nfpaMatch: {
    health: boolean;
    flammability: boolean;
    reactivity: boolean;
    special: boolean;
  };
}

export interface IntelligentAssignmentConfig {
  customerId?: string;
  customerName?: string;
  quoteAccepted?: boolean;
  quantity?: number;
  volume?: number;
  weight?: number;
  preferredWarehouse?: string;
  excludeWarehouses?: string[];
  requireCommercialAgreement?: boolean;
}

class IntelligentWarehouseAssignmentService {
  /**
   * Analyze NFPA requirements from MSDS data
   * Public method for external use
   */
  analyzeNFPARequirements(
    extractedData: ExtractedMSDSData,
  ): NFPAStorageRequirements {
    const health = parseInt(extractedData.healthRating || "0");
    const flammability = parseInt(extractedData.flammabilityRating || "0");
    const reactivity = parseInt(extractedData.reactivityRating || "0");

    // Determine special hazards
    const special: string[] = [];
    if (extractedData.specialHazards) {
      if (extractedData.specialHazards.toLowerCase().includes("oxidizer"))
        special.push("OX");
      if (extractedData.specialHazards.toLowerCase().includes("water reactive"))
        special.push("W");
      if (extractedData.specialHazards.toLowerCase().includes("radioactive"))
        special.push("☢");
      if (extractedData.specialHazards.toLowerCase().includes("corrosive"))
        special.push("COR");
    }

    // Determine if hazmat warehouse required
    const requiresHazmatWarehouse =
      health >= 3 ||
      flammability >= 3 ||
      reactivity >= 3 ||
      special.length > 0 ||
      extractedData.hazardLevel === "High" ||
      (extractedData.unNumber && extractedData.unNumber !== "UN not specified");

    // Temperature requirements
    const storageConditions = extractedData.storageConditions || [];
    const requiresTemperatureControl = storageConditions.some(
      (c) =>
        c.toLowerCase().includes("temperature") ||
        c.toLowerCase().includes("cold") ||
        c.toLowerCase().includes("refrigerated") ||
        c.toLowerCase().includes("frozen") ||
        c.toLowerCase().includes("cool"),
    );

    // Extract temperature range
    let storageTemperature:
      | NFPAStorageRequirements["storageTemperature"]
      | undefined;
    const tempCondition = storageConditions.find(
      (c) =>
        c.toLowerCase().includes("temperature") ||
        c.toLowerCase().includes("°c") ||
        c.toLowerCase().includes("°f"),
    );
    if (tempCondition) {
      const tempMatch = tempCondition.match(/(-?\d+)\s*[°-]?\s*(-?\d+)?/i);
      if (tempMatch) {
        storageTemperature = {
          min: parseInt(tempMatch[1]),
          max: tempMatch[2] ? parseInt(tempMatch[2]) : undefined,
          range: tempCondition,
        };
      }
    }

    // Ventilation requirements
    const requiresVentilation =
      storageConditions.some(
        (c) =>
          c.toLowerCase().includes("ventilation") ||
          c.toLowerCase().includes("ventilated") ||
          c.toLowerCase().includes("air flow"),
      ) ||
      flammability >= 2 ||
      extractedData.physicalState?.toLowerCase() === "gas";

    // Secondary containment
    const requiresSecondaryContainment =
      storageConditions.some(
        (c) =>
          c.toLowerCase().includes("containment") ||
          c.toLowerCase().includes("secondary") ||
          c.toLowerCase().includes("spill"),
      ) ||
      extractedData.physicalState?.toLowerCase() === "liquid" ||
      flammability >= 2;

    // Segregation requirements
    const incompatibleMaterials = extractedData.incompatibleMaterials || [];
    const requiresSegregation =
      incompatibleMaterials.length > 0 || reactivity >= 2;

    // Determine incompatible hazard classes
    const incompatibleClasses: string[] = [];
    if (extractedData.hazardClass) {
      incompatibleClasses.push(extractedData.hazardClass);
    }
    if (extractedData.incompatibleMaterials) {
      extractedData.incompatibleMaterials.forEach((mat) => {
        // Extract hazard class from incompatible material description
        if (mat.toLowerCase().includes("acid"))
          incompatibleClasses.push("Acids");
        if (
          mat.toLowerCase().includes("base") ||
          mat.toLowerCase().includes("alkali")
        )
          incompatibleClasses.push("Bases");
        if (mat.toLowerCase().includes("oxidiz"))
          incompatibleClasses.push("Oxidizers");
        if (mat.toLowerCase().includes("reduc"))
          incompatibleClasses.push("Reducing Agents");
      });
    }

    // Determine storage area type
    let storageAreaType: NFPAStorageRequirements["storageArea"]["type"] =
      "general";
    if (requiresHazmatWarehouse) {
      storageAreaType = "hazmat";
    } else if (requiresTemperatureControl) {
      if (storageTemperature?.max && storageTemperature.max < 0) {
        storageAreaType = "frozen";
      } else if (storageTemperature?.max && storageTemperature.max < 10) {
        storageAreaType = "refrigerated";
      } else {
        storageAreaType = "controlled";
      }
    }

    // Required capabilities
    const requiredCapabilities: string[] = [];
    if (requiresHazmatWarehouse) requiredCapabilities.push("hazmat");
    if (requiresTemperatureControl)
      requiredCapabilities.push("temperature-control");
    if (requiresVentilation) requiredCapabilities.push("ventilation");
    if (requiresSecondaryContainment)
      requiredCapabilities.push("secondary-containment");
    if (requiresSegregation) requiredCapabilities.push("segregation");
    if (health >= 3) requiredCapabilities.push("toxic-handling");
    if (flammability >= 3) requiredCapabilities.push("flammable-storage");
    if (reactivity >= 3) requiredCapabilities.push("reactive-storage");

    // Fire suppression requirements
    const fireSuppression: string[] = [];
    if (flammability >= 2) {
      fireSuppression.push("foam");
      if (flammability >= 3) {
        fireSuppression.push("dry-chemical");
      }
    }
    if (
      extractedData.fireSuppressionRequired &&
      extractedData.fireSuppressionRequired !== "Not specified"
    ) {
      fireSuppression.push(extractedData.fireSuppressionRequired);
    }

    // Special handling
    const specialHandling: string[] = [];
    if (health >= 3) specialHandling.push("Use respiratory protection");
    if (flammability >= 3) specialHandling.push("No ignition sources");
    if (reactivity >= 3) specialHandling.push("Store separately");
    if (special.includes("W")) specialHandling.push("Keep away from water");
    if (special.includes("OX"))
      specialHandling.push("Keep away from combustibles");

    // Segregation distance (NFPA 400)
    let segregationDistance = 0;
    if (health >= 3 || flammability >= 3 || reactivity >= 3) {
      segregationDistance = 3; // 3 meters minimum
    } else if (health >= 2 || flammability >= 2 || reactivity >= 2) {
      segregationDistance = 1.5; // 1.5 meters
    }

    return {
      health,
      flammability,
      reactivity,
      special,
      requiresHazmatWarehouse,
      requiresTemperatureControl,
      requiresVentilation,
      requiresSecondaryContainment,
      requiresSegregation,
      incompatibleClasses,
      storageTemperature,
      storageArea: {
        type: storageAreaType,
        requiredCapabilities,
      },
      segregationDistance,
      fireSuppression,
      specialHandling,
    };
  }

  /**
   * Get intelligent warehouse assignment recommendations
   */
  async getIntelligentAssignment(
    submission: MSDSSubmission,
    config: IntelligentAssignmentConfig = {},
  ): Promise<WarehouseAssignment[]> {
    if (!submission.extractedData) {
      throw new Error("MSDS data not extracted");
    }

    const nfpaRequirements = this.analyzeNFPARequirements(
      submission.extractedData,
    );

    // Fetch available warehouses
    const warehouses = await this.fetchWarehouses(config);

    // Score and rank warehouses
    const assignments: WarehouseAssignment[] = [];

    for (const warehouse of warehouses) {
      const assignment = await this.scoreWarehouse(
        warehouse,
        nfpaRequirements,
        submission.extractedData!,
        config,
      );

      if (assignment.complianceScore >= 60) {
        // Minimum threshold
        assignments.push(assignment);
      }
    }

    // Sort by confidence and compliance score
    assignments.sort((a, b) => {
      const scoreA = a.confidence * 0.6 + a.complianceScore * 0.4;
      const scoreB = b.confidence * 0.6 + b.complianceScore * 0.4;
      return scoreB - scoreA;
    });

    return assignments;
  }

  /**
   * Score a warehouse against NFPA requirements
   */
  private async scoreWarehouse(
    warehouse: any,
    nfpaRequirements: NFPAStorageRequirements,
    extractedData: ExtractedMSDSData,
    config: IntelligentAssignmentConfig,
  ): Promise<WarehouseAssignment> {
    let complianceScore = 100;
    const reasoning: string[] = [];
    const warnings: string[] = [];
    const nfpaMatch = {
      health: false,
      flammability: false,
      reactivity: false,
      special: false,
    };

    // Check hazmat capability
    if (nfpaRequirements.requiresHazmatWarehouse) {
      if (
        warehouse.type === "HAZMAT" ||
        warehouse.capabilities?.some((c: any) => c.id === "hazmat")
      ) {
        reasoning.push("✓ Hazmat warehouse matches NFPA requirements");
        nfpaMatch.health = true;
        nfpaMatch.flammability = true;
        nfpaMatch.reactivity = true;
      } else {
        complianceScore -= 50;
        warnings.push("⚠ Warehouse may not meet hazmat requirements");
        reasoning.push("✗ Warehouse lacks hazmat certification");
      }
    } else {
      reasoning.push("✓ General warehouse suitable for non-hazmat material");
      nfpaMatch.health = true;
      nfpaMatch.flammability = true;
      nfpaMatch.reactivity = true;
    }

    // Check temperature control
    if (nfpaRequirements.requiresTemperatureControl) {
      const hasTempControl =
        warehouse.capacity?.temperatureZones?.length > 0 ||
        warehouse.capabilities?.some(
          (c: any) => c.id === "temperature-control",
        );

      if (hasTempControl) {
        // Check if temperature range matches
        if (nfpaRequirements.storageTemperature) {
          const tempZones = warehouse.capacity?.temperatureZones || [];
          const tempMatch = tempZones.some((zone: any) => {
            if (
              nfpaRequirements.storageTemperature?.min &&
              zone.minTemp > nfpaRequirements.storageTemperature.min
            )
              return false;
            if (
              nfpaRequirements.storageTemperature?.max &&
              zone.maxTemp < nfpaRequirements.storageTemperature.max
            )
              return false;
            return true;
          });

          if (tempMatch) {
            reasoning.push(
              `✓ Temperature control matches requirement (${nfpaRequirements.storageTemperature.range || "specified range"})`,
            );
          } else {
            complianceScore -= 20;
            warnings.push("⚠ Temperature range may not match requirements");
          }
        } else {
          reasoning.push("✓ Temperature control available");
        }
      } else {
        complianceScore -= 30;
        warnings.push("⚠ Temperature control required but not available");
        reasoning.push("✗ Warehouse lacks temperature control");
      }
    }

    // Check ventilation
    if (nfpaRequirements.requiresVentilation) {
      const hasVentilation = warehouse.capabilities?.some(
        (c: any) => c.id === "ventilation",
      );
      if (hasVentilation) {
        reasoning.push("✓ Ventilation system available");
      } else {
        complianceScore -= 15;
        warnings.push("⚠ Ventilation may be required");
      }
    }

    // Check secondary containment
    if (nfpaRequirements.requiresSecondaryContainment) {
      const hasContainment = warehouse.capabilities?.some(
        (c: any) => c.id === "secondary-containment",
      );
      if (hasContainment) {
        reasoning.push("✓ Secondary containment available");
      } else {
        complianceScore -= 20;
        warnings.push("⚠ Secondary containment recommended");
      }
    }

    // Check segregation capability
    if (nfpaRequirements.requiresSegregation) {
      const hasSegregation =
        warehouse.capabilities?.some((c: any) => c.id === "segregation") ||
        warehouse.capacity?.temperatureZones?.length > 1;

      if (hasSegregation) {
        reasoning.push(
          `✓ Segregation available (${nfpaRequirements.segregationDistance}m distance)`,
        );
      } else {
        complianceScore -= 15;
        warnings.push("⚠ Segregation may be limited");
      }
    }

    // Check incompatible materials
    if (nfpaRequirements.incompatibleClasses.length > 0) {
      // Check if warehouse already stores incompatible materials
      // This would require checking existing inventory
      reasoning.push(
        `⚠ Ensure segregation from: ${nfpaRequirements.incompatibleClasses.join(", ")}`,
      );
    }

    // Check commercial agreement
    if (config.requireCommercialAgreement && config.customerId) {
      const hasAgreement =
        warehouse.servingCustomers?.includes(config.customerId) ||
        warehouse.primaryCustomer === config.customerId;

      if (hasAgreement) {
        reasoning.push("✓ Commercial agreement in place");
      } else {
        complianceScore -= 10;
        warnings.push("⚠ Commercial agreement may be required");
      }
    }

    // Check space availability
    const utilization = warehouse.currentUtilization || {};
    const capacity = warehouse.capacity || {};

    const areaUtilization =
      (utilization.areaUsed || 0) / (capacity.totalArea || 1);
    const volumeUtilization =
      (utilization.volumeUsed || 0) / (capacity.totalVolume || 1);

    if (areaUtilization > 0.9 || volumeUtilization > 0.9) {
      complianceScore -= 25;
      warnings.push("⚠ Warehouse near capacity");
    } else {
      reasoning.push("✓ Adequate space available");
    }

    // Calculate confidence
    let confidence = complianceScore;
    if (config.quoteAccepted) confidence += 10;
    if (config.preferredWarehouse === warehouse.id) confidence += 15;

    // Ensure confidence is within bounds
    confidence = Math.min(100, Math.max(0, confidence));

    return {
      warehouseId: warehouse.id,
      warehouseName: warehouse.warehouseName || warehouse.name,
      warehouseCode: warehouse.warehouseCode || warehouse.code,
      confidence: Math.round(confidence),
      reasoning,
      warnings,
      complianceScore: Math.max(0, Math.min(100, complianceScore)),
      nfpaMatch,
      estimatedCost: this.calculateEstimatedCost(
        warehouse,
        nfpaRequirements,
        config,
      ),
    };
  }

  /**
   * Calculate estimated storage cost
   */
  private calculateEstimatedCost(
    warehouse: any,
    nfpaRequirements: NFPAStorageRequirements,
    config: IntelligentAssignmentConfig,
  ): { monthly: number; currency: string } {
    // Base cost per m²
    let baseCost = 50; // SAR per m² per month

    // Hazmat premium
    if (nfpaRequirements.requiresHazmatWarehouse) {
      baseCost *= 1.5;
    }

    // Temperature control premium
    if (nfpaRequirements.requiresTemperatureControl) {
      baseCost *= 1.3;
    }

    // Calculate based on volume or area
    const volume = config.volume || 1; // m³
    const area = volume / 3; // Assume 3m height

    const monthlyCost = baseCost * area;

    return {
      monthly: Math.round(monthlyCost),
      currency: "SAR",
    };
  }

  /**
   * Fetch warehouses from ERPNext
   */
  private async fetchWarehouses(
    config: IntelligentAssignmentConfig,
  ): Promise<any[]> {
    try {
      const response = await fetch("/api/warehouse/list", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        return data.warehouses || [];
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }

    // Fallback: return empty array
    return [];
  }

  /**
   * Auto-assign warehouse when MSDS is approved
   */
  async autoAssignOnApproval(
    submission: MSDSSubmission,
    config: IntelligentAssignmentConfig,
  ): Promise<WarehouseAssignment | null> {
    // Only auto-assign if quote is accepted
    if (!config.quoteAccepted) {
      return null;
    }

    // Get recommendations
    const assignments = await this.getIntelligentAssignment(submission, {
      ...config,
      requireCommercialAgreement: true,
    });

    if (assignments.length === 0) {
      return null;
    }

    // Select top recommendation if confidence is high enough
    const topAssignment = assignments[0];
    if (topAssignment.confidence >= 75 && topAssignment.complianceScore >= 80) {
      // Auto-assign to ERPNext
      await this.assignToWarehouse(submission, topAssignment);
      return topAssignment;
    }

    return null;
  }

  /**
   * Assign MSDS to warehouse in ERPNext
   */
  private async assignToWarehouse(
    submission: MSDSSubmission,
    assignment: WarehouseAssignment,
  ): Promise<void> {
    try {
      await fetch("/api/warehouse/assign-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: submission.id,
          warehouseId: assignment.warehouseId,
          area: assignment.area,
          zone: assignment.zone,
          location: assignment.location,
          reasoning: assignment.reasoning,
          nfpaRequirements: this.analyzeNFPARequirements(
            submission.extractedData!,
          ),
        }),
      });
    } catch (error) {
      console.error("Error assigning to warehouse:", error);
      throw error;
    }
  }
}

export const intelligentWarehouseAssignmentService =
  new IntelligentWarehouseAssignmentService();

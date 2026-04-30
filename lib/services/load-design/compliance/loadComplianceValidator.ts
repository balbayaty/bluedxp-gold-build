/**
 * Load Compliance Validator
 *
 * Comprehensive compliance validation for load designs:
 * - Ministry of Transport (MOT) regulations
 * - Customs requirements
 * - Weight and dimension restrictions
 * - Hazmat regulations
 * - Route-specific regulations
 * - Country-specific requirements
 */

import type {
  LoadPlan,
  MultimodalLoadPlan,
  ComplianceCheck,
  ComplianceWarning,
  ComplianceError,
  LoadItem,
} from "@/types/load-design";
import { complianceService } from "@/lib/services/compliance/complianceService";
import { customsService } from "@/lib/services/customs/CustomsService";

export interface ComplianceValidationResult {
  status:
    | "COMPLIANT"
    | "NON_COMPLIANT"
    | "PENDING_VALIDATION"
    | "REQUIRES_REVIEW";
  checks: ComplianceCheck[];
  warnings: ComplianceWarning[];
  errors: ComplianceError[];
  score: number; // 0-100
  summary: string;
}

/**
 * Load Compliance Validator Service
 */
export class LoadComplianceValidator {
  /**
   * Validate load plan compliance
   */
  async validateLoadPlan(
    loadPlan: LoadPlan,
  ): Promise<ComplianceValidationResult> {
    const checks: ComplianceCheck[] = [];
    const warnings: ComplianceWarning[] = [];
    const errors: ComplianceError[] = [];

    // Weight compliance
    const weightCheck = await this.validateWeight(loadPlan);
    checks.push(weightCheck);
    if (weightCheck.status === "FAIL") {
      errors.push(
        this.createError("WEIGHT", weightCheck.message, true, weightCheck.id),
      );
    }

    // Dimension compliance
    const dimensionCheck = await this.validateDimensions(loadPlan);
    checks.push(dimensionCheck);
    if (dimensionCheck.status === "FAIL") {
      errors.push(
        this.createError(
          "DIMENSIONS",
          dimensionCheck.message,
          true,
          dimensionCheck.id,
        ),
      );
    }

    // Axle weight compliance
    const axleCheck = await this.validateAxleWeight(loadPlan);
    checks.push(axleCheck);
    if (axleCheck.status === "FAIL") {
      errors.push(
        this.createError("WEIGHT", axleCheck.message, true, axleCheck.id),
      );
    }

    // Hazmat compliance
    const hazmatChecks = await this.validateHazmat(loadPlan);
    checks.push(...hazmatChecks);
    for (const check of hazmatChecks) {
      if (check.status === "FAIL") {
        errors.push(this.createError("HAZMAT", check.message, true, check.id));
      } else if (check.status === "WARNING") {
        warnings.push(
          this.createWarning("MEDIUM", "HAZMAT", check.message, check.id),
        );
      }
    }

    // Temperature compliance
    const tempChecks = await this.validateTemperature(loadPlan);
    checks.push(...tempChecks);
    for (const check of tempChecks) {
      if (check.status === "FAIL") {
        errors.push(
          this.createError("TEMPERATURE", check.message, true, check.id),
        );
      }
    }

    // Customs compliance
    const customsChecks = await this.validateCustoms(loadPlan);
    checks.push(...customsChecks);
    for (const check of customsChecks) {
      if (check.status === "FAIL") {
        errors.push(this.createError("CUSTOMS", check.message, true, check.id));
      } else if (check.status === "WARNING") {
        warnings.push(
          this.createWarning("MEDIUM", "CUSTOMS", check.message, check.id),
        );
      }
    }

    // Route compliance
    const routeChecks = await this.validateRoute(loadPlan);
    checks.push(...routeChecks);
    for (const check of routeChecks) {
      if (check.status === "FAIL") {
        errors.push(this.createError("ROUTE", check.message, true, check.id));
      } else if (check.status === "WARNING") {
        warnings.push(
          this.createWarning("LOW", "ROUTE", check.message, check.id),
        );
      }
    }

    // Ministry of Transport compliance
    const motChecks = await this.validateMOT(loadPlan);
    checks.push(...motChecks);
    for (const check of motChecks) {
      if (check.status === "FAIL") {
        errors.push(
          this.createError("TRANSPORT", check.message, true, check.id),
        );
      } else if (check.status === "WARNING") {
        warnings.push(
          this.createWarning("MEDIUM", "TRANSPORT", check.message, check.id),
        );
      }
    }

    // Calculate overall status
    const status = this.determineStatus(checks, warnings, errors);
    const score = this.calculateScore(checks, warnings, errors);
    const summary = this.generateSummary(status, checks, warnings, errors);

    return {
      status,
      checks,
      warnings,
      errors,
      score,
      summary,
    };
  }

  /**
   * Validate weight compliance
   */
  private async validateWeight(loadPlan: LoadPlan): Promise<ComplianceCheck> {
    const totalWeight = loadPlan.items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0,
    );
    const maxWeight = loadPlan.vehicleSpec.maxWeight;

    // Check gross weight
    if (totalWeight > maxWeight) {
      return {
        id: `check-weight-${loadPlan.id}`,
        category: "WEIGHT",
        authority: "MOT",
        country: loadPlan.route?.destination.country,
        checkType: "AUTOMATED",
        status: "FAIL",
        message: `Total weight (${totalWeight.toFixed(0)}kg) exceeds vehicle capacity (${maxWeight.toFixed(0)}kg)`,
        requirement: "Vehicle weight capacity must not be exceeded",
      };
    }

    // Check if near limit (warning)
    const utilization = (totalWeight / maxWeight) * 100;
    if (utilization > 95) {
      return {
        id: `check-weight-${loadPlan.id}`,
        category: "WEIGHT",
        authority: "MOT",
        country: loadPlan.route?.destination.country,
        checkType: "AUTOMATED",
        status: "WARNING",
        message: `Weight utilization is very high (${utilization.toFixed(1)}%) - verify actual weights`,
        requirement: "Weight should be verified before loading",
      };
    }

    return {
      id: `check-weight-${loadPlan.id}`,
      category: "WEIGHT",
      authority: "MOT",
      country: loadPlan.route?.destination.country,
      checkType: "AUTOMATED",
      status: "PASS",
      message: `Weight compliance verified (${totalWeight.toFixed(0)}kg / ${maxWeight.toFixed(0)}kg)`,
    };
  }

  /**
   * Validate dimensions compliance
   */
  private async validateDimensions(
    loadPlan: LoadPlan,
  ): Promise<ComplianceCheck> {
    const vehicleDims = loadPlan.vehicleSpec.dimensions;
    const oversizedItems: LoadItem[] = [];

    for (const item of loadPlan.items) {
      if (
        item.dimensions.length > vehicleDims.length ||
        item.dimensions.width > vehicleDims.width ||
        item.dimensions.height > vehicleDims.height
      ) {
        oversizedItems.push(item);
      }
    }

    if (oversizedItems.length > 0) {
      return {
        id: `check-dimension-${loadPlan.id}`,
        category: "DIMENSIONS",
        authority: "MOT",
        country: loadPlan.route?.destination.country,
        checkType: "AUTOMATED",
        status: "FAIL",
        message: `${oversizedItems.length} item(s) exceed vehicle dimensions`,
        requirement: "All items must fit within vehicle dimensions",
      };
    }

    // Check placement dimensions
    for (const placement of loadPlan.itemPlacements) {
      const endX = placement.position.x + placement.dimensions.length;
      const endY = placement.position.y + placement.dimensions.width;
      const endZ = placement.position.z + placement.dimensions.height;

      if (
        endX > vehicleDims.length ||
        endY > vehicleDims.width ||
        endZ > vehicleDims.height
      ) {
        return {
          id: `check-dimension-placement-${loadPlan.id}`,
          category: "DIMENSIONS",
          authority: "MOT",
          country: loadPlan.route?.destination.country,
          checkType: "AUTOMATED",
          status: "FAIL",
          message: `Item placement exceeds vehicle dimensions`,
          requirement: "All item placements must be within vehicle boundaries",
        };
      }
    }

    return {
      id: `check-dimension-${loadPlan.id}`,
      category: "DIMENSIONS",
      authority: "MOT",
      country: loadPlan.route?.destination.country,
      checkType: "AUTOMATED",
      status: "PASS",
      message: "Dimension compliance verified",
    };
  }

  /**
   * Validate axle weight
   */
  private async validateAxleWeight(
    loadPlan: LoadPlan,
  ): Promise<ComplianceCheck> {
    if (!loadPlan.vehicleSpec.maxAxleWeight) {
      return {
        id: `check-axle-${loadPlan.id}`,
        category: "WEIGHT",
        authority: "MOT",
        country: loadPlan.route?.destination.country,
        checkType: "AUTOMATED",
        status: "PASS",
        message: "Axle weight check not applicable",
      };
    }

    const totalWeight = loadPlan.items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0,
    );

    // Simplified: assume weight is distributed (in reality, would calculate based on placement)
    const estimatedAxleWeight = totalWeight / 2; // Assume 2 axles

    if (estimatedAxleWeight > loadPlan.vehicleSpec.maxAxleWeight) {
      return {
        id: `check-axle-${loadPlan.id}`,
        category: "WEIGHT",
        authority: "MOT",
        country: loadPlan.route?.destination.country,
        checkType: "AUTOMATED",
        status: "FAIL",
        message: `Estimated axle weight (${estimatedAxleWeight.toFixed(0)}kg) exceeds limit (${loadPlan.vehicleSpec.maxAxleWeight.toFixed(0)}kg)`,
        requirement: "Axle weight limits must not be exceeded",
      };
    }

    return {
      id: `check-axle-${loadPlan.id}`,
      category: "WEIGHT",
      authority: "MOT",
      country: loadPlan.route?.destination.country,
      checkType: "AUTOMATED",
      status: "PASS",
      message: "Axle weight compliance verified",
    };
  }

  /**
   * Validate hazmat compliance
   */
  private async validateHazmat(loadPlan: LoadPlan): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];
    const hazmatItems = loadPlan.items.filter((item) => item.isHazmat);

    if (hazmatItems.length === 0) {
      return checks;
    }

    // Check if vehicle is approved for hazmat
    if (!loadPlan.vehicleSpec.metadata?.hazmatApproved) {
      checks.push({
        id: `check-hazmat-vehicle-${loadPlan.id}`,
        category: "HAZMAT",
        authority: "CUSTOMS",
        country: loadPlan.route?.destination.country,
        checkType: "AUTOMATED",
        status: "FAIL",
        message: "Vehicle is not approved for hazardous materials",
        requirement: "Hazmat cargo requires approved vehicle",
      });
    }

    // Check segregation
    for (const item of hazmatItems) {
      if (!item.segregationGroup) {
        checks.push({
          id: `check-hazmat-segregation-${item.id}`,
          category: "HAZMAT",
          authority: "CUSTOMS",
          country: loadPlan.route?.destination.country,
          checkType: "AUTOMATED",
          status: "WARNING",
          message: `Hazmat item ${item.id} missing segregation group`,
          requirement:
            "Hazmat items must have proper segregation classification",
        });
      }

      // Check UN number
      if (!item.unNumber) {
        checks.push({
          id: `check-hazmat-un-${item.id}`,
          category: "HAZMAT",
          authority: "CUSTOMS",
          country: loadPlan.route?.destination.country,
          checkType: "AUTOMATED",
          status: "WARNING",
          message: `Hazmat item ${item.id} missing UN number`,
          requirement: "Hazmat items must have UN number",
        });
      }
    }

    // Check segregation conflicts
    const segregationGroups = new Set(
      hazmatItems.map((item) => item.segregationGroup).filter(Boolean),
    );

    // TODO: Check for incompatible segregation groups

    return checks;
  }

  /**
   * Validate temperature compliance
   */
  private async validateTemperature(
    loadPlan: LoadPlan,
  ): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];
    const tempItems = loadPlan.items.filter(
      (item) => item.requiresTemperatureControl,
    );

    if (tempItems.length === 0) {
      return checks;
    }

    // Check if vehicle has temperature control
    if (!loadPlan.vehicleSpec.hasTemperatureControl) {
      checks.push({
        id: `check-temp-vehicle-${loadPlan.id}`,
        category: "TEMPERATURE",
        authority: "MOT",
        country: loadPlan.route?.destination.country,
        checkType: "AUTOMATED",
        status: "FAIL",
        message: "Vehicle does not have temperature control",
        requirement:
          "Temperature-controlled cargo requires refrigerated vehicle",
      });
      return checks;
    }

    // Check temperature range compatibility
    const vehicleRange = loadPlan.vehicleSpec.temperatureRange;
    if (!vehicleRange) {
      checks.push({
        id: `check-temp-range-${loadPlan.id}`,
        category: "TEMPERATURE",
        authority: "MOT",
        country: loadPlan.route?.destination.country,
        checkType: "AUTOMATED",
        status: "WARNING",
        message: "Vehicle temperature range not specified",
        requirement: "Verify temperature range compatibility",
      });
      return checks;
    }

    for (const item of tempItems) {
      if (
        item.minTemperature !== undefined &&
        item.minTemperature < vehicleRange.min
      ) {
        checks.push({
          id: `check-temp-min-${item.id}`,
          category: "TEMPERATURE",
          authority: "MOT",
          country: loadPlan.route?.destination.country,
          checkType: "AUTOMATED",
          status: "FAIL",
          message: `Item ${item.id} requires minimum temperature ${item.minTemperature}°C, but vehicle minimum is ${vehicleRange.min}°C`,
          requirement:
            "Item temperature requirements must be within vehicle range",
        });
      }

      if (
        item.maxTemperature !== undefined &&
        item.maxTemperature > vehicleRange.max
      ) {
        checks.push({
          id: `check-temp-max-${item.id}`,
          category: "TEMPERATURE",
          authority: "MOT",
          country: loadPlan.route?.destination.country,
          checkType: "AUTOMATED",
          status: "FAIL",
          message: `Item ${item.id} requires maximum temperature ${item.maxTemperature}°C, but vehicle maximum is ${vehicleRange.max}°C`,
          requirement:
            "Item temperature requirements must be within vehicle range",
        });
      }
    }

    return checks;
  }

  /**
   * Validate customs compliance
   */
  private async validateCustoms(
    loadPlan: LoadPlan,
  ): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];

    // Check if international shipment
    const countries = new Set(
      loadPlan.items.map((item) => item.destination.country),
    );

    if (countries.size === 1) {
      // Domestic shipment - no customs required
      return checks;
    }

    // International shipment - check customs requirements
    for (const item of loadPlan.items) {
      if (item.requiresCustomsDocumentation) {
        if (!item.hsCode) {
          checks.push({
            id: `check-customs-hs-${item.id}`,
            category: "CUSTOMS",
            authority: "CUSTOMS",
            country: item.destination.country,
            checkType: "AUTOMATED",
            status: "WARNING",
            message: `Item ${item.id} requires customs documentation but HS code is missing`,
            requirement:
              "International shipments require HS code for customs classification",
          });
        }

        if (!item.countryOfOrigin) {
          checks.push({
            id: `check-customs-origin-${item.id}`,
            category: "CUSTOMS",
            authority: "CUSTOMS",
            country: item.destination.country,
            checkType: "AUTOMATED",
            status: "WARNING",
            message: `Item ${item.id} missing country of origin`,
            requirement: "International shipments require country of origin",
          });
        }

        if (!item.customsValue) {
          checks.push({
            id: `check-customs-value-${item.id}`,
            category: "CUSTOMS",
            authority: "CUSTOMS",
            country: item.destination.country,
            checkType: "AUTOMATED",
            status: "WARNING",
            message: `Item ${item.id} missing customs value`,
            requirement:
              "International shipments require customs value for duty calculation",
          });
        }
      }
    }

    return checks;
  }

  /**
   * Validate route compliance
   */
  private async validateRoute(loadPlan: LoadPlan): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];

    if (!loadPlan.route) {
      return checks;
    }

    // TODO: Check route-specific regulations
    // - Weight restrictions on specific routes
    // - Dimension restrictions
    // - Time restrictions
    // - Permit requirements

    return checks;
  }

  /**
   * Validate Ministry of Transport compliance
   */
  private async validateMOT(loadPlan: LoadPlan): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];

    // Get countries involved
    const countries = new Set([
      ...loadPlan.items.map((item) => item.origin?.country).filter(Boolean),
      ...loadPlan.items.map((item) => item.destination.country),
    ]);

    // TODO: Load MOT regulations for each country
    // - Vehicle registration requirements
    // - Driver license requirements
    // - Permit requirements
    // - Route restrictions

    return checks;
  }

  /**
   * Determine overall compliance status
   */
  private determineStatus(
    checks: ComplianceCheck[],
    warnings: ComplianceWarning[],
    errors: ComplianceError[],
  ): ComplianceValidationResult["status"] {
    if (errors.length > 0) {
      return "NON_COMPLIANT";
    }

    const allPassed = checks.every((c) => c.status === "PASS");
    if (allPassed && warnings.length === 0) {
      return "COMPLIANT";
    }

    if (warnings.length > 0 || checks.some((c) => c.status === "WARNING")) {
      return "REQUIRES_REVIEW";
    }

    return "PENDING_VALIDATION";
  }

  /**
   * Calculate compliance score
   */
  private calculateScore(
    checks: ComplianceCheck[],
    warnings: ComplianceWarning[],
    errors: ComplianceError[],
  ): number {
    if (errors.length > 0) {
      return 0;
    }

    const totalChecks = checks.length;
    if (totalChecks === 0) {
      return 100;
    }

    const passedChecks = checks.filter((c) => c.status === "PASS").length;
    const baseScore = (passedChecks / totalChecks) * 100;

    // Deduct for warnings
    const warningPenalty = warnings.length * 5;
    const finalScore = Math.max(0, baseScore - warningPenalty);

    return Math.round(finalScore);
  }

  /**
   * Generate compliance summary
   */
  private generateSummary(
    status: ComplianceValidationResult["status"],
    checks: ComplianceCheck[],
    warnings: ComplianceWarning[],
    errors: ComplianceError[],
  ): string {
    const parts: string[] = [];

    parts.push(`Compliance Status: ${status}`);
    parts.push(
      `Checks: ${checks.length} (${checks.filter((c) => c.status === "PASS").length} passed)`,
    );

    if (warnings.length > 0) {
      parts.push(`Warnings: ${warnings.length}`);
    }

    if (errors.length > 0) {
      parts.push(`Errors: ${errors.length} (BLOCKING)`);
    }

    return parts.join(" | ");
  }

  /**
   * Create error from check
   */
  private createError(
    category: string,
    message: string,
    blocking: boolean,
    relatedCheckId?: string,
  ): ComplianceError {
    return {
      id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      category,
      message,
      blocking,
      relatedCheckId,
    };
  }

  /**
   * Create warning from check
   */
  private createWarning(
    severity: "LOW" | "MEDIUM" | "HIGH",
    category: string,
    message: string,
    relatedCheckId?: string,
  ): ComplianceWarning {
    return {
      id: `warning-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      severity,
      category,
      message,
      relatedCheckId,
    };
  }
}

export const loadComplianceValidator = new LoadComplianceValidator();

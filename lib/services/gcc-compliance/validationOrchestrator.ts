/**
 * Pre-Dispatch Validation Orchestrator
 *
 * Orchestrates all 8 validation checks before dispatch:
 * 1. Carrier Eligibility Check
 * 2. Backload Legality Check
 * 3. Equipment-Facility Compatibility
 * 4. Weight & Dimension Validation
 * 5. Truck Ban Window Calculator
 * 6. Document Completeness
 * 7. Permit Validity Check
 * 8. Border Agent Requirements
 *
 * All checks must pass before dispatch is allowed.
 *
 * @module gcc-compliance/validationOrchestrator
 */

import type {
  PreDispatchValidationRequest,
  PreDispatchValidationResult,
  ValidationStep,
  ValidationStepStatus,
  GCCCountry,
} from '@/types/gcc-compliance';
import { equipmentFacilityMatcher } from './equipmentFacilityMatrix';
import { regulationDatabase } from './regulationDatabase';
import { backloadValidator } from './backloadValidator';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// VALIDATION ORCHESTRATOR
// ============================================================================

export class PreDispatchValidationOrchestrator {
  /**
   * Run all 8 validation steps
   */
  async validate(request: PreDispatchValidationRequest): Promise<PreDispatchValidationResult> {
    const validationId = uuidv4();
    const startTime = Date.now();
    const steps: ValidationStep[] = [];

    // Run all 8 validation steps
    steps.push(await this.step1CarrierEligibility(request));
    steps.push(await this.step2BackloadLegality(request));
    steps.push(await this.step3EquipmentCompatibility(request));
    steps.push(await this.step4WeightDimensions(request));
    steps.push(await this.step5TruckBanWindows(request));
    steps.push(await this.step6DocumentCompleteness(request));
    steps.push(await this.step7PermitValidity(request));
    steps.push(await this.step8BorderRequirements(request));

    // Calculate results
    const passedSteps = steps.filter((s) => s.status === 'PASSED').length;
    const failedSteps = steps.filter((s) => s.status === 'FAILED').length;
    const warnings = steps.filter((s) => s.status === 'WARNING').length;

    const blockingIssues = steps
      .filter((s) => s.status === 'FAILED' && s.blocksDispatch)
      .map((s) => s.details);

    const canDispatch = blockingIssues.length === 0;

    // Collect all recommendations
    const recommendations = steps
      .flatMap((s) => s.recommendations || [])
      .filter((r, i, arr) => arr.indexOf(r) === i);

    return {
      shipmentId: request.shipmentId,
      tenantId: request.tenantId,
      canDispatch,
      validationId,
      validatedAt: new Date(),
      steps,
      passedSteps,
      failedSteps,
      warnings,
      blockingIssues,
      recommendations,
      validationTime: new Date(),
      validityPeriod: 30, // 30 minutes
      totalExecutionTimeMs: Date.now() - startTime,
      summary: {
        carrierEligible: steps[0].status === 'PASSED',
        backloadLegal: steps[1].status === 'PASSED' || steps[1].status === 'SKIPPED',
        equipmentCompatible: steps[2].status === 'PASSED',
        weightDimensionsOk: steps[3].status === 'PASSED',
        truckBanClear: steps[4].status === 'PASSED' || steps[4].status === 'WARNING',
        documentsComplete: steps[5].status === 'PASSED',
        permitsValid: steps[6].status === 'PASSED',
        borderRequirementsMet: steps[7].status === 'PASSED' || steps[7].status === 'SKIPPED',
      },
    };
  }

  /**
   * Run a single validation step (for partial validation)
   */
  async runSingleStep(
    stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
    request: PreDispatchValidationRequest
  ): Promise<ValidationStep> {
    switch (stepNumber) {
      case 1:
        return this.step1CarrierEligibility(request);
      case 2:
        return this.step2BackloadLegality(request);
      case 3:
        return this.step3EquipmentCompatibility(request);
      case 4:
        return this.step4WeightDimensions(request);
      case 5:
        return this.step5TruckBanWindows(request);
      case 6:
        return this.step6DocumentCompleteness(request);
      case 7:
        return this.step7PermitValidity(request);
      case 8:
        return this.step8BorderRequirements(request);
    }
  }

  // ============================================================================
  // STEP 1: CARRIER ELIGIBILITY CHECK
  // ============================================================================

  private async step1CarrierEligibility(
    request: PreDispatchValidationRequest
  ): Promise<ValidationStep> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check WASL registration
    if (!request.carrier.waslRegistered) {
      issues.push('Carrier is not WASL registered');
      recommendations.push('Register vehicle with WASL system');
    }

    // Check insurance
    if (!request.carrier.insuranceValid) {
      issues.push('Carrier insurance is invalid or expired');
      recommendations.push('Renew carrier insurance before dispatch');
    }

    if (request.carrier.insuranceExpiry) {
      const daysUntilExpiry = Math.floor(
        (new Date(request.carrier.insuranceExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry < 7) {
        recommendations.push(`Insurance expires in ${daysUntilExpiry} days - consider renewal`);
      }
    }

    // Check route licensing
    const routeKey = `${request.route.origin.country}-${request.route.destination.country}`;
    if (!request.carrier.licensedRoutes.includes(routeKey) && !request.carrier.licensedRoutes.includes('ALL')) {
      issues.push(`Carrier not licensed for route: ${routeKey}`);
      recommendations.push('Apply for route license or use licensed carrier');
    }

    const status: ValidationStepStatus = issues.length === 0 ? 'PASSED' : 'FAILED';

    return {
      step: 1,
      name: 'Carrier Eligibility Check',
      description: 'Is carrier licensed for this route type? Valid insurance? WASL registered?',
      status,
      details: issues.length === 0 ? 'Carrier is eligible for this shipment' : issues.join('; '),
      blocksDispatch: issues.length > 0,
      executionTimeMs: Date.now() - startTime,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  // ============================================================================
  // STEP 2: BACKLOAD LEGALITY CHECK
  // ============================================================================

  private async step2BackloadLegality(
    request: PreDispatchValidationRequest
  ): Promise<ValidationStep> {
    const startTime = Date.now();

    // Skip if not a backload
    if (!request.backloadInfo) {
      return {
        step: 2,
        name: 'Backload Legality Check',
        description: 'If foreign carrier + backload: Is pickup location within 50km of direct return route?',
        status: 'SKIPPED',
        details: 'Not a backload shipment',
        blocksDispatch: false,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Skip if Saudi carrier (exempt)
    if (request.carrier.nationality === 'SA') {
      return {
        step: 2,
        name: 'Backload Legality Check',
        description: 'If foreign carrier + backload: Is pickup location within 50km of direct return route?',
        status: 'PASSED',
        details: 'Saudi carriers are exempt from backload restrictions',
        blocksDispatch: false,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Validate backload
    const result = await backloadValidator.validateBackload({
      carrierId: request.carrier.id,
      carrierNationality: request.carrier.nationality as GCCCountry | 'OTHER',
      plateNumber: request.equipment.plateNumber,
      plateType: request.equipment.plateType,
      originalTrip: {
        bayanNumber: request.backloadInfo.originalBayanNumber,
        arrivalCity: request.backloadInfo.arrivalCity,
        arrivalLocation: request.backloadInfo.arrivalLocation,
        arrivalDate: request.backloadInfo.arrivalDate,
      },
      proposedBackload: {
        pickupLocation: request.route.origin.coordinates,
        pickupCity: request.route.origin.city,
        destinationCity: request.route.destination.city,
        destinationCountry: request.route.destination.country,
      },
    });

    const status: ValidationStepStatus = result.isLegal
      ? 'PASSED'
      : result.complianceStatus === 'REQUIRES_REVIEW'
        ? 'WARNING'
        : 'FAILED';

    return {
      step: 2,
      name: 'Backload Legality Check',
      description: 'If foreign carrier + backload: Is pickup location within 50km of direct return route?',
      status,
      details: result.isLegal
        ? `Backload is legal - ${result.distanceFromReturnRoute}km from return route`
        : result.violations.join('; '),
      blocksDispatch: !result.isLegal,
      executionTimeMs: Date.now() - startTime,
      recommendations: result.warnings.length > 0 ? result.warnings : undefined,
      evidence: {
        type: 'BACKLOAD_VALIDATION',
        data: result,
        timestamp: new Date(),
      },
    };
  }

  // ============================================================================
  // STEP 3: EQUIPMENT-FACILITY COMPATIBILITY
  // ============================================================================

  private async step3EquipmentCompatibility(
    request: PreDispatchValidationRequest
  ): Promise<ValidationStep> {
    const startTime = Date.now();

    // Build facilities list
    const facilities = [
      {
        facilityId: request.route.origin.facilityId,
        facilityType: request.route.origin.facilityType,
        name: `Origin: ${request.route.origin.city}`,
        location: request.route.origin.coordinates,
      },
      ...request.route.intermediateFacilities.map((f) => ({
        facilityId: f.facilityId,
        facilityType: f.facilityType,
        name: `Stop: ${f.city}`,
        location: f.coordinates,
      })),
      {
        facilityId: request.route.destination.facilityId,
        facilityType: request.route.destination.facilityType,
        name: `Destination: ${request.route.destination.city}`,
        location: request.route.destination.coordinates,
      },
    ];

    const result = equipmentFacilityMatcher.validateEquipmentForJourney({
      equipmentType: request.equipment.type,
      facilities,
      cargo: {
        isHazmat: request.cargo.type === 'HAZMAT',
        requiresRefrigeration: request.cargo.type === 'PERISHABLE',
        weight: request.cargo.weight,
      },
    });

    const status: ValidationStepStatus = result.isCompatible
      ? 'PASSED'
      : result.warnings.length > 0
        ? 'WARNING'
        : 'FAILED';

    return {
      step: 3,
      name: 'Equipment-Facility Compatibility',
      description: 'Can assigned trailer be handled at origin, all intermediate stops, and destination?',
      status,
      details: result.isCompatible
        ? 'Equipment is compatible with all facilities'
        : `Blocked at: ${result.blockedFacilities.join(', ')}`,
      blocksDispatch: !result.isCompatible,
      executionTimeMs: Date.now() - startTime,
      recommendations: result.recommendations.length > 0 ? result.recommendations : undefined,
      evidence: {
        type: 'EQUIPMENT_COMPATIBILITY',
        data: result,
        timestamp: new Date(),
      },
    };
  }

  // ============================================================================
  // STEP 4: WEIGHT & DIMENSION VALIDATION
  // ============================================================================

  private async step4WeightDimensions(
    request: PreDispatchValidationRequest
  ): Promise<ValidationStep> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Get weight limits for origin country
    const originLimits = regulationDatabase.getWeightLimits(request.route.origin.country);
    const destLimits = regulationDatabase.getWeightLimits(request.route.destination.country);

    // Use the stricter limits
    const limits = originLimits || destLimits;

    if (limits) {
      // Check gross weight
      if (request.cargo.weight > limits.maxGrossWeight) {
        issues.push(
          `Cargo weight ${request.cargo.weight}kg exceeds limit of ${limits.maxGrossWeight}kg`
        );
        recommendations.push('Split cargo or apply for oversized permit');
      }

      // Check dimensions
      if (request.cargo.dimensions.height > limits.maxHeight) {
        issues.push(
          `Height ${request.cargo.dimensions.height}m exceeds limit of ${limits.maxHeight}m`
        );
      }

      if (request.cargo.dimensions.length > limits.maxLength) {
        issues.push(
          `Length ${request.cargo.dimensions.length}m exceeds limit of ${limits.maxLength}m`
        );
      }

      if (request.cargo.dimensions.width > limits.maxWidth) {
        issues.push(
          `Width ${request.cargo.dimensions.width}m exceeds limit of ${limits.maxWidth}m`
        );
      }

      // Check if oversized permit needed
      if (issues.length > 0 && limits.oversizedPermitRequired) {
        recommendations.push('Oversized cargo permit required');
      }
    }

    // HAZMAT specific checks
    if (request.cargo.type === 'HAZMAT') {
      if (!request.cargo.hazmatClass) {
        issues.push('HAZMAT class not specified');
      }
      if (!request.cargo.hazmatUnNumber) {
        issues.push('HAZMAT UN number not specified');
      }
    }

    const status: ValidationStepStatus = issues.length === 0 ? 'PASSED' : 'FAILED';

    return {
      step: 4,
      name: 'Weight & Dimension Validation',
      description: 'Does cargo fit equipment? Within axle limits? Need oversized permit?',
      status,
      details:
        issues.length === 0
          ? `Weight ${request.cargo.weight}kg and dimensions within limits`
          : issues.join('; '),
      blocksDispatch: issues.length > 0,
      executionTimeMs: Date.now() - startTime,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  // ============================================================================
  // STEP 5: TRUCK BAN WINDOW CALCULATOR
  // ============================================================================

  private async step5TruckBanWindows(
    request: PreDispatchValidationRequest
  ): Promise<ValidationStep> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let totalWaitTime = 0;

    // Check truck ban at destination
    const destBan = regulationDatabase.checkTruckBan({
      city: request.route.destination.city,
      country: request.route.destination.country,
      plannedArrival: request.route.plannedArrival,
      vehicleType: request.equipment.type,
    });

    if (!destBan.canEnter && destBan.currentlyBanned) {
      if (destBan.waitTimeHours) {
        totalWaitTime += destBan.waitTimeHours;
        recommendations.push(
          `Destination: Wait ${destBan.waitTimeHours} hours or book E-Appointment`
        );
      }
      if (destBan.activeRestriction) {
        issues.push(
          `Destination ${request.route.destination.city}: ${destBan.activeRestriction.name} active`
        );
      }
    }

    // Check intermediate cities
    for (const facility of request.route.intermediateFacilities) {
      const ban = regulationDatabase.checkTruckBan({
        city: facility.city,
        country: facility.country,
        plannedArrival: request.route.plannedDeparture, // Estimate
        vehicleType: request.equipment.type,
      });

      if (!ban.canEnter && ban.currentlyBanned) {
        if (ban.waitTimeHours) {
          totalWaitTime += ban.waitTimeHours;
        }
        recommendations.push(`${facility.city}: Truck ban may apply - check timing`);
      }
    }

    // Determine status
    let status: ValidationStepStatus = 'PASSED';
    if (issues.length > 0) {
      status = totalWaitTime > 4 ? 'FAILED' : 'WARNING'; // Fail if > 4 hours wait
    }

    return {
      step: 5,
      name: 'Truck Ban Window Calculator',
      description: 'Can truck legally enter each city at the planned arrival time?',
      status,
      details:
        issues.length === 0
          ? 'No truck ban restrictions at planned times'
          : `${issues.join('; ')}. Total wait: ${totalWaitTime} hours`,
      blocksDispatch: status === 'FAILED',
      executionTimeMs: Date.now() - startTime,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      evidence: {
        type: 'TRUCK_BAN_CHECK',
        data: { destBan, totalWaitTime },
        timestamp: new Date(),
      },
    };
  }

  // ============================================================================
  // STEP 6: DOCUMENT COMPLETENESS
  // ============================================================================

  private async step6DocumentCompleteness(
    request: PreDispatchValidationRequest
  ): Promise<ValidationStep> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check Bayan ETD (required for Saudi routes)
    const isSaudiRoute =
      request.route.origin.country === 'SA' || request.route.destination.country === 'SA';

    if (isSaudiRoute) {
      if (!request.documents.bayanEtd) {
        issues.push('Bayan ETD not provided (required for Saudi Arabia)');
        recommendations.push('Create Bayan ETD before dispatch');
      } else {
        if (!request.documents.bayanEtd.valid) {
          issues.push('Bayan ETD is invalid');
        }
        if (request.documents.bayanEtd.status !== 'ACTIVE') {
          issues.push(`Bayan ETD status is ${request.documents.bayanEtd.status}`);
        }
        if (new Date(request.documents.bayanEtd.expiryDate) < new Date()) {
          issues.push('Bayan ETD has expired');
        }
      }
    }

    // Check customs manifest for cross-border
    const isCrossBorder = request.route.origin.country !== request.route.destination.country;
    if (isCrossBorder && !request.documents.customsManifest) {
      issues.push('Customs manifest required for cross-border shipment');
      recommendations.push('Prepare customs manifest');
    }

    // Check SFDA for perishables
    if (request.cargo.sfdaRequired && request.cargo.type === 'PERISHABLE') {
      const hasSfdaPermit = request.documents.permits.some((p) => p.type === 'SFDA');
      if (!hasSfdaPermit) {
        issues.push('SFDA permit required for perishable cargo');
        recommendations.push('Apply for SFDA permit');
      }
    }

    const status: ValidationStepStatus = issues.length === 0 ? 'PASSED' : 'FAILED';

    return {
      step: 6,
      name: 'Document Completeness',
      description: 'Are all required documents (Bayan ETD, customs manifest, permits) available and valid?',
      status,
      details:
        issues.length === 0
          ? 'All required documents are complete and valid'
          : issues.join('; '),
      blocksDispatch: issues.length > 0,
      executionTimeMs: Date.now() - startTime,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  // ============================================================================
  // STEP 7: PERMIT VALIDITY CHECK
  // ============================================================================

  private async step7PermitValidity(
    request: PreDispatchValidationRequest
  ): Promise<ValidationStep> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check all permits
    for (const permit of request.documents.permits) {
      if (!permit.isValid) {
        issues.push(`Permit ${permit.type} (${permit.number}) is invalid`);
      }

      const expiryDate = new Date(permit.expiryDate);
      const now = new Date();

      if (expiryDate < now) {
        issues.push(`Permit ${permit.type} has expired`);
        recommendations.push(`Renew ${permit.type} permit`);
      } else {
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry < 7) {
          recommendations.push(`${permit.type} expires in ${daysUntilExpiry} days`);
        }
      }
    }

    // Check for required permits based on cargo type
    if (request.cargo.type === 'HAZMAT') {
      const hasHazmatPermit = request.documents.permits.some(
        (p) => p.type === 'HAZMAT_TRANSPORT' || p.type === 'ADR_CERTIFICATE'
      );
      if (!hasHazmatPermit) {
        issues.push('HAZMAT transport permit required');
        recommendations.push('Apply for HAZMAT transport permit');
      }
    }

    if (request.cargo.type === 'OVERSIZED') {
      const hasOversizedPermit = request.documents.permits.some(
        (p) => p.type === 'OVERSIZED_CARGO' || p.type === 'ABNORMAL_LOAD'
      );
      if (!hasOversizedPermit) {
        issues.push('Oversized cargo permit required');
        recommendations.push('Apply for oversized cargo permit');
      }
    }

    const status: ValidationStepStatus =
      issues.length === 0 ? 'PASSED' : recommendations.length > 0 ? 'WARNING' : 'FAILED';

    return {
      step: 7,
      name: 'Permit Validity Check',
      description: 'Are all permits current? Need renewal? Special cargo permits required?',
      status,
      details:
        issues.length === 0
          ? 'All permits are valid'
          : issues.join('; '),
      blocksDispatch: issues.some((i) => i.includes('required') || i.includes('expired')),
      executionTimeMs: Date.now() - startTime,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  // ============================================================================
  // STEP 8: BORDER AGENT REQUIREMENTS
  // ============================================================================

  private async step8BorderRequirements(
    request: PreDispatchValidationRequest
  ): Promise<ValidationStep> {
    const startTime = Date.now();

    // Skip if not cross-border
    if (request.route.origin.country === request.route.destination.country) {
      return {
        step: 8,
        name: 'Border Agent Requirements',
        description: 'Does this border/cargo combination require a clearing agent?',
        status: 'SKIPPED',
        details: 'Domestic shipment - no border crossing',
        blocksDispatch: false,
        executionTimeMs: Date.now() - startTime,
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Get border crossing info
    const border = regulationDatabase.getBorderCrossing(
      request.route.origin.country,
      request.route.destination.country
    );

    if (border) {
      // Check required documents
      for (const doc of border.requirements.documentsRequired) {
        if (doc === 'BAYAN_ETD' && !request.documents.bayanEtd) {
          issues.push(`${doc} required at ${border.name}`);
        }
        if (doc === 'CUSTOMS_MANIFEST' && !request.documents.customsManifest) {
          issues.push(`${doc} required at ${border.name}`);
        }
      }

      // Check fees
      if (border.requirements.feesApplicable.length > 0) {
        const totalFees = border.requirements.feesApplicable.reduce((sum, f) => sum + f.amount, 0);
        recommendations.push(
          `Border fees: ${totalFees} ${border.requirements.feesApplicable[0].currency} at ${border.name}`
        );
      }

      // Check inspection requirement
      if (border.requirements.inspectionRequired) {
        recommendations.push(`Inspection required at ${border.name} - allow extra time`);
      }

      // Estimate processing time
      recommendations.push(
        `Estimated processing time at ${border.name}: ${border.averageProcessingTime} hours`
      );
    } else {
      recommendations.push('Border crossing information not available - verify requirements');
    }

    const status: ValidationStepStatus = issues.length === 0 ? 'PASSED' : 'FAILED';

    return {
      step: 8,
      name: 'Border Agent Requirements',
      description: 'Does this border/cargo combination require a clearing agent?',
      status,
      details:
        issues.length === 0
          ? `Border requirements met for ${border?.name || 'crossing'}`
          : issues.join('; '),
      blocksDispatch: issues.length > 0,
      executionTimeMs: Date.now() - startTime,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      evidence: border
        ? {
            type: 'BORDER_CROSSING',
            data: border,
            timestamp: new Date(),
          }
        : undefined,
    };
  }
}

// Export singleton
export const validationOrchestrator = new PreDispatchValidationOrchestrator();

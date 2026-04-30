/**
 * Equipment-Facility Compatibility Matrix
 *
 * Comprehensive matrix defining which equipment types can be handled
 * at which facility types. Prevents invalid dispatch combinations.
 *
 * Based on GCC Compliance Intelligence Framework
 * @module gcc-compliance/equipmentFacilityMatrix
 */

import type {
  EquipmentType,
  FacilityCapabilityType,
  CompatibilityRule,
  CompatibilityStatus,
  EquipmentFacilityMatrix,
  EquipmentMatchRequest,
  EquipmentMatchResult,
} from '@/types/gcc-compliance';

// ============================================================================
// EQUIPMENT-FACILITY COMPATIBILITY MATRIX
// ============================================================================

/**
 * The master compatibility matrix
 * Based on real-world GCC logistics operations
 */
export const EQUIPMENT_FACILITY_MATRIX: EquipmentFacilityMatrix = {
  OPEN_YARD: {
    FLATBED: { status: 'COMPATIBLE', notes: 'Ideal for flatbed operations' },
    BOX_DRY_VAN: { status: 'INCOMPATIBLE', notes: 'Requires covered loading area' },
    REEFER: { status: 'INCOMPATIBLE', notes: 'Requires power connection' },
    CURTAIN_SIDE: { status: 'COMPATIBLE', notes: 'Side loading possible' },
    CONTAINER: {
      status: 'CONDITIONAL',
      condition: 'Crane required for lift on/off',
      equipmentRequired: ['CRANE', 'REACH_STACKER'],
      notes: 'Need container handling equipment',
    },
    LOWBED: { status: 'COMPATIBLE', notes: 'Suitable for heavy equipment' },
    TANKER: { status: 'INCOMPATIBLE', notes: 'Requires specialized terminal' },
  },

  DOCK_WAREHOUSE: {
    FLATBED: { status: 'INCOMPATIBLE', notes: 'Cannot back into dock' },
    BOX_DRY_VAN: { status: 'COMPATIBLE', notes: 'Standard dock operations' },
    REEFER: {
      status: 'CONDITIONAL',
      condition: 'Power plug required for standby',
      equipmentRequired: ['POWER_PLUG_400V'],
      notes: 'Check power availability',
    },
    CURTAIN_SIDE: { status: 'COMPATIBLE', notes: 'Can use dock or side' },
    CONTAINER: { status: 'INCOMPATIBLE', notes: 'Cannot handle containers' },
    LOWBED: { status: 'INCOMPATIBLE', notes: 'Height restrictions' },
    TANKER: { status: 'INCOMPATIBLE', notes: 'Not designed for liquids' },
  },

  RAMP_WAREHOUSE: {
    FLATBED: { status: 'COMPATIBLE', notes: 'Forklift access from side' },
    BOX_DRY_VAN: { status: 'COMPATIBLE', notes: 'Ramp or forklift access' },
    REEFER: {
      status: 'CONDITIONAL',
      condition: 'Power plug required',
      equipmentRequired: ['POWER_PLUG_400V'],
      notes: 'Cold storage coordination needed',
    },
    CURTAIN_SIDE: { status: 'COMPATIBLE', notes: 'Flexible loading options' },
    CONTAINER: { status: 'INCOMPATIBLE', notes: 'No container handling' },
    LOWBED: {
      status: 'CONDITIONAL',
      condition: 'Ramp capacity check required',
      notes: 'Weight limits apply',
    },
    TANKER: { status: 'INCOMPATIBLE', notes: 'Not suitable' },
  },

  CONTAINER_TERMINAL: {
    FLATBED: { status: 'INCOMPATIBLE', notes: 'Container operations only' },
    BOX_DRY_VAN: { status: 'INCOMPATIBLE', notes: 'Container operations only' },
    REEFER: {
      status: 'COMPATIBLE',
      notes: 'Reefer plugs available',
      equipmentRequired: ['REEFER_PLUG'],
    },
    CURTAIN_SIDE: { status: 'INCOMPATIBLE', notes: 'Container operations only' },
    CONTAINER: { status: 'COMPATIBLE', notes: 'Primary purpose' },
    LOWBED: { status: 'INCOMPATIBLE', notes: 'Not designed for lowbed' },
    TANKER: { status: 'INCOMPATIBLE', notes: 'Container terminal only' },
  },

  CROSS_DOCK: {
    FLATBED: { status: 'COMPATIBLE', notes: 'Cross-dock suitable' },
    BOX_DRY_VAN: { status: 'COMPATIBLE', notes: 'Standard cross-dock' },
    REEFER: {
      status: 'CONDITIONAL',
      condition: 'Power plug required',
      equipmentRequired: ['POWER_PLUG_400V'],
      notes: 'Temperature monitoring needed',
    },
    CURTAIN_SIDE: { status: 'COMPATIBLE', notes: 'Fast loading/unloading' },
    CONTAINER: {
      status: 'CONDITIONAL',
      condition: 'Container handling equipment needed',
      equipmentRequired: ['REACH_STACKER'],
    },
    LOWBED: { status: 'INCOMPATIBLE', notes: 'Not typical for cross-dock' },
    TANKER: { status: 'INCOMPATIBLE', notes: 'Not suitable' },
  },

  RAIL_YARD: {
    FLATBED: { status: 'COMPATIBLE', notes: 'Intermodal transfer possible' },
    BOX_DRY_VAN: {
      status: 'CONDITIONAL',
      condition: 'May need specialized handling',
    },
    REEFER: {
      status: 'CONDITIONAL',
      condition: 'Power plug required',
      equipmentRequired: ['POWER_PLUG_400V'],
    },
    CURTAIN_SIDE: {
      status: 'CONDITIONAL',
      condition: 'Depends on cargo type',
    },
    CONTAINER: { status: 'COMPATIBLE', notes: 'Standard intermodal' },
    LOWBED: { status: 'COMPATIBLE', notes: 'Heavy cargo transfer' },
    TANKER: { status: 'COMPATIBLE', notes: 'Rail tanker transfer' },
  },

  BORDER_CHECKPOINT: {
    FLATBED: { status: 'COMPATIBLE', notes: 'Standard inspection' },
    BOX_DRY_VAN: { status: 'COMPATIBLE', notes: 'Standard inspection' },
    REEFER: { status: 'COMPATIBLE', notes: 'Priority processing available' },
    CURTAIN_SIDE: { status: 'COMPATIBLE', notes: 'Easy inspection access' },
    CONTAINER: { status: 'COMPATIBLE', notes: 'X-ray scanning available' },
    LOWBED: { status: 'COMPATIBLE', notes: 'Oversized inspection lane' },
    TANKER: {
      status: 'CONDITIONAL',
      condition: 'HAZMAT permit required',
      permits: ['HAZMAT_TRANSPORT', 'ADR_CERTIFICATE'],
      notes: 'Special inspection procedures',
    },
  },

  TANKER_TERMINAL: {
    FLATBED: { status: 'INCOMPATIBLE', notes: 'Tanker operations only' },
    BOX_DRY_VAN: { status: 'INCOMPATIBLE', notes: 'Tanker operations only' },
    REEFER: { status: 'INCOMPATIBLE', notes: 'Tanker operations only' },
    CURTAIN_SIDE: { status: 'INCOMPATIBLE', notes: 'Tanker operations only' },
    CONTAINER: { status: 'INCOMPATIBLE', notes: 'Tanker operations only' },
    LOWBED: { status: 'INCOMPATIBLE', notes: 'Tanker operations only' },
    TANKER: { status: 'COMPATIBLE', notes: 'Primary purpose' },
  },
};

// ============================================================================
// EQUIPMENT LABELS (Arabic + English)
// ============================================================================

export const EQUIPMENT_LABELS: Record<EquipmentType, { en: string; ar: string }> = {
  FLATBED: { en: 'Flatbed', ar: 'سطحة' },
  BOX_DRY_VAN: { en: 'Box/Dry Van', ar: 'صندوق' },
  REEFER: { en: 'Reefer', ar: 'مبرد' },
  CURTAIN_SIDE: { en: 'Curtain-side', ar: 'ستارة' },
  CONTAINER: { en: 'Container', ar: 'حاوية' },
  LOWBED: { en: 'Lowbed', ar: 'لوبد' },
  TANKER: { en: 'Tanker', ar: 'صهريج' },
};

export const FACILITY_LABELS: Record<FacilityCapabilityType, { en: string; ar: string }> = {
  OPEN_YARD: { en: 'Open Yard', ar: 'ساحة مفتوحة' },
  DOCK_WAREHOUSE: { en: 'Dock Warehouse', ar: 'مستودع رصيف' },
  RAMP_WAREHOUSE: { en: 'Ramp Warehouse', ar: 'مستودع منحدر' },
  CONTAINER_TERMINAL: { en: 'Container Terminal', ar: 'محطة حاويات' },
  CROSS_DOCK: { en: 'Cross-dock Facility', ar: 'مرفق عبور' },
  RAIL_YARD: { en: 'Rail Yard', ar: 'ساحة سكك حديدية' },
  BORDER_CHECKPOINT: { en: 'Border Checkpoint', ar: 'نقطة حدود' },
  TANKER_TERMINAL: { en: 'Tanker Terminal', ar: 'محطة صهاريج' },
};

// ============================================================================
// EQUIPMENT-FACILITY MATCHER SERVICE
// ============================================================================

export class EquipmentFacilityMatcher {
  /**
   * Check if equipment is compatible with a single facility
   */
  checkSingleFacility(
    equipmentType: EquipmentType,
    facilityType: FacilityCapabilityType,
    facilityCapabilities?: string[]
  ): {
    status: CompatibilityStatus;
    rule: CompatibilityRule;
    issues: string[];
    missingEquipment: string[];
    canProceed: boolean;
  } {
    const rule = EQUIPMENT_FACILITY_MATRIX[facilityType]?.[equipmentType];

    if (!rule) {
      return {
        status: 'INCOMPATIBLE',
        rule: { status: 'INCOMPATIBLE', notes: 'Unknown combination' },
        issues: ['Unknown equipment/facility combination'],
        missingEquipment: [],
        canProceed: false,
      };
    }

    const issues: string[] = [];
    const missingEquipment: string[] = [];

    if (rule.status === 'INCOMPATIBLE') {
      issues.push(rule.notes || 'Equipment not compatible with facility');
      return {
        status: 'INCOMPATIBLE',
        rule,
        issues,
        missingEquipment,
        canProceed: false,
      };
    }

    if (rule.status === 'CONDITIONAL') {
      // Check if facility has required equipment
      const requiredEquipment = rule.equipmentRequired || [];
      const facilityHas = facilityCapabilities || [];

      for (const req of requiredEquipment) {
        if (!facilityHas.includes(req)) {
          missingEquipment.push(req);
        }
      }

      if (missingEquipment.length > 0) {
        issues.push(`Facility missing: ${missingEquipment.join(', ')}`);
        if (rule.condition) {
          issues.push(rule.condition);
        }
        return {
          status: 'INCOMPATIBLE',
          rule,
          issues,
          missingEquipment,
          canProceed: false,
        };
      }

      // Check permits if applicable
      if (rule.permits && rule.permits.length > 0) {
        issues.push(`Permits required: ${rule.permits.join(', ')}`);
      }
    }

    return {
      status: rule.status,
      rule,
      issues,
      missingEquipment,
      canProceed: true,
    };
  }

  /**
   * Validate equipment for an entire journey
   */
  validateEquipmentForJourney(request: EquipmentMatchRequest): EquipmentMatchResult {
    const facilityChecks = request.facilities.map((facility) => {
      const check = this.checkSingleFacility(
        request.equipmentType,
        facility.facilityType,
        facility.capabilities
      );

      return {
        facilityId: facility.facilityId,
        facilityName: facility.name,
        facilityType: facility.facilityType,
        status: check.status,
        issues: check.issues,
        requiredEquipment: check.rule.equipmentRequired || [],
        missingEquipment: check.missingEquipment,
        canProceed: check.canProceed,
      };
    });

    const blockedFacilities = facilityChecks
      .filter((c) => !c.canProceed)
      .map((c) => c.facilityName);

    const warnings = facilityChecks
      .filter((c) => c.status === 'CONDITIONAL' && c.canProceed)
      .flatMap((c) => c.issues);

    const recommendations: string[] = [];

    // Add cargo-specific recommendations
    if (request.cargo) {
      if (request.cargo.isHazmat && request.equipmentType !== 'TANKER') {
        recommendations.push('Consider using TANKER for HAZMAT cargo');
      }
      if (request.cargo.requiresRefrigeration && request.equipmentType !== 'REEFER') {
        recommendations.push('REEFER equipment recommended for temperature-sensitive cargo');
      }
    }

    // Add general recommendations based on blocked facilities
    if (blockedFacilities.length > 0) {
      recommendations.push(
        `Consider alternative equipment or facilities for: ${blockedFacilities.join(', ')}`
      );
    }

    return {
      isCompatible: blockedFacilities.length === 0,
      facilityChecks,
      blockedFacilities,
      warnings,
      recommendations,
    };
  }

  /**
   * Get all compatible equipment for a facility type
   */
  getCompatibleEquipment(facilityType: FacilityCapabilityType): EquipmentType[] {
    const compatible: EquipmentType[] = [];
    const facilityRules = EQUIPMENT_FACILITY_MATRIX[facilityType];

    if (!facilityRules) return compatible;

    for (const [equipment, rule] of Object.entries(facilityRules)) {
      if (rule.status === 'COMPATIBLE' || rule.status === 'CONDITIONAL') {
        compatible.push(equipment as EquipmentType);
      }
    }

    return compatible;
  }

  /**
   * Get all compatible facilities for an equipment type
   */
  getCompatibleFacilities(equipmentType: EquipmentType): FacilityCapabilityType[] {
    const compatible: FacilityCapabilityType[] = [];

    for (const [facilityType, equipmentRules] of Object.entries(EQUIPMENT_FACILITY_MATRIX)) {
      const rule = equipmentRules[equipmentType];
      if (rule && (rule.status === 'COMPATIBLE' || rule.status === 'CONDITIONAL')) {
        compatible.push(facilityType as FacilityCapabilityType);
      }
    }

    return compatible;
  }

  /**
   * Get the full matrix for display purposes
   */
  getFullMatrix(): {
    facilities: Array<{ type: FacilityCapabilityType; label: { en: string; ar: string } }>;
    equipment: Array<{ type: EquipmentType; label: { en: string; ar: string } }>;
    matrix: Array<{
      facility: FacilityCapabilityType;
      compatibility: Array<{
        equipment: EquipmentType;
        status: CompatibilityStatus;
        condition?: string;
      }>;
    }>;
  } {
    const facilities = Object.keys(FACILITY_LABELS).map((type) => ({
      type: type as FacilityCapabilityType,
      label: FACILITY_LABELS[type as FacilityCapabilityType],
    }));

    const equipment = Object.keys(EQUIPMENT_LABELS).map((type) => ({
      type: type as EquipmentType,
      label: EQUIPMENT_LABELS[type as EquipmentType],
    }));

    const matrix = facilities.map((f) => ({
      facility: f.type,
      compatibility: equipment.map((e) => {
        const rule = EQUIPMENT_FACILITY_MATRIX[f.type]?.[e.type];
        return {
          equipment: e.type,
          status: rule?.status || 'INCOMPATIBLE',
          condition: rule?.condition,
        };
      }),
    }));

    return { facilities, equipment, matrix };
  }
}

// Export singleton instance
export const equipmentFacilityMatcher = new EquipmentFacilityMatcher();

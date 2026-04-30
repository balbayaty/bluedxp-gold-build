/**
 * Fire Safety Service
 * Comprehensive fire suppression system management and compliance
 * BlueDXP Platform - 4IR & 5IR Aligned • Integration-First
 */

import { eventBus } from "@/lib/services/event-store";
import type { FireSuppressionSystemType } from "@/types/warehouseLocation";

/**
 * Fire Suppression System Specifications
 */
export interface FireSuppressionSystemSpec {
  type: FireSuppressionSystemType;
  description: string;
  suitableFor: string[]; // Hazard classes
  coverageArea: number; // Square meters
  activationType: "Automatic" | "Manual" | "Both";
  agent: string; // e.g., FM-200, CO2, Foam
  environmentalImpact: "Low" | "Medium" | "High";
  maintenanceFrequency: "Monthly" | "Quarterly" | "Annually";
  certificationStandards: string[]; // NFPA, ISO, etc.
}

/**
 * Fire Safety Compliance Check
 */
export interface FireSafetyCompliance {
  locationId: string;
  systemType: FireSuppressionSystemType;
  compliant: boolean;
  complianceScore: number; // 0-100
  issues: string[];
  recommendations: string[];
  lastInspection?: string;
  nextInspection?: string;
  certifications: string[];
}

/**
 * Fire Safety Service Interface
 */
export interface FireSafetyService {
  // System Management
  getSystemSpecs(
    systemType: FireSuppressionSystemType,
  ): FireSuppressionSystemSpec | null;
  getAllSystemSpecs(): FireSuppressionSystemSpec[];
  getRecommendedSystem(
    hazardClasses: string[],
    areaSize: number,
  ): FireSuppressionSystemType[];

  // Compliance
  checkCompliance(
    locationId: string,
    systemType: FireSuppressionSystemType,
    hazardClasses: string[],
  ): Promise<FireSafetyCompliance>;
  validateSystemForHazards(
    systemType: FireSuppressionSystemType,
    hazardClasses: string[],
  ): boolean;

  // IoT Integration (4IR)
  monitorFireSystem(systemId: string): Promise<FireSystemStatus>;
  getFireSystemAlerts(locationId: string): Promise<FireSystemAlert[]>;
}

export interface FireSystemStatus {
  systemId: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "ALARM";
  pressure?: number;
  temperature?: number;
  lastTest?: string;
  nextMaintenance?: string;
}

export interface FireSystemAlert {
  id: string;
  locationId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  type:
    | "PRESSURE_LOW"
    | "TEMPERATURE_HIGH"
    | "SYSTEM_FAULT"
    | "MAINTENANCE_DUE";
  message: string;
  timestamp: string;
}

// ============================================================================
// FIRE SUPPRESSION SYSTEM SPECIFICATIONS
// ============================================================================

const FIRE_SUPPRESSION_SPECS: FireSuppressionSystemSpec[] = [
  {
    type: "Sprinkler System with FM-200",
    description: "Wet pipe sprinkler system with FM-200 gas suppression backup",
    suitableFor: [
      "Class 3",
      "Class 4.1",
      "Class 4.2",
      "Class 5.1",
      "Class 8",
      "Class 9",
    ],
    coverageArea: 5000,
    activationType: "Automatic",
    agent: "FM-200",
    environmentalImpact: "Low",
    maintenanceFrequency: "Quarterly",
    certificationStandards: ["NFPA 2001", "ISO 14520"],
  },
  {
    type: "CO2 System",
    description: "Carbon dioxide fire suppression system",
    suitableFor: ["Class 3", "Class 4.1", "Class 5.1", "Class 8"],
    coverageArea: 3000,
    activationType: "Both",
    agent: "CO2",
    environmentalImpact: "Medium",
    maintenanceFrequency: "Quarterly",
    certificationStandards: ["NFPA 12"],
  },
  {
    type: "Foam System",
    description: "Aqueous film-forming foam (AFFF) system",
    suitableFor: ["Class 3", "Class 4.1", "Class 4.2"],
    coverageArea: 4000,
    activationType: "Automatic",
    agent: "AFFF",
    environmentalImpact: "Medium",
    maintenanceFrequency: "Quarterly",
    certificationStandards: ["NFPA 11", "NFPA 16"],
  },
  {
    type: "Dry Chemical System",
    description: "Dry chemical powder suppression system",
    suitableFor: ["Class 3", "Class 4.1", "Class 5.1", "Class 8"],
    coverageArea: 2000,
    activationType: "Both",
    agent: "ABC Powder",
    environmentalImpact: "High",
    maintenanceFrequency: "Monthly",
    certificationStandards: ["NFPA 17"],
  },
  {
    type: "Water Sprinkler System",
    description: "Standard wet pipe water sprinkler system",
    suitableFor: ["Class 3", "Class 4.1", "Class 8", "Class 9"],
    coverageArea: 10000,
    activationType: "Automatic",
    agent: "Water",
    environmentalImpact: "Low",
    maintenanceFrequency: "Quarterly",
    certificationStandards: ["NFPA 13", "NFPA 25"],
  },
  {
    type: "Gas Suppression (FM-200)",
    description: "Clean agent FM-200 gas suppression system",
    suitableFor: ["Class 3", "Class 4.1", "Class 5.1", "Class 8", "Class 9"],
    coverageArea: 2000,
    activationType: "Automatic",
    agent: "FM-200",
    environmentalImpact: "Low",
    maintenanceFrequency: "Quarterly",
    certificationStandards: ["NFPA 2001", "ISO 14520"],
  },
  {
    type: "Gas Suppression (Novec 1230)",
    description: "Clean agent Novec 1230 gas suppression system",
    suitableFor: ["Class 3", "Class 4.1", "Class 5.1", "Class 8", "Class 9"],
    coverageArea: 2000,
    activationType: "Automatic",
    agent: "Novec 1230",
    environmentalImpact: "Low",
    maintenanceFrequency: "Quarterly",
    certificationStandards: ["NFPA 2001", "ISO 14520"],
  },
  {
    type: "Inert Gas System (IG-541)",
    description: "Inert gas (nitrogen, argon, CO2) suppression system",
    suitableFor: ["Class 3", "Class 4.1", "Class 5.1", "Class 8", "Class 9"],
    coverageArea: 3000,
    activationType: "Automatic",
    agent: "IG-541",
    environmentalImpact: "Low",
    maintenanceFrequency: "Quarterly",
    certificationStandards: ["NFPA 2001"],
  },
  {
    type: "Pre-Action Sprinkler System",
    description: "Pre-action sprinkler system with double interlock",
    suitableFor: ["Class 3", "Class 4.1", "Class 8", "Class 9"],
    coverageArea: 5000,
    activationType: "Automatic",
    agent: "Water",
    environmentalImpact: "Low",
    maintenanceFrequency: "Quarterly",
    certificationStandards: ["NFPA 13"],
  },
  {
    type: "Deluge System",
    description: "Open-head deluge sprinkler system",
    suitableFor: ["Class 3", "Class 4.1", "Class 4.2"],
    coverageArea: 8000,
    activationType: "Automatic",
    agent: "Water",
    environmentalImpact: "Low",
    maintenanceFrequency: "Quarterly",
    certificationStandards: ["NFPA 13"],
  },
  {
    type: "Foam-Water Sprinkler System",
    description: "Combined foam and water sprinkler system",
    suitableFor: ["Class 3", "Class 4.1", "Class 4.2"],
    coverageArea: 6000,
    activationType: "Automatic",
    agent: "Foam/Water",
    environmentalImpact: "Medium",
    maintenanceFrequency: "Quarterly",
    certificationStandards: ["NFPA 16"],
  },
  {
    type: "Multiple Systems (Combined)",
    description: "Multiple fire suppression systems combined",
    suitableFor: [
      "Class 1",
      "Class 2.1",
      "Class 2.2",
      "Class 2.3",
      "Class 3",
      "Class 4.1",
      "Class 4.2",
      "Class 4.3",
      "Class 5.1",
      "Class 5.2",
      "Class 6.1",
      "Class 6.2",
      "Class 7",
      "Class 8",
      "Class 9",
    ],
    coverageArea: 10000,
    activationType: "Both",
    agent: "Multiple",
    environmentalImpact: "Medium",
    maintenanceFrequency: "Monthly",
    certificationStandards: ["NFPA Multiple"],
  },
];

// ============================================================================
// FIRE SAFETY SERVICE IMPLEMENTATION
// ============================================================================

class FireSafetyServiceImpl implements FireSafetyService {
  getSystemSpecs(
    systemType: FireSuppressionSystemType,
  ): FireSuppressionSystemSpec | null {
    return (
      FIRE_SUPPRESSION_SPECS.find((spec) => spec.type === systemType) || null
    );
  }

  getAllSystemSpecs(): FireSuppressionSystemSpec[] {
    return FIRE_SUPPRESSION_SPECS;
  }

  getRecommendedSystem(
    hazardClasses: string[],
    areaSize: number,
  ): FireSuppressionSystemType[] {
    const recommendations: FireSuppressionSystemType[] = [];

    for (const spec of FIRE_SUPPRESSION_SPECS) {
      const isSuitable = hazardClasses.some((hc) =>
        spec.suitableFor.includes(hc),
      );
      const canCover = spec.coverageArea >= areaSize;

      if (isSuitable && canCover) {
        recommendations.push(spec.type);
      }
    }

    // If no single system covers all, recommend multiple systems
    if (recommendations.length === 0) {
      recommendations.push("Multiple Systems (Combined)");
    }

    return recommendations;
  }

  async checkCompliance(
    locationId: string,
    systemType: FireSuppressionSystemType,
    hazardClasses: string[],
  ): Promise<FireSafetyCompliance> {
    const spec = this.getSystemSpecs(systemType);
    if (!spec) {
      return {
        locationId,
        systemType,
        compliant: false,
        complianceScore: 0,
        issues: ["Unknown fire suppression system type"],
        recommendations: ["Select a valid fire suppression system"],
        certifications: [],
      };
    }

    const isCompatible = this.validateSystemForHazards(
      systemType,
      hazardClasses,
    );
    const issues: string[] = [];
    const recommendations: string[] = [];
    let complianceScore = 100;

    // Check hazard compatibility
    if (!isCompatible) {
      issues.push(
        "Fire suppression system may not be suitable for all stored hazard classes",
      );
      recommendations.push(
        "Consider upgrading to Multiple Systems (Combined) or add supplementary systems",
      );
      complianceScore -= 30;
    }

    // Check coverage (would need location area data)
    // This is a placeholder - in production, fetch location area
    recommendations.push(
      "Verify system coverage matches location area requirements",
    );

    // Check certifications
    const certifications = spec.certificationStandards;

    return {
      locationId,
      systemType,
      compliant: complianceScore >= 70 && isCompatible,
      complianceScore,
      issues,
      recommendations,
      certifications,
    };
  }

  validateSystemForHazards(
    systemType: FireSuppressionSystemType,
    hazardClasses: string[],
  ): boolean {
    if (systemType === "None") {
      return false;
    }

    if (systemType === "Multiple Systems (Combined)") {
      return true; // Multiple systems can handle all hazard classes
    }

    const spec = this.getSystemSpecs(systemType);
    if (!spec) {
      return false;
    }

    // Check if all hazard classes are in the suitable list
    return hazardClasses.every((hc) => spec.suitableFor.includes(hc));
  }

  async monitorFireSystem(systemId: string): Promise<FireSystemStatus> {
    // Placeholder for IoT integration
    // In production, this would connect to actual fire system sensors
    return {
      systemId,
      status: "ACTIVE",
      pressure: 150, // PSI
      temperature: 20, // Celsius
      lastTest: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      nextMaintenance: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 30 days from now
    };
  }

  async getFireSystemAlerts(locationId: string): Promise<FireSystemAlert[]> {
    // Placeholder for IoT integration
    // In production, this would fetch real-time alerts from fire system sensors
    return [];
  }
}

// ============================================================================
// EXPORT SERVICE INSTANCE
// ============================================================================

export const fireSafetyService = new FireSafetyServiceImpl();
export default fireSafetyService;

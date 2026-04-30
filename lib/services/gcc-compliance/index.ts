/**
 * GCC Compliance Intelligence Framework
 *
 * Complete implementation of the GCC Compliance Intelligence Framework
 * for Saudi Arabia and GCC transport compliance.
 *
 * Features:
 * - Equipment-Facility Compatibility Matrix
 * - GCC Regulation Database (Truck Bans, Backload Rules)
 * - Backload Compliance Validator (TGA Oct 2024)
 * - Pre-Dispatch Validation Orchestrator (8 steps)
 * - Daleeli Billing & API Usage Tracking
 * - TextLocate-style Driver Location Requests
 * - Bayan QR Code Embedding for E-Waybill
 * - Dynamic Touchpoint Generator
 * - Multi-Source Location Fusion
 *
 * @module gcc-compliance
 */

// ============================================================================
// SERVICE EXPORTS
// ============================================================================

// Equipment-Facility Matrix
export {
  equipmentFacilityMatcher,
  EquipmentFacilityMatcher,
  EQUIPMENT_FACILITY_MATRIX,
  EQUIPMENT_LABELS,
  FACILITY_LABELS,
} from './equipmentFacilityMatrix';

// Regulation Database
export {
  regulationDatabase,
  RegulationDatabaseService,
  TRUCK_BAN_SCHEDULES,
  GCC_BORDER_CROSSINGS,
  GCC_REGULATIONS,
} from './regulationDatabase';

// Backload Validator
export {
  backloadValidator,
  BackloadComplianceValidator,
} from './backloadValidator';

// Pre-Dispatch Validation
export {
  validationOrchestrator,
  PreDispatchValidationOrchestrator,
} from './validationOrchestrator';

// Daleeli Billing
export {
  daleeliBillingService,
  DaleeliBillingService,
} from './daleeliBillingService';

// TextLocate Location Requests
export {
  textLocateService,
  TextLocateService,
} from './textLocateService';

// Bayan QR Embedder
export {
  bayanQRService,
  BayanQRService,
} from './bayanQrEmbedder';

// Touchpoint Generator
export {
  touchpointGenerator,
  DynamicTouchpointGenerator,
} from './touchpointGenerator';

// Location Fusion
export {
  locationFusionService,
  LocationFusionService,
} from './locationFusionService';

// Event Integration
export {
  initializeGCCComplianceEvents,
  GCC_COMPLIANCE_EVENTS,
  startTruckBanMonitoring,
  checkComplianceStatus,
} from './eventIntegration';

// Module Initialization (Main Entry Point)
export {
  initializeGCCCompliance,
  isInitialized as isGCCComplianceInitialized,
  activeShipments as gccActiveShipments,
  isGCCShipment,
} from './initialize';

// Competitive Advantage Service
export {
  competitiveAdvantageService,
} from './competitiveAdvantageService';

// Compliance Certificate Service
export {
  complianceCertificateService,
} from './complianceCertificateService';

// Industry Standards
export { industryStandardsService } from './standards/industryStandards';

// Transportation Integration
export { transportationIntegration } from './integrations/transportationIntegration';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Core Types
  GCCCountry,
  EquipmentType,
  FacilityCapabilityType,
  CompatibilityStatus,
  CargoType,
  ValidationStepStatus,
  TouchpointCode,
  LocationSourceType,

  // Equipment-Facility
  CompatibilityRule,
  EquipmentFacilityMatrix,
  EquipmentMatchRequest,
  EquipmentMatchResult,

  // Truck Bans
  TruckBanRestriction,
  TruckBanException,
  TruckBanSchedule,
  TruckBanCheckRequest,
  TruckBanCheckResult,

  // Backload
  BackloadValidationRequest,
  BackloadValidationResult,

  // Pre-Dispatch Validation
  ValidationStep,
  PreDispatchValidationRequest,
  PreDispatchValidationResult,

  // Daleeli Billing
  DaleeliApiCall,
  DaleeliMonthlyReconciliation,

  // Location
  LocationSource,
  FusedLocation,
  LocationRequestResult,

  // Bayan QR
  BayanQRData,
  BayanQRVerificationResult,

  // Touchpoints
  DynamicTouchpointRequest,
  DynamicTouchpointResult,
  GeneratedTouchpoint,

  // Regulations
  GCCRegulation,
  BorderCrossing,

  // Service Interfaces
  IGCCComplianceService,
  IDaleeliBillingService,
  ILocationIntelligenceService,
  IBayanQRService,
} from '@/types/gcc-compliance';

// ============================================================================
// UNIFIED GCC COMPLIANCE SERVICE
// ============================================================================

import type {
  EquipmentMatchRequest,
  EquipmentMatchResult,
  TruckBanCheckRequest,
  TruckBanCheckResult,
  BackloadValidationRequest,
  BackloadValidationResult,
  PreDispatchValidationRequest,
  PreDispatchValidationResult,
  DynamicTouchpointRequest,
  DynamicTouchpointResult,
  GCCCountry,
  GCCRegulation,
  BorderCrossing,
  TruckBanSchedule,
  IGCCComplianceService,
} from '@/types/gcc-compliance';

import { equipmentFacilityMatcher } from './equipmentFacilityMatrix';
import { regulationDatabase } from './regulationDatabase';
import { backloadValidator } from './backloadValidator';
import { validationOrchestrator } from './validationOrchestrator';
import { touchpointGenerator } from './touchpointGenerator';

/**
 * Unified GCC Compliance Service
 *
 * Provides a single entry point for all GCC compliance operations.
 */
class GCCComplianceService implements IGCCComplianceService {
  /**
   * Check equipment compatibility with facilities
   */
  async checkEquipmentCompatibility(
    request: EquipmentMatchRequest
  ): Promise<EquipmentMatchResult> {
    return equipmentFacilityMatcher.validateEquipmentForJourney(request);
  }

  /**
   * Check truck ban for a city
   */
  async checkTruckBan(request: TruckBanCheckRequest): Promise<TruckBanCheckResult> {
    return regulationDatabase.checkTruckBan(request);
  }

  /**
   * Get truck ban schedule for a city
   */
  getTruckBanSchedule(city: string, country: GCCCountry): TruckBanSchedule | null {
    return regulationDatabase.getTruckBanSchedule(city, country);
  }

  /**
   * Validate backload compliance (TGA Oct 2024)
   */
  async validateBackload(
    request: BackloadValidationRequest
  ): Promise<BackloadValidationResult> {
    return backloadValidator.validateBackload(request);
  }

  /**
   * Run full pre-dispatch validation (8 steps)
   */
  async validatePreDispatch(
    request: PreDispatchValidationRequest
  ): Promise<PreDispatchValidationResult> {
    return validationOrchestrator.validate(request);
  }

  /**
   * Generate touchpoints for a shipment
   */
  async generateTouchpoints(
    request: DynamicTouchpointRequest
  ): Promise<DynamicTouchpointResult> {
    return touchpointGenerator.generateTouchpoints(request);
  }

  /**
   * Get regulations for a country
   */
  getRegulations(
    country: GCCCountry,
    category?: GCCRegulation['category']
  ): GCCRegulation[] {
    return regulationDatabase.getRegulations(country, category);
  }

  /**
   * Get border crossing between two countries
   */
  getBorderCrossing(country1: GCCCountry, country2: GCCCountry): BorderCrossing | null {
    return regulationDatabase.getBorderCrossing(country1, country2);
  }

  /**
   * Get all border crossings for a country
   */
  getBorderCrossingsForCountry(country: GCCCountry): BorderCrossing[] {
    return regulationDatabase.getBorderCrossingsForCountry(country);
  }

  /**
   * Get weight limits for a country
   */
  getWeightLimits(country: GCCCountry): GCCRegulation['limits'] | null {
    return regulationDatabase.getWeightLimits(country);
  }

  /**
   * Quick backload check (for UI validation)
   */
  quickBackloadCheck(
    arrivalLocation: { lat: number; lng: number },
    pickupLocation: { lat: number; lng: number },
    carrierNationality: GCCCountry | 'OTHER'
  ): { likely: boolean; reason: string } {
    return backloadValidator.quickCheck(arrivalLocation, pickupLocation, carrierNationality);
  }

  /**
   * Get compatible equipment for a facility
   */
  getCompatibleEquipment(facilityType: string): string[] {
    return equipmentFacilityMatcher.getCompatibleEquipment(facilityType as any);
  }

  /**
   * Get compatible facilities for equipment
   */
  getCompatibleFacilities(equipmentType: string): string[] {
    return equipmentFacilityMatcher.getCompatibleFacilities(equipmentType as any);
  }
}

// Export singleton
export const gccComplianceService = new GCCComplianceService();

// Default export
export default gccComplianceService;

/**
 * GCC Compliance Intelligence Framework Types
 *
 * Comprehensive types for Saudi Arabia and GCC transport compliance
 * Includes: Bayan, Daleel, WASL, Truck Bans, Backload Rules, Equipment Matrix
 *
 * TGA October 2024 Aligned • 4IR & 5IR Ready
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

export type GCCCountry = 'SA' | 'AE' | 'KW' | 'QA' | 'BH' | 'OM';

export type EquipmentType =
  | 'FLATBED'       // سطحة
  | 'BOX_DRY_VAN'   // صندوق
  | 'REEFER'        // مبرد
  | 'CURTAIN_SIDE'  // ستارة
  | 'CONTAINER'     // حاوية
  | 'LOWBED'        // لوبد
  | 'TANKER';       // صهريج

export type FacilityCapabilityType =
  | 'OPEN_YARD'
  | 'DOCK_WAREHOUSE'
  | 'RAMP_WAREHOUSE'
  | 'CONTAINER_TERMINAL'
  | 'CROSS_DOCK'
  | 'RAIL_YARD'
  | 'BORDER_CHECKPOINT'
  | 'TANKER_TERMINAL';

export type CompatibilityStatus =
  | 'COMPATIBLE'     // ✓
  | 'INCOMPATIBLE'   // ✗
  | 'CONDITIONAL';   // ⚠️ requires specific equipment/permits

export type CargoType =
  | 'GENERAL'
  | 'PERISHABLE'   // SFDA required
  | 'HAZMAT'       // Special permits
  | 'OVERSIZED';   // Special permits

export type ValidationStepStatus =
  | 'PASSED'
  | 'FAILED'
  | 'WARNING'
  | 'PENDING'
  | 'SKIPPED';

export type TouchpointCode =
  | 'POL'        // Port of Loading
  | 'BPC_EXIT'   // Border Point Control - Exit
  | 'BPC_ENTRY'  // Border Point Control - Entry
  | 'INSP'       // Inspection Point
  | 'XDK'        // Cross-dock
  | 'HOLD'       // Truck Ban Hold Area
  | 'POD'        // Port of Discharge
  | 'SFDA'       // Food/Drug Authority
  | 'HAZ'        // HAZMAT Checkpoint
  | 'CUST'       // Customs
  | 'WEIGH'      // Weighbridge
  | 'REST';      // Rest Stop / Driver Break

// ============================================================================
// EQUIPMENT-FACILITY COMPATIBILITY
// ============================================================================

export interface CompatibilityRule {
  status: CompatibilityStatus;
  condition?: string;
  permits?: string[];
  equipmentRequired?: string[];
  notes?: string;
}

export interface EquipmentFacilityMatrix {
  [facilityType: string]: {
    [equipmentType: string]: CompatibilityRule;
  };
}

export interface EquipmentMatchRequest {
  equipmentType: EquipmentType;
  facilities: Array<{
    facilityId: string;
    facilityType: FacilityCapabilityType;
    name: string;
    capabilities?: string[];
    location: { lat: number; lng: number };
  }>;
  cargo?: {
    isHazmat: boolean;
    requiresRefrigeration: boolean;
    weight: number;
    specialHandling?: string[];
  };
}

export interface EquipmentMatchResult {
  isCompatible: boolean;
  facilityChecks: Array<{
    facilityId: string;
    facilityName: string;
    facilityType: FacilityCapabilityType;
    status: CompatibilityStatus;
    issues: string[];
    requiredEquipment: string[];
    missingEquipment: string[];
    canProceed: boolean;
  }>;
  blockedFacilities: string[];
  warnings: string[];
  recommendations: string[];
}

// ============================================================================
// TRUCK BAN SCHEDULES
// ============================================================================

export interface TruckBanRestriction {
  id: string;
  name: string;
  days: Array<'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT'>;
  normalHours: {
    bannedFrom: string; // HH:mm
    bannedTo: string;
  };
  ramadanHours?: {
    bannedFrom: string;
    bannedTo: string;
  };
  zones: string[];
}

export interface TruckBanException {
  type: 'E_APPOINTMENT' | 'INDUSTRIAL_ZONE' | 'SPECIAL_PERMIT' | 'RTA_PERMIT';
  description: string;
  portalUrl?: string;
  requiresBooking: boolean;
}

export interface TruckBanSchedule {
  city: string;
  country: GCCCountry;
  timezone: string;
  restrictions: TruckBanRestriction[];
  exceptions: TruckBanException[];
  specialNotes?: string[];
  geofenceIds?: string[];
  industrialZoneGeofences?: string[];
}

export interface TruckBanCheckRequest {
  city: string;
  country: GCCCountry;
  plannedArrival: Date;
  vehicleType: EquipmentType;
  hasEAppointment?: boolean;
  isIndustrialZone?: boolean;
  permitNumber?: string;
}

export interface TruckBanCheckResult {
  canEnter: boolean;
  currentlyBanned: boolean;
  nextAllowedEntry?: Date;
  waitTimeHours?: number;
  activeRestriction?: TruckBanRestriction;
  availableExceptions: TruckBanException[];
  recommendedAction: string;
  holdAreaGeofenceId?: string;
}

// ============================================================================
// BACKLOAD COMPLIANCE (TGA October 2024)
// ============================================================================

export interface BackloadValidationRequest {
  carrierId: string;
  carrierNationality: GCCCountry | 'OTHER';
  plateNumber: string;
  plateType: string;
  
  originalTrip: {
    bayanNumber: string;
    arrivalCity: string;
    arrivalLocation: { lat: number; lng: number };
    arrivalDate: Date;
  };
  
  proposedBackload: {
    pickupLocation: { lat: number; lng: number };
    pickupCity: string;
    destinationCity: string;
    destinationCountry: GCCCountry;
  };
}

export interface BackloadValidationResult {
  isLegal: boolean;
  distanceFromArrival: number;
  distanceFromReturnRoute: number;
  maxAllowedDistance: number;
  isOnReturnRoute: boolean;
  returnRoutePoints: Array<{ lat: number; lng: number; city: string }>;
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'REQUIRES_REVIEW';
  violations: string[];
  warnings: string[];
  
  calculationDetails: {
    haversineDistance: number;
    routeDistance: number;
    directReturnRoute: any;
    pickupDeviationAngle: number;
  };
  
  regulationReference: {
    authority: string;
    circularNumber: string;
    effectiveDate: Date;
    description: string;
  };
}

// ============================================================================
// PRE-DISPATCH VALIDATION
// ============================================================================

export interface ValidationStep {
  step: number;
  name: string;
  description: string;
  status: ValidationStepStatus;
  details: string;
  blocksDispatch: boolean;
  executionTimeMs: number;
  recommendations?: string[];
  evidence?: {
    type: string;
    data: any;
    timestamp: Date;
  };
}

export interface PreDispatchValidationRequest {
  shipmentId: string;
  tenantId: string;
  
  carrier: {
    id: string;
    name: string;
    nationality: GCCCountry | 'OTHER';
    crNumber: string;
    waslRegistered: boolean;
    insuranceValid: boolean;
    insuranceExpiry?: Date;
    licensedRoutes: string[];
  };
  
  equipment: {
    type: EquipmentType;
    plateNumber: string;
    plateType: string;
    sequenceNumber?: string;
  };
  
  cargo: {
    type: CargoType;
    weight: number;
    dimensions: { length: number; width: number; height: number };
    value: number;
    sfdaRequired?: boolean;
    hazmatClass?: string;
    hazmatUnNumber?: string;
  };
  
  route: {
    origin: {
      facilityId: string;
      city: string;
      country: GCCCountry;
      coordinates: { lat: number; lng: number };
      facilityType: FacilityCapabilityType;
    };
    destination: {
      facilityId: string;
      city: string;
      country: GCCCountry;
      coordinates: { lat: number; lng: number };
      facilityType: FacilityCapabilityType;
    };
    plannedDeparture: Date;
    plannedArrival: Date;
    intermediateFacilities: Array<{
      facilityId: string;
      facilityType: FacilityCapabilityType;
      city: string;
      country: GCCCountry;
      coordinates: { lat: number; lng: number };
    }>;
  };
  
  documents: {
    bayanEtd?: {
      number: string;
      valid: boolean;
      expiryDate: Date;
      status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    };
    customsManifest?: boolean;
    permits: Array<{
      type: string;
      number: string;
      expiryDate: Date;
      isValid: boolean;
    }>;
  };
  
  backloadInfo?: {
    originalBayanNumber: string;
    arrivalCity: string;
    arrivalDate: Date;
    arrivalLocation: { lat: number; lng: number };
  };
}

export interface PreDispatchValidationResult {
  canDispatch: boolean;
  validationId: string;
  steps: ValidationStep[];
  passedSteps: number;
  failedSteps: number;
  warnings: number;
  blockingIssues: string[];
  validationTime: Date;
  validityPeriod: number;
  totalExecutionTimeMs: number;
  
  summary: {
    carrierEligible: boolean;
    backloadLegal: boolean;
    equipmentCompatible: boolean;
    weightDimensionsOk: boolean;
    truckBanClear: boolean;
    documentsComplete: boolean;
    permitsValid: boolean;
    borderRequirementsMet: boolean;
  };
}

// ============================================================================
// DALEELI API BILLING
// ============================================================================

export interface DaleeliApiCall {
  id: string;
  timestamp: Date;
  endpoint: 'LOCATION_BY_SEQUENCE' | 'LOCATION_BY_PLATE' | 'VEHICLE_STATUS' | 'TRIP_HISTORY';
  requestPayload: {
    sequenceNumber?: string;
    plateNumber?: string;
    plateType?: string;
    fromDate?: Date;
    toDate?: Date;
  };
  success: boolean;
  responseCode: string;
  responseTime: number;
  dataPointsReturned: number;
  billable: boolean;
  creditCost: number;
  shipmentId?: string;
  bayanNumber?: string;
  tenantId: string;
}

export interface DaleeliMonthlyReconciliation {
  tenantId: string;
  period: { year: number; month: number };
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalDataPoints: number;
  totalCreditsUsed: number;
  estimatedCost: number;
  currency: 'SAR';
  
  byShipment: Array<{
    shipmentId: string;
    bayanNumber: string;
    calls: number;
    dataPoints: number;
    credits: number;
  }>;
  
  byDay: Array<{
    date: string;
    calls: number;
    credits: number;
  }>;
  
  byEndpoint: Array<{
    endpoint: DaleeliApiCall['endpoint'];
    calls: number;
    credits: number;
  }>;
}

// ============================================================================
// LOCATION INTELLIGENCE
// ============================================================================

export type LocationSourceType =
  | 'DALEEL'
  | 'WHATSAPP_TEXTLOCATE'
  | 'TELEGRAM'
  | 'DRIVER_APP'
  | 'IOT_SENSOR'
  | 'MANUAL';

export interface LocationSource {
  source: LocationSourceType;
  coordinates: { lat: number; lng: number };
  accuracy?: number;
  timestamp: Date;
  trustLevel: number;
  rawData?: any;
}

export interface FusedLocation {
  coordinates: { lat: number; lng: number };
  accuracy: number;
  confidence: number;
  timestamp: Date;
  
  sources: Array<LocationSource & {
    deviation: number;
    weight: number;
  }>;
  
  deviation: {
    maxDeviation: number;
    averageDeviation: number;
    anomalyDetected: boolean;
    possibleCauses: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  
  daleeliData?: {
    sequenceNumber: string;
    vehicleStatus: 'MOVING' | 'STOPPED' | 'IDLE';
    velocity: number;
    weight: number;
  };
}

export interface LocationRequestResult {
  requestId: string;
  sentAt: Date;
  channel: 'WHATSAPP' | 'TELEGRAM' | 'SMS';
  phoneNumber: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'RESPONDED' | 'EXPIRED' | 'FAILED';
  trackingUrl: string;
  expiresAt: Date;
  response?: {
    receivedAt: Date;
    coordinates: { lat: number; lng: number };
    accuracy: number;
    deviceInfo?: string;
  };
}

// ============================================================================
// BAYAN QR CODE
// ============================================================================

export interface BayanQRData {
  etwId: string;
  etwNumber: string;
  bayanNumber: string;
  bayanStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  bayanCreatedDate: Date;
  
  origin: { city: string; country: GCCCountry };
  destination: { city: string; country: GCCCountry };
  
  carrierCR: string;
  carrierName: string;
  
  plateNumber: string;
  plateType: string;
  sequenceNumber: string;
  
  driverName: string;
  driverIdNumber: string;
  
  cargoDescription: string;
  totalWeight: number;
  numberOfPackages: number;
  
  verificationUrl: string;
  digitalSignature: string;
  
  issuedAt: Date;
  validUntil: Date;
}

export interface BayanQRVerificationResult {
  valid: boolean;
  data?: BayanQRData;
  errors?: string[];
  realTimeStatus?: {
    bayanActive: boolean;
    vehicleLocation?: { lat: number; lng: number };
    lastLocationTime?: Date;
    currentStatus?: string;
  };
  verifiedAt: Date;
  verifiedBy?: string;
}

// ============================================================================
// DYNAMIC TOUCHPOINT
// ============================================================================

export interface DynamicTouchpointRequest {
  shipmentId: string;
  origin: {
    city: string;
    country: GCCCountry;
    facilityId: string;
    facilityType: FacilityCapabilityType;
    coordinates: { lat: number; lng: number };
  };
  destination: {
    city: string;
    country: GCCCountry;
    facilityId: string;
    facilityType: FacilityCapabilityType;
    coordinates: { lat: number; lng: number };
  };
  equipmentType: EquipmentType;
  carrierNationality: GCCCountry | 'OTHER';
  cargoType: CargoType;
  requiresCrossDock: boolean;
  plannedDeparture: Date;
  hasBackloadRestriction?: boolean;
}

export interface GeneratedTouchpoint {
  code: TouchpointCode;
  name: string;
  description: string;
  location: {
    city: string;
    country: GCCCountry;
    coordinates: { lat: number; lng: number };
    geofenceId?: string;
  };
  sequence: number;
  estimatedArrival: Date;
  estimatedDeparture: Date;
  dwellTime: number;
  
  requiredActions: string[];
  requiredDocuments: string[];
  
  geofenceConfig: {
    radius: number;
    entryTrigger: boolean;
    exitTrigger: boolean;
    dwellAlert: boolean;
    dwellThreshold: number;
  };
  
  alerts: Array<{
    type: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
  }>;
}

export interface DynamicTouchpointResult {
  shipmentId: string;
  touchpoints: GeneratedTouchpoint[];
  totalTouchpoints: number;
  isCrossBorder: boolean;
  estimatedTransitTime: number;
  warnings: string[];
  backloadWarning?: string;
}

// ============================================================================
// GCC REGULATION
// ============================================================================

export interface GCCRegulation {
  id: string;
  country: GCCCountry;
  category: 'TRUCK_BAN' | 'WEIGHT_LIMIT' | 'CABOTAGE' | 'BACKLOAD' | 'PERMIT' | 'DOCUMENT' | 'BORDER';
  name: string;
  description: string;
  effectiveDate: Date;
  expiryDate?: Date;
  authority: string;
  referenceNumber?: string;
  
  backloadRestriction?: {
    foreignCarriersOnly: boolean;
    allowedPickupRadius: number;
    requiresReturnRouteProof: boolean;
  };
  
  limits?: {
    maxGrossWeight: number;
    maxAxleLoad: number;
    maxHeight: number;
    maxLength: number;
    maxWidth: number;
    oversizedPermitRequired: boolean;
  };
  
  documentRequirements?: string[];
  permitRequirements?: string[];
}

// ============================================================================
// BORDER CROSSING
// ============================================================================

export interface BorderCrossing {
  id: string;
  name: string;
  nameArabic: string;
  country1: GCCCountry;
  country2: GCCCountry;
  coordinates: { lat: number; lng: number };
  type: 'LAND' | 'SEA' | 'AIR';
  
  operatingHours: {
    days: string[];
    openTime: string;
    closeTime: string;
    is24Hours: boolean;
  };
  
  facilities: string[];
  averageProcessingTime: number;
  
  requirements: {
    documentsRequired: string[];
    feesApplicable: Array<{
      type: string;
      amount: number;
      currency: string;
      refundable: boolean;
    }>;
    inspectionRequired: boolean;
  };
  
  geofenceId?: string;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface IGCCComplianceService {
  // Equipment-Facility
  checkEquipmentCompatibility(request: EquipmentMatchRequest): Promise<EquipmentMatchResult>;
  
  // Truck Bans
  checkTruckBan(request: TruckBanCheckRequest): Promise<TruckBanCheckResult>;
  getTruckBanSchedule(city: string, country: GCCCountry): TruckBanSchedule | null;
  
  // Backload
  validateBackload(request: BackloadValidationRequest): Promise<BackloadValidationResult>;
  
  // Pre-Dispatch
  validatePreDispatch(request: PreDispatchValidationRequest): Promise<PreDispatchValidationResult>;
  
  // Touchpoints
  generateTouchpoints(request: DynamicTouchpointRequest): Promise<DynamicTouchpointResult>;
  
  // Regulations
  getRegulations(country: GCCCountry, category?: GCCRegulation['category']): GCCRegulation[];
  getBorderCrossing(country1: GCCCountry, country2: GCCCountry): BorderCrossing | null;
}

export interface IDaleeliBillingService {
  logApiCall(call: Omit<DaleeliApiCall, 'id'>): Promise<DaleeliApiCall>;
  getMonthlyReconciliation(tenantId: string, year: number, month: number): Promise<DaleeliMonthlyReconciliation>;
  getShipmentUsage(shipmentId: string): Promise<DaleeliApiCall[]>;
}

export interface ILocationIntelligenceService {
  requestDriverLocation(params: {
    driverId: string;
    phoneNumber: string;
    channel: 'WHATSAPP' | 'TELEGRAM';
    customMessage?: string;
    shipmentId?: string;
  }): Promise<LocationRequestResult>;
  
  fuseLocations(shipmentId: string, sources: LocationSource[]): Promise<FusedLocation>;
  detectAnomaly(current: FusedLocation, history: FusedLocation[]): Promise<{
    isAnomaly: boolean;
    riskLevel: string;
    reasons: string[];
  }>;
}

export interface IBayanQRService {
  generateBayanEtwQR(data: BayanQRData): Promise<{
    qrCodeBase64: string;
    qrCodeUrl: string;
    verificationUrl: string;
  }>;
  
  verifyBayanEtwQR(qrPayload: string): Promise<BayanQRVerificationResult>;
}

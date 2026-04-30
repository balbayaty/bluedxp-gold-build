/**
 * Unified Facility Registry Types
 * 
 * Platform-level facility entity that serves as single source of truth
 * for all modules: Geofence, Touchpoints, Route Analysis, WMS, Compliance
 * 
 * COMPREHENSIVE: Government Divisions with Independent Operating Hours
 * FLEXIBLE: Supports any division type
 * SCALABLE: Multiple divisions per facility
 * INTERCONNECTED: Auto-syncs to all modules
 * 
 * @module unified-facility
 */

import type { CountryCode, GeoCoordinates, TransportMode } from './customs'
import type { ZoneType } from './geofence'
import type { TouchpointType, BorderType, TouchpointStatus, CongestionLevel } from './touchpoint'
import type { DocumentRequirement } from './customs'

// ============================================================================
// GOVERNMENT DIVISION TYPES - Industry Standard Terminology
// ============================================================================

/**
 * Government Division Types - Based on route analysis module terminology
 * Each division has INDEPENDENT operating hours
 */
export type GovernmentDivisionType =
  // Border Control & Immigration
  | 'BORDER_CONTROL'           // Border Control Authority (entry/exit control)
  | 'IMMIGRATION'              // Immigration Services (passport/visa control)
  | 'PASSPORT_CONTROL'         // Passport verification
  | 'VISA_CONTROL'             // Visa processing
  
  // Customs & Trade
  | 'CUSTOMS'                  // Customs Authority (ZATCA, etc.)
  | 'CUSTOMS_CLEARANCE'        // Customs clearance processing
  | 'CUSTOMS_INSPECTION'       // Physical customs inspection
  | 'CUSTOMS_DOCUMENTATION'    // Customs documentation office
  | 'TRADE_COMPLIANCE'         // Trade compliance verification
  
  // Security
  | 'SECURITY'                 // Security checkpoint
  | 'SECURITY_SCREENING'       // Security screening (X-ray, etc.)
  | 'POLICE'                   // Police checkpoint
  | 'MILITARY'                 // Military checkpoint
  
  // Health & Medical
  | 'HEALTH'                   // Health Authority
  | 'PUBLIC_HEALTH'            // Public Health Authority
  | 'QUARANTINE'               // Quarantine services
  | 'MEDICAL_INSPECTION'       // Medical inspection
  | 'VACCINATION'              // Vaccination checkpoint
  
  // Food & Drug
  | 'FOOD_DRUG'                // Food & Drug Authority (SFDA, FDA, etc.)
  | 'FOOD_SAFETY'              // Food safety inspection
  | 'DRUG_CONTROL'             // Drug control authority
  | 'PHARMACEUTICAL'           // Pharmaceutical inspection
  
  // Agriculture & Livestock
  | 'AGRICULTURE'              // Agriculture Authority
  | 'PLANT_QUARANTINE'         // Plant quarantine (phytosanitary)
  | 'VETERINARY'               // Veterinary services
  | 'LIVESTOCK'                // Livestock inspection
  | 'PHYTOSANITARY'            // Phytosanitary inspection
  
  // Environmental
  | 'ENVIRONMENTAL'             // Environmental Protection Agency
  | 'ENVIRONMENTAL_INSPECTION' // Environmental inspection
  | 'WASTE_MANAGEMENT'         // Waste management authority
  | 'POLLUTION_CONTROL'        // Pollution control
  
  // Standards & Quality
  | 'STANDARDS'                // Standards Authority (SASO, etc.)
  | 'QUALITY_CONTROL'          // Quality control inspection
  | 'METROLOGY'                // Metrology/weights & measures
  | 'CONFORMITY_ASSESSMENT'    // Conformity assessment
  
  // Transport & Logistics
  | 'TRANSPORT'                // Transport Authority (TGA, etc.)
  | 'TRANSPORT_LICENSING'      // Transport licensing
  | 'VEHICLE_INSPECTION'       // Vehicle inspection
  | 'WEIGH_STATION'            // Weigh station authority
  
  // Other Regulatory
  | 'INDUSTRY'                 // Industry Authority
  | 'COMMERCE'                 // Commerce Authority
  | 'INVESTMENT'               // Investment Authority
  | 'LABOR'                    // Labor Authority
  | 'TAXATION'                 // Tax Authority
  | 'OTHER'                    // Other regulatory body

/**
 * Environmental Agency Types
 */
export type EnvironmentalAgencyType =
  | 'ENVIRONMENTAL_PROTECTION'  // EPA, Environmental Protection
  | 'CLIMATE_CHANGE'            // Climate change authority
  | 'AIR_QUALITY'               // Air quality monitoring
  | 'WATER_QUALITY'             // Water quality authority
  | 'WASTE_MANAGEMENT'          // Waste management
  | 'HAZARDOUS_MATERIALS'       // Hazardous materials control
  | 'EMISSIONS_CONTROL'         // Emissions control
  | 'BIODIVERSITY'              // Biodiversity protection
  | 'SUSTAINABILITY'            // Sustainability authority
  | 'OTHER'

// ============================================================================
// CORE FACILITY TYPES
// ============================================================================

export type UnifiedFacilityType =
  // Warehouses & Distribution
  | 'WAREHOUSE'
  | 'DISTRIBUTION_CENTER'
  | 'COLD_STORAGE'
  | 'BONDED_WAREHOUSE'
  | 'STORAGE_YARD'
  
  // Borders & Customs
  | 'BORDER_CROSSING'
  | 'CUSTOMS_OFFICE'
  | 'CUSTOMS_CLEARANCE_FACILITY'
  | 'INSPECTION_FACILITY'
  
  // Ports & Terminals
  | 'SEA_PORT'
  | 'AIRPORT_CARGO'
  | 'DRY_PORT'
  | 'RAILWAY_TERMINAL'
  | 'LOGISTICS_HUB'
  
  // Manufacturing & Production
  | 'MANUFACTURING_PLANT'
  | 'PRODUCTION_FACILITY'
  
  // Regulatory & Government
  | 'REGULATORY_OFFICE'
  | 'GOVERNMENT_OFFICE'
  | 'CHECKPOINT'
  
  // Other
  | 'CUSTOMER_SITE'
  | 'ORIGIN_FACILITY'
  | 'DESTINATION_FACILITY'
  | 'OTHER'

export type FacilityStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'MAINTENANCE'
  | 'CLOSED'
  | 'PLANNED'
  | 'UNDER_CONSTRUCTION'

// ============================================================================
// OPERATING HOURS
// ============================================================================

export interface OperatingHours {
  monday?: TimeRange
  tuesday?: TimeRange
  wednesday?: TimeRange
  thursday?: TimeRange
  friday?: TimeRange
  saturday?: TimeRange
  sunday?: TimeRange
  notes?: string
  timezone: string
  is24Hours?: boolean
  holidays?: Holiday[]
}

export interface TimeRange {
  open: string // HH:mm format
  close: string // HH:mm format
  closed?: boolean
}

export interface Holiday {
  date: string // YYYY-MM-DD
  name: string
  isClosed: boolean
}

export interface PeakHours {
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  start: string // HH:mm
  end: string // HH:mm
  congestionLevel: CongestionLevel
}

// ============================================================================
// GOVERNMENT DIVISION
// ============================================================================

/**
 * Government Division - Each with INDEPENDENT Operating Hours
 * CRITICAL: Each division can have different hours than the facility
 */
export interface GovernmentDivision {
  id: string
  code: string                    // Official code (e.g., "ZATCA-BORDER-001")
  name: string                    // Official name
  nameLocal?: string              // Local language name
  type: GovernmentDivisionType
  environmentalAgencyType?: EnvironmentalAgencyType  // If environmental
  
  // Authority Information
  authority: {
    name: string                  // Full authority name (e.g., "Zakat, Tax and Customs Authority")
    code: string                  // Authority code (e.g., "ZATCA")
    country: CountryCode
    jurisdiction: 'NATIONAL' | 'REGIONAL' | 'LOCAL' | 'INTERNATIONAL'
    website?: string
  }
  
  // Location at Border/Facility
  location: {
    facilityId: string            // Link to unified facility
    coordinates?: GeoCoordinates  // Specific location within facility
    building?: string             // Building name/number
    floor?: string                // Floor number
    office?: string               // Office number/name
    checkpoint?: string           // Checkpoint number/name
    lane?: string                 // Lane number (for border crossings)
  }
  
  // INDEPENDENT Operating Hours (CRITICAL - Different from facility!)
  operatingHours: OperatingHours  // This division's specific hours
  
  // Processing Times
  processingTimes: {
    average: number               // hours
    min: number                   // hours
    max: number                   // hours
    peakHours?: PeakHours[]       // Peak processing times
    notes?: string
  }
  
  // Services Offered
  services: GovernmentDivisionService[]
  
  // Requirements
  requiredDocuments: DocumentRequirement[]
  requiredCertifications?: string[]
  preferredPrograms?: string[]    // AEO, Golden List, TIR, etc.
  
  // Capacity & Constraints
  capacity?: {
    dailyApplications?: number
    currentQueue?: number
    averageWaitTime?: number      // minutes
    maxWaitTime?: number          // minutes
  }
  
  // Contact Information
  contact: {
    phone?: string
    email?: string
    emergencyPhone?: string
    officeHours?: string
  }
  
  // Status
  status: 'OPERATIONAL' | 'CLOSED' | 'MAINTENANCE' | 'EMERGENCY' | 'HOLIDAY'
  is24Hours?: boolean
  
  // Real-time Data
  realTimeData?: {
    currentQueueLength: number
    estimatedWaitTime: number     // minutes
    activeInspections: number
    lastUpdated: Date
    dataSource: 'API' | 'SENSOR' | 'MANUAL' | 'ESTIMATED'
  }
  
  // Integration
  integrationIds: Record<string, string>  // External system IDs
  apiEndpoint?: string            // API endpoint for real-time updates
  
  // Metadata
  notes?: string
  tags: string[]
  lastUpdated: Date
  createdAt: Date
}

export interface GovernmentDivisionService {
  id: string
  name: string
  description: string
  available: boolean
  processingTime: number          // hours
  requiresAppointment: boolean
  appointmentRequired?: boolean
  fee?: number
  currency?: string
  serviceHours?: OperatingHours   // Service-specific hours (if different)
}

// ============================================================================
// ENVIRONMENTAL AGENCY
// ============================================================================

/**
 * Environmental Agency (Separate from Government Divisions)
 */
export interface EnvironmentalAgency {
  id: string
  code: string
  name: string
  type: EnvironmentalAgencyType
  
  // Authority
  authority: {
    name: string
    code: string
    country: CountryCode
  }
  
  // Location
  location: {
    facilityId: string
    coordinates?: GeoCoordinates
    building?: string
    office?: string
  }
  
  // INDEPENDENT Operating Hours
  operatingHours: OperatingHours
  
  // Services
  services: EnvironmentalService[]
  
  // Requirements
  requiredDocuments: DocumentRequirement[]
  environmentalStandards?: string[]
  
  // Contact
  contact: {
    phone?: string
    email?: string
  }
  
  status: 'OPERATIONAL' | 'CLOSED' | 'MAINTENANCE'
  lastUpdated: Date
}

export interface EnvironmentalService {
  id: string
  name: string
  description: string
  available: boolean
  processingTime: number          // hours
  requiresAppointment: boolean
  fee?: number
  currency?: string
}

// ============================================================================
// BORDER CONTROL COMPONENT
// ============================================================================

/**
 * Border Control Component (Detailed breakdown)
 */
export interface BorderControlComponent {
  id: string
  name: string
  type: 'ENTRY' | 'EXIT' | 'BOTH'
  
  // Components at this border
  components: {
    borderControl?: string    // GovernmentDivision ID
    immigration?: string       // GovernmentDivision ID
    customs?: string          // GovernmentDivision ID
    security?: string         // GovernmentDivision ID
    quarantine?: string       // GovernmentDivision ID
    health?: string           // GovernmentDivision ID
    agriculture?: string     // GovernmentDivision ID
    environmental?: string    // EnvironmentalAgency ID
    standards?: string       // GovernmentDivision ID
    transport?: string       // GovernmentDivision ID
  }
  
  // Processing Sequence (order of checks)
  processingSequence: string[]            // Division IDs in order
  
  // Combined Processing Time
  totalProcessingTime: {
    average: number                       // hours
    min: number
    max: number
  }
}

// ============================================================================
// UNIFIED FACILITY
// ============================================================================

export interface UnifiedFacility {
  // Core Identity
  id: string
  code: string
  name: string
  nameLocal?: string
  alternateNames?: string[]
  type: UnifiedFacilityType
  status: FacilityStatus
  tenantId: string
  
  // Location (for Geofence)
  location: FacilityLocation
  
  // Operating Hours & Constraints (for Route Analysis)
  operatingHours: OperatingHours
  constraints: FacilityConstraint[]
  
  // Capabilities (for Route Analysis & Touchpoints)
  capabilities: FacilityCapability[]
  supportedTransportModes: TransportMode[]
  supportedCommodities?: string[]
  restrictedCommodities?: string[]
  
  // Government Divisions & Regulatory (for Compliance)
  // CRITICAL: Each division has INDEPENDENT operating hours
  regulatoryAuthorities: RegulatoryAuthority[]
  governmentDivisions: GovernmentDivision[]  // Array - each with own hours!
  environmentalAgencies: EnvironmentalAgency[]  // Separate from divisions
  borderControlComponents?: BorderControlComponent[]
  licenses: FacilityLicense[]
  certifications: FacilityCertification[]
  
  // Capacity (for WMS & Route Planning)
  capacity: FacilityCapacity
  
  // Processing Times (for Route Analysis)
  processingTimes: ProcessingTimes
  
  // Contact Information
  contact: FacilityContact
  
  // Module-Specific Extensions
  moduleExtensions: FacilityModuleExtensions
  
  // Performance Metrics
  performance: FacilityPerformance
  
  // Metadata
  tags: string[]
  notes?: string
  metadata?: Record<string, unknown>
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export interface FacilityLocation {
  coordinates: GeoCoordinates
  address: {
    street: string
    city: string
    state?: string
    postalCode?: string
    country: CountryCode
    region?: string
  }
  timezone: string
  geofenceRadius?: number // meters (default: 1000)
  geofenceGeometry?: {
    type: 'CIRCLE' | 'POLYGON'
    coordinates: GeoCoordinates | GeoCoordinates[]
  }
}

export interface FacilityConstraint {
  id: string
  type: 'WEIGHT' | 'DIMENSIONS' | 'VEHICLE_TYPE' | 'COMMODITY' | 'TIME' | 'REGULATORY' | 'OTHER'
  name: string
  description: string
  restrictions: {
    maxWeight?: number // kg
    maxLength?: number // meters
    maxWidth?: number // meters
    maxHeight?: number // meters
    allowedVehicleTypes?: string[]
    blockedVehicleTypes?: string[]
    blockedHours?: string[] // Format: "DAY:HH:mm-HH:mm"
    blockedDays?: string[]
    allowedCommodities?: string[]
    blockedCommodities?: string[]
    regulatoryRequirements?: string[]
  }
  appliesTo?: TransportMode[]
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  isActive: boolean
}

export interface FacilityCapability {
  id: string
  type: string
  name: string
  description: string
  available: boolean
  capacity?: number
  unit?: string
  currentUsage?: number
  requiresBooking?: boolean
  cost?: number
  currency?: string
}

export interface RegulatoryAuthority {
  id: string
  code: string
  name: string
  type: 'CUSTOMS' | 'FOOD_DRUG' | 'STANDARDS' | 'TRADE' | 'ENVIRONMENT' | 'HEALTH' | 'AGRICULTURE' | 'INDUSTRY' | 'OTHER'
  country: CountryCode
  officeCode?: string
  contact?: {
    phone?: string
    email?: string
    address?: string
  }
}

export interface FacilityLicense {
  id: string
  licenseNumber: string
  licenseType: string
  issuingAuthority: string
  issueDate: Date
  expiryDate: Date
  renewalDate?: Date
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_RENEWAL' | 'SUSPENDED' | 'REVOKED'
  documents?: string[]
}

export interface FacilityCertification {
  id: string
  certificationType: string
  certifyingBody: string
  certificateNumber?: string
  issueDate: Date
  expiryDate?: Date
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'
  documents?: string[]
}

export interface FacilityCapacity {
  storage?: {
    total: number
    unit: 'SQUARE_METERS' | 'CUBIC_METERS' | 'PALLETS' | 'CONTAINERS'
    currentUsage?: number
    available?: number
  }
  dailyVehicles?: number
  dailyShipments?: number
  dailyContainers?: number
  currentUtilization?: number // percentage (0-100)
}

export interface ProcessingTimes {
  average: number // hours
  export: number // hours
  import: number // hours
  transit: number // hours
  min: number // hours
  max: number // hours
  notes?: string
}

export interface FacilityContact {
  primary?: {
    name: string
    role: string
    phone: string
    email: string
  }
  emergency?: {
    name: string
    phone: string
    email?: string
  }
  facilityManager?: {
    name: string
    phone: string
    email: string
  }
  customsOffice?: {
    name: string
    code: string
    phone?: string
    email?: string
  }
}

export interface FacilityModuleExtensions {
  geofence?: GeofenceExtension
  touchpoint?: TouchpointExtension
  wms?: WMSExtension
  facilityManagement?: FacilityManagementExtension
}

export interface GeofenceExtension {
  zoneId?: string
  autoCreateZone: boolean
  zoneType: ZoneType
  expectedDwellTime?: number // minutes
  maxDwellTime?: number // minutes
  slaRules?: SLARule[]
}

export interface SLARule {
  id: string
  name: string
  expectedDwellTime: number // minutes
  maxDwellTime: number // minutes
  penaltyPerMinute?: number
  currency?: string
}

export interface TouchpointExtension {
  touchpointId?: string
  touchpointType: TouchpointType
  borderType?: BorderType
  connectedBorderId?: string
  connectedBorderName?: string
  distanceToConnected?: number // kilometers
  realTimeStatus?: TouchpointStatus
  congestionLevel?: CongestionLevel
}

export interface WMSExtension {
  warehouseId?: string
  warehouseCode?: string
  storageLocations?: string[] // Storage location IDs
  dockDoors?: string[] // Dock door IDs
}

export interface FacilityManagementExtension {
  assets?: string[] // Asset IDs
  maintenanceRecords?: string[] // Maintenance record IDs
  energyConsumption?: string // Energy consumption record ID
  digitalTwin?: string // Digital twin ID
}

export interface FacilityPerformance {
  reliabilityScore?: number // 0-100
  averageWaitTime?: number // minutes
  onTimePercentage?: number // percentage
  throughput?: number // shipments per day
  lastUpdated?: Date
}

// ============================================================================
// FACILITY QUERY TYPES
// ============================================================================

export interface FacilityQuery {
  tenantId: string
  ids?: string[]
  codes?: string[]
  types?: UnifiedFacilityType[]
  status?: FacilityStatus[]
  country?: CountryCode
  nearLocation?: {
    coordinates: GeoCoordinates
    radius: number // kilometers
  }
  hasCapability?: string
  hasConstraint?: string
  regulatoryAuthority?: string
  hasGovernmentDivision?: GovernmentDivisionType
  tags?: string[]
  search?: string // Search in name, code, alternateNames
}

export interface FacilityCreateInput {
  code: string
  name: string
  nameLocal?: string
  type: UnifiedFacilityType
  status?: FacilityStatus
  tenantId: string
  
  location: FacilityLocation
  operatingHours: OperatingHours
  constraints?: FacilityConstraint[]
  capabilities?: FacilityCapability[]
  supportedTransportModes?: TransportMode[]
  regulatoryAuthorities?: RegulatoryAuthority[]
  
  // Government Divisions - Each with independent hours
  governmentDivisions?: GovernmentDivisionInput[]
  
  // Environmental Agencies - Separate from divisions
  environmentalAgencies?: EnvironmentalAgencyInput[]
  
  // Border Control Components
  borderControlComponents?: BorderControlComponentInput[]
  
  licenses?: FacilityLicense[]
  certifications?: FacilityCertification[]
  capacity?: FacilityCapacity
  processingTimes?: ProcessingTimes
  contact?: FacilityContact
  
  // Module Extensions
  autoCreateGeofence?: boolean
  autoCreateTouchpoint?: boolean
  geofenceExtension?: Partial<GeofenceExtension>
  touchpointExtension?: Partial<TouchpointExtension>
  
  tags?: string[]
  notes?: string
  metadata?: Record<string, unknown>
  createdBy?: string
}

export interface GovernmentDivisionInput {
  code: string
  name: string
  nameLocal?: string
  type: GovernmentDivisionType
  environmentalAgencyType?: EnvironmentalAgencyType
  
  authority: {
    name: string
    code: string
    country: CountryCode
    jurisdiction?: 'NATIONAL' | 'REGIONAL' | 'LOCAL' | 'INTERNATIONAL'
    website?: string
  }
  
  location?: {
    coordinates?: GeoCoordinates
    building?: string
    floor?: string
    office?: string
    checkpoint?: string
    lane?: string
  }
  
  // INDEPENDENT Operating Hours
  operatingHours: OperatingHours
  
  processingTimes?: {
    average?: number
    min?: number
    max?: number
    peakHours?: PeakHours[]
    notes?: string
  }
  
  services?: GovernmentDivisionServiceInput[]
  requiredDocuments?: DocumentRequirement[]
  requiredCertifications?: string[]
  preferredPrograms?: string[]
  
  capacity?: {
    dailyApplications?: number
    currentQueue?: number
    averageWaitTime?: number
    maxWaitTime?: number
  }
  
  contact?: {
    phone?: string
    email?: string
    emergencyPhone?: string
    officeHours?: string
  }
  
  status?: 'OPERATIONAL' | 'CLOSED' | 'MAINTENANCE' | 'EMERGENCY' | 'HOLIDAY'
  is24Hours?: boolean
  
  integrationIds?: Record<string, string>
  apiEndpoint?: string
  
  tags?: string[]
  notes?: string
}

export interface GovernmentDivisionServiceInput {
  name: string
  description: string
  available: boolean
  processingTime: number
  requiresAppointment: boolean
  appointmentRequired?: boolean
  fee?: number
  currency?: string
  serviceHours?: OperatingHours
}

export interface EnvironmentalAgencyInput {
  code: string
  name: string
  type: EnvironmentalAgencyType
  
  authority: {
    name: string
    code: string
    country: CountryCode
  }
  
  location?: {
    coordinates?: GeoCoordinates
    building?: string
    office?: string
  }
  
  // INDEPENDENT Operating Hours
  operatingHours: OperatingHours
  
  services?: EnvironmentalServiceInput[]
  requiredDocuments?: DocumentRequirement[]
  environmentalStandards?: string[]
  
  contact?: {
    phone?: string
    email?: string
  }
  
  status?: 'OPERATIONAL' | 'CLOSED' | 'MAINTENANCE'
}

export interface EnvironmentalServiceInput {
  name: string
  description: string
  available: boolean
  processingTime: number
  requiresAppointment: boolean
  fee?: number
  currency?: string
}

export interface BorderControlComponentInput {
  name: string
  type: 'ENTRY' | 'EXIT' | 'BOTH'
  components: {
    borderControl?: string
    immigration?: string
    customs?: string
    security?: string
    quarantine?: string
    health?: string
    agriculture?: string
    environmental?: string
    standards?: string
    transport?: string
  }
  processingSequence: string[]
  totalProcessingTime: {
    average: number
    min: number
    max: number
  }
}

export interface FacilityUpdateInput {
  name?: string
  nameLocal?: string
  status?: FacilityStatus
  location?: Partial<FacilityLocation>
  operatingHours?: Partial<OperatingHours>
  constraints?: FacilityConstraint[]
  capabilities?: FacilityCapability[]
  regulatoryAuthorities?: RegulatoryAuthority[]
  governmentDivisions?: GovernmentDivisionInput[]  // Can add/update divisions
  environmentalAgencies?: EnvironmentalAgencyInput[]
  licenses?: FacilityLicense[]
  certifications?: FacilityCertification[]
  capacity?: Partial<FacilityCapacity>
  processingTimes?: Partial<ProcessingTimes>
  contact?: Partial<FacilityContact>
  moduleExtensions?: Partial<FacilityModuleExtensions>
  tags?: string[]
  notes?: string
  metadata?: Record<string, unknown>
  updatedBy?: string
}




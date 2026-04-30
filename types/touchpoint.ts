/**
 * Touchpoint Intelligence Types
 * Borders, Facilities, Bonded Warehouses, Regulatory Offices
 */

import type { CountryCode, GeoCoordinates, TransportMode, CustomsDeclarationType, DocumentRequirement } from './customs'

// ============================================================================
// TOUCHPOINT TYPES
// ============================================================================

export type TouchpointType = 
  | 'BORDER'
  | 'FACILITY'
  | 'BONDED_WAREHOUSE'
  | 'REGULATORY_OFFICE'
  | 'INSPECTION_FACILITY'
  | 'FREE_ZONE'
  | 'CUSTOMS_OFFICE'
  | 'PORT'
  | 'AIRPORT'

export type BorderType = 
  | 'LAND'
  | 'SEA_PORT'
  | 'AIRPORT'
  | 'DRY_PORT'
  | 'RAILWAY'
  | 'RIVER_PORT'

export type TouchpointStatus = 
  | 'OPERATIONAL'
  | 'LIMITED'
  | 'CLOSED'
  | 'MAINTENANCE'
  | 'OVERLOADED'
  | 'EMERGENCY'

export type CongestionLevel = 
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'

// ============================================================================
// TOUCHPOINT
// ============================================================================

export interface Touchpoint {
  id: string
  code: string
  name: string
  nameLocal?: string
  alternateNames?: string[]
  type: TouchpointType
  country: CountryCode
  
  // Location
  address: TouchpointAddress
  coordinates: GeoCoordinates
  timezone: string
  
  // Border-specific
  borderType?: BorderType
  connectedBorderId?: string // For paired borders (e.g., Saudi-Kuwait)
  connectedBorderName?: string
  distanceToConnected?: number // kilometers
  
  // Capabilities
  capabilities: TouchpointCapability[]
  supportedTransportModes: TransportMode[]
  supportedDeclarationTypes: CustomsDeclarationType[]
  supportedCommodities?: string[]
  restrictedCommodities?: string[]
  
  // Operations
  status: TouchpointStatus
  operatingHours: OperatingHours
  averageProcessingTime: ProcessingTime
  currentProcessingTime?: number // real-time estimate in hours
  
  // Capacity
  capacity: Capacity
  currentUtilization: number // percentage (0-100)
  utilizationHistory: UtilizationRecord[]
  
  // Requirements
  requiredDocuments: DocumentRequirement[]
  preferredPrograms?: string[] // AEO, Golden List, TIR, etc.
  restrictions?: TouchpointRestriction[]
  specialRequirements?: string[]
  
  // Features & Facilities
  features: TouchpointFeature[]
  hasXRayScanning: boolean
  hasWeighbridge: boolean
  hasColdStorage: boolean
  hasDangerousGoodsHandling: boolean
  hasLivestockHandling: boolean
  hasPhytosanitaryInspection: boolean
  hasVeterinaryInspection: boolean
  
  // Contact
  customsOffice?: string
  customsOfficeCode?: string
  phone?: string
  email?: string
  website?: string
  
  // Performance Metrics
  reliabilityScore: number // 0-100
  congestionLevel: CongestionLevel
  averageWaitTime: number // minutes
  peakHours?: PeakHours[]
  
  // Statistics
  statistics: TouchpointStatistics
  
  // Real-time Data
  realTimeData?: RealTimeTouchpointData
  
  // Integration
  integrationIds: Record<string, string> // External system IDs
  lastSyncedAt?: Date
  
  // Metadata
  notes?: string
  tags: string[]
  lastUpdated: Date
  createdAt: Date
}

export interface TouchpointAddress {
  street: string
  city: string
  state?: string
  postalCode?: string
  country: CountryCode
  region?: string
}

export interface TouchpointCapability {
  id: string
  type: string
  name: string
  description: string
  available: boolean
  capacity?: number
  unit?: string
  currentUsage?: number
}

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
}

export interface TimeRange {
  open: string // HH:mm
  close: string // HH:mm
  closed?: boolean
}

export interface ProcessingTime {
  export: number // hours
  import: number // hours
  transit: number // hours
  average: number // hours
  min: number // hours
  max: number // hours
}

export interface Capacity {
  dailyVehicles?: number
  dailyContainers?: number
  dailyShipments?: number
  storageCapacity?: number // square meters or cubic meters
  currentLoad?: number
  maxLoad?: number
  unit?: string
}

export interface UtilizationRecord {
  timestamp: Date
  utilization: number // percentage
  vehicles?: number
  containers?: number
  shipments?: number
}

export interface TouchpointRestriction {
  type: 'WEIGHT' | 'DIMENSIONS' | 'COMMODITY' | 'TIME' | 'VEHICLE' | 'OTHER'
  description: string
  appliesTo?: TransportMode[]
  appliesToCommodities?: string[]
}

export interface TouchpointFeature {
  id: string
  name: string
  description: string
  available: boolean
  cost?: number
  currency?: string
  requiresBooking?: boolean
}

export interface PeakHours {
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  start: string // HH:mm
  end: string // HH:mm
  congestionLevel: CongestionLevel
}

export interface TouchpointStatistics {
  totalShipments: number
  totalVehicles: number
  totalContainers: number
  averageProcessingTime: number // hours
  onTimePercentage: number // percentage
  rejectionRate: number // percentage
  period: {
    from: Date
    to: Date
  }
}

export interface RealTimeTouchpointData {
  currentQueueLength: number
  estimatedWaitTime: number // minutes
  activeInspections: number
  availableCapacity: number
  lastUpdated: Date
  dataSource: 'API' | 'SENSOR' | 'MANUAL' | 'ESTIMATED'
}

// ============================================================================
// BORDER CROSSING POINT
// ============================================================================

export interface BorderCrossingPoint extends Touchpoint {
  type: 'BORDER'
  borderType: BorderType
  
  // Border-specific
  borderCode: string
  connectedBorderId?: string
  connectedBorderCode?: string
  connectedBorderName?: string
  distanceToConnected?: number
  
  // Border capabilities
  handlesTIR: boolean
  handlesETIR: boolean
  handlesTransit: boolean
  handlesTemporaryImport: boolean
  
  // Border features
  hasImmigration: boolean
  hasCustoms: boolean
  hasQuarantine: boolean
  hasSecurity: boolean
  
  // Border statistics
  borderStatistics: BorderStatistics
}

export interface BorderStatistics {
  dailyCrossings: number
  averageCrossingTime: number // minutes
  peakCrossingTime: string // HH:mm
  rejectionRate: number // percentage
  inspectionRate: number // percentage
}

// ============================================================================
// FACILITY
// ============================================================================

export interface Facility extends Touchpoint {
  type: 'FACILITY'
  
  // Facility-specific
  facilityType: 'WAREHOUSE' | 'DISTRIBUTION_CENTER' | 'MANUFACTURING' | 'STORAGE_YARD' | 'OTHER'
  facilityCode?: string
  
  // Operations
  operatingCapacity: number
  currentOccupancy: number
  availableSpace: number
  
  // Services
  services: FacilityService[]
  
  // Certifications
  certifications: FacilityCertification[]
  
  // Facility statistics
  facilityStatistics: FacilityStatistics
}

export interface FacilityService {
  id: string
  name: string
  description: string
  available: boolean
  cost?: number
  currency?: string
}

export interface FacilityCertification {
  id: string
  type: string
  issuingAuthority: string
  certificateNumber: string
  validFrom: Date
  validTo: Date
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'
}

export interface FacilityStatistics {
  totalShipments: number
  averageStorageTime: number // days
  utilizationRate: number // percentage
  throughput: number // shipments per day
}

// ============================================================================
// BONDED WAREHOUSE
// ============================================================================

export interface BondedWarehouse extends Touchpoint {
  type: 'BONDED_WAREHOUSE'
  
  // Bonded warehouse-specific
  warehouseCode: string
  bondNumber?: string
  bondAmount?: number
  bondCurrency?: string
  
  // Customs
  customsOffice?: string
  customsOfficeCode?: string
  customsSupervision: boolean
  
  // Storage
  storageCapacity: number
  currentStorage: number
  availableStorage: number
  storageTypes: StorageType[]
  
  // Operations
  maxStoragePeriod?: number // days
  handlingFee?: number
  storageFee?: number
  currency?: string
  
  // Bonded warehouse statistics
  warehouseStatistics: BondedWarehouseStatistics
}

export interface StorageType {
  type: 'GENERAL' | 'COLD' | 'DANGEROUS_GOODS' | 'LIVESTOCK' | 'OTHER'
  capacity: number
  currentUsage: number
  available: number
}

export interface BondedWarehouseStatistics {
  totalShipments: number
  averageStoragePeriod: number // days
  utilizationRate: number // percentage
  customsClearanceRate: number // percentage
}

// ============================================================================
// REGULATORY OFFICE
// ============================================================================

export interface RegulatoryOffice extends Touchpoint {
  type: 'REGULATORY_OFFICE'
  
  // Regulatory-specific
  officeCode: string
  regulatoryBody: string
  bodyType: 'CUSTOMS' | 'FOOD_DRUG' | 'STANDARDS' | 'TRADE' | 'ENVIRONMENT' | 'HEALTH' | 'AGRICULTURE' | 'INDUSTRY'
  
  // Services
  services: RegulatoryService[]
  
  // Operating hours
  appointmentRequired: boolean
  walkInAllowed: boolean
  
  // Regulatory office statistics
  officeStatistics: RegulatoryOfficeStatistics
}

export interface RegulatoryService {
  id: string
  name: string
  description: string
  available: boolean
  processingTime: number // days
  fee?: number
  currency?: string
  requiresAppointment: boolean
}

export interface RegulatoryOfficeStatistics {
  totalApplications: number
  averageProcessingTime: number // days
  approvalRate: number // percentage
  averageWaitTime: number // minutes
}

// ============================================================================
// TOUCHPOINT REGISTRY
// ============================================================================

export interface TouchpointRegistry {
  touchpoints: Touchpoint[]
  borders: BorderCrossingPoint[]
  facilities: Facility[]
  bondedWarehouses: BondedWarehouse[]
  regulatoryOffices: RegulatoryOffice[]
  
  // Indexes
  byCountry: Record<CountryCode, Touchpoint[]>
  byType: Record<TouchpointType, Touchpoint[]>
  byCode: Record<string, Touchpoint>
  
  // Statistics
  totalTouchpoints: number
  lastUpdated: Date
}

// ============================================================================
// TOUCHPOINT QUERIES
// ============================================================================

export interface TouchpointQuery {
  country?: CountryCode
  type?: TouchpointType
  borderType?: BorderType
  transportMode?: TransportMode
  declarationType?: CustomsDeclarationType
  status?: TouchpointStatus
  hasFeature?: string
  nearLocation?: {
    coordinates: GeoCoordinates
    radius: number // kilometers
  }
  minCapacity?: number
  maxUtilization?: number
}

export interface TouchpointRecommendation {
  touchpoint: Touchpoint
  score: number // 0-100
  reasons: string[]
  estimatedProcessingTime: number // hours
  estimatedCost?: number
  currency?: string
}

// ============================================================================
// TOUCHPOINT EVENTS
// ============================================================================

export type TouchpointEventType =
  | 'touchpoint.status.changed'
  | 'touchpoint.capacity.updated'
  | 'touchpoint.congestion.changed'
  | 'touchpoint.operating.hours.changed'
  | 'touchpoint.feature.added'
  | 'touchpoint.restriction.added'

export interface TouchpointEvent {
  type: TouchpointEventType
  touchpointId: string
  touchpointCode: string
  data: Record<string, any>
  timestamp: Date
}














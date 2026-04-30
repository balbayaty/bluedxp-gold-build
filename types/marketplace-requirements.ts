/**
 * Marketplace Service Requirements & Scoping Types
 * Comprehensive data collection for all service categories
 * Ensures complete information gathering for accurate matching
 */

// ============================================================================
// BASE REQUIREMENT TYPES
// ============================================================================

export interface BaseServiceRequirement {
  category: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  budget?: {
    min?: number
    max?: number
    currency: string
    flexible?: boolean
  }
  timeline: {
    startDate?: string
    endDate?: string
    duration?: number
    unit?: 'DAYS' | 'WEEKS' | 'MONTHS'
    flexible?: boolean
  }
  location: {
    address?: string
    city?: string
    country?: string
    region?: string
    coordinates?: { lat: number; lng: number }
    multipleLocations?: boolean
    locations?: Array<{
      address: string
      city: string
      coordinates?: { lat: number; lng: number }
    }>
  }
  specialRequirements?: string[]
  certifications?: string[]
  compliance?: string[] // ISO, SABER, SFDA, etc.
  notes?: string
}

// ============================================================================
// STORAGE SERVICE REQUIREMENTS
// ============================================================================

export interface StorageServiceRequirement extends BaseServiceRequirement {
  category: 'STORAGE'
  serviceType: 'GENERAL_STORAGE' | 'COLD_STORAGE' | 'HAZMAT_STORAGE' | 'BONDED_STORAGE' | 'BULK_STORAGE' | 'RACK_STORAGE' | 'OPEN_YARD' | 'TEMPORARY_STORAGE' | 'LONG_TERM_STORAGE'
  
  // Capacity Requirements
  capacity: {
    volume?: number // m³
    area?: number // m²
    pallets?: number
    weight?: number // tons
    unit: 'CUBIC_METERS' | 'SQUARE_METERS' | 'PALLETS' | 'TONS'
    growthExpected?: boolean
    peakCapacity?: number
  }
  
  // Material Details
  materials: {
    type?: string[] // ['Electronics', 'Food', 'Chemicals']
    hazardous?: boolean
    temperatureControlled?: boolean
    humidityControlled?: boolean
    specialHandling?: string[]
  }
  
  // Operational Requirements
  operations: {
    inventoryManagement?: boolean
    realTimeTracking?: boolean
    reporting?: boolean
    handling?: boolean
    packaging?: boolean
    labeling?: boolean
    accessHours?: string // '24/7', 'Business Hours', etc.
    securityLevel?: 'STANDARD' | 'HIGH' | 'MAXIMUM'
  }
  
  // Service Level
  serviceLevel: {
    inboundFrequency?: 'DAILY' | 'WEEKLY' | 'ON_DEMAND'
    outboundFrequency?: 'DAILY' | 'WEEKLY' | 'ON_DEMAND'
    responseTime?: number // hours
    minimumCommitment?: number // months
  }
}

// ============================================================================
// CROSS-DOCKING SERVICE REQUIREMENTS
// ============================================================================

export interface CrossDockingServiceRequirement extends BaseServiceRequirement {
  category: 'CROSSDOCKING'
  
  // Facility Requirements
  facility: {
    dockDoors?: number
    minimumDoors?: number
    yardSpace?: number // m²
    stagingArea?: boolean
    sortingArea?: boolean
  }
  
  // Volume Requirements
  volume: {
    dailyShipments?: number
    peakShipments?: number
    averageShipmentSize?: number // kg or m³
    unit: 'KG' | 'CUBIC_METERS' | 'PALLETS'
  }
  
  // Operational Requirements
  operations: {
    inboundCarriers?: number
    outboundCarriers?: number
    consolidation?: boolean
    deconsolidation?: boolean
    sorting?: boolean
    labeling?: boolean
    qualityCheck?: boolean
    operatingHours?: string
  }
  
  // Service Level
  serviceLevel: {
    turnaroundTime?: number // hours
    sameDayService?: boolean
    weekendService?: boolean
    peakHandling?: boolean
  }
}

// ============================================================================
// TRANSPORTATION SERVICE REQUIREMENTS
// ============================================================================

export interface TransportationServiceRequirement extends BaseServiceRequirement {
  category: 'TRANSPORTATION'
  serviceType: 'FTL' | 'LTL' | 'EXPRESS' | 'SAME_DAY' | 'SCHEDULED' | 'ON_DEMAND'
  
  // Route Requirements
  route: {
    origin: {
      address: string
      city: string
      country: string
      coordinates?: { lat: number; lng: number }
    }
    destination: {
      address: string
      city: string
      country: string
      coordinates?: { lat: number; lng: number }
    }
    multipleStops?: boolean
    stops?: Array<{
      address: string
      city: string
      sequence: number
    }>
    returnTrip?: boolean
  }
  
  // Cargo Details
  cargo: {
    weight?: number // kg
    volume?: number // m³
    dimensions?: {
      length?: number
      width?: number
      height?: number
      unit: 'CM' | 'M'
    }
    pallets?: number
    pieces?: number
    type?: string[] // ['General', 'Fragile', 'Hazardous']
    hazardous?: boolean
    temperatureControlled?: boolean
    specialHandling?: string[]
  }
  
  // Vehicle Requirements
  vehicle: {
    type?: 'TRUCK' | 'VAN' | 'TRAILER' | 'CONTAINER' | 'FLEXIBLE'
    size?: string
    refrigeration?: boolean
    liftgate?: boolean
    tailgate?: boolean
    specialEquipment?: string[]
  }
  
  // Service Level
  serviceLevel: {
    pickupDate?: string
    deliveryDate?: string
    timeWindow?: {
      pickup?: { start: string; end: string }
      delivery?: { start: string; end: string }
    }
    tracking?: boolean
    proofOfDelivery?: boolean
    insurance?: boolean
    customsClearance?: boolean
  }
}

// ============================================================================
// FREIGHT SERVICE REQUIREMENTS
// ============================================================================

export interface FreightServiceRequirement extends BaseServiceRequirement {
  category: 'FREIGHT'
  serviceType: 'FCL' | 'LCL' | 'AIR_FREIGHT' | 'SEA_FREIGHT' | 'RAIL_FREIGHT' | 'MULTIMODAL'
  
  // Route Requirements
  route: {
    origin: {
      port?: string // Port/Airport code
      city: string
      country: string
      address?: string
    }
    destination: {
      port?: string
      city: string
      country: string
      address?: string
    }
    incoterms?: string // FOB, CIF, EXW, etc.
    doorToDoor?: boolean
    portToPort?: boolean
  }
  
  // Cargo Details
  cargo: {
    containers?: {
      type?: '20FT' | '40FT' | '40FT_HC' | '45FT'
      quantity?: number
      fullOrPartial?: 'FULL' | 'PARTIAL'
    }
    weight?: number // kg
    volume?: number // m³
    dimensions?: {
      length?: number
      width?: number
      height?: number
      unit: 'CM' | 'M'
    }
    pieces?: number
    type?: string[]
    hazardous?: boolean
    temperatureControlled?: boolean
    specialHandling?: string[]
  }
  
  // Service Level
  serviceLevel: {
    transitTime?: number // days
    urgency?: 'STANDARD' | 'EXPRESS' | 'URGENT'
    customsClearance?: boolean
    insurance?: boolean
    tracking?: boolean
    documentation?: string[] // ['Bill of Lading', 'Commercial Invoice', etc.]
  }
}

// ============================================================================
// CONSULTING SERVICE REQUIREMENTS
// ============================================================================

export interface ConsultingServiceRequirement extends BaseServiceRequirement {
  category: 'CONSULTING'
  serviceType: 'CIVIL_DEFENSE' | 'SAUDIZATION' | 'COMPLIANCE' | 'REGULATORY' | 'SAFETY' | 'QUALITY' | 'ENVIRONMENTAL' | 'LEGAL' | 'FINANCIAL' | 'TECHNICAL' | 'STRATEGIC'
  
  // Project Details
  project: {
    scope?: string
    objectives?: string[]
    deliverables?: string[]
    complexity?: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'VERY_COMPLEX'
    industry?: string
    sector?: string
  }
  
  // Consultant Requirements
  consultant: {
    experience?: {
      minimumYears?: number
      specificExperience?: string[]
      industryExperience?: string[]
    }
    qualifications?: string[] // ['Professional Engineer', 'Certified Consultant']
    certifications?: string[]
    languages?: string[]
    location?: 'ONSITE' | 'REMOTE' | 'HYBRID'
  }
  
  // Service Level
  serviceLevel: {
    engagementType?: 'PROJECT' | 'ONGOING' | 'ADVISORY'
    startDate?: string
    duration?: number
    hoursPerWeek?: number
    responseTime?: number // hours
    availability?: 'FULL_TIME' | 'PART_TIME' | 'AS_NEEDED'
  }
}

// ============================================================================
// MANPOWER SERVICE REQUIREMENTS
// ============================================================================

export interface ManpowerServiceRequirement extends BaseServiceRequirement {
  category: 'MANPOWER'
  serviceType: 'WAREHOUSE_STAFF' | 'DRIVERS' | 'ADMINISTRATIVE' | 'TECHNICAL' | 'MANAGEMENT' | 'SAUDIZATION_COMPLIANCE' | 'TRAINING'
  
  // Staff Requirements
  staff: {
    quantity?: number
    roles?: string[]
    qualifications?: string[]
    experience?: {
      minimumYears?: number
      specificSkills?: string[]
    }
    languages?: string[]
    certifications?: string[]
    backgroundChecks?: boolean
    training?: boolean
  }
  
  // Employment Details
  employment: {
    type?: 'TEMPORARY' | 'CONTRACT' | 'PERMANENT' | 'PROJECT_BASED'
    duration?: number
    unit?: 'DAYS' | 'WEEKS' | 'MONTHS'
    hoursPerWeek?: number
    shift?: 'DAY' | 'NIGHT' | 'ROTATING' | 'FLEXIBLE'
    location?: string
    remote?: boolean
  }
  
  // Service Level
  serviceLevel: {
    startDate?: string
    onboardingTime?: number // days
    replacementPolicy?: string
    supervision?: boolean
    reporting?: boolean
  }
}

// ============================================================================
// TRANSLATION SERVICE REQUIREMENTS
// ============================================================================

export interface TranslationServiceRequirement extends BaseServiceRequirement {
  category: 'TRANSLATION'
  
  // Translation Details
  translation: {
    languages: {
      from: string[]
      to: string[]
    }
    documentType?: string[] // ['Legal', 'Technical', 'Medical', 'General']
    wordCount?: number
    pageCount?: number
    fileCount?: number
    format?: string[] // ['PDF', 'Word', 'Excel', 'PowerPoint']
    specialty?: string[]
  }
  
  // Service Requirements
  service: {
    certified?: boolean
    notarized?: boolean
    rushService?: boolean
    rushDeadline?: string
    review?: boolean
    proofreading?: boolean
    desktopPublishing?: boolean
  }
  
  // Service Level
  serviceLevel: {
    deadline?: string
    qualityLevel?: 'STANDARD' | 'PROFESSIONAL' | 'EXPERT'
    revisionRounds?: number
    confidentiality?: 'STANDARD' | 'HIGH' | 'MAXIMUM'
  }
}

// ============================================================================
// WAREHOUSE NETWORK SERVICE REQUIREMENTS
// ============================================================================

export interface WarehouseNetworkServiceRequirement extends BaseServiceRequirement {
  category: 'WAREHOUSE_NETWORK'
  
  // Network Requirements
  network: {
    coverage?: {
      regions?: string[]
      countries?: string[]
      cities?: string[]
    }
    warehouseCount?: number
    minimumWarehouses?: number
    hubAndSpoke?: boolean
    distributionCenters?: boolean
  }
  
  // Operational Requirements
  operations: {
    multiLocationInventory?: boolean
    inventoryTransfer?: boolean
    centralizedManagement?: boolean
    realTimeVisibility?: boolean
    crossDocking?: boolean
    consolidation?: boolean
    deconsolidation?: boolean
  }
  
  // Capacity Requirements
  capacity: {
    totalCapacity?: number
    unit?: 'CUBIC_METERS' | 'SQUARE_METERS' | 'PALLETS'
    utilization?: number // %
    growthExpected?: boolean
  }
  
  // Service Level
  serviceLevel: {
    networkMetrics?: boolean
    performanceReporting?: boolean
    optimization?: boolean
    supportLevel?: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'
  }
}

// ============================================================================
// UNIFIED SERVICE REQUIREMENT
// ============================================================================

export type ServiceRequirement =
  | StorageServiceRequirement
  | CrossDockingServiceRequirement
  | TransportationServiceRequirement
  | FreightServiceRequirement
  | ConsultingServiceRequirement
  | ManpowerServiceRequirement
  | TranslationServiceRequirement
  | WarehouseNetworkServiceRequirement

// ============================================================================
// REQUIREMENT COMPLETENESS TRACKING
// ============================================================================

export interface RequirementCompleteness {
  requirementId: string
  category: string
  completeness: number // 0-100
  missingFields: string[]
  recommendedFields: string[]
  confidence: number // 0-100 - confidence in matching accuracy
  lastUpdated: string
}

// ============================================================================
// LEARNING & FEEDBACK
// ============================================================================

export interface MatchingFeedback {
  id: string
  requirementId: string
  bookingId?: string
  matchedProviderId: string
  matchedServiceId: string
  customerSatisfaction?: number // 1-5
  providerSatisfaction?: number // 1-5
  accuracy: number // 1-5 - how well the match was
  missingInformation?: string[] // What was missing that would have improved matching
  suggestions?: string[] // Suggestions for better matching
  outcome: 'SUCCESS' | 'PARTIAL' | 'FAILURE'
  notes?: string
  createdAt: string
}

export interface RequirementLearning {
  category: string
  commonMissingFields: Array<{
    field: string
    frequency: number
    impact: 'LOW' | 'MEDIUM' | 'HIGH'
  }>
  recommendedFields: Array<{
    field: string
    improvesMatching: number // 0-100
    improvesPricing: number
    improvesSatisfaction: number
  }>
  lastAnalyzed: string
}









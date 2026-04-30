/**
 * Global Transportation & Logistics Management System (GTLS)
 * Comprehensive Type Definitions
 * 
 * Covers all transportation modes, customs, brokers, documents, and integrations
 */

// ============================================================================
// TRANSPORT MODES
// ============================================================================

export type TransportMode = 
  | 'AIR'
  | 'SEA'
  | 'LAND'
  | 'RAIL'
  | 'MULTIMODAL'
  | 'EXPRESS'
  | 'COURIER'

export type ShipmentType = 
  | 'FCL' // Full Container Load
  | 'LCL' // Less than Container Load
  | 'FTL' // Full Truck Load
  | 'LTL' // Less than Truck Load
  | 'AIR_EXPRESS'
  | 'AIR_STANDARD'
  | 'AIR_ECONOMY'
  | 'BULK'
  | 'BREAK_BULK'
  | 'RO_RO'
  | 'PROJECT_CARGO'
  | 'REEFER'
  | 'HAZMAT'

export type ShipmentStatus = 
  | 'DRAFT'
  | 'QUOTED'
  | 'BOOKED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_PORT'
  | 'CUSTOMS_CLEARANCE'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'POD_PENDING'
  | 'COMPLETED'
  | 'HELD'
  | 'EXCEPTION'
  | 'RETURNED'
  | 'CANCELLED'

export type CustomsStatus = 
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'DOCUMENTS_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INSPECTION_REQUIRED'
  | 'DUTY_ASSESSED'
  | 'PAYMENT_PENDING'
  | 'CLEARED'
  | 'REJECTED'
  | 'HELD'

// ============================================================================
// LOCATION & ROUTE
// ============================================================================

export interface Location {
  id: string
  name: string
  type: 'ORIGIN' | 'DESTINATION' | 'WAYPOINT' | 'PORT' | 'AIRPORT' | 'WAREHOUSE' | 'CUSTOMS'
  address: {
    street: string
    city: string
    state?: string
    postalCode: string
    country: string
    countryCode: string
  }
  coordinates?: {
    lat: number
    lng: number
  }
  contact?: {
    name: string
    phone: string
    email: string
  }
  customsOffice?: string
  portCode?: string
  airportCode?: string
}

export interface Route {
  id: string
  origin: Location
  destination: Location
  waypoints?: Location[]
  mode: TransportMode
  distance?: number // km
  estimatedDuration?: number // hours
  actualDuration?: number // hours
  cost?: number
  currency: string
  optimized: boolean
  carbonFootprint?: number // kg CO2
}

// ============================================================================
// SHIPMENT
// ============================================================================

export interface Shipment {
  id: string
  shipmentNumber: string
  trackingNumber?: string
  referenceNumber?: string
  customerReference?: string
  internalReference?: string
  
  // Shipment Details
  type: ShipmentType
  mode: TransportMode
  status: ShipmentStatus
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  serviceLevel?: 'ECONOMY' | 'STANDARD' | 'EXPRESS' | 'SAME_DAY'
  
  // Locations
  origin: Location
  destination: Location
  route?: Route
  alternativeRoutes?: Route[] // Multiple route options
  intermediateStops?: Location[] // For multi-stop shipments
  
  // Dates & Timing
  pickupDate?: Date | string
  pickupTimeWindow?: { start: string; end: string } // Time window for pickup
  estimatedPickup?: Date | string
  actualPickup?: Date | string
  estimatedDelivery?: Date | string
  deliveryTimeWindow?: { start: string; end: string } // Time window for delivery
  actualDelivery?: Date | string
  bookingDate?: Date | string
  cutOffDate?: Date | string // Latest date for cargo delivery to port/airport
  sailingDate?: Date | string // For sea freight
  departureDate?: Date | string
  arrivalDate?: Date | string
  
  // Cargo Details
  items: ShipmentItem[]
  totalWeight: number // kg
  totalVolume: number // m³
  totalValue: number
  currency: string
  totalPieces?: number
  totalPallets?: number
  totalContainers?: number
  
  // Dimensions (for all shipment types)
  dimensions?: {
    length: number // cm or m
    width: number // cm or m
    height: number // cm or m
    unit: 'CM' | 'M' | 'IN' | 'FT'
    stackable?: boolean
    stackableHeight?: number
  }
  
  // Consolidation
  consolidationLevel?: 'SINGLE' | 'CONSOLIDATED' | 'MASTER' | 'CHILD'
  masterShipmentId?: string
  childShipmentIds?: string[]
  consolidatedShipmentIds?: string[]
  consolidationDetails?: {
    consolidationNumber?: string
    consolidationDate?: Date | string
    deconsolidationLocation?: Location
    deconsolidationDate?: Date | string
  }
  
  // FCL Specific Fields
  fclDetails?: {
    containerType?: '20FT' | '40FT' | '40FT_HC' | '45FT_HC' | '20FT_REEFER' | '40FT_REEFER' | 'OPEN_TOP' | 'FLAT_RACK'
    containerSize?: string
    containerCount?: number
    sealNumber?: string
    sealNumbers?: string[] // Multiple seals
    containerOwner?: string
    stuffingDate?: Date | string
    unstuffingDate?: Date | string
    stuffingLocation?: Location
    unstuffingLocation?: Location
    grossWeight?: number // kg
    netWeight?: number // kg
    tareWeight?: number // kg
    maxGrossWeight?: number // kg
    payload?: number // kg
    utilization?: number // %
    cubeUtilization?: number // %
  }
  
  // LCL Specific Fields
  lclDetails?: {
    bookingNumber?: string
    freightForwarder?: string
    consolidationDetails?: string
    cargoDimensions?: {
      length: number
      width: number
      height: number
      unit: 'CM' | 'M'
    }
    cargoWeight?: number
    cargoVolume?: number
    cbm?: number // Cubic meters
    chargeableWeight?: number
    chargeableVolume?: number
  }
  
  // Air Freight Specific Fields
  airFreightDetails?: {
    awbNumber?: string // Airway Bill Number
    masterAWB?: string // Master Airway Bill
    houseAWB?: string // House Airway Bill
    flightNumber?: string
    flightNumbers?: string[] // Multiple flights for multi-leg
    departureAirport?: string
    arrivalAirport?: string
    transitAirports?: string[]
    airline?: string
    handlingInstructions?: string
    specialHandling?: string[] // ['PERISHABLE', 'DANGEROUS_GOODS', 'VALUABLES', etc.]
    chargeableWeight?: number // kg (higher of actual or volumetric)
    volumetricWeight?: number // kg
    chargeableVolume?: number // m³
    iataCode?: string
    commodityCode?: string
  }
  
  // Rail Freight Specific Fields
  railFreightDetails?: {
    railcarNumber?: string
    railcarNumbers?: string[] // Multiple railcars
    trainNumber?: string
    trainOperator?: string
    departureStation?: string
    arrivalStation?: string
    intermediateStations?: string[]
    railcarType?: string
    loadingGauge?: string
    axleLoad?: number // tons
    grossWeight?: number // tons
  }
  
  // Road Freight Specific Fields
  roadFreightDetails?: {
    truckNumber?: string
    trailerNumber?: string
    driverName?: string
    driverLicense?: string
    driverPhone?: string
    vehicleType?: 'TRUCK' | 'VAN' | 'TRAILER' | 'FLATBED' | 'REEFER' | 'TANKER'
    vehicleCapacity?: {
      weight: number // kg
      volume: number // m³
    }
    specialEquipment?: string[] // ['LIFTGATE', 'TAILGATE', 'PALLET_JACK', etc.]
    loadingMethod?: 'FORKLIFT' | 'CRANE' | 'MANUAL' | 'AUTOMATED'
    unloadingMethod?: 'FORKLIFT' | 'CRANE' | 'MANUAL' | 'AUTOMATED'
    loadingTime?: number // minutes
    unloadingTime?: number // minutes
  }
  
  // Bulk Cargo Specific Fields
  bulkDetails?: {
    commodity?: string
    grade?: string
    quantity?: number
    unit?: string // 'TONS', 'BARRELS', 'CUBIC_METERS', etc.
    moistureContent?: number // %
    density?: number // kg/m³
    storageType?: 'SILO' | 'TANK' | 'OPEN_STORAGE' | 'COVERED_STORAGE'
  }
  
  // Project Cargo Specific Fields
  projectCargoDetails?: {
    projectName?: string
    projectPhase?: string
    equipmentType?: string
    dimensions?: {
      length: number
      width: number
      height: number
      unit: 'CM' | 'M'
    }
    weight?: number
    specialHandling?: string[]
    permits?: string[]
    escortRequired?: boolean
    routeSurvey?: boolean
  }
  
  // Carrier & Booking
  carrierId?: string
  carrierName?: string
  carrierCode?: string
  bookingNumber?: string
  confirmationNumber?: string
  containerNumber?: string
  containerNumbers?: string[] // Multiple containers
  vesselName?: string
  vesselIMO?: string // IMO number
  voyageNumber?: string
  flightNumber?: string
  awbNumber?: string // Airway Bill
  blNumber?: string // Bill of Lading
  houseBL?: string // House Bill of Lading
  masterBL?: string // Master Bill of Lading
  bookingAgent?: string
  freightForwarder?: string
  nvocc?: string // Non-Vessel Operating Common Carrier
  
  // Incoterms
  incoterms?: 'EXW' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP' | 'FAS' | 'FOB' | 'CFR' | 'CIF'
  incotermsLocation?: string
  
  // Customs
  customs?: CustomsInfo
  
  // Broker
  brokerId?: string
  brokerName?: string
  
  // Parties (for cross-border orchestration)
  consignorId?: string
  consignorName?: string
  consignorContact?: string
  consigneeId?: string
  consigneeName?: string
  consigneeContact?: string
  notifyPartyName?: string
  notifyPartyContact?: string
  supplierId?: string
  customerId?: string
  
  // Documents
  documents: ShipmentDocument[]
  
  // Financial
  freightCharges?: FreightCharges
  insurance?: InsuranceInfo
  paymentTerms?: 'PREPAID' | 'COLLECT' | 'THIRD_PARTY'
  paymentMethod?: string
  currency?: string
  
  // Pricing Intelligence
  pricingIntelligence?: {
    marketRate?: number
    marketRateIndex?: number
    rateTrend?: 'UP' | 'DOWN' | 'STABLE'
    rateChange?: number // %
    benchmarkRate?: number
    savings?: number
    savingsPercentage?: number
    rateValidity?: Date | string
  }
  
  // CO2 Emissions
  emissions?: {
    totalCO2e?: number // kg CO2 equivalent
    co2ePerKg?: number
    co2ePerKm?: number
    calculationMethod?: 'STANDARD' | 'DETAILED' | 'CERTIFIED'
    emissionFactors?: {
      mode: TransportMode
      factor: number // kg CO2e per km or per kg
      source: string
    }[]
    offset?: {
      offset: boolean
      offsetAmount?: number // kg CO2e
      offsetProvider?: string
      offsetCertificate?: string
    }
  }
  
  // Transit Time & Performance
  transitTime?: {
    estimated?: number // hours
    actual?: number // hours
    scheduled?: number // hours
    delay?: number // hours
    delayReason?: string
    onTimePerformance?: number // %
    averageSpeed?: number // km/h
    stops?: number
    dwellTime?: number // hours (time at stops)
  }
  
  // Special Requirements
  temperatureControl?: TemperatureControl
  hazmat?: HazmatInfo
  specialHandling?: {
    fragile?: boolean
    valuable?: boolean
    perishable?: boolean
    oversized?: boolean
    overweight?: boolean
    requirements?: string[]
  }
  
  // Tracking
  trackingEvents: TrackingEvent[]
  currentLocation?: {
    lat: number
    lng: number
    address: string
    timestamp: Date | string
    accuracy?: number // meters
    source?: string
  }
  realTimeTracking?: {
    enabled: boolean
    lastUpdate?: Date | string
    updateFrequency?: number // seconds
    provider?: string
  }
  
  // Exceptions & Alerts
  exceptions: Exception[]
  alerts: Alert[]
  
  // Journey Integration
  journeyId?: string // Link to Journey Analysis module
  lifecycleId?: string // Link to Process Lifecycle module
  rootCauseAnalysisId?: string // Link to root cause analysis
  etwId?: string // Link to ETW (e-waybill)
  crossBorderRouteId?: string // Link to cross-border route
  
  // State Management
  blocked?: boolean
  blockReason?: string
  blockedAt?: Date | string
  blockedBy?: string
  
  // AI Insights
  aiInsights?: {
    recommendations?: string[]
    riskFactors?: string[]
    optimizationSuggestions?: string[]
    predictedDelay?: number // hours
    predictedDelayProbability?: number // %
    costOptimization?: {
      potentialSavings?: number
      recommendations?: string[]
    }
  }
  
  // Metadata
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  updatedBy?: string
  tenantId?: string
  
  // Integration
  integrationSource?: 'STANDALONE' | 'ZOHO' | 'SAP' | 'ORACLE' | 'ERPNEXT' | 'UBERFREIGHT' | 'FLEXPORT' | 'PROJECT44' | 'FOURKITES' | string
  externalId?: string
  externalReferences?: Record<string, string>
  
  // GCC Compliance (Saudi Arabia & GCC Transport Compliance)
  gccCompliance?: {
    // Pre-dispatch validation result
    validationResult?: {
      canProceed: boolean
      overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      steps: Array<{
        name: string
        status: 'PASSED' | 'FAILED' | 'WARNING' | 'SKIPPED'
        message: string
        details?: Record<string, unknown>
      }>
      recommendations: string[]
    }
    
    // Touchpoints generated for this shipment
    touchpoints?: Array<{
      id: string
      code: string
      name: string
      type: 'PICKUP' | 'BORDER' | 'CUSTOMS' | 'CROSS_DOCK' | 'DELIVERY'
      coordinates: { lat: number; lng: number }
      radius: number
      expectedArrival?: Date | string
      actualArrival?: Date | string
      status: 'PENDING' | 'APPROACHING' | 'ARRIVED' | 'COMPLETED'
    }>
    
    // Bayan (Saudi e-waybill) integration
    bayanNumber?: string
    bayanStatus?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    bayanQrCode?: string
    bayanVerificationUrl?: string
    
    // Daleeli tracking
    daleeliSequenceNumber?: string
    daleeliTrackingActive?: boolean
    daleeliLastUpdate?: Date | string
    
    // Compliance score
    complianceScore?: number
    industryStandards?: string[]
    
    // Backload validation (for foreign carriers)
    backloadValidation?: {
      isBackload: boolean
      isLegal: boolean
      restrictions: string[]
    }
    
    // Timestamps
    validatedAt?: Date | string
    dispatchedAt?: Date | string
    completedAt?: Date | string
  }
  
  // Vehicle & Driver for Saudi compliance
  vehiclePlateNumber?: string
  vehiclePlateType?: string
  vehicleSequenceNumber?: string
}

export interface ShipmentItem {
  id: string
  sku: string
  description: string
  quantity: number
  unit: string
  weight: number // kg
  volume: number // m³
  value: number
  currency: string
  hsCode?: string
  countryOfOrigin?: string
  customsValue?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: 'CM' | 'M' | 'IN' | 'FT'
  }
}

// ============================================================================
// CARRIER
// ============================================================================

export interface Carrier {
  id: string
  code: string
  name: string
  type: 'AIR' | 'SEA' | 'LAND' | 'RAIL' | 'MULTIMODAL' | 'FREIGHT_FORWARDER' | 'COURIER'
  
  // Contact
  contactPerson: string
  email: string
  phone: string
  website?: string
  
  // Services
  serviceTypes: string[]
  coverage: {
    local: boolean
    regional: boolean
    international: boolean
  }
  
  // Performance
  rating: number // 1-5
  performance?: {
    onTimeDeliveryRate: number // %
    averageDeliveryTime: number // hours
    damageRate: number // %
    lossRate: number // %
    costPerShipment: number
    totalRevenue: number
    customerSatisfaction: number // %
  }
  
  // Integration
  integration?: {
    apiEnabled: boolean
    apiUrl?: string
    apiKey?: string
    trackingEnabled: boolean
    labelPrinting: boolean
    rateQuoting: boolean
    bookingEnabled: boolean
  }
  
  // Status
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  
  // Metadata
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// CUSTOMS & BROKER
// ============================================================================

export interface CustomsInfo {
  status: CustomsStatus
  declarationNumber?: string
  
  // Broker
  brokerId?: string
  brokerName?: string
  brokerLicense?: string
  
  // Documents
  documents: CustomsDocument[]
  
  // Classification
  hsCode?: string
  customsValue: number
  currency: string
  
  // Origin & Destination
  countryOfOrigin: string
  countryOfDestination: string
  
  // Licenses
  importLicenseNumber?: string
  exportLicenseNumber?: string
  
  // Duties & Taxes
  duties?: number
  taxes?: number
  totalDutyTax?: number
  
  // Clearance
  clearanceDate?: Date | string
  clearanceBy?: string
  
  // Inspection
  inspectionRequired: boolean
  inspectionDate?: Date | string
  inspectionResult?: 'PASSED' | 'FAILED' | 'PENDING'
  inspectionAgency?: string
  
  // Authority
  customsAuthority?: string
  customsOffice?: string
  
  // Compliance
  complianceStatus?: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING'
  complianceNotes?: string
}

export interface CustomsDocument {
  id: string
  type: 
    | 'COMMERCIAL_INVOICE'
    | 'PACKING_LIST'
    | 'CERTIFICATE_OF_ORIGIN'
    | 'EXPORT_LICENSE'
    | 'IMPORT_LICENSE'
    | 'CUSTOMS_DECLARATION'
    | 'PHYTOSANITARY_CERTIFICATE'
    | 'HEALTH_CERTIFICATE'
    | 'INSURANCE_CERTIFICATE'
    | 'BILL_OF_LADING'
    | 'AIRWAY_BILL'
    | 'OTHER'
  documentNumber?: string
  issueDate?: Date | string
  expiryDate?: Date | string
  fileUrl?: string
  status: 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'REJECTED'
  verifiedBy?: string
  verifiedAt?: Date | string
  rejectionReason?: string
}

export interface CustomsBroker {
  id: string
  name: string
  licenseNumber: string
  country: string
  
  // Contact
  contactPerson: string
  email: string
  phone: string
  
  // Performance
  performance?: {
    onTimeClearanceRate: number // %
    averageClearanceTime: number // hours
    accuracyRate: number // %
    totalClearances: number
    customerSatisfaction: number // %
  }
  
  // Coverage
  coverage: {
    countries: string[]
    customsOffices: string[]
  }
  
  // Status
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  
  // Integration
  integration?: {
    apiEnabled: boolean
    apiUrl?: string
    documentPortal?: string
  }
  
  // Metadata
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CustomsAuthorityOffice {
  id: string
  name: string
  location: string
  contact: string
  phone?: string
  email?: string
}

export interface CustomsAuthority {
  id: string
  code: string
  name: string
  country: string
  region?: string
  offices: CustomsAuthorityOffice[]
  requirements: string[]
  workingHours?: string
  timezone?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// TRACKING & EVENTS
// ============================================================================

export interface TrackingEvent {
  id: string
  shipmentId: string
  timestamp: Date | string
  status: ShipmentStatus
  location?: {
    name: string
    address: string
    lat?: number
    lng?: number
    country?: string
  }
  description: string
  source: 'CARRIER' | 'CUSTOMS' | 'BROKER' | 'PORT' | 'AIRPORT' | 'SYSTEM' | 'MANUAL'
  sourceId?: string
  metadata?: Record<string, any>
}

// ============================================================================
// FINANCIAL
// ============================================================================

export interface FreightCharges {
  baseRate: number
  currency: string
  
  // Additional Charges
  fuelSurcharge?: number
  customsDuties?: number
  customsTaxes?: number
  insurancePremium?: number
  storageFees?: number
  demurrage?: number
  detention?: number
  accessorialCharges?: {
    name: string
    amount: number
  }[]
  
  // Totals
  subtotal: number
  taxes: number
  total: number
  
  // Payment
  paymentStatus?: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE'
  paymentDate?: Date | string
  paymentMethod?: string
}

export interface PricingModel {
  type: 'FIXED' | 'PER_KG' | 'PER_M3' | 'PER_CONTAINER' | 'PER_PALLET' | 'TIERED' | 'QUOTE'
  baseRate: number
  currency: string
  minimumCharge?: number
  maximumCharge?: number
  tiers?: {
    min: number
    max?: number
    rate: number
  }[]
}

export interface InsuranceInfo {
  insured: boolean
  provider?: string
  policyNumber?: string
  coverageAmount?: number
  premium?: number
  currency?: string
  effectiveDate?: Date | string
  expiryDate?: Date | string
}

// ============================================================================
// SPECIAL REQUIREMENTS
// ============================================================================

export interface TemperatureControl {
  required: boolean
  minTemperature?: number // Celsius
  maxTemperature?: number // Celsius
  setPoint?: number // Celsius
  tolerance?: number // ±Celsius
  monitoring?: boolean
  alerts?: boolean
}

export interface HazmatInfo {
  isHazmat: boolean
  unNumber?: string
  properShippingName?: string
  hazardClass?: string
  packingGroup?: string
  quantity?: number
  unit?: string
  emergencyContact?: string
  specialInstructions?: string
}

// ============================================================================
// EXCEPTIONS & ALERTS
// ============================================================================

export interface Exception {
  id: string
  shipmentId: string
  type: 
    | 'DELAY'
    | 'DAMAGE'
    | 'LOSS'
    | 'CUSTOMS_HOLD'
    | 'DOCUMENT_MISSING'
    | 'ROUTE_DEVIATION'
    | 'TEMPERATURE_DEVIATION'
    | 'OTHER'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  detectedAt: Date | string
  resolvedAt?: Date | string
  resolvedBy?: string
  resolution?: string
}

export interface Alert {
  id: string
  shipmentId?: string
  type: 
    | 'ETA_CHANGE'
    | 'STATUS_UPDATE'
    | 'DOCUMENT_RECEIVED'
    | 'CUSTOMS_UPDATE'
    | 'EXCEPTION'
    | 'REMINDER'
    | 'OTHER'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  title: string
  message: string
  createdAt: Date | string
  read: boolean
  readAt?: Date | string
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export interface ShipmentDocument {
  id: string
  shipmentId: string
  type: string
  name: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
  uploadedBy: string
  uploadedAt: Date | string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  version?: string
  tags?: string[]
  
  // Integration
  externalId?: string
  externalUrl?: string
  integrationSource?: string
}

// ============================================================================
// QUOTE & BOOKING
// ============================================================================

export interface Quote {
  id: string
  quoteNumber: string
  shipmentId?: string
  
  // Route
  origin: Location
  destination: Location
  mode: TransportMode
  type: ShipmentType
  
  // Cargo
  weight: number
  volume: number
  value: number
  currency: string
  
  // Pricing
  pricing: PricingModel
  charges: FreightCharges
  
  // Validity
  validFrom: Date | string
  validTo: Date | string
  
  // Status
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  
  // Carrier
  carrierId?: string
  carrierName?: string
  
  // Metadata
  createdAt: Date | string
  createdBy: string
}

export interface Booking {
  id: string
  bookingNumber: string
  shipmentId: string
  quoteId?: string
  
  // Carrier
  carrierId: string
  carrierName: string
  
  // Dates
  bookingDate: Date | string
  pickupDate: Date | string
  estimatedDelivery: Date | string
  
  // Status
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  
  // Confirmation
  confirmationNumber?: string
  confirmedAt?: Date | string
  
  // Metadata
  createdAt: Date | string
  createdBy: string
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface TransportationAnalytics {
  // Shipments
  totalShipments: number
  activeShipments: number
  deliveredShipments: number
  inTransitShipments: number
  
  // Performance
  onTimeDeliveryRate: number // %
  averageTransitTime: number // hours
  exceptionRate: number // %
  
  // Financial
  totalFreightCost: number
  averageCostPerShipment: number
  currency: string
  
  // Mode Distribution
  modeDistribution: {
    mode: TransportMode
    count: number
    percentage: number
  }[]
  
  // Carrier Performance
  carrierPerformance: {
    carrierId: string
    carrierName: string
    shipmentCount: number
    onTimeRate: number
    averageCost: number
  }[]
  
  // Customs
  customsClearanceRate: number // %
  averageClearanceTime: number // hours
  
  // Period
  period: {
    start: Date | string
    end: Date | string
  }
}

// ============================================================================
// ROUTE COMPARISON & OPTIMIZATION
// ============================================================================

export interface RouteOption {
  id: string
  route: Route
  carrierId?: string
  carrierName?: string
  mode: TransportMode
  type: ShipmentType
  
  // Pricing
  pricing: {
    baseRate: number
    fuelSurcharge?: number
    accessorialCharges?: number
    totalCost: number
    currency: string
    rateIndex?: number // Market rate index
    savings?: number // vs market rate
    savingsPercentage?: number
  }
  
  // Transit Time
  transitTime: {
    estimated: number // hours
    min?: number
    max?: number
    confidence?: number // 0-1
    factors?: string[] // ['TRAFFIC', 'WEATHER', 'CUSTOMS', etc.]
  }
  
  // CO2 Emissions
  emissions: {
    co2e: number // kg CO2 equivalent
    co2ePerKg?: number
    co2ePerKm?: number
    calculationMethod?: string
  }
  
  // Reliability
  reliability: {
    onTimeRate?: number // %
    averageDelay?: number // hours
    riskScore?: number // 0-100 (lower is better)
    riskFactors?: string[]
  }
  
  // Additional Info
  bookingAvailable?: boolean
  bookingDeadline?: Date | string
  capacityAvailable?: boolean
  specialRequirements?: string[]
  notes?: string
  
  // Ranking
  score?: number // Overall score for comparison
  rank?: number
}

export interface RouteComparison {
  shipmentId?: string
  origin: Location
  destination: Location
  cargo: {
    weight: number
    volume: number
    value: number
    type: ShipmentType
    mode?: TransportMode
  }
  options: RouteOption[]
  recommended?: RouteOption
  comparisonCriteria?: {
    prioritize?: 'COST' | 'TIME' | 'EMISSIONS' | 'RELIABILITY' | 'BALANCED'
    weights?: {
      cost?: number
      time?: number
      emissions?: number
      reliability?: number
    }
  }
  generatedAt: Date | string
}

// ============================================================================
// PRICING INTELLIGENCE
// ============================================================================

export interface FreightRateIndex {
  id: string
  name: string
  type: 'SPOT' | 'CONTRACT' | 'MARKET'
  mode: TransportMode
  region?: string
  lane?: string // Origin-Destination lane
  
  // Current Rate
  currentRate: number
  currency: string
  unit?: 'PER_KG' | 'PER_M3' | 'PER_CONTAINER' | 'PER_KM' | 'PER_SHIPMENT'
  
  // Historical Data
  previousRate?: number
  change?: number // %
  changeDirection?: 'UP' | 'DOWN' | 'STABLE'
  
  // Index Value
  indexValue?: number // Normalized index (e.g., 100 = baseline)
  baselineDate?: Date | string
  baselineValue?: number
  
  // Trend
  trend?: {
    period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
    direction: 'UP' | 'DOWN' | 'STABLE'
    change: number // %
    volatility?: number // %
  }
  
  // Forecast
  forecast?: {
    nextPeriod?: number
    confidence?: number // 0-1
    factors?: string[]
  }
  
  // Metadata
  source?: string
  lastUpdated: Date | string
  validUntil?: Date | string
}

export interface PricingIntelligence {
  shipmentId?: string
  route: {
    origin: Location
    destination: Location
    mode: TransportMode
    type: ShipmentType
  }
  cargo: {
    weight: number
    volume: number
    value: number
  }
  
  // Market Rates
  marketRate?: number
  marketRateIndex?: FreightRateIndex
  benchmarkRate?: number
  yourRate?: number
  
  // Comparison
  comparison?: {
    vsMarket?: {
      difference: number
      percentage: number
      status: 'ABOVE' | 'BELOW' | 'AT_MARKET'
    }
    vsBenchmark?: {
      difference: number
      percentage: number
    }
    vsHistorical?: {
      average: number
      difference: number
      percentage: number
    }
  }
  
  // Rate Trends
  rateTrend?: {
    direction: 'UP' | 'DOWN' | 'STABLE'
    change: number // %
    period: string
    factors?: string[]
  }
  
  // Recommendations
  recommendations?: {
    action: 'NEGOTIATE' | 'ACCEPT' | 'WAIT' | 'SHOP_AROUND'
    reason: string
    suggestedRate?: number
    potentialSavings?: number
  }[]
  
  // Forecast
  forecast?: {
    next30Days?: number
    next90Days?: number
    confidence?: number
    factors?: string[]
  }
  
  generatedAt: Date | string
}

// ============================================================================
// TRANSIT TIME PREDICTION
// ============================================================================

export interface TransitTimePrediction {
  shipmentId?: string
  route: {
    origin: Location
    destination: Location
    mode: TransportMode
    waypoints?: Location[]
  }
  
  // Predictions
  predictions: {
    optimistic: number // hours (best case)
    realistic: number // hours (most likely)
    pessimistic: number // hours (worst case)
    confidence: number // 0-1
  }
  
  // Factors
  factors: {
    distance: number // km
    mode: TransportMode
    historicalAverage?: number // hours
    trafficConditions?: 'LIGHT' | 'MODERATE' | 'HEAVY' | 'SEVERE'
    weatherImpact?: 'NONE' | 'MINOR' | 'MODERATE' | 'MAJOR'
    customsImpact?: number // hours
    portCongestion?: 'LOW' | 'MEDIUM' | 'HIGH'
    seasonalFactors?: string[]
  }
  
  // Breakdown by Segment
  segments?: {
    segment: string
    estimatedTime: number // hours
    distance: number // km
    mode?: TransportMode
    factors?: string[]
  }[]
  
  // AI Insights
  aiInsights?: {
    delayProbability?: number // 0-1
    riskFactors?: string[]
    recommendations?: string[]
  }
  
  generatedAt: Date | string
  validUntil?: Date | string
}

// ============================================================================
// CO2 EMISSIONS CALCULATION
// ============================================================================

export interface CO2EmissionsCalculation {
  shipmentId?: string
  route: {
    origin: Location
    destination: Location
    distance: number // km
    mode: TransportMode
  }
  cargo: {
    weight: number // kg
    volume: number // m³
  }
  
  // Total Emissions
  totalCO2e: number // kg CO2 equivalent
  
  // Breakdown by Mode/Segment
  breakdown: {
    segment: string
    mode: TransportMode
    distance: number // km
    co2e: number // kg
    percentage: number // % of total
    emissionFactor: number // kg CO2e per km or per kg
    source: string
  }[]
  
  // Calculation Method
  calculationMethod: {
    method: 'STANDARD' | 'DETAILED' | 'CERTIFIED' | 'CUSTOM'
    standard?: 'GHG_PROTOCOL' | 'ISO_14064' | 'EPA' | 'DEFRA'
    factors?: {
      fuelType?: string
      fuelConsumption?: number // L or kg
      emissionFactor?: number // kg CO2e per L or kg
      loadFactor?: number // % of capacity utilized
    }
  }
  
  // Comparison
  comparison?: {
    vsAverage?: {
      average: number
      difference: number
      percentage: number
    }
    vsBest?: {
      best: number
      difference: number
      percentage: number
    }
    vsWorst?: {
      worst: number
      difference: number
      percentage: number
    }
  }
  
  // Offset Options
  offsetOptions?: {
    provider: string
    cost: number
    currency: string
    certificate: boolean
  }[]
  
  calculatedAt: Date | string
}

// ============================================================================
// AI INSIGHTS & RECOMMENDATIONS
// ============================================================================

export interface TransportationInsight {
  id: string
  type: 'COST_OPTIMIZATION' | 'ROUTE_OPTIMIZATION' | 'CARRIER_SELECTION' | 'TIMING_OPTIMIZATION' | 'RISK_MITIGATION' | 'SUSTAINABILITY'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  
  // Impact
  impact: {
    potentialSavings?: number
    timeReduction?: number // hours
    emissionReduction?: number // kg CO2e
    riskReduction?: number // %
    score: number // 0-100
  }
  
  // Recommendations
  recommendations: {
    action: string
    description: string
    expectedOutcome: string
    effort?: 'LOW' | 'MEDIUM' | 'HIGH'
    cost?: number
  }[]
  
  // Evidence
  evidence?: {
    dataPoints: string[]
    historicalExamples?: string[]
    confidence: number // 0-1
  }
  
  // Related
  relatedShipments?: string[]
  relatedInsights?: string[]
  
  generatedAt: Date | string
  validUntil?: Date | string
}

export interface TransportationAIInsights {
  shipmentId?: string
  insights: TransportationInsight[]
  summary: {
    totalInsights: number
    highPriority: number
    potentialSavings?: number
    topRecommendations: string[]
  }
  generatedAt: Date | string
}



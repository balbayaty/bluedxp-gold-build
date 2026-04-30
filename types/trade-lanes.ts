/**
 * Trade Lane Management Types
 * Industry-grade data structures for international freight corridors
 * Aligned with UN/LOCODE, WCO, and IATA standards
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

export type TransportMode = 'ROAD' | 'SEA' | 'AIR' | 'RAIL' | 'MULTIMODAL'
export type BorderType = 'LAND' | 'SEA_PORT' | 'AIRPORT' | 'DRY_PORT' | 'FREE_ZONE'
export type OperationalStatus = 'OPERATIONAL' | 'LIMITED' | 'CLOSED' | 'SEASONAL'
export type ClearanceType = 'EXPORT' | 'IMPORT' | 'TRANSIT' | 'TRANSSHIPMENT'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type ShipmentStatus = 'BOOKED' | 'IN_TRANSIT' | 'AT_BORDER' | 'CLEARED' | 'DELIVERED' | 'DELAYED' | 'HELD'

// ============================================================================
// GEOGRAPHIC & LOCATION TYPES
// ============================================================================

export interface GeoCoordinates {
  latitude: number
  longitude: number
}

export interface Country {
  code: string           // ISO 3166-1 alpha-2 (e.g., "SA", "KW")
  code3: string          // ISO 3166-1 alpha-3 (e.g., "SAU", "KWT")
  name: string           // Full name
  nameArabic?: string    // Arabic name
  region: string         // Geographic region (e.g., "GCC", "MENA")
  currency: string       // ISO 4217 currency code
  timezone: string       // IANA timezone
  customsAuthority: string  // Name of customs authority
  customsPortal?: string    // Online customs system name
}

export interface Location {
  id: string
  unLocode: string       // UN/LOCODE (e.g., "SAYNB" for Yanbu)
  name: string
  nameLocal?: string     // Local language name
  country: string        // Country code
  coordinates: GeoCoordinates
  type: 'CITY' | 'PORT' | 'AIRPORT' | 'INDUSTRIAL_ZONE' | 'FREE_ZONE' | 'WAREHOUSE'
  iataCode?: string      // For airports
  portCode?: string      // For seaports
}

// ============================================================================
// BORDER CROSSING POINT (BCP) TYPES
// ============================================================================

export interface OperatingHours {
  sunday: { open: string; close: string } | null
  monday: { open: string; close: string } | null
  tuesday: { open: string; close: string } | null
  wednesday: { open: string; close: string } | null
  thursday: { open: string; close: string } | null
  friday: { open: string; close: string } | null
  saturday: { open: string; close: string } | null
  notes?: string
  holidaySchedule?: string
}

export interface BorderCrossingPoint {
  id: string
  code: string           // Official BCP code
  name: string           // Official name
  nameLocal?: string     // Local language name
  alternateNames?: string[]  // Common alternate names
  
  // Location
  country: string        // Country code
  coordinates: GeoCoordinates
  type: BorderType
  
  // Connectivity
  connectedBCP?: string  // ID of connected BCP on other side
  distanceToConnectedBCP?: number  // km
  
  // Operations
  status: OperationalStatus
  operatingHours: OperatingHours
  clearanceTypes: ClearanceType[]
  averageProcessingTime: {
    export: number       // hours
    import: number       // hours
    transit: number      // hours
  }
  
  // Capabilities
  facilities: BCPFacility[]
  supportedTransportModes: TransportMode[]
  maxVehicleCapacity?: number  // vehicles per day
  hasXRayScanning: boolean
  hasWeighbridge: boolean
  hasColdStorage: boolean
  hasDGHandling: boolean  // Dangerous goods
  hasLivestock: boolean
  
  // Requirements
  requiredDocuments: string[]
  preferredPrograms?: string[]  // AEO, Golden List, etc.
  restrictions?: string[]
  
  // Contact
  customsOffice: string
  phone?: string
  email?: string
  
  // Performance metrics
  congestionLevel: RiskLevel
  reliabilityScore: number  // 0-100
  
  // Notes
  notes?: string
  lastUpdated: string
}

export interface BCPFacility {
  type: 'INSPECTION_BAY' | 'DOCUMENT_OFFICE' | 'WEIGHBRIDGE' | 'PARKING' | 'REST_AREA' | 'FUEL_STATION' | 'COLD_STORAGE' | 'DG_YARD' | 'BONDED_WAREHOUSE'
  name: string
  available: boolean
  capacity?: number
}

// ============================================================================
// TRADE LANE TYPES
// ============================================================================

export interface TradeLane {
  id: string
  code: string           // Lane code (e.g., "SA-KW-001")
  name: string           // Descriptive name
  description?: string
  
  // Origin & Destination
  originCountry: string
  destinationCountry: string
  originRegion?: string
  destinationRegion?: string
  
  // Route options
  routes: TradeLaneRoute[]
  defaultRouteId: string
  
  // Trade characteristics
  primaryCommodities: string[]
  restrictedCommodities: string[]
  hsCodePrefixes?: string[]
  
  // Agreements & Programs
  tradeAgreements: string[]  // FTA, customs unions, etc.
  availablePrograms: TradeProgramReference[]
  
  // Performance
  averageTransitTime: number  // hours
  transitTimeVariance: number // hours +/-
  reliabilityScore: number    // 0-100
  
  // Compliance
  requiredCertificates: string[]
  regulatoryNotes?: string
  
  // Metadata
  isActive: boolean
  lastUpdated: string
}

export interface TradeLaneRoute {
  id: string
  code: string           // Route variant code (e.g., "SA-KW-001-A")
  name: string           // Route name
  description?: string
  
  // Transport
  primaryMode: TransportMode
  modes: TransportMode[]
  
  // Waypoints
  origin: RouteWaypoint
  destination: RouteWaypoint
  waypoints: RouteWaypoint[]
  segments: RouteSegment[]
  
  // Border crossings
  borderCrossings: RouteBorderCrossing[]
  
  // Metrics
  totalDistance: number     // km
  estimatedTransitTime: number  // hours
  transitTimeRange: { min: number; max: number }
  
  // Cost indicators
  relativeCost: 'LOW' | 'MEDIUM' | 'HIGH'
  tollsRequired: boolean
  
  // Risk & reliability
  riskLevel: RiskLevel
  reliabilityScore: number
  
  // Conditions
  seasonalRestrictions?: string[]
  weatherSensitivity: 'LOW' | 'MEDIUM' | 'HIGH'
  
  // Recommendations
  bestFor: string[]       // e.g., ["Time-sensitive", "DG cargo", "Bulk"]
  avoidFor: string[]
  
  isDefault: boolean
  isActive: boolean
}

export interface RouteWaypoint {
  id: string
  locationId: string
  name: string
  type: 'ORIGIN' | 'PICKUP' | 'CONSOLIDATION' | 'BORDER' | 'DECONSOLIDATION' | 'DELIVERY' | 'DESTINATION'
  sequence: number
  coordinates: GeoCoordinates
  
  // Timing
  estimatedDwell: number  // hours
  dwellVariance: number   // hours +/-
  
  // Operations
  activities: WaypointActivity[]
  operatingHours?: OperatingHours
  
  // Requirements
  requiredDocuments?: string[]
  
  notes?: string
}

export interface WaypointActivity {
  type: 'LOADING' | 'UNLOADING' | 'INSPECTION' | 'DOCUMENTATION' | 'CUSTOMS_CLEARANCE' | 'CONSOLIDATION' | 'DECONSOLIDATION' | 'TRANSSHIPMENT' | 'REST' | 'REFUEL'
  name: string
  estimatedDuration: number  // hours
  mandatory: boolean
}

export interface RouteSegment {
  id: string
  fromWaypointId: string
  toWaypointId: string
  
  // Transport
  mode: TransportMode
  carrierType?: string
  
  // Distance & Time
  distance: number        // km
  estimatedDuration: number  // hours
  durationRange: { min: number; max: number }
  
  // Route details
  routeDescription?: string
  highways?: string[]
  
  // Conditions
  borderCrossing: boolean
  tollRoads: boolean
  
  // Risk
  riskLevel: RiskLevel
  congestionProbability: number  // 0-100
  
  // Emissions
  estimatedCO2: number    // kg
}

export interface RouteBorderCrossing {
  sequence: number
  exportBCP: string       // BCP ID
  importBCP: string       // BCP ID
  
  // Clearance type
  clearanceType: ClearanceType
  
  // Timing
  estimatedClearanceTime: number  // hours
  clearanceTimeRange: { min: number; max: number }
  
  // Requirements
  requiredDocuments: string[]
  inspectionProbability: number  // 0-100
  
  // Programs
  expeditedPrograms?: string[]
  
  notes?: string
}

export interface TradeProgramReference {
  programId: string
  name: string
  authority: string
  benefitSummary: string
  timeReduction?: number  // percentage
  costReduction?: number  // percentage
}

// ============================================================================
// GCC REGION DATA
// ============================================================================

export const GCC_COUNTRIES: Record<string, Country> = {
  SA: {
    code: 'SA',
    code3: 'SAU',
    name: 'Saudi Arabia',
    nameArabic: 'المملكة العربية السعودية',
    region: 'GCC',
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    customsAuthority: 'Saudi Customs (ZATCA)',
    customsPortal: 'FASAH'
  },
  KW: {
    code: 'KW',
    code3: 'KWT',
    name: 'Kuwait',
    nameArabic: 'الكويت',
    region: 'GCC',
    currency: 'KWD',
    timezone: 'Asia/Kuwait',
    customsAuthority: 'Kuwait General Administration of Customs',
    customsPortal: 'ASYCUDA World'
  },
  AE: {
    code: 'AE',
    code3: 'ARE',
    name: 'United Arab Emirates',
    nameArabic: 'الإمارات العربية المتحدة',
    region: 'GCC',
    currency: 'AED',
    timezone: 'Asia/Dubai',
    customsAuthority: 'Federal Customs Authority',
    customsPortal: 'Dubai Trade / Mirsal'
  },
  QA: {
    code: 'QA',
    code3: 'QAT',
    name: 'Qatar',
    nameArabic: 'قطر',
    region: 'GCC',
    currency: 'QAR',
    timezone: 'Asia/Qatar',
    customsAuthority: 'General Authority of Customs',
    customsPortal: 'Al Nadeeb'
  },
  BH: {
    code: 'BH',
    code3: 'BHR',
    name: 'Bahrain',
    nameArabic: 'البحرين',
    region: 'GCC',
    currency: 'BHD',
    timezone: 'Asia/Bahrain',
    customsAuthority: 'Customs Affairs',
    customsPortal: 'Sijilat'
  },
  OM: {
    code: 'OM',
    code3: 'OMN',
    name: 'Oman',
    nameArabic: 'عُمان',
    region: 'GCC',
    currency: 'OMR',
    timezone: 'Asia/Muscat',
    customsAuthority: 'Royal Oman Customs',
    customsPortal: 'Bayan'
  }
}

// ============================================================================
// MENA REGION DATA (Non-GCC Middle East)
// ============================================================================

export const MENA_COUNTRIES: Record<string, Country> = {
  EG: {
    code: 'EG',
    code3: 'EGY',
    name: 'Egypt',
    nameArabic: 'مصر',
    region: 'MENA',
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    customsAuthority: 'Egyptian Customs Authority',
    customsPortal: 'NAFEZA / CargoX (ACID)'
  },
  JO: {
    code: 'JO',
    code3: 'JOR',
    name: 'Jordan',
    nameArabic: 'الأردن',
    region: 'MENA',
    currency: 'JOD',
    timezone: 'Asia/Amman',
    customsAuthority: 'Jordan Customs Department',
    customsPortal: 'ASYCUDA World'
  },
  LB: {
    code: 'LB',
    code3: 'LBN',
    name: 'Lebanon',
    nameArabic: 'لبنان',
    region: 'MENA',
    currency: 'LBP',
    timezone: 'Asia/Beirut',
    customsAuthority: 'Lebanese Customs Administration',
    customsPortal: 'Under Development'
  }
}

// ============================================================================
// SAUDI-KUWAIT BORDER CROSSING POINTS
// ============================================================================

export const SA_KW_BORDER_CROSSINGS: BorderCrossingPoint[] = [
  {
    id: 'bcp-sa-khafji',
    code: 'SA-KHF-01',
    name: 'Al Khafji Border Crossing',
    nameLocal: 'منفذ الخفجي',
    alternateNames: ['Khafji Port', 'Eastern Border Post'],
    country: 'SA',
    coordinates: { latitude: 28.4167, longitude: 48.5000 },
    type: 'LAND',
    connectedBCP: 'bcp-kw-nuwaiseeb',
    distanceToConnectedBCP: 2,
    status: 'OPERATIONAL',
    operatingHours: {
      sunday: { open: '06:00', close: '22:00' },
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '06:00', close: '22:00' },
      notes: 'Commercial cargo: 06:00-18:00 only'
    },
    clearanceTypes: ['EXPORT', 'TRANSIT'],
    averageProcessingTime: { export: 4.5, import: 0, transit: 2.0 },
    facilities: [
      { type: 'INSPECTION_BAY', name: 'Primary Inspection', available: true, capacity: 10 },
      { type: 'DOCUMENT_OFFICE', name: 'Customs Hall', available: true },
      { type: 'WEIGHBRIDGE', name: 'Truck Scale', available: true, capacity: 2 },
      { type: 'PARKING', name: 'Truck Parking', available: true, capacity: 200 },
      { type: 'DG_YARD', name: 'Hazmat Holding', available: true, capacity: 20 }
    ],
    supportedTransportModes: ['ROAD'],
    maxVehicleCapacity: 500,
    hasXRayScanning: true,
    hasWeighbridge: true,
    hasColdStorage: false,
    hasDGHandling: true,
    hasLivestock: false,
    requiredDocuments: [
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin',
      'Bill of Lading / CMR',
      'Export Declaration (Bayan)',
      'SABER Certificate (if applicable)',
      'MSDS (for chemicals)',
      'Phytosanitary Certificate (if applicable)'
    ],
    preferredPrograms: ['Saudi AEO', 'Authorized Exporter'],
    restrictions: ['No livestock', 'DG requires prior approval'],
    customsOffice: 'Khafji Customs Office',
    phone: '+966-13-XXX-XXXX',
    congestionLevel: 'MEDIUM',
    reliabilityScore: 85,
    notes: 'Primary commercial crossing for Saudi-Kuwait trade. Peak congestion: Sunday-Tuesday.',
    lastUpdated: '2024-12-01'
  },
  {
    id: 'bcp-kw-nuwaiseeb',
    code: 'KW-NWS-01',
    name: 'Nuwaiseeb Border Crossing',
    nameLocal: 'منفذ النويصيب',
    alternateNames: ['Al Nuwaiseeb', 'Kuwait Southern Port'],
    country: 'KW',
    coordinates: { latitude: 28.4000, longitude: 48.4833 },
    type: 'LAND',
    connectedBCP: 'bcp-sa-khafji',
    distanceToConnectedBCP: 2,
    status: 'LIMITED',
    operatingHours: {
      sunday: { open: '08:00', close: '13:00' },
      monday: { open: '08:00', close: '13:00' },
      tuesday: { open: '08:00', close: '13:00' },
      wednesday: { open: '08:00', close: '13:00' },
      thursday: { open: '08:00', close: '13:00' },
      friday: null,
      saturday: { open: '08:00', close: '12:00' },
      notes: 'CRITICAL: Only 5 hours daily for commercial cargo. Friday closed.',
      holidaySchedule: 'Closed on all Kuwaiti public holidays'
    },
    clearanceTypes: ['IMPORT', 'TRANSIT'],
    averageProcessingTime: { export: 0, import: 55.43, transit: 12.0 },
    facilities: [
      { type: 'INSPECTION_BAY', name: 'Import Inspection', available: true, capacity: 6 },
      { type: 'DOCUMENT_OFFICE', name: 'Main Customs Building', available: true },
      { type: 'WEIGHBRIDGE', name: 'Entry Weighbridge', available: true, capacity: 1 },
      { type: 'PARKING', name: 'Arrival Holding', available: true, capacity: 150 },
      { type: 'COLD_STORAGE', name: 'Reefer Parking', available: true, capacity: 10 }
    ],
    supportedTransportModes: ['ROAD'],
    maxVehicleCapacity: 150,
    hasXRayScanning: true,
    hasWeighbridge: true,
    hasColdStorage: true,
    hasDGHandling: true,
    hasLivestock: true,
    requiredDocuments: [
      'Commercial Invoice (Arabic/English)',
      'Packing List',
      'Certificate of Origin (COO)',
      'Certificate of Analysis (COA)',
      'Bill of Lading / CMR',
      'Import Permit (if required)',
      'SFDA Registration (food/pharma)',
      'Kuwait Standards Certificate',
      'Halal Certificate (if applicable)',
      'MSDS (for chemicals)'
    ],
    preferredPrograms: ['Kuwait Golden List', 'GCC Trusted Trader'],
    restrictions: ['Limited hours severely impact throughput', 'Some DG classes prohibited'],
    customsOffice: 'Nuwaiseeb Customs Administration',
    phone: '+965-XXXX-XXXX',
    congestionLevel: 'CRITICAL',
    reliabilityScore: 55,
    notes: 'MAJOR BOTTLENECK: Limited 5-hour daily operation causes severe backlogs. Average wait 2-3 days for clearance. Arrive before 08:00 for same-day processing.',
    lastUpdated: '2024-12-01'
  },
  {
    id: 'bcp-sa-salmi',
    code: 'SA-SLM-01',
    name: 'Al Salmi Border Crossing (Saudi Side)',
    nameLocal: 'منفذ السالمي',
    alternateNames: ['Salmi Post', 'Western Border Post'],
    country: 'SA',
    coordinates: { latitude: 29.0833, longitude: 46.5333 },
    type: 'LAND',
    connectedBCP: 'bcp-kw-salmi',
    distanceToConnectedBCP: 3,
    status: 'OPERATIONAL',
    operatingHours: {
      sunday: { open: '06:00', close: '18:00' },
      monday: { open: '06:00', close: '18:00' },
      tuesday: { open: '06:00', close: '18:00' },
      wednesday: { open: '06:00', close: '18:00' },
      thursday: { open: '06:00', close: '18:00' },
      friday: { open: '08:00', close: '16:00' },
      saturday: { open: '06:00', close: '18:00' },
      notes: 'Primarily for passenger vehicles. Limited commercial capacity.'
    },
    clearanceTypes: ['EXPORT', 'TRANSIT'],
    averageProcessingTime: { export: 6.0, import: 0, transit: 3.0 },
    facilities: [
      { type: 'INSPECTION_BAY', name: 'Vehicle Inspection', available: true, capacity: 4 },
      { type: 'DOCUMENT_OFFICE', name: 'Border Office', available: true }
    ],
    supportedTransportModes: ['ROAD'],
    maxVehicleCapacity: 100,
    hasXRayScanning: false,
    hasWeighbridge: true,
    hasColdStorage: false,
    hasDGHandling: false,
    hasLivestock: true,
    requiredDocuments: [
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin',
      'Export Declaration'
    ],
    preferredPrograms: ['Saudi AEO'],
    restrictions: ['Not recommended for commercial freight', 'No DG handling', 'Limited capacity'],
    customsOffice: 'Salmi Customs Post',
    congestionLevel: 'LOW',
    reliabilityScore: 70,
    notes: 'Alternative route via desert. Longer transit but may avoid Khafji congestion. Not suitable for time-sensitive or DG cargo.',
    lastUpdated: '2024-12-01'
  },
  {
    id: 'bcp-kw-salmi',
    code: 'KW-SLM-01',
    name: 'Al Salmi Border Crossing (Kuwait Side)',
    nameLocal: 'منفذ السالمي',
    country: 'KW',
    coordinates: { latitude: 29.1000, longitude: 46.5500 },
    type: 'LAND',
    connectedBCP: 'bcp-sa-salmi',
    distanceToConnectedBCP: 3,
    status: 'OPERATIONAL',
    operatingHours: {
      sunday: { open: '07:00', close: '17:00' },
      monday: { open: '07:00', close: '17:00' },
      tuesday: { open: '07:00', close: '17:00' },
      wednesday: { open: '07:00', close: '17:00' },
      thursday: { open: '07:00', close: '17:00' },
      friday: null,
      saturday: { open: '07:00', close: '15:00' },
      notes: 'Limited commercial processing'
    },
    clearanceTypes: ['IMPORT', 'TRANSIT'],
    averageProcessingTime: { export: 0, import: 24.0, transit: 8.0 },
    facilities: [
      { type: 'INSPECTION_BAY', name: 'Border Checkpoint', available: true, capacity: 3 },
      { type: 'DOCUMENT_OFFICE', name: 'Customs Office', available: true }
    ],
    supportedTransportModes: ['ROAD'],
    maxVehicleCapacity: 80,
    hasXRayScanning: false,
    hasWeighbridge: true,
    hasColdStorage: false,
    hasDGHandling: false,
    hasLivestock: true,
    requiredDocuments: [
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin',
      'Import Permit'
    ],
    preferredPrograms: ['Kuwait Golden List'],
    restrictions: ['No DG', 'Limited capacity', 'Longer processing times'],
    customsOffice: 'Salmi Border Control',
    congestionLevel: 'LOW',
    reliabilityScore: 65,
    notes: 'Secondary crossing. Longer route but potential alternative during Nuwaiseeb congestion. 10 hours daily operation vs 5 at Nuwaiseeb.',
    lastUpdated: '2024-12-01'
  }
]

// ============================================================================
// SAUDI-KUWAIT TRADE LANES
// ============================================================================

export const SA_KW_TRADE_LANES: TradeLane[] = [
  {
    id: 'lane-sa-kw-001',
    code: 'SA-KW-001',
    name: 'Saudi Arabia → Kuwait (Primary Coastal Route)',
    description: 'Main commercial corridor via Khafji-Nuwaiseeb border crossing. Fastest route for most cargo.',
    originCountry: 'SA',
    destinationCountry: 'KW',
    routes: [
      {
        id: 'route-sa-kw-001-a',
        code: 'SA-KW-001-A',
        name: 'Yanbu → Kuwait City via Khafji',
        description: 'Primary commercial route from Western Saudi to Kuwait',
        primaryMode: 'ROAD',
        modes: ['ROAD'],
        origin: {
          id: 'wp-yanbu-origin',
          locationId: 'loc-yanbu',
          name: 'Yanbu Industrial City',
          type: 'ORIGIN',
          sequence: 0,
          coordinates: { latitude: 24.0231, longitude: 38.0456 },
          estimatedDwell: 8.5,
          dwellVariance: 3,
          activities: [
            { type: 'LOADING', name: 'Loading Bay Operations', estimatedDuration: 6.5, mandatory: true },
            { type: 'DOCUMENTATION', name: 'Export Documentation', estimatedDuration: 5.0, mandatory: true }
          ]
        },
        destination: {
          id: 'wp-kuwait-city-dest',
          locationId: 'loc-kuwait-city',
          name: 'Kuwait City (Shuwaikh)',
          type: 'DESTINATION',
          sequence: 6,
          coordinates: { latitude: 29.3375, longitude: 47.9774 },
          estimatedDwell: 16.77,
          dwellVariance: 10,
          activities: [
            { type: 'UNLOADING', name: 'Consignee Receiving', estimatedDuration: 8.83, mandatory: true }
          ]
        },
        waypoints: [
          {
            id: 'wp-dammam',
            locationId: 'loc-dammam',
            name: 'Dammam (Transit)',
            type: 'PICKUP',
            sequence: 1,
            coordinates: { latitude: 26.4207, longitude: 50.0888 },
            estimatedDwell: 0,
            dwellVariance: 0,
            activities: []
          },
          {
            id: 'wp-khafji',
            locationId: 'loc-khafji',
            name: 'Al Khafji BCP',
            type: 'BORDER',
            sequence: 2,
            coordinates: { latitude: 28.4167, longitude: 48.5000 },
            estimatedDwell: 7.21,
            dwellVariance: 4,
            activities: [
              { type: 'CUSTOMS_CLEARANCE', name: 'Saudi Export Clearance', estimatedDuration: 4.5, mandatory: true },
              { type: 'INSPECTION', name: 'Export Inspection', estimatedDuration: 2.5, mandatory: false }
            ]
          },
          {
            id: 'wp-nuwaiseeb',
            locationId: 'loc-nuwaiseeb',
            name: 'Nuwaiseeb BCP',
            type: 'BORDER',
            sequence: 3,
            coordinates: { latitude: 28.4000, longitude: 48.4833 },
            estimatedDwell: 55.43,
            dwellVariance: 25,
            activities: [
              { type: 'CUSTOMS_CLEARANCE', name: 'Kuwait Import Clearance', estimatedDuration: 48, mandatory: true },
              { type: 'INSPECTION', name: 'Import Inspection', estimatedDuration: 4, mandatory: true },
              { type: 'DOCUMENTATION', name: 'COA/COO Verification', estimatedDuration: 2, mandatory: true }
            ],
            notes: 'CRITICAL BOTTLENECK: 5-hour daily operation window'
          }
        ],
        segments: [
          {
            id: 'seg-yanbu-dammam',
            fromWaypointId: 'wp-yanbu-origin',
            toWaypointId: 'wp-dammam',
            mode: 'ROAD',
            distance: 1150,
            estimatedDuration: 12,
            durationRange: { min: 10, max: 14 },
            routeDescription: 'Cross-Kingdom Highway via Riyadh bypass',
            highways: ['Highway 40', 'Highway 65'],
            borderCrossing: false,
            tollRoads: false,
            riskLevel: 'LOW',
            congestionProbability: 15,
            estimatedCO2: 1.15
          },
          {
            id: 'seg-dammam-khafji',
            fromWaypointId: 'wp-dammam',
            toWaypointId: 'wp-khafji',
            mode: 'ROAD',
            distance: 280,
            estimatedDuration: 3.5,
            durationRange: { min: 3, max: 4.5 },
            routeDescription: 'Coastal Highway to Khafji Border',
            highways: ['Highway 95'],
            borderCrossing: false,
            tollRoads: false,
            riskLevel: 'LOW',
            congestionProbability: 20,
            estimatedCO2: 0.28
          },
          {
            id: 'seg-khafji-nuwaiseeb',
            fromWaypointId: 'wp-khafji',
            toWaypointId: 'wp-nuwaiseeb',
            mode: 'ROAD',
            distance: 2,
            estimatedDuration: 0.5,
            durationRange: { min: 0.25, max: 2 },
            routeDescription: 'Cross-border transit zone',
            borderCrossing: true,
            tollRoads: false,
            riskLevel: 'MEDIUM',
            congestionProbability: 60,
            estimatedCO2: 0.01
          },
          {
            id: 'seg-nuwaiseeb-kuwait',
            fromWaypointId: 'wp-nuwaiseeb',
            toWaypointId: 'wp-kuwait-city-dest',
            mode: 'ROAD',
            distance: 120,
            estimatedDuration: 2.37,
            durationRange: { min: 1.8, max: 3.1 },
            routeDescription: 'Highway 80 to Kuwait City',
            highways: ['Highway 80', 'Fifth Ring Road'],
            borderCrossing: false,
            tollRoads: false,
            riskLevel: 'LOW',
            congestionProbability: 25,
            estimatedCO2: 0.12
          }
        ],
        borderCrossings: [
          {
            sequence: 1,
            exportBCP: 'bcp-sa-khafji',
            importBCP: 'bcp-kw-nuwaiseeb',
            clearanceType: 'EXPORT',
            estimatedClearanceTime: 62.64,
            clearanceTimeRange: { min: 42, max: 92 },
            requiredDocuments: [
              'Commercial Invoice',
              'Packing List', 
              'COO',
              'COA',
              'B/L or CMR',
              'Export Declaration',
              'Import Permit',
              'SFDA Registration'
            ],
            inspectionProbability: 45,
            expeditedPrograms: ['Saudi AEO', 'Kuwait Golden List'],
            notes: 'Kuwait side is the bottleneck - plan for 2-3 day clearance'
          }
        ],
        totalDistance: 1552,
        estimatedTransitTime: 125.34,
        transitTimeRange: { min: 95, max: 180 },
        relativeCost: 'MEDIUM',
        tollsRequired: false,
        riskLevel: 'HIGH',
        reliabilityScore: 60,
        seasonalRestrictions: ['Ramadan: Reduced customs hours', 'Summer: Heat restrictions for some cargo'],
        weatherSensitivity: 'LOW',
        bestFor: ['Standard commercial cargo', 'Chemical products', 'Industrial goods'],
        avoidFor: ['Urgent shipments (use air)', 'Perishables without contingency'],
        isDefault: true,
        isActive: true
      },
      {
        id: 'route-sa-kw-001-b',
        code: 'SA-KW-001-B',
        name: 'Yanbu → Kuwait City via Al Salmi (Alternative)',
        description: 'Alternative desert route via Al Salmi crossing. Longer but may avoid Nuwaiseeb congestion.',
        primaryMode: 'ROAD',
        modes: ['ROAD'],
        origin: {
          id: 'wp-yanbu-origin-alt',
          locationId: 'loc-yanbu',
          name: 'Yanbu Industrial City',
          type: 'ORIGIN',
          sequence: 0,
          coordinates: { latitude: 24.0231, longitude: 38.0456 },
          estimatedDwell: 8.5,
          dwellVariance: 3,
          activities: [
            { type: 'LOADING', name: 'Loading Bay Operations', estimatedDuration: 6.5, mandatory: true },
            { type: 'DOCUMENTATION', name: 'Export Documentation', estimatedDuration: 5.0, mandatory: true }
          ]
        },
        destination: {
          id: 'wp-kuwait-city-dest-alt',
          locationId: 'loc-kuwait-city',
          name: 'Kuwait City (Shuwaikh)',
          type: 'DESTINATION',
          sequence: 5,
          coordinates: { latitude: 29.3375, longitude: 47.9774 },
          estimatedDwell: 16.77,
          dwellVariance: 10,
          activities: [
            { type: 'UNLOADING', name: 'Consignee Receiving', estimatedDuration: 8.83, mandatory: true }
          ]
        },
        waypoints: [
          {
            id: 'wp-riyadh',
            locationId: 'loc-riyadh',
            name: 'Riyadh (Bypass)',
            type: 'PICKUP',
            sequence: 1,
            coordinates: { latitude: 24.7136, longitude: 46.6753 },
            estimatedDwell: 0,
            dwellVariance: 0,
            activities: []
          },
          {
            id: 'wp-hafar-albatin',
            locationId: 'loc-hafar-albatin',
            name: 'Hafar Al-Batin',
            type: 'PICKUP',
            sequence: 2,
            coordinates: { latitude: 28.4333, longitude: 45.9667 },
            estimatedDwell: 1,
            dwellVariance: 0.5,
            activities: [
              { type: 'REST', name: 'Driver Rest Stop', estimatedDuration: 1, mandatory: false }
            ]
          },
          {
            id: 'wp-salmi-sa',
            locationId: 'loc-salmi-sa',
            name: 'Al Salmi BCP (Saudi)',
            type: 'BORDER',
            sequence: 3,
            coordinates: { latitude: 29.0833, longitude: 46.5333 },
            estimatedDwell: 6.0,
            dwellVariance: 3,
            activities: [
              { type: 'CUSTOMS_CLEARANCE', name: 'Saudi Export Clearance', estimatedDuration: 6.0, mandatory: true }
            ]
          },
          {
            id: 'wp-salmi-kw',
            locationId: 'loc-salmi-kw',
            name: 'Al Salmi BCP (Kuwait)',
            type: 'BORDER',
            sequence: 4,
            coordinates: { latitude: 29.1000, longitude: 46.5500 },
            estimatedDwell: 24.0,
            dwellVariance: 12,
            activities: [
              { type: 'CUSTOMS_CLEARANCE', name: 'Kuwait Import Clearance', estimatedDuration: 20, mandatory: true },
              { type: 'INSPECTION', name: 'Import Inspection', estimatedDuration: 3, mandatory: true }
            ],
            notes: '10-hour daily operation - better than Nuwaiseeb (5 hours)'
          }
        ],
        segments: [],
        borderCrossings: [
          {
            sequence: 1,
            exportBCP: 'bcp-sa-salmi',
            importBCP: 'bcp-kw-salmi',
            clearanceType: 'EXPORT',
            estimatedClearanceTime: 30,
            clearanceTimeRange: { min: 18, max: 48 },
            requiredDocuments: [
              'Commercial Invoice',
              'Packing List',
              'COO',
              'B/L or CMR',
              'Export Declaration',
              'Import Permit'
            ],
            inspectionProbability: 60,
            expeditedPrograms: ['Saudi AEO', 'Kuwait Golden List'],
            notes: 'Longer route but more predictable clearance times'
          }
        ],
        totalDistance: 1680,
        estimatedTransitTime: 95,
        transitTimeRange: { min: 72, max: 130 },
        relativeCost: 'HIGH',
        tollsRequired: false,
        riskLevel: 'MEDIUM',
        reliabilityScore: 70,
        seasonalRestrictions: ['Summer: Desert heat restrictions'],
        weatherSensitivity: 'MEDIUM',
        bestFor: ['When Nuwaiseeb is congested', 'Non-urgent bulk cargo', 'Livestock'],
        avoidFor: ['DG cargo', 'Time-sensitive shipments', 'Reefer cargo'],
        isDefault: false,
        isActive: true
      }
    ],
    defaultRouteId: 'route-sa-kw-001-a',
    primaryCommodities: ['Chemicals', 'Construction Materials', 'Food Products', 'Industrial Equipment', 'Plastics'],
    restrictedCommodities: ['Alcohol', 'Pork Products', 'Certain Pharmaceuticals'],
    hsCodePrefixes: ['28', '29', '39', '72', '84', '85'],
    tradeAgreements: ['GCC Customs Union', 'Arab Free Trade Area'],
    availablePrograms: [
      {
        programId: 'prog-sa-aeo',
        name: 'Saudi Authorized Economic Operator (AEO)',
        authority: 'ZATCA',
        benefitSummary: 'Expedited export clearance, reduced inspections',
        timeReduction: 30,
        costReduction: 15
      },
      {
        programId: 'prog-kw-golden-list',
        name: 'Kuwait Golden List',
        authority: 'Kuwait Customs',
        benefitSummary: 'Priority processing, extended hours access',
        timeReduction: 40,
        costReduction: 20
      },
      {
        programId: 'prog-gcc-trusted-trader',
        name: 'GCC Trusted Trader',
        authority: 'GCC Secretariat',
        benefitSummary: 'Mutual recognition across all GCC states',
        timeReduction: 25,
        costReduction: 10
      }
    ],
    averageTransitTime: 125.34,
    transitTimeVariance: 42.5,
    reliabilityScore: 62,
    requiredCertificates: ['COO', 'COA', 'Commercial Invoice', 'Packing List'],
    regulatoryNotes: 'Kuwait customs operates limited hours (5hrs/day at Nuwaiseeb). Plan shipments to arrive before 08:00 for same-day processing.',
    isActive: true,
    lastUpdated: '2024-12-01'
  }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getBorderCrossingById(id: string): BorderCrossingPoint | undefined {
  return SA_KW_BORDER_CROSSINGS.find(bcp => bcp.id === id)
}

export function getTradeLaneByCode(code: string): TradeLane | undefined {
  return SA_KW_TRADE_LANES.find(lane => lane.code === code)
}

export function getRoutesByLane(laneId: string): TradeLaneRoute[] {
  const lane = SA_KW_TRADE_LANES.find(l => l.id === laneId)
  return lane?.routes || []
}

export function getBCPsByCountry(countryCode: string): BorderCrossingPoint[] {
  return SA_KW_BORDER_CROSSINGS.filter(bcp => bcp.country === countryCode)
}

export function formatOperatingHours(hours: OperatingHours): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
  const formatted = days.map(day => {
    const schedule = hours[day]
    if (!schedule) return `${day.charAt(0).toUpperCase() + day.slice(1, 3)}: Closed`
    return `${day.charAt(0).toUpperCase() + day.slice(1, 3)}: ${schedule.open}-${schedule.close}`
  })
  return formatted.join(' | ')
}

export function calculateRouteRisk(route: TradeLaneRoute): RiskLevel {
  const criticalBottlenecks = route.waypoints.filter(wp => 
    wp.notes?.includes('CRITICAL') || wp.estimatedDwell > 48
  ).length
  
  if (criticalBottlenecks > 0 || route.reliabilityScore < 50) return 'CRITICAL'
  if (route.reliabilityScore < 65) return 'HIGH'
  if (route.reliabilityScore < 80) return 'MEDIUM'
  return 'LOW'
}


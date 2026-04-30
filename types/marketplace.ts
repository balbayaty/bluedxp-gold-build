/**
 * Marketplace Types
 * Comprehensive marketplace for all logistics and professional services
 * Benchmarking: Expert360, Thumbtack, Sulekha, Clicktrans, Catalant
 */

// ============================================================================
// SERVICE CATEGORIES
// ============================================================================

export type MarketplaceServiceCategory =
  | 'STORAGE'                    // Warehouse storage services
  | 'CROSSDOCKING'               // Cross-docking services
  | 'TRANSPORTATION'              // Transportation services
  | 'FREIGHT'                     // Freight forwarding
  | 'CONSULTING'                  // Professional consulting services
  | 'MANPOWER'                    // Manpower/staffing services
  | 'TRANSLATION'                 // Translation services
  | 'WAREHOUSE_NETWORK'           // Warehouse network/distribution centers
  | 'CUSTOMS_CLEARANCE'          // Customs clearance services
  | 'VALUE_ADDED_SERVICES'       // VAS (labeling, kitting, etc.)
  | 'QUALITY_SERVICES'            // Quality inspection, testing
  | 'FACILITY_SERVICES'           // Facility management services
  | 'TECHNOLOGY_SERVICES'         // IT/Technology services
  | 'FINANCIAL_SERVICES'          // Financial/insurance services
  | 'OTHER'                       // Other services

// ============================================================================
// STORAGE SERVICES
// ============================================================================

export type StorageServiceType =
  | 'GENERAL_STORAGE'             // General warehouse storage
  | 'COLD_STORAGE'                // Cold storage/refrigerated
  | 'HAZMAT_STORAGE'              // Hazardous materials storage
  | 'BONDED_STORAGE'              // Bonded warehouse storage
  | 'BULK_STORAGE'                // Bulk storage
  | 'RACK_STORAGE'                // Rack storage
  | 'OPEN_YARD'                   // Open yard storage
  | 'TEMPORARY_STORAGE'           // Temporary storage
  | 'LONG_TERM_STORAGE'           // Long-term storage

export interface StorageServiceListing {
  id: string
  providerId: string
  providerName: string
  serviceCategory?: MarketplaceServiceCategory
  serviceType: StorageServiceType
  warehouseId?: string
  warehouseName?: string
  location: {
    address: string
    city: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  capacity: {
    total: number              // Total capacity (m³ or m²)
    available: number          // Available capacity
    unit: 'CUBIC_METERS' | 'SQUARE_METERS' | 'PALLETS' | 'TONS'
  }
  features: string[]            // Features: ['24/7 Access', 'Security', 'Climate Control']
  pricing: {
    model: 'PER_UNIT' | 'PER_MONTH' | 'PER_DAY' | 'CUSTOM'
    basePrice: number
    currency: string
    unit?: string
    minimumCommitment?: number
    discounts?: {
      volume: number           // Volume discount percentage
      longTerm: number         // Long-term discount percentage
    }
  }
  capabilities: {
    handling?: boolean         // Material handling available
    inventoryManagement?: boolean
    realTimeTracking?: boolean
    reporting?: boolean
  }
  certifications: string[]     // ISO, SABER, SFDA, etc.
  rating: number               // Average rating (1-5)
  totalBookings: number
  availability: 'AVAILABLE' | 'LIMITED' | 'FULL'
  createdAt: string
  updatedAt: string
}

// ============================================================================
// CROSSDOCKING SERVICES
// ============================================================================

export interface CrossDockingServiceListing {
  id: string
  providerId: string
  providerName: string
  serviceCategory?: MarketplaceServiceCategory
  facilityId?: string
  facilityName?: string
  location: {
    address: string
    city: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  throughput: {
    daily: number              // Daily throughput capacity
    hourly?: number             // Hourly throughput
    unit: 'PALLETS' | 'CONTAINERS' | 'TONS'
  }
  dockDoors: number
  operatingHours: {
    start: string
    end: string
    days: string[]
    timezone: string
  }
  pricing: {
    model: 'PER_PALLET' | 'PER_CONTAINER' | 'PER_TON' | 'FIXED'
    basePrice: number
    currency: string
    rushFee?: number
  }
  capabilities: {
    sameDay?: boolean
    nextDay?: boolean
    sorting?: boolean
    consolidation?: boolean
    deconsolidation?: boolean
  }
  rating: number
  totalBookings: number
  availability: 'AVAILABLE' | 'LIMITED' | 'FULL'
  createdAt: string
  updatedAt: string
}

// ============================================================================
// TRANSPORTATION SERVICES
// ============================================================================

export type TransportServiceType =
  | 'FTL'                       // Full Truck Load
  | 'LTL'                       // Less Than Truck Load
  | 'EXPRESS'                   // Express delivery
  | 'LAST_MILE'                 // Last mile delivery
  | 'DEDICATED_FLEET'           // Dedicated fleet
  | 'SHARED_TRANSPORT'          // Shared transport

export interface TransportationServiceListing {
  id: string
  providerId: string
  providerName: string
  serviceCategory?: MarketplaceServiceCategory
  carrierId?: string
  serviceType: TransportServiceType
  routes: {
    origin: string
    destination: string
    distance?: number           // km
    estimatedTime?: number      // hours
  }[]
  fleet: {
    totalVehicles: number
    availableVehicles: number
    vehicleTypes: string[]     // ['Truck', 'Van', 'Refrigerated']
  }
  pricing: {
    model: 'PER_KM' | 'PER_TON' | 'PER_PALLET' | 'FIXED_ROUTE' | 'QUOTE_BASED'
    basePrice: number
    currency: string
    fuelSurcharge?: number      // Percentage
    minimumCharge?: number
  }
  capabilities: {
    tracking?: boolean
    temperatureControl?: boolean
    hazmat?: boolean
    oversized?: boolean
    insurance?: boolean
  }
  certifications: string[]      // Transport licenses, insurance
  rating: number
  onTimePerformance: number     // Percentage
  totalBookings: number
  availability: 'AVAILABLE' | 'LIMITED' | 'FULL'
  createdAt: string
  updatedAt: string
}

// ============================================================================
// FREIGHT SERVICES
// ============================================================================

export type FreightServiceType =
  | 'FCL'                       // Full Container Load
  | 'LCL'                       // Less Container Load
  | 'AIR_FREIGHT'               // Air freight
  | 'SEA_FREIGHT'               // Sea freight
  | 'RAIL_FREIGHT'              // Rail freight
  | 'MULTIMODAL'                // Multimodal
  | 'BREAKBULK'                 // Breakbulk
  | 'PROJECT_CARGO'             // Project cargo

export interface FreightServiceListing {
  id: string
  providerId: string
  providerName: string
  serviceCategory?: MarketplaceServiceCategory
  serviceType: FreightServiceType
  routes: {
    origin: string              // Port/Airport code
    destination: string
    transitTime?: number        // days
    frequency?: string          // 'Daily', 'Weekly', etc.
  }[]
  pricing: {
    model: 'PER_CONTAINER' | 'PER_KG' | 'PER_CBM' | 'QUOTE_BASED'
    basePrice: number
    currency: string
    surcharges?: {
      fuel?: number
      security?: number
      peak?: number
    }
  }
  capabilities: {
    customsClearance?: boolean
    doorToDoor?: boolean
    insurance?: boolean
    tracking?: boolean
  }
  certifications: string[]
  rating: number
  totalBookings: number
  availability: 'AVAILABLE' | 'LIMITED' | 'FULL'
  createdAt: string
  updatedAt: string
}

// ============================================================================
// CONSULTING SERVICES
// ============================================================================

export type ConsultingServiceType =
  | 'CIVIL_DEFENSE'             // Civil Defense consulting
  | 'SAUDIZATION'               // Saudization consulting
  | 'COMPLIANCE'                // Compliance consulting
  | 'REGULATORY'                // Regulatory consulting
  | 'SAFETY'                    // Safety consulting
  | 'QUALITY'                   // Quality consulting
  | 'ENVIRONMENTAL'              // Environmental consulting
  | 'LEGAL'                     // Legal consulting
  | 'FINANCIAL'                 // Financial consulting
  | 'TECHNICAL'                 // Technical consulting
  | 'STRATEGIC'                 // Strategic consulting

export interface ConsultingServiceListing {
  id: string
  providerId: string
  providerName: string
  serviceCategory?: MarketplaceServiceCategory
  consultantId?: string
  consultantName?: string
  serviceType: ConsultingServiceType
  specialties: string[]         // ['Civil Defense Licensing', 'Fire Safety']
  serviceAreas: string[]        // ['Riyadh', 'Jeddah', 'Dammam']
  pricing: {
    model: 'HOURLY' | 'DAILY' | 'PROJECT' | 'FIXED'
    basePrice: number
    currency: string
    minimumHours?: number
  }
  experience: {
    years: number
    totalProjects: number
    successRate: number         // Percentage
  }
  certifications: string[]      // Professional certifications
  languages: string[]           // Languages spoken
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE'
  rating: number
  totalBookings: number
  averageResponseTime: number   // hours
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MANPOWER SERVICES
// ============================================================================

export type ManpowerServiceType =
  | 'WAREHOUSE_STAFF'           // Warehouse staff
  | 'DRIVERS'                   // Drivers
  | 'ADMINISTRATIVE'            // Administrative staff
  | 'TECHNICAL'                 // Technical staff
  | 'MANAGEMENT'                // Management staff
  | 'SAUDIZATION_COMPLIANCE'    // Saudization compliance
  | 'TRAINING'                  // Training services

export interface ManpowerServiceListing {
  id: string
  providerId: string
  providerName: string
  serviceCategory?: MarketplaceServiceCategory
  serviceType: ManpowerServiceType
  availableStaff: {
    total: number
    available: number
    qualifications: string[]
  }
  pricing: {
    model: 'PER_HOUR' | 'PER_DAY' | 'PER_MONTH' | 'FIXED'
    basePrice: number
    currency: string
    benefits?: string[]         // Benefits included
  }
  capabilities: {
    backgroundChecks?: boolean
    training?: boolean
    certifications?: boolean
    insurance?: boolean
  }
  certifications: string[]      // Labor licenses, etc.
  rating: number
  totalBookings: number
  availability: 'AVAILABLE' | 'LIMITED' | 'FULL'
  createdAt: string
  updatedAt: string
}

// ============================================================================
// TRANSLATION SERVICES
// ============================================================================

export interface TranslationServiceListing {
  id: string
  providerId: string
  providerName: string
  serviceCategory?: MarketplaceServiceCategory
  translatorId?: string
  translatorName?: string
  languages: {
    from: string[]
    to: string[]
  }
  specialties: string[]          // ['Legal', 'Technical', 'Medical']
  pricing: {
    model: 'PER_WORD' | 'PER_PAGE' | 'PER_HOUR' | 'FIXED'
    basePrice: number
    currency: string
    rushFee?: number
  }
  capabilities: {
    certified?: boolean
    notarized?: boolean
    sameDay?: boolean
    proofreading?: boolean
  }
  certifications: string[]      // Translation certifications
  rating: number
  totalBookings: number
  averageTurnaroundTime: number // hours
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE'
  createdAt: string
  updatedAt: string
}

// ============================================================================
// WAREHOUSE NETWORK SERVICES
// ============================================================================

export interface WarehouseNetworkListing {
  id: string
  providerId: string
  providerName: string
  serviceCategory?: MarketplaceServiceCategory
  networkId?: string
  networkName?: string
  warehouses: {
    warehouseId: string
    warehouseName: string
    location: {
      city: string
      country: string
      coordinates?: { lat: number; lng: number }
    }
    type: string
    capacity: number
  }[]
  coverage: {
    regions: string[]           // Regions covered
    countries: string[]         // Countries covered
  }
  capabilities: {
    multiLocation?: boolean
    inventoryTransfer?: boolean
    centralizedManagement?: boolean
    realTimeVisibility?: boolean
  }
  pricing: {
    model: 'PER_WAREHOUSE' | 'NETWORK_FEE' | 'CUSTOM'
    basePrice: number
    currency: string
  }
  rating: number
  totalBookings: number
  availability: 'AVAILABLE' | 'LIMITED' | 'FULL'
  createdAt: string
  updatedAt: string
}

// ============================================================================
// UNIFIED SERVICE LISTING
// ============================================================================

export type MarketplaceServiceListing =
  | StorageServiceListing
  | CrossDockingServiceListing
  | TransportationServiceListing
  | FreightServiceListing
  | ConsultingServiceListing
  | ManpowerServiceListing
  | TranslationServiceListing
  | WarehouseNetworkListing

// ============================================================================
// SERVICE PROVIDER
// ============================================================================

export interface ServiceProvider {
  id: string
  name: string
  type: 'COMPANY' | 'INDIVIDUAL' | 'NETWORK'
  description: string
  logo?: string
  contact: {
    email: string
    phone: string
    website?: string
    address?: string
  }
  services: MarketplaceServiceCategory[]
  rating: number
  totalBookings: number
  totalRevenue: number
  verified: boolean
  certifications: string[]
  joinedDate: string
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
}

// ============================================================================
// BOOKING/ORDER
// ============================================================================

export type BookingStatus =
  | 'PENDING'                   // Pending provider acceptance
  | 'CONFIRMED'                 // Provider confirmed
  | 'IN_PROGRESS'               // Service in progress
  | 'COMPLETED'                 // Service completed
  | 'CANCELLED'                 // Cancelled
  | 'DISPUTED'                  // Dispute raised

export interface MarketplaceBooking {
  id: string
  bookingNumber: string
  customerId: string
  customerName: string
  providerId: string
  providerName: string
  serviceId: string
  serviceCategory: MarketplaceServiceCategory
  serviceDetails: Record<string, any>  // Service-specific details
  status: BookingStatus
  pricing: {
    basePrice: number
    currency: string
    fees?: number
    taxes?: number
    total: number
  }
  schedule: {
    startDate: string
    endDate?: string
    duration?: number
  }
  location?: {
    address: string
    coordinates?: { lat: number; lng: number }
  }
  requirements?: string[]        // Special requirements
  notes?: string
  rating?: number               // Customer rating after completion
  review?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// SEARCH & FILTERS
// ============================================================================

export interface MarketplaceSearchFilters {
  category?: MarketplaceServiceCategory
  location?: {
    city?: string
    country?: string
    radius?: number              // km
    coordinates?: { lat: number; lng: number }
  }
  priceRange?: {
    min?: number
    max?: number
    currency?: string
  }
  rating?: {
    min?: number
  }
  availability?: 'AVAILABLE' | 'LIMITED' | 'FULL'
  certifications?: string[]
  features?: string[]
  dateRange?: {
    start: string
    end: string
  }
}

// ============================================================================
// REVIEWS & RATINGS
// ============================================================================

export interface MarketplaceReview {
  id: string
  bookingId: string
  serviceId: string
  providerId: string
  customerId: string
  customerName: string
  rating: number                // 1-5
  review: string
  categories: {
    quality: number
    timeliness: number
    communication: number
    value: number
  }
  helpful: number               // Helpful votes
  verified: boolean             // Verified booking
  createdAt: string
}












/**
 * WASL (Electronic Freight Forwarder) Types
 * 
 * Comprehensive type definitions for WASL/Rabet.sa EFF services
 * Based on OpenAPI 3.0.1 specification
 */

// ============================================================================
// AUTHENTICATION
// ============================================================================

export interface WaslAuthConfig {
  appId: string
  appKey: string
  apiBaseUrl?: string
  environment?: 'sandbox' | 'production'
  timeout?: number
  retryAttempts?: number
}

// ============================================================================
// VEHICLE TYPES
// ============================================================================

export interface VehiclePlate {
  plateNumber: string
  plateType?: string
  plateCode?: string
}

export interface EffVehicleCreateDto {
  plateNumber: string
  plateType?: string
  plateCode?: string
  vehicleType?: string
  vehicleModel?: string
  vehicleYear?: number
  vehicleColor?: string
  chassisNumber?: string
  engineNumber?: string
  ownerName?: string
  ownerNationalId?: string
  registrationExpiryDate?: string
  insuranceExpiryDate?: string
  [key: string]: any // Allow additional fields
}

export interface EffVehicleDeleteDto {
  plateNumber: string
  plateType?: string
  plateCode?: string
}

// ============================================================================
// DRIVER TYPES
// ============================================================================

export interface EffDriverCreateDto {
  nationalId: string
  fullName: string
  mobileNumber: string
  email?: string
  licenseNumber: string
  licenseType?: string
  licenseExpiryDate?: string
  dateOfBirth?: string
  address?: string
  [key: string]: any // Allow additional fields
}

export interface EffDriverDeleteDto {
  nationalId: string
}

// ============================================================================
// TRIP TYPES
// ============================================================================

export interface EffTripCreateDto {
  tripNumber?: string // Optional - may be auto-generated
  vehiclePlate: VehiclePlate
  driverNationalId: string
  origin: {
    address: string
    city?: string
    region?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  destination: {
    address: string
    city?: string
    region?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  plannedStartDate: string // ISO 8601 format
  plannedEndDate?: string // ISO 8601 format
  cargoDescription?: string
  cargoWeight?: number
  cargoValue?: number
  tripType?: string
  [key: string]: any // Allow additional fields
}

export interface EffTripUpdateDto {
  tripNumber: string
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  actualStartDate?: string
  actualEndDate?: string
  currentLocation?: {
    address: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    timestamp?: string
  }
  notes?: string
  [key: string]: any // Allow additional fields
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface WaslResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: WaslError[]
  timestamp?: string
}

export interface WaslError {
  code: string
  message: string
  field?: string
  details?: any
}

export interface WaslResponseEntityEffRejectionReasonResponseDto {
  rejectionReason?: string
  rejectionCode?: string
  rejectionDetails?: string
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface WaslEFFService {
  // Vehicle Management
  registerVehicle(vehicle: EffVehicleCreateDto): Promise<WaslResponse<VehiclePlate>>
  deleteVehicle(vehicle: EffVehicleDeleteDto): Promise<WaslResponse<void>>
  
  // Driver Management
  registerDriver(driver: EffDriverCreateDto): Promise<WaslResponse<{ nationalId: string }>>
  deleteDriver(driver: EffDriverDeleteDto): Promise<WaslResponse<void>>
  
  // Trip Management
  registerTrip(trip: EffTripCreateDto): Promise<WaslResponse<{ tripNumber: string }>>
  updateTrip(tripNumber: string, updates: EffTripUpdateDto): Promise<WaslResponse<{ tripNumber: string }>>
  getTrip(tripNumber: string): Promise<WaslResponse<EffTripCreateDto & { status?: string }>>
}

// ============================================================================
// ADAPTER CONFIGURATION
// ============================================================================

export interface WaslAdapterConfig {
  appId: string
  appKey: string
  apiBaseUrl?: string
  environment?: 'sandbox' | 'production'
  timeout?: number
  retryAttempts?: number
  enableLogging?: boolean
  enableCaching?: boolean
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface WaslVehicle {
  plateNumber: string
  plateType?: string
  plateCode?: string
  vehicleType?: string
  vehicleModel?: string
  vehicleYear?: number
  ownerName?: string
  ownerNationalId?: string
  registrationExpiryDate?: string
  insuranceExpiryDate?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  registeredAt?: string
  lastUpdatedAt?: string
}

export interface WaslDriver {
  nationalId: string
  fullName: string
  mobileNumber: string
  email?: string
  licenseNumber: string
  licenseType?: string
  licenseExpiryDate?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  registeredAt?: string
  lastUpdatedAt?: string
}

export interface WaslTrip {
  tripNumber: string
  vehiclePlate: VehiclePlate
  driverNationalId: string
  origin: {
    address: string
    city?: string
    region?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  destination: {
    address: string
    city?: string
    region?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  plannedStartDate: string
  plannedEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  currentLocation?: {
    address: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    timestamp?: string
  }
  cargoDescription?: string
  cargoWeight?: number
  cargoValue?: number
  tripType?: string
  registeredAt?: string
  lastUpdatedAt?: string
}




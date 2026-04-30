/**
 * Daleel API (Waybill Package) Types
 * 
 * Comprehensive type definitions for Daleel real-time location tracking
 * Based on OpenAPI 3.0.1 specification
 */

// ============================================================================
// AUTHENTICATION
// ============================================================================

export interface DaleelAuthConfig {
  username: string
  password: string
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

export interface AssignTagRequestDTO {
  vehiclePlate: VehiclePlate
  clientId?: string
  tag?: string
  [key: string]: any
}

export interface BulkAssignTagRequestDTO {
  vehicles: VehiclePlate[]
  clientId?: string
  tag?: string
  [key: string]: any
}

export interface BulkAssignTagResponseDTO {
  success: boolean
  assigned: number
  failed: number
  results: Array<{
    vehiclePlate: VehiclePlate
    success: boolean
    message?: string
  }>
}

export interface UnassignTagRequestDTO {
  vehiclePlate: VehiclePlate
  [key: string]: any
}

export interface BayanAssignTagRequestDTO {
  vehiclePlate: VehiclePlate
  bayanNumber: string
  [key: string]: any
}

export interface BayanUnassignTagRequestDTO {
  vehiclePlate: VehiclePlate
  bayanNumber: string
  [key: string]: any
}

export interface SequenceNumberResponseDTO {
  sequenceNumber: string
  vehiclePlate: VehiclePlate
}

export interface VehicleInfoDTO {
  vehiclePlate: VehiclePlate
  vehicleType?: string
  vehicleModel?: string
  vehicleYear?: number
  ownerName?: string
  ownerNationalId?: string
  registrationDate?: string
  status?: string
  [key: string]: any
}

export interface VehicleInfoResponseDTO {
  success: boolean
  data?: VehicleInfoDTO
  message?: string
}

// ============================================================================
// LOCATION TYPES
// ============================================================================

export interface Point {
  latitude: number
  longitude: number
}

export interface CurrentLocationRequestDTO {
  vehiclePlate: VehiclePlate
  [key: string]: any
}

export interface VehicleLocationDTO {
  vehiclePlate: VehiclePlate
  location: Point
  timestamp: string
  speed?: number
  heading?: number
  address?: string
  city?: string
  region?: string
  [key: string]: any
}

export interface CurrentLocationResponseDTO {
  success: boolean
  data?: VehicleLocationDTO
  message?: string
}

export interface VehicleLocationDetailsDTO extends VehicleLocationDTO {
  accuracy?: number
  altitude?: number
  odometer?: number
  fuelLevel?: number
  engineStatus?: 'ON' | 'OFF'
  [key: string]: any
}

export interface CurrentLocationDetailsResponseDTO {
  success: boolean
  data?: VehicleLocationDetailsDTO
  message?: string
}

export interface CurrentLocationListRequestDTO {
  vehiclePlates: VehiclePlate[]
  [key: string]: any
}

export interface HistoryRequestDTO {
  vehiclePlate: VehiclePlate
  startDate: string // ISO 8601
  endDate: string // ISO 8601
  [key: string]: any
}

export interface HistoryResponseDTO {
  success: boolean
  data?: VehicleLocationDTO[]
  message?: string
}

export interface CurrentAndHistoryRequestDTO {
  vehiclePlate: VehiclePlate
  startDate: string // ISO 8601
  endDate: string // ISO 8601
  [key: string]: any
}

export interface PolygonRequestDTO {
  polygon: Point[] // Array of points forming polygon
  [key: string]: any
}

export interface PolygonResponseDTO {
  success: boolean
  data?: VehicleLocationDTO[]
  message?: string
}

export interface WeightDropRequestDTO {
  vehiclePlate: VehiclePlate
  startDate?: string // ISO 8601
  endDate?: string // ISO 8601
  [key: string]: any
}

export interface WeightDropResponseDTO {
  success: boolean
  data?: Array<{
    location: Point
    timestamp: string
    weight?: number
    [key: string]: any
  }>
  message?: string
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface SubscribeRequestDTO {
  vehiclePlates?: VehiclePlate[]
  eventTypes?: string[]
  webhookUrl?: string
  [key: string]: any
}

export interface SubscribeResponseDTO {
  success: boolean
  subscriptionId?: string
  message?: string
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface DaleelResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: DaleelError[]
  timestamp?: string
}

export interface DaleelError {
  code: string
  message: string
  field?: string
  details?: any
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface DaleelLocationService {
  // Current Location
  getCurrentLocation(vehiclePlate: VehiclePlate): Promise<DaleelResponse<VehicleLocationDTO>>
  getCurrentLocationDetails(vehiclePlate: VehiclePlate): Promise<DaleelResponse<VehicleLocationDetailsDTO>>
  getCurrentLocationList(vehiclePlates: VehiclePlate[]): Promise<DaleelResponse<VehicleLocationDetailsDTO[]>>
  
  // Historical Location
  getLocationHistory(vehiclePlate: VehiclePlate, startDate: string, endDate: string): Promise<DaleelResponse<VehicleLocationDTO[]>>
  getCurrentAndHistory(vehiclePlate: VehiclePlate, startDate: string, endDate: string): Promise<DaleelResponse<{ current?: VehicleLocationDTO; history: VehicleLocationDTO[] }>>
  
  // Advanced Location
  getVehiclesInPolygon(polygon: Point[]): Promise<DaleelResponse<VehicleLocationDTO[]>>
  getWeightDropLocations(vehiclePlate: VehiclePlate, startDate?: string, endDate?: string): Promise<DaleelResponse<WeightDropResponseDTO['data']>>
}

export interface DaleelVehicleService {
  // Vehicle Assignment
  assignTag(request: AssignTagRequestDTO): Promise<DaleelResponse<void>>
  assignTagWithLimit(request: AssignTagRequestDTO): Promise<DaleelResponse<void>>
  bulkAssignTag(request: BulkAssignTagRequestDTO): Promise<DaleelResponse<BulkAssignTagResponseDTO>>
  assignTagByBayan(request: BayanAssignTagRequestDTO): Promise<DaleelResponse<void>>
  unassignTag(request: UnassignTagRequestDTO): Promise<DaleelResponse<void>>
  unassignTagByBayan(request: BayanUnassignTagRequestDTO): Promise<DaleelResponse<void>>
  
  // Vehicle Information
  getSequenceNumber(vehiclePlate: VehiclePlate): Promise<DaleelResponse<SequenceNumberResponseDTO>>
  getVehicleInfo(vehiclePlate: VehiclePlate): Promise<DaleelResponse<VehicleInfoDTO>>
}

export interface DaleelNotificationService {
  subscribe(request: SubscribeRequestDTO): Promise<DaleelResponse<SubscribeResponseDTO>>
}

// ============================================================================
// ADAPTER CONFIGURATION
// ============================================================================

export interface DaleelAdapterConfig {
  username: string
  password: string
  apiBaseUrl?: string
  environment?: 'sandbox' | 'production'
  timeout?: number
  retryAttempts?: number
  enableLogging?: boolean
  enableCaching?: boolean
  pollingInterval?: number // For real-time tracking
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface DaleelVehicle {
  vehiclePlate: VehiclePlate
  currentLocation?: VehicleLocationDTO
  vehicleInfo?: VehicleInfoDTO
  assignedTo?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  lastSeen?: string
}

export interface DaleelTrackingData {
  vehiclePlate: VehiclePlate
  currentLocation: VehicleLocationDTO
  history: VehicleLocationDTO[]
  lastUpdate: string
  speed?: number
  heading?: number
  address?: string
}




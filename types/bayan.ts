/**
 * Bayan Electronic Freight Forwarder API Types
 * 
 * Comprehensive type definitions for Bayan EFF services
 * Extends WASL with waybill management and carrier operations
 */

import type { VehiclePlate } from './wasl'

// ============================================================================
// AUTHENTICATION (reuses WASL auth)
// ============================================================================

export interface BayanAuthConfig {
  appId: string
  appKey: string
  apiBaseUrl?: string
  environment?: 'sandbox' | 'production'
  timeout?: number
  retryAttempts?: number
}

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface VehiclePlateDTO {
  plateNumber: string
  plateType?: string
  plateCode?: string
}

export interface DriverDTO {
  nationalId: string
  fullName: string
  mobileNumber?: string
  licenseNumber?: string
  licenseType?: string
}

export interface VehicleDTO {
  vehiclePlate: VehiclePlateDTO
  vehicleType?: string
  vehicleModel?: string
  vehicleYear?: number
  chassisNumber?: string
}

export interface LocationDTO {
  address: string
  city?: string
  region?: string
  country?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  postalCode?: string
}

export interface CityDTO {
  code: string
  name: string
  region?: string
}

export interface CountryDTO {
  code: string
  name: string
}

export interface CustomerDTO {
  name: string
  nationalId?: string
  commercialRegistration?: string
  mobileNumber?: string
  email?: string
  address?: string
  customerType?: CustomerType
}

export type CustomerType = 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT'

export interface CarrierDTO {
  name: string
  commercialRegistration?: string
  mobileNumber?: string
  email?: string
  address?: string
}

export interface ItemDTO {
  description: string
  quantity: number
  unit?: UnitDTO
  weight?: number
  value?: number
  goodType?: GoodTypeDTO
  [key: string]: any
}

export interface UnitDTO {
  code: string
  name: string
}

export interface GoodTypeDTO {
  code: string
  name: string
}

export interface PaymentMethodDTO {
  code: string
  name: string
}

export interface HijriDate {
  day: number
  month: number
  year: number
}

export interface MapsDto {
  latitude: number
  longitude: number
}

// ============================================================================
// TRIP TYPES
// ============================================================================

export interface CreateTripRequest {
  vehicle: VehicleDTO
  driver: DriverDTO
  origin: LocationDTO
  destination: LocationDTO
  plannedStartDate: string // ISO 8601
  plannedEndDate?: string // ISO 8601
  customer?: CustomerDTO
  carrier?: CarrierDTO
  items?: ItemDTO[]
  notes?: string
  [key: string]: any
}

export interface CreateTripResponse {
  success: boolean
  tripId?: string
  tripNumber?: string
  message?: string
  data?: TripDetailsDTO
}

export interface TripDetailsDTO {
  tripId: string
  tripNumber: string
  vehicle: VehicleDetailsDTO
  driver: DriverDetailsDTO
  origin: LocationDTO
  destination: LocationDTO
  customer?: CustomerDetailsDTO
  carrier?: CarrierDetailsDTO
  status: StatusDTO
  plannedStartDate: string
  plannedEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  waybills?: WaybillDetailsDTO[]
  createdAt?: string
  updatedAt?: string
}

export interface VehicleDetailsDTO extends VehicleDTO {
  ownerName?: string
  ownerNationalId?: string
  registrationDate?: string
  insuranceExpiryDate?: string
}

export interface DriverDetailsDTO extends DriverDTO {
  dateOfBirth?: string
  licenseExpiryDate?: string
  address?: string
}

export interface CustomerDetailsDTO extends CustomerDTO {
  id?: string
  createdAt?: string
}

export interface CarrierDetailsDTO extends CarrierDTO {
  id?: string
  createdAt?: string
}

export interface StatusDTO {
  code: string
  name: string
  description?: string
}

// ============================================================================
// WAYBILL TYPES
// ============================================================================

export interface CreateWaybillDTO {
  tripId: string
  waybillNumber?: string
  customer: CustomerDTO
  items: ItemDTO[]
  origin: LocationDTO
  destination: LocationDTO
  paymentMethod?: PaymentMethodDTO
  totalValue?: number
  totalWeight?: number
  notes?: string
  [key: string]: any
}

export interface UpdateWaybillDTO {
  waybillId: string
  customer?: CustomerDTO
  items?: ItemDTO[]
  origin?: LocationDTO
  destination?: LocationDTO
  paymentMethod?: PaymentMethodDTO
  totalValue?: number
  totalWeight?: number
  notes?: string
  [key: string]: any
}

export interface AddWaybillDTO {
  tripId: string
  waybillNumber?: string
  customer: CustomerDTO
  items: ItemDTO[]
  origin: LocationDTO
  destination: LocationDTO
  paymentMethod?: PaymentMethodDTO
  totalValue?: number
  totalWeight?: number
  notes?: string
  [key: string]: any
}

export interface WaybillResponse {
  success: boolean
  waybillId?: string
  waybillNumber?: string
  message?: string
  data?: WaybillDetailsDTO
}

export interface WaybillDetailsDTO {
  waybillId: string
  waybillNumber: string
  tripId: string
  customer: CustomerDetailsDTO
  items: ItemDetailsDTO[]
  origin: LocationDTO
  destination: LocationDTO
  paymentMethod?: PaymentMethodDTO
  totalValue?: number
  totalWeight?: number
  status: StatusDTO
  notes?: string
  createdAt?: string
  updatedAt?: string
  closedAt?: string
  cancelledAt?: string
}

export interface ItemDetailsDTO extends ItemDTO {
  itemId?: string
  waybillId?: string
}

export interface CloseWaybillRequest {
  waybillId: string
  notes?: string
  [key: string]: any
}

export interface CancelWaybillRequest {
  waybillId: string
  reason?: string
  notes?: string
  [key: string]: any
}

export interface CancelStatusDTO {
  cancelled: boolean
  reason?: string
  cancelledAt?: string
}

// ============================================================================
// CARRIER TYPES
// ============================================================================

export interface CreateCarrierTripRequest {
  vehicle: VehicleDTO
  driver: DriverDTO
  origin: LocationDTO
  destination: LocationDTO
  plannedStartDate: string
  plannedEndDate?: string
  carrier: CarrierDTO
  items?: ItemDTO[]
  notes?: string
  [key: string]: any
}

export interface UpdateVehicleOrDriverRequest {
  tripId: string
  vehicle?: VehicleDTO
  driver?: DriverDTO
  [key: string]: any
}

export interface CreateExceptionalWaybillDTO {
  tripId: string
  waybillNumber?: string
  customer: CustomerDTO
  items: ItemDTO[]
  origin: LocationDTO
  destination: LocationDTO
  reason: string // Reason for exceptional waybill
  paymentMethod?: PaymentMethodDTO
  totalValue?: number
  totalWeight?: number
  notes?: string
  [key: string]: any
}

export interface RAWaybillDetailsDTO extends WaybillDetailsDTO {
  isExceptional: boolean
  reason?: string
}

export interface Actor {
  id: string
  name: string
  type: 'FREIGHT_FORWARDER' | 'CARRIER' | 'CUSTOMER'
}

export interface CreateCarrierTripWithEWRequest {
  trip: CreateCarrierTripRequest
  exceptionalWaybill?: CreateExceptionalWaybillDTO
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface BayanFreightForwarderService {
  // Trip Management
  createTrip(request: CreateTripRequest): Promise<CreateTripResponse>
  updateTrip(tripId: string, request: Partial<CreateTripRequest>): Promise<CreateTripResponse>
  getTrip(tripId: string): Promise<TripDetailsDTO | null>
  printTrip(tripId: string): Promise<Blob | null>
  
  // Waybill Management
  addWaybill(request: AddWaybillDTO): Promise<WaybillResponse>
  updateWaybill(request: UpdateWaybillDTO): Promise<WaybillResponse>
  closeWaybill(request: CloseWaybillRequest): Promise<WaybillResponse>
  cancelWaybill(request: CancelWaybillRequest): Promise<WaybillResponse>
}

export interface BayanCarrierService {
  // Carrier Trip Management
  createCarrierTrip(request: CreateCarrierTripRequest): Promise<CreateTripResponse>
  updateVehicleOrDriver(request: UpdateVehicleOrDriverRequest): Promise<CreateTripResponse>
  getCarrierTrip(tripId: string): Promise<TripDetailsDTO | null>
  printCarrierTrip(tripId: string): Promise<Blob | null>
  
  // Carrier Waybill Management
  addCarrierWaybill(request: AddWaybillDTO): Promise<WaybillResponse>
  updateCarrierWaybill(request: UpdateWaybillDTO): Promise<WaybillResponse>
  closeCarrierWaybill(request: CloseWaybillRequest): Promise<WaybillResponse>
  cancelCarrierWaybill(request: CancelWaybillRequest): Promise<WaybillResponse>
  
  // Exceptional Waybill
  createExceptionalWaybill(request: CreateExceptionalWaybillDTO): Promise<WaybillResponse>
}

// ============================================================================
// ADAPTER CONFIGURATION
// ============================================================================

export interface BayanAdapterConfig {
  appId: string
  appKey: string
  apiBaseUrl?: string
  environment?: 'sandbox' | 'production'
  timeout?: number
  retryAttempts?: number
  enableLogging?: boolean
  enableCaching?: boolean
}




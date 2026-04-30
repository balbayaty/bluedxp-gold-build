/**
 * Athr Naql (Transportation Impact) API Types
 * 
 * Comprehensive type definitions for Athr Naql verification and inquiry services
 * Used for checking operation cards, licenses, and driver cards
 */

// ============================================================================
// AUTHENTICATION (reuses WASL auth)
// ============================================================================

export interface AthrNaqlAuthConfig {
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

export interface Vehicle {
  plateNumber: string
  plateType?: string
  plateCode?: string
  chassisNumber?: string
  [key: string]: any
}

// ============================================================================
// OPERATION CARD TYPES
// ============================================================================

export interface OperationCardStatusRequest {
  plateNumber: string
  plateType?: string
  plateCode?: string
  operationCardNumber?: string
  [key: string]: any
}

export interface OperationCardStatusResponseV1 {
  success: boolean
  data?: {
    plateNumber: string
    plateType?: string
    plateCode?: string
    operationCardNumber?: string
    status?: string
    statusCode?: string
    statusDescription?: string
    issueDate?: string
    expiryDate?: string
    operationCardType?: OperationCardType
    [key: string]: any
  }
  message?: string
  errors?: Array<{
    code: string
    message: string
    field?: string
  }>
}

export interface OperationCardType {
  id: string
  code: string
  name: string
  description?: string
  [key: string]: any
}

export interface OperationCardTypeResponse {
  success: boolean
  data?: OperationCardType[]
  message?: string
}

// ============================================================================
// LICENSE TYPES
// ============================================================================

export interface LicenseStatusRequest {
  licenseNumber: string
  licenseType?: string
  commercialRegistration?: string
  [key: string]: any
}

export interface LicenseStatusResponse {
  success: boolean
  data?: {
    licenseNumber: string
    licenseType?: string
    status?: string
    statusCode?: string
    statusDescription?: string
    issueDate?: string
    expiryDate?: string
    commercialRegistration?: string
    licenseTypeDetails?: LicenseType
    [key: string]: any
  }
  message?: string
  errors?: Array<{
    code: string
    message: string
    field?: string
  }>
}

export interface LicenseStatusResponseV2 {
  success: boolean
  data?: {
    licenseNumber: string
    licenseType?: string
    status?: string
    statusCode?: string
    statusDescription?: string
    issueDate?: string
    expiryDate?: string
    commercialRegistration?: string
    licenseTypeDetails?: LicenseType
    additionalInfo?: Record<string, any>
    [key: string]: any
  }
  message?: string
  errors?: Array<{
    code: string
    message: string
    field?: string
  }>
}

export interface LicenseType {
  id: string
  code: string
  name: string
  description?: string
  [key: string]: any
}

export interface LicenseTypeResponse {
  success: boolean
  data?: LicenseType[]
  message?: string
}

// ============================================================================
// DRIVER CARD TYPES
// ============================================================================

export interface DriverCardStatusRequest {
  nationalId: string
  driverCardNumber?: string
  [key: string]: any
}

export interface DriverCardStatusBySponsorIdRequest {
  sponsorId: string
  [key: string]: any
}

export interface DriverCardStatusResponse {
  success: boolean
  data?: {
    nationalId: string
    driverCardNumber?: string
    status?: string
    statusCode?: string
    statusDescription?: string
    issueDate?: string
    expiryDate?: string
    categoryType?: DriverCardCategoryType
    sponsorId?: string
    [key: string]: any
  }
  message?: string
  errors?: Array<{
    code: string
    message: string
    field?: string
  }>
}

export interface DriverCardCategoryType {
  id: string
  code: string
  name: string
  description?: string
  [key: string]: any
}

export interface DriverCardCategoryTypeResponse {
  success: boolean
  data?: DriverCardCategoryType[]
  message?: string
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface AthrNaqlOperationCardService {
  // Operation Card Inquiry
  inquireOperationCardStatus(request: OperationCardStatusRequest): Promise<OperationCardStatusResponseV1>
  getOperationCardTypes(): Promise<OperationCardType[]>
  getOperationCardType(id: string): Promise<OperationCardType | null>
}

export interface AthrNaqlLicenseService {
  // License Inquiry
  inquireLicenseStatus(request: LicenseStatusRequest): Promise<LicenseStatusResponse>
  inquireLicenseStatusV2(request: LicenseStatusRequest): Promise<LicenseStatusResponseV2>
  getLicenseTypes(): Promise<LicenseType[]>
  getLicenseType(id: string): Promise<LicenseType | null>
}

export interface AthrNaqlDriverCardService {
  // Driver Card Inquiry
  inquireDriverCardStatus(request: DriverCardStatusRequest): Promise<DriverCardStatusResponse>
  inquireDriverCardStatusBySponsorId(request: DriverCardStatusBySponsorIdRequest): Promise<DriverCardStatusResponse[]>
  getDriverCardCategoryTypes(): Promise<DriverCardCategoryType[]>
}

// ============================================================================
// ADAPTER CONFIGURATION
// ============================================================================

export interface AthrNaqlAdapterConfig {
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
// VERIFICATION TYPES
// ============================================================================

export interface VehicleVerification {
  plateNumber: string
  operationCardValid: boolean
  operationCardStatus?: OperationCardStatusResponseV1['data']
  licenseValid?: boolean
  licenseStatus?: LicenseStatusResponse['data']
}

export interface DriverVerification {
  nationalId: string
  driverCardValid: boolean
  driverCardStatus?: DriverCardStatusResponse['data']
}

export interface CompleteVerification {
  vehicle: VehicleVerification
  driver: DriverVerification
  allValid: boolean
  verifiedAt: string
}




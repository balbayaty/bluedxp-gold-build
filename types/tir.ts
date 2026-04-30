/**
 * TIR/ETIR/IRU Integration Types
 * International Road Transport Union and Electronic TIR System types
 */

import type { CountryCode, Party, Vehicle, DeclarationProduct, CustomsDocument } from './customs'

// ============================================================================
// TIR CARNET
// ============================================================================

export interface TIRCarnet {
  id: string
  carnetNumber: string
  
  // Issuance
  issuingCountry: CountryCode
  issuingAssociation: string
  issuedAt: Date
  validFrom: Date
  validTo: Date
  
  // Parties
  holder: Party
  vehicle: Vehicle
  driver?: Driver
  
  // Guarantee
  guarantee: TIRGuarantee
  
  // Route
  originCountry: CountryCode
  destinationCountry: CountryCode
  route: TIRRoute
  borders: TIRBorderCrossing[]
  
  // Products
  products: DeclarationProduct[]
  totalValue: number
  currency: string
  
  // Documents
  documents: CustomsDocument[]
  
  // Status
  status: TIRStatus
  currentBorderIndex?: number
  
  // Timeline
  startedAt?: Date
  completedAt?: Date
  closedAt?: Date
  
  // Metadata
  notes?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export type TIRStatus = 
  | 'ISSUED'
  | 'ACTIVE'
  | 'IN_TRANSIT'
  | 'AT_BORDER'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'CLAIMED'

// ============================================================================
// TIR GUARANTEE
// ============================================================================

export interface TIRGuarantee {
  guaranteeNumber: string
  issuingAssociation: string
  associationCode: string
  holder: Party
  
  // Financial
  amount: number
  currency: string
  coverage: number // percentage
  
  // Validity
  validFrom: Date
  validTo: Date
  status: TIRGuaranteeStatus
  
  // Claims
  claims: TIRGuaranteeClaim[]
  totalClaims: number
  remainingAmount: number
  
  // Verification
  lastVerifiedAt?: Date
  verificationStatus: 'VERIFIED' | 'PENDING' | 'FAILED'
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

export type TIRGuaranteeStatus = 
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CLAIMED'
  | 'RELEASED'
  | 'EXPIRED'
  | 'CANCELLED'

export interface TIRGuaranteeClaim {
  id: string
  claimNumber: string
  carnetNumber: string
  amount: number
  currency: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  claimedAt: Date
  resolvedAt?: Date
}

// ============================================================================
// TIR ROUTE
// ============================================================================

export interface TIRRoute {
  id: string
  originCountry: CountryCode
  destinationCountry: CountryCode
  transitCountries: CountryCode[]
  
  // Borders
  borderCrossings: TIRBorderCrossing[]
  totalBorders: number
  
  // Distance
  totalDistance: number // kilometers
  estimatedTransitTime: number // hours
  
  // Route details
  waypoints: RouteWaypoint[]
  restrictions?: RouteRestriction[]
  
  // Optimization
  optimized: boolean
  optimizationScore?: number
}

export interface RouteWaypoint {
  id: string
  sequence: number
  country: CountryCode
  location: string
  coordinates: {
    latitude: number
    longitude: number
  }
  type: 'ORIGIN' | 'BORDER' | 'DESTINATION'
  borderId?: string
}

export interface RouteRestriction {
  type: 'TIME_RESTRICTION' | 'WEIGHT_RESTRICTION' | 'VEHICLE_RESTRICTION' | 'OTHER'
  description: string
  appliesTo: CountryCode[]
}

// ============================================================================
// TIR BORDER CROSSING
// ============================================================================

export interface TIRBorderCrossing {
  id: string
  carnetId: string
  carnetNumber: string
  sequence: number
  
  // Border
  borderId: string
  borderName: string
  borderCode: string
  country: CountryCode
  type: 'DEPARTURE' | 'TRANSIT' | 'ARRIVAL'
  
  // Status
  status: TIRBorderStatus
  enteredAt?: Date
  exitedAt?: Date
  processingTime?: number // minutes
  
  // Inspection
  inspected: boolean
  inspectionResult?: 'CLEARED' | 'HELD' | 'REJECTED'
  inspectionNotes?: string
  
  // Seals
  seals: TIRSeal[]
  sealStatus: 'INTACT' | 'BROKEN' | 'MISSING'
  
  // Documents
  documents: CustomsDocument[]
  requiredDocuments: string[]
  missingDocuments: string[]
  
  // Customs
  customsOffice?: string
  customsOfficer?: string
  customsNotes?: string
  
  // Issues
  issues: TIRBorderIssue[]
  
  // Metadata
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type TIRBorderStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'ENTERED'
  | 'EXITED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'HELD'

export interface TIRSeal {
  id: string
  sealNumber: string
  type: 'CUSTOMS_SEAL' | 'TIR_SEAL'
  appliedAt?: Date
  removedAt?: Date
  status: 'INTACT' | 'BROKEN' | 'MISSING'
  location?: string
}

export interface TIRBorderIssue {
  id: string
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  category: 'DOCUMENT' | 'SEAL' | 'PRODUCT' | 'VALUE' | 'OTHER'
  description: string
  resolved: boolean
  resolvedAt?: Date
}

// ============================================================================
// ETIR (ELECTRONIC TIR)
// ============================================================================

export interface ETIRDeclaration {
  id: string
  tirCarnetId: string
  carnetNumber: string
  
  // ETIR System
  etirId?: string
  etirStatus: ETIRStatus
  etirMessageId?: string
  
  // Pre-Declaration (TIR-EPD)
  epdSubmitted: boolean
  epdSubmittedAt?: Date
  epdStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  
  // Message Exchange
  messages: ETIRMessage[]
  lastMessageAt?: Date
  
  // Countries
  countries: CountryCode[]
  currentCountry?: CountryCode
  
  // Synchronization
  lastSyncedAt?: Date
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR'
  syncErrors?: string[]
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

export type ETIRStatus = 
  | 'NOT_INITIATED'
  | 'INITIATED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'TERMINATED'
  | 'ERROR'

export interface ETIRMessage {
  id: string
  messageId: string
  type: ETIRMessageType
  fromCountry: CountryCode
  toCountry: CountryCode
  status: 'SENT' | 'RECEIVED' | 'PROCESSED' | 'ERROR'
  content: Record<string, any>
  sentAt: Date
  receivedAt?: Date
  processedAt?: Date
  error?: string
}

export type ETIRMessageType =
  | 'TIR_START'
  | 'TIR_TERMINATION'
  | 'TIR_TERMINATION_CONFIRMATION'
  | 'TIR_CANCELLATION'
  | 'TIR_DISCHARGE'
  | 'TIR_DISCHARGE_CONFIRMATION'
  | 'TIR_DISCHARGE_REFUSAL'
  | 'TIR_CONTROL'
  | 'TIR_CONTROL_RESULT'
  | 'TIR_IRREGULARITY'
  | 'TIR_IRREGULARITY_CONFIRMATION'

// ============================================================================
// IRU (INTERNATIONAL ROAD TRANSPORT UNION)
// ============================================================================

export interface IRUOperator {
  id: string
  operatorNumber: string
  name: string
  country: CountryCode
  type: 'CARRIER' | 'FORWARDER' | 'BROKER'
  
  // Certification
  certified: boolean
  certificationNumber?: string
  certifiedAt?: Date
  certificationExpiresAt?: Date
  
  // TIR Authorization
  tirAuthorized: boolean
  tirAuthorizationNumber?: string
  tirAuthorizationExpiresAt?: Date
  
  // Vehicles
  vehicles: Vehicle[]
  
  // Performance
  performanceScore?: number
  violations: IRUViolation[]
  
  // Status
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED'
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

export interface IRUViolation {
  id: string
  violationType: string
  description: string
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL'
  occurredAt: Date
  resolved: boolean
  resolvedAt?: Date
  penalty?: number
}

// ============================================================================
// SAFETIR (REAL-TIME SAFE TIR)
// ============================================================================

export interface SafeTIRVerification {
  id: string
  guaranteeNumber: string
  carnetNumber?: string
  
  // Verification
  status: SafeTIRStatus
  verifiedAt: Date
  
  // Guarantee Info
  guarantee: TIRGuarantee
  holder: Party
  issuingAssociation: string
  
  // Validity
  isValid: boolean
  validityReason?: string
  
  // Messages
  customsMessages: ETIRMessage[]
  lastMessageAt?: Date
  
  // Metadata
  verifiedBy?: string
  notes?: string
}

export type SafeTIRStatus = 
  | 'VALID'
  | 'INVALID'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'CLAIMED'
  | 'NOT_FOUND'

// ============================================================================
// ASKTIRWEB
// ============================================================================

export interface AskTIRWebData {
  // Association Management
  associations: TIRAssociation[]
  
  // Operator Management
  operators: IRUOperator[]
  
  // Guarantee Management
  guarantees: TIRGuarantee[]
  
  // Claims Management
  claims: TIRGuaranteeClaim[]
  
  // Statistics
  statistics: TIRStatistics
}

export interface TIRAssociation {
  id: string
  code: string
  name: string
  country: CountryCode
  website?: string
  contact: {
    email?: string
    phone?: string
    address?: string
  }
  authorized: boolean
  authorizationExpiresAt?: Date
}

export interface TIRStatistics {
  totalCarnetsIssued: number
  activeCarnets: number
  completedCarnets: number
  totalGuarantees: number
  activeGuarantees: number
  totalClaims: number
  totalClaimAmount: number
  period: {
    from: Date
    to: Date
  }
}

// ============================================================================
// DRIVER
// ============================================================================

export interface Driver {
  id?: string
  name: string
  licenseNumber: string
  licenseCountry: CountryCode
  licenseExpiresAt?: Date
  phone?: string
  email?: string
}

// ============================================================================
// ADAPTER INTERFACES
// ============================================================================

export interface TIRAdapter {
  readonly id: string
  readonly name: string
  readonly type: 'ETIR' | 'IRU' | 'TIR'
  
  // Connection
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): Promise<boolean>
  
  // Carnet Management
  issueCarnet(data: Partial<TIRCarnet>): Promise<TIRCarnet>
  getCarnet(carnetNumber: string): Promise<TIRCarnet | null>
  updateCarnet(carnetNumber: string, updates: Partial<TIRCarnet>): Promise<TIRCarnet>
  closeCarnet(carnetNumber: string): Promise<void>
  
  // Border Crossing
  registerBorderCrossing(carnetNumber: string, border: Partial<TIRBorderCrossing>): Promise<TIRBorderCrossing>
  getBorderCrossings(carnetNumber: string): Promise<TIRBorderCrossing[]>
  
  // ETIR
  submitETIRDeclaration(declaration: Partial<ETIRDeclaration>): Promise<ETIRDeclaration>
  getETIRStatus(carnetNumber: string): Promise<ETIRStatus>
  sendETIRMessage(message: Partial<ETIRMessage>): Promise<ETIRMessage>
  
  // Guarantee
  verifyGuarantee(guaranteeNumber: string): Promise<SafeTIRVerification>
  getGuarantee(guaranteeNumber: string): Promise<TIRGuarantee | null>
  
  // Operator
  getOperator(operatorNumber: string): Promise<IRUOperator | null>
  verifyOperator(operatorNumber: string): Promise<boolean>
}














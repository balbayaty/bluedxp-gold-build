/**
 * Flex Smart e-Waybill (ETW) Type Definitions
 * Production-grade, evidence-grade e-Waybill system
 * 
 * Features:
 * - Evidence-grade chain-of-custody
 * - Multi-tenant support
 * - Policy-driven rules engine
 * - Intelligence service (ETA/detention/congestion)
 * - World-class QR verification
 * - Arabic/English i18n
 * - Print-ready PDF
 * - Full platform integration
 */

import { z } from 'zod'
import type { Location, TransportMode } from './tms'

// ============================================================================
// CORE ETW TYPES
// ============================================================================

export type ETWScope = 'LOCAL' | 'INTERCITY' | 'CROSS_BORDER' | 'MULTIMODAL'

export type ETWStatus = 
  | 'DRAFT'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'IN_TRANSIT'
  | 'AT_BORDER'
  | 'AT_PORT'
  | 'CUSTOMS_CLEARANCE'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'CANCELLED'
  | 'COMPLETED'

export type ETWEventType =
  | 'CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_FACILITY'
  | 'HANDOVER'
  | 'BORDER_CROSSING'
  | 'CUSTOMS_CLEARED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'EXCEPTION_RESOLVED'
  | 'CANCELLED'

export type PermitStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'

export type VerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'TAMPERED'
  | 'EXPIRED'
  | 'REVOKED'

// ============================================================================
// TRANSPORT REFERENCE MATRIX
// ============================================================================

export interface TransportReferenceMatrix {
  etwNumber: string
  shipmentNumber?: string
  invoiceNumber?: string
  purchaseOrderNumber?: string
  customerReference?: string
  internalReference?: string
  carrierReference?: string
  customsDeclarationNumber?: string
  permitNumbers?: string[]
  msdsIds?: string[]
  exceptionIds?: string[]
}

// ============================================================================
// PARTIES & LEGAL ROLES
// ============================================================================

export interface Party {
  id: string
  type: 'SHIPPER' | 'CONSIGNEE' | 'CARRIER' | 'BROKER' | 'AUTHORITY' | 'CUSTOMS' | 'WAREHOUSE'
  name: string
  legalName?: string
  registrationNumber?: string
  taxId?: string
  contact: {
    name: string
    phone: string
    email: string
    address: string
  }
  location?: Location
  signature?: {
    method: 'DIGITAL' | 'OTP' | 'MANUAL'
    timestamp?: Date | string
    verified: boolean
  }
}

// ============================================================================
// CARGO DECLARATION
// ============================================================================

export interface CargoItem {
  id: string
  description: string
  hsCode?: string
  packaging: {
    type: string
    quantity: number
    unit: string
  }
  weight: {
    gross: number // kg
    net: number // kg
    unit: 'KG' | 'TON'
  }
  volume?: {
    value: number // m³
    unit: 'M3' | 'L'
  }
  dimensions?: {
    length: number // cm
    width: number // cm
    height: number // cm
    unit: 'CM' | 'M'
  }
  value: {
    amount: number
    currency: string
  }
  containerNumber?: string
  sealNumbers?: string[]
  batchNumber?: string
  serialNumbers?: string[]
}

export interface CargoDeclaration {
  items: CargoItem[]
  totalWeight: number // kg
  totalVolume?: number // m³
  totalValue: number
  currency: string
  totalPieces: number
  totalContainers?: number
  totalPallets?: number
}

// ============================================================================
// COMPLIANCE FLAGS
// ============================================================================

export interface ComplianceFlags {
  hazardous: boolean
  msdsId?: string
  msdsReference?: string
  civilDefenseReference?: string
  temperatureControl?: {
    required: boolean
    min?: number // Celsius
    max?: number // Celsius
    current?: number
  }
  specialHandling?: string[]
  restrictedGoods?: boolean
  customsValue?: number
  incoterms?: string
  exportLicense?: string
  importLicense?: string
}

// ============================================================================
// PERMITS & REGULATORY PROCESSING
// ============================================================================

export interface PermitRecord {
  id: string
  type: string
  authority: string
  status: PermitStatus
  required: boolean
  submittedDocs: Array<{
    id: string
    name: string
    type: string
    url?: string
    submittedAt: Date | string
  }>
  avgProcessingHours?: number
  estimatedCompletion?: Date | string
  actualCompletion?: Date | string
  notes?: string
  rejectionReason?: string
}

// ============================================================================
// ROUTE & EXECUTION
// ============================================================================

export interface ETWRoute {
  origin: Location
  destination: Location
  waypoints?: Location[]
  unLocode?: string[]
  borders?: string[]
  ports?: string[]
  icd?: string[] // Inland Container Depots
  industrialCityGates?: string[]
  mode: TransportMode
  distance?: number // km
  estimatedDuration?: number // hours
}

// ============================================================================
// COMMERCIAL & RATE CONTEXT
// ============================================================================

export interface CommercialContext {
  contractType: 'CONTRACT' | 'SPOT' | 'BENCHMARK'
  contractReference?: string
  termsAndConditionsRef?: string
  rate: {
    base: number
    currency: string
    surcharges?: Array<{
      type: string
      amount: number
      description?: string
    }>
    total: number
  }
  paymentTerms?: string
  paymentMethod?: string
}

// ============================================================================
// OPERATIONAL RISK & CONGESTION OUTLOOK
// ============================================================================

export interface RiskSnapshot {
  id: string
  timestamp: Date | string
  portCongestion?: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    delayHours?: number
    confidence: number // 0-1
  }
  borderLoad?: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    delayHours?: number
    confidence: number // 0-1
  }
  industrialAccessLoad?: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    delayHours?: number
    confidence: number // 0-1
  }
  delayRange?: {
    min: number // hours
    max: number // hours
    expected: number // hours
    confidence: number // 0-1
  }
  commonCauses?: string[]
  authorityWorkingHours?: {
    days: string[]
    hours: string
    timezone: string
  }
  detentionExposure?: {
    hours: number
    cost?: number
    currency?: string
  }
}

// ============================================================================
// ESTIMATED MILESTONES
// ============================================================================

export interface MilestoneEstimate {
  portHandling?: {
    avg: number // hours
    min: number
    max: number
    confidence: number // 0-1
  }
  borderAvg?: {
    avg: number // hours
    min: number
    max: number
    confidence: number // 0-1
  }
  industrialGateAvg?: {
    avg: number // hours
    min: number
    max: number
    confidence: number // 0-1
  }
  endToEndEstimate: {
    avg: number // hours
    min: number
    max: number
    confidence: number // 0-1
    estimatedCompletion: Date | string
  }
}

// ============================================================================
// EVENT TIMELINE / CHAIN OF CUSTODY
// ============================================================================

export interface ETWEvent {
  id: string
  etwId: string
  type: ETWEventType
  timestamp: Date | string
  actor: {
    id: string
    name: string
    role: string
    type: 'USER' | 'SYSTEM' | 'DRIVER' | 'AUTHORITY'
  }
  location?: {
    name: string
    coordinates?: {
      lat: number
      lng: number
    }
    address?: string
  }
  evidenceRefs?: string[] // Evidence service IDs
  description?: string
  metadata?: Record<string, any>
  handoverTo?: {
    id: string
    name: string
    role: string
  }
  verified: boolean
  verificationMethod?: 'GPS' | 'SIGNATURE' | 'OTP' | 'MANUAL'
}

// ============================================================================
// MULTIMODAL LEGS
// ============================================================================

export interface ETWLeg {
  id: string
  etwId: string
  legNumber: number
  mode: TransportMode
  origin: Location
  destination: Location
  carrier?: {
    id: string
    name: string
    code?: string
  }
  vehicle?: {
    type: string
    number?: string
    driver?: string
  }
  estimatedStart?: Date | string
  actualStart?: Date | string
  estimatedEnd?: Date | string
  actualEnd?: Date | string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXCEPTION'
  events: ETWEvent[]
}

// ============================================================================
// DELIVERY ACKNOWLEDGMENT
// ============================================================================

export interface DeliveryAcknowledgment {
  receiver: {
    id: string
    name: string
    identity?: string // ID number
    signature?: {
      method: 'DIGITAL' | 'OTP' | 'MANUAL'
      timestamp: Date | string
      verified: boolean
      data?: string // Signature data/OTP
    }
  }
  deliveredAt: Date | string
  condition: 'GOOD' | 'DAMAGED' | 'PARTIAL' | 'REJECTED'
  exceptions?: Array<{
    type: string
    description: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    requiresAction: boolean
  }>
  notes?: string
  photos?: string[] // URLs
}

// ============================================================================
// DIGITAL VERIFICATION
// ============================================================================

export interface VerificationPayload {
  hash: string // SHA-256 of canonical JSON
  signature: string // Ed25519 signature
  publicKeyId: string
  createdAt: Date | string
  expiresAt?: Date | string
  accessPolicy: 'PUBLIC' | 'CUSTOMER' | 'AUTHORITY' | 'RESTRICTED'
  qrTokenId: string
  verificationUrl: string
}

export interface QRToken {
  id: string
  etwId: string
  token: string // Short token for QR
  accessPolicy: 'PUBLIC' | 'CUSTOMER' | 'AUTHORITY' | 'RESTRICTED'
  expiresAt?: Date | string
  revoked: boolean
  revokedAt?: Date | string
  revokedBy?: string
  createdAt: Date | string
  createdBy: string
  verificationCount: number
  lastVerifiedAt?: Date | string
}

// ============================================================================
// ATTACHMENTS
// ============================================================================

export interface ETWAttachment {
  id: string
  etwId: string
  type: 'POD' | 'MSDS' | 'PERMIT' | 'INVOICE' | 'IMAGE' | 'SIGNATURE' | 'OTHER'
  name: string
  url: string
  mimeType: string
  size: number // bytes
  uploadedAt: Date | string
  uploadedBy: string
  metadata?: Record<string, any>
}

// ============================================================================
// MAIN ETW INTERFACE
// ============================================================================

export interface ETW {
  id: string
  etwNumber: string
  tenantId: string
  
  // Status
  status: ETWStatus
  version: number
  
  // Transport Reference Matrix
  references: TransportReferenceMatrix
  
  // Scope & Mode
  scope: ETWScope
  mode: TransportMode
  isMultimodal: boolean
  
  // Parties
  parties: Party[]
  
  // Cargo
  cargo: CargoDeclaration
  
  // Compliance
  compliance: ComplianceFlags
  
  // Permits
  permits: PermitRecord[]
  
  // Route
  route: ETWRoute
  
  // Commercial
  commercial: CommercialContext
  
  // Risk & Intelligence
  riskSnapshot?: RiskSnapshot
  milestones?: MilestoneEstimate
  
  // Events & Timeline
  events: ETWEvent[]
  legs?: ETWLeg[] // For multimodal
  
  // Delivery
  delivery?: DeliveryAcknowledgment
  
  // Verification
  verification?: VerificationPayload
  
  // Attachments
  attachments: ETWAttachment[]
  
  // Legal Notice
  legalNotice?: string
  
  // Metadata
  metadata: {
    customerView?: boolean // Customer-facing view flag
    internalNotes?: string
    tags?: string[]
    customFields?: Record<string, any>
  }
  
  // Audit
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  updatedBy?: string
  
  // Integration Links
  shipmentId?: string
  invoiceId?: string
  podId?: string
  exceptionIds?: string[]
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['ORIGIN', 'DESTINATION', 'WAYPOINT', 'PORT', 'AIRPORT', 'WAREHOUSE', 'CUSTOMS']),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string(),
    country: z.string(),
    countryCode: z.string(),
  }),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  contact: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email(),
  }).optional(),
  customsOffice: z.string().optional(),
  portCode: z.string().optional(),
  airportCode: z.string().optional(),
})

export const PartySchema = z.object({
  id: z.string(),
  type: z.enum(['SHIPPER', 'CONSIGNEE', 'CARRIER', 'BROKER', 'AUTHORITY', 'CUSTOMS', 'WAREHOUSE']),
  name: z.string(),
  legalName: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  contact: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email(),
    address: z.string(),
  }),
  location: LocationSchema.optional(),
  signature: z.object({
    method: z.enum(['DIGITAL', 'OTP', 'MANUAL']),
    timestamp: z.union([z.date(), z.string()]).optional(),
    verified: z.boolean(),
  }).optional(),
})

export const CargoItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  hsCode: z.string().optional(),
  packaging: z.object({
    type: z.string(),
    quantity: z.number().positive(),
    unit: z.string(),
  }),
  weight: z.object({
    gross: z.number().positive(),
    net: z.number().positive(),
    unit: z.enum(['KG', 'TON']),
  }),
  volume: z.object({
    value: z.number().positive(),
    unit: z.enum(['M3', 'L']),
  }).optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['CM', 'M']),
  }).optional(),
  value: z.object({
    amount: z.number().nonnegative(),
    currency: z.string().length(3),
  }),
  containerNumber: z.string().optional(),
  sealNumbers: z.array(z.string()).optional(),
  batchNumber: z.string().optional(),
  serialNumbers: z.array(z.string()).optional(),
})

export const CargoDeclarationSchema = z.object({
  items: z.array(CargoItemSchema).min(1),
  totalWeight: z.number().positive(),
  totalVolume: z.number().positive().optional(),
  totalValue: z.number().nonnegative(),
  currency: z.string().length(3),
  totalPieces: z.number().int().positive(),
  totalContainers: z.number().int().nonnegative().optional(),
  totalPallets: z.number().int().nonnegative().optional(),
})

export const ComplianceFlagsSchema = z.object({
  hazardous: z.boolean(),
  msdsId: z.string().optional(),
  msdsReference: z.string().optional(),
  civilDefenseReference: z.string().optional(),
  temperatureControl: z.object({
    required: z.boolean(),
    min: z.number().optional(),
    max: z.number().optional(),
    current: z.number().optional(),
  }).optional(),
  specialHandling: z.array(z.string()).optional(),
  restrictedGoods: z.boolean().optional(),
  customsValue: z.number().nonnegative().optional(),
  incoterms: z.string().optional(),
  exportLicense: z.string().optional(),
  importLicense: z.string().optional(),
})

export const PermitRecordSchema = z.object({
  id: z.string(),
  type: z.string(),
  authority: z.string(),
  status: z.enum(['NOT_REQUIRED', 'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED']),
  required: z.boolean(),
  submittedDocs: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string().url().optional(),
    submittedAt: z.union([z.date(), z.string()]),
  })),
  avgProcessingHours: z.number().positive().optional(),
  estimatedCompletion: z.union([z.date(), z.string()]).optional(),
  actualCompletion: z.union([z.date(), z.string()]).optional(),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
})

export const ETWEventSchema = z.object({
  id: z.string(),
  etwId: z.string(),
  type: z.enum(['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'AT_FACILITY', 'HANDOVER', 'BORDER_CROSSING', 'CUSTOMS_CLEARED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'EXCEPTION_RESOLVED', 'CANCELLED']),
  timestamp: z.union([z.date(), z.string()]),
  actor: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    type: z.enum(['USER', 'SYSTEM', 'DRIVER', 'AUTHORITY']),
  }),
  location: z.object({
    name: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    address: z.string().optional(),
  }).optional(),
  evidenceRefs: z.array(z.string()).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  handoverTo: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
  }).optional(),
  verified: z.boolean(),
  verificationMethod: z.enum(['GPS', 'SIGNATURE', 'OTP', 'MANUAL']).optional(),
})

export const CreateETWSchema = z.object({
  tenantId: z.string(),
  scope: z.enum(['LOCAL', 'INTERCITY', 'CROSS_BORDER', 'MULTIMODAL']),
  mode: z.enum(['AIR', 'SEA', 'LAND', 'RAIL', 'MULTIMODAL', 'EXPRESS', 'COURIER']),
  references: z.object({
    shipmentNumber: z.string().optional(),
    invoiceNumber: z.string().optional(),
    purchaseOrderNumber: z.string().optional(),
    customerReference: z.string().optional(),
    internalReference: z.string().optional(),
    carrierReference: z.string().optional(),
  }).optional(),
  parties: z.array(PartySchema).min(2), // At least shipper and consignee
  cargo: CargoDeclarationSchema,
  compliance: ComplianceFlagsSchema,
  route: z.object({
    origin: LocationSchema,
    destination: LocationSchema,
    waypoints: z.array(LocationSchema).optional(),
    mode: z.enum(['AIR', 'SEA', 'LAND', 'RAIL', 'MULTIMODAL', 'EXPRESS', 'COURIER']),
  }),
  commercial: z.object({
    contractType: z.enum(['CONTRACT', 'SPOT', 'BENCHMARK']),
    rate: z.object({
      base: z.number().nonnegative(),
      currency: z.string().length(3),
      surcharges: z.array(z.object({
        type: z.string(),
        amount: z.number(),
        description: z.string().optional(),
      })).optional(),
    }),
  }),
  createdBy: z.string(),
  shipmentId: z.string().optional(),
})

export const UpdateETWSchema = CreateETWSchema.partial().extend({
  id: z.string(),
})

export const AddETWEventSchema = z.object({
  etwId: z.string(),
  type: ETWEventSchema.shape.type,
  actor: ETWEventSchema.shape.actor,
  location: ETWEventSchema.shape.location.optional(),
  description: z.string().optional(),
  verificationMethod: ETWEventSchema.shape.verificationMethod.optional(),
  metadata: z.record(z.any()).optional(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  ETW,
  ETWEvent,
  ETWLeg,
  ETWAttachment,
  Party,
  CargoDeclaration,
  CargoItem,
  ComplianceFlags,
  PermitRecord,
  RiskSnapshot,
  MilestoneEstimate,
  DeliveryAcknowledgment,
  VerificationPayload,
  QRToken,
  TransportReferenceMatrix,
  ETWRoute,
  CommercialContext,
}





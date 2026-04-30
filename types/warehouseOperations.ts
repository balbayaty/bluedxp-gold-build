// Enhanced Warehouse Operations Types
// Supporting multi-modal, cross-border, quality gates, AI suggestions

export type TransportMode = 'TRUCK' | 'AIR' | 'SEA' | 'RAIL' | 'MULTI_MODAL'
export type CustomsStatus = 'NOT_REQUIRED' | 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CLEARED'
export type QualityGateStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL' | 'WAIVED'
export type ExceptionType = 'DAMAGE' | 'SHORTAGE' | 'OVERAGE' | 'MISMATCH' | 'QUALITY' | 'DOCUMENTATION' | 'CUSTOMS' | 'OTHER'

// Multi-Modal Transport Information
export interface TransportInfo {
  primaryMode: TransportMode
  secondaryModes?: TransportMode[]
  carrierName?: string
  carrierCode?: string
  vesselName?: string // For sea freight
  flightNumber?: string // For air freight
  containerNumber?: string
  sealNumber?: string
  billOfLading?: string
  airwayBill?: string
  railCarNumber?: string // For rail
  originPort?: string
  destinationPort?: string
  estimatedTransitTime?: number // in hours
  actualTransitTime?: number // in hours
}

// Cross-Border Customs Information
export interface CustomsInfo {
  status: CustomsStatus
  customsBroker?: string
  customsDeclarationNumber?: string
  importLicenseNumber?: string
  exportLicenseNumber?: string
  countryOfOrigin?: string
  countryOfDestination?: string
  harmonizedCode?: string // HS Code
  customsValue?: number
  currency?: string
  duties?: number
  taxes?: number
  clearanceDate?: Date | string
  clearanceBy?: string
  documents?: CustomsDocument[]
  inspectionRequired?: boolean
  inspectionDate?: Date | string
  inspectionResult?: 'PASSED' | 'FAILED' | 'PENDING'
}

export interface CustomsDocument {
  id: string
  type: 'COMMERCIAL_INVOICE' | 'PACKING_LIST' | 'CERTIFICATE_OF_ORIGIN' | 'EXPORT_LICENSE' | 'IMPORT_LICENSE' | 'CUSTOMS_DECLARATION' | 'OTHER'
  documentNumber?: string
  issueDate?: Date | string
  expiryDate?: Date | string
  fileUrl?: string
  status: 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'REJECTED'
}

// Quality Gate Information
export interface QualityGate {
  id: string
  name: string
  stage: number // 1, 2, 3, etc.
  description: string
  status: QualityGateStatus
  requiredChecks: QualityCheck[]
  completedChecks: QualityCheck[]
  passedAt?: Date | string
  failedAt?: Date | string
  passedBy?: string
  failedBy?: string
  failureReason?: string
  nextGate?: string // ID of next gate
}

export interface QualityCheck {
  id: string
  name: string
  type: 'VISUAL' | 'DIMENSIONAL' | 'WEIGHT' | 'TEMPERATURE' | 'DOCUMENTATION' | 'SAMPLING' | 'FULL_INSPECTION' | 'OTHER'
  required: boolean
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'SKIPPED'
  result?: string
  checkedBy?: string
  checkedAt?: Date | string
  notes?: string
}

// AI Putaway Suggestion
export interface PutawaySuggestion {
  id: string
  locationCode: string
  locationType: 'BULK' | 'RACK' | 'COLD_STORAGE' | 'HAZMAT' | 'QUARANTINE' | 'CROSS_DOCK'
  confidence: number // 0-100
  reasoning: string[]
  factors: {
    materialCompatibility: number
    spaceAvailability: number
    accessibility: number
    temperatureControl: boolean
    hazmatCompliance: boolean
    pickingFrequency: number
    distanceFromReceiving: number
  }
  estimatedPutawayTime?: number // in seconds
  alternativeLocations?: PutawaySuggestion[]
}

// Exception Information
export interface Exception {
  id: string
  type: ExceptionType
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  detectedAt: Date | string
  detectedBy?: string
  affectedQuantity?: number
  affectedItems?: string[]
  photos?: string[]
  resolution?: {
    status: 'PENDING' | 'RESOLVED' | 'ESCALATED'
    resolvedAt?: Date | string
    resolvedBy?: string
    resolutionNotes?: string
  }
  escalationLevel?: number
  assignedTo?: string
}

// Document Management
export interface Document {
  id: string
  name: string
  type: 'COA' | 'MSDS' | 'CERTIFICATE' | 'INVOICE' | 'PACKING_LIST' | 'BOL' | 'CUSTOMS' | 'QUALITY' | 'OTHER'
  category: 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL'
  fileUrl: string
  thumbnailUrl?: string
  uploadedAt: Date | string
  uploadedBy?: string
  verifiedAt?: Date | string
  verifiedBy?: string
  expiryDate?: Date | string
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REJECTED'
  metadata?: Record<string, any>
}

// ASN Timeline Event
export interface ASNTimelineEvent {
  id: string
  timestamp: Date | string
  eventType: 'ASN_RECEIVED' | 'ACKNOWLEDGED' | 'IN_TRANSIT' | 'ARRIVED' | 'CUSTOMS_STARTED' | 'CUSTOMS_CLEARED' | 'QUALITY_GATE_1' | 'QUALITY_GATE_2' | 'QUALITY_GATE_3' | 'OFFLOADING_STARTED' | 'OFFLOADING_COMPLETED' | 'PUTAWAY_STARTED' | 'PUTAWAY_COMPLETED' | 'GR_POSTED' | 'EXCEPTION' | 'COMPLETED'
  title: string
  description?: string
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO'
  duration?: number // seconds from previous event
  metadata?: Record<string, any>
}




/**
 * MSDS-SKU Linking Type Definitions
 * Comprehensive types for intelligent MSDS to SKU linking system
 * Deep Architecture • Integration-First • 4IR & 5IR Aligned
 */

import { MSDSDocument, ExtractedMSDSData } from './chemical'
import { SKU } from './sku'
import { Customer } from './tenant'

// ============================================================================
// LINKING TYPES
// ============================================================================

/**
 * MSDS-SKU Link Status
 */
export type MSDSSKULinkStatus =
  | 'PENDING'              // Link created, awaiting approval
  | 'APPROVED'             // Link approved and active
  | 'REJECTED'             // Link rejected
  | 'CONDITIONAL'          // Link approved with conditions
  | 'EXPIRED'              // Link expired (MSDS expired)
  | 'REVOKED'              // Link revoked by approver
  | 'SUPERSEDED'           // Link superseded by new MSDS version

/**
 * Approval Level
 */
export type ApprovalLevel =
  | 'AUTO_APPROVED'        // Auto-approved by system (high confidence)
  | 'CUSTOMER_USER'        // Approved by customer user
  | 'CUSTOMER_ADMIN'       // Approved by customer admin
  | 'QUALITY_MANAGER'      // Approved by quality manager
  | 'COMPLIANCE_OFFICER'   // Approved by compliance officer
  | 'SYSTEM_ADMIN'         // Approved by system admin

/**
 * Approval Channel
 */
export type ApprovalChannel =
  | 'EMAIL'                // Email link approval
  | 'WHATSAPP'             // WhatsApp link approval
  | 'PORTAL'                // Customer portal approval
  | 'API'                  // API approval
  | 'MANUAL'                // Manual approval in system

/**
 * MSDS-SKU Link
 * Core linking entity between MSDS and SKU
 */
export interface MSDSSKULink {
  id: string
  msdsId: string
  skuId: string
  
  // Related entities
  customerId: string
  tenantId: string
  
  // Link metadata
  status: MSDSSKULinkStatus
  approvalLevel?: ApprovalLevel
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  
  // Approval conditions
  conditions?: ApprovalCondition[]
  restrictions?: ApprovalRestriction[]
  
  // Matching information
  matchingStrategy: MatchingStrategy
  confidenceScore: number              // 0-100
  matchingEvidence: MatchingEvidence
  
  // Link metadata
  linkedBy?: string
  linkedAt: string
  lastVerifiedAt?: string
  verifiedBy?: string
  
  // Versioning
  msdsVersion?: string
  skuVersion?: number
  
  // Lifecycle
  effectiveDate?: string
  expirationDate?: string
  notes?: string
  
  // Compliance
  complianceStatus?: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING_REVIEW'
  complianceNotes?: string
  
  // Data reuse tracking
  dataReused?: DataReuseTracking
  
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

/**
 * Matching Strategy
 */
export type MatchingStrategy =
  | 'CAS_NUMBER'           // Exact CAS number match
  | 'PRODUCT_NAME'         // Product name match
  | 'SYNONYM'              // Synonym match
  | 'CHEMICAL_FORMULA'     // Chemical formula match
  | 'UN_NUMBER'            // UN number match
  | 'MANUFACTURER'         // Manufacturer match
  | 'CATEGORY'             // Category match
  | 'HISTORICAL_LINK'      // Historical link match
  | 'AI_ML_MODEL'          // AI/ML model prediction
  | 'MANUAL'               // Manual linking
  | 'BULK_IMPORT'          // Bulk import
  | 'CUSTOMER_PROVIDED'    // Customer-provided mapping

/**
 * Matching Evidence
 * Evidence supporting the match
 */
export interface MatchingEvidence {
  strategy: MatchingStrategy
  confidenceScore: number
  matchedFields: MatchedField[]
  similarityScores: Record<string, number>
  aiAnalysis?: AIAnalysis
  historicalLinks?: HistoricalLink[]
  warnings?: string[]
  recommendations?: string[]
}

/**
 * Matched Field
 */
export interface MatchedField {
  field: string
  msdsValue: string
  skuValue: string
  matchType: 'EXACT' | 'FUZZY' | 'PARTIAL' | 'SEMANTIC'
  confidence: number
}

/**
 * AI Analysis
 */
export interface AIAnalysis {
  model?: string
  reasoning: string
  factors: string[]
  confidence: number
  alternatives?: AlternativeMatch[]
}

/**
 * Alternative Match
 */
export interface AlternativeMatch {
  msdsId: string
  skuId: string
  confidence: number
  reason: string
}

/**
 * Historical Link
 */
export interface HistoricalLink {
  linkId: string
  msdsId: string
  skuId: string
  status: MSDSSKULinkStatus
  linkedAt: string
  confidence: number
}

/**
 * Approval Condition
 */
export interface ApprovalCondition {
  id: string
  type: 'STORAGE' | 'HANDLING' | 'PACKAGING' | 'TRANSPORTATION' | 'COMPLIANCE' | 'CUSTOM'
  description: string
  required: boolean
  verified: boolean
  verifiedBy?: string
  verifiedAt?: string
  notes?: string
}

/**
 * Approval Restriction
 */
export interface ApprovalRestriction {
  id: string
  type: 'QUANTITY_LIMIT' | 'LOCATION_RESTRICTION' | 'TIME_RESTRICTION' | 'CUSTOM'
  description: string
  value?: any
  effectiveDate?: string
  expirationDate?: string
}

/**
 * Data Reuse Tracking
 * Tracks which MSDS data has been reused in which modules
 */
export interface DataReuseTracking {
  packaging?: {
    reused: boolean
    reusedAt?: string
    reusedBy?: string
    targetModule: 'WMS' | 'INVENTORY' | 'COMPLIANCE' | 'TRANSPORTATION'
  }
  palletConfiguration?: {
    reused: boolean
    reusedAt?: string
    reusedBy?: string
    targetModule: 'WMS' | 'INVENTORY'
  }
  storageRequirements?: {
    reused: boolean
    reusedAt?: string
    reusedBy?: string
    targetModule: 'WMS' | 'INVENTORY' | 'COMPLIANCE'
  }
  complianceData?: {
    reused: boolean
    reusedAt?: string
    reusedBy?: string
    targetModule: 'COMPLIANCE' | 'CIVIL_DEFENSE' | 'MINISTRY_INTERIOR'
  }
  transportationData?: {
    reused: boolean
    reusedAt?: string
    reusedBy?: string
    targetModule: 'TRANSPORTATION' | 'COMPLIANCE'
  }
}

// ============================================================================
// CUSTOMER APPROVAL TYPES
// ============================================================================

/**
 * Customer Approval Request
 */
export interface CustomerApprovalRequest {
  id: string
  linkId: string
  customerId: string
  customerEmail?: string
  customerPhone?: string
  
  // Request details
  requestType: 'MSDS_APPROVAL' | 'SKU_LINK_APPROVAL' | 'BULK_LINK_APPROVAL'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  
  // Channels
  channels: ApprovalChannel[]
  approvalToken: string
  approvalUrl?: string
  whatsappUrl?: string
  
  // Links to approve
  links: ApprovalLinkItem[]
  
  // Metadata
  requestedAt: string
  requestedBy?: string
  expiresAt: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
  
  // Notifications
  notificationsSent: NotificationSent[]
  
  createdAt: string
  updatedAt: string
}

/**
 * Approval Link Item
 */
export interface ApprovalLinkItem {
  linkId: string
  msdsId: string
  msdsName: string
  skuId: string
  skuCode: string
  skuDescription: string
  confidenceScore: number
  matchingStrategy: MatchingStrategy
  suggestedBy: 'SYSTEM' | 'CUSTOMER' | 'MANUAL'
}

/**
 * Notification Sent
 */
export interface NotificationSent {
  channel: ApprovalChannel
  sentAt: string
  recipient: string
  status: 'SENT' | 'DELIVERED' | 'FAILED'
  error?: string
}

/**
 * Customer Approval Response
 */
export interface CustomerApprovalResponse {
  requestId: string
  token: string
  action: 'APPROVE' | 'REJECT' | 'CONDITIONAL'
  links: {
    linkId: string
    action: 'APPROVE' | 'REJECT'
    conditions?: ApprovalCondition[]
    notes?: string
  }[]
  notes?: string
  approvedBy?: string
  approvedAt: string
}

// ============================================================================
// PACKAGING & COMPLIANCE DATA TYPES
// ============================================================================

/**
 * Packaging Data from MSDS
 * Comprehensive packaging information extracted from MSDS
 */
export interface MSDSPackagingData {
  // Container types
  containerTypes: ContainerType[]
  primaryContainer?: ContainerType
  secondaryContainer?: ContainerType
  
  // Packaging materials
  packagingMaterials: string[]
  
  // Pallet configuration
  palletConfiguration?: PalletConfiguration
  
  // Quantity per container
  quantityPerContainer?: number
  containerUnit?: string
  
  // Special requirements
  specialRequirements?: string[]
  labelingRequirements?: LabelingRequirement[]
  
  // Compliance
  civilDefenseRequirements?: CivilDefenseRequirements
  ministryInteriorRequirements?: MinistryInteriorRequirements
}

/**
 * Container Type
 */
export interface ContainerType {
  type: 'DRUM' | 'BAG' | 'BOTTLE' | 'CAN' | 'CYLINDER' | 'TANK' | 'BULK' | 'CUSTOM'
  material?: string
  size?: string
  capacity?: number
  capacityUnit?: string
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit: 'CM' | 'M' | 'IN' | 'FT'
  }
  weight?: number
  weightUnit?: string
  unCode?: string
  specialHandling?: string[]
}

/**
 * Pallet Configuration from MSDS
 */
export interface PalletConfiguration {
  palletType: 'STANDARD_EURO' | 'STANDARD_US' | 'STANDARD_ASIA' | 'CUSTOM'
  palletDimensions?: {
    length: number
    width: number
    height?: number
    unit: 'CM' | 'M' | 'IN' | 'FT'
  }
  maxLayers?: number
  maxUnitsPerLayer?: number
  maxWeight?: number
  stackingPattern?: 'COLUMN' | 'BRICK' | 'INTERLOCK' | 'PINWHEEL' | 'CUSTOM'
  tiePattern?: {
    horizontalTies?: number
    verticalTies?: number
    diagonalTies?: number
  }
  stretchWrapRequired?: boolean
  shrinkWrapRequired?: boolean
  palletCapRequired?: boolean
  cornerProtectors?: boolean
  specialInstructions?: string[]
}

/**
 * Labeling Requirement
 */
export interface LabelingRequirement {
  type: 'SHIPPING' | 'PRODUCT' | 'HAZMAT' | 'CUSTOM'
  language?: string[]
  requiredFields?: string[]
  template?: string
  customInstructions?: string
}

/**
 * Civil Defense Requirements
 */
export interface CivilDefenseRequirements {
  approved: boolean
  licenseNumber?: string
  licenseExpiryDate?: string
  storageCategory?: string
  fireSuppressionRequired?: string[]
  segregationRequired?: boolean
  segregationRules?: string[]
  quantityLimits?: {
    maxQuantity?: number
    unit?: string
    location?: string
  }
  specialConditions?: string[]
}

/**
 * Ministry of Interior Requirements
 */
export interface MinistryInteriorRequirements {
  approved: boolean
  licenseNumber?: string
  licenseExpiryDate?: string
  importApproval?: boolean
  exportApproval?: boolean
  regulatoryFrameworks?: string[]
  specialConditions?: string[]
}

// ============================================================================
// BULK OPERATIONS TYPES
// ============================================================================

/**
 * Bulk Link Request
 */
export interface BulkLinkRequest {
  customerId: string
  links: {
    msdsId: string
    skuIds: string[]  // One MSDS to many SKUs
    matchingStrategy?: MatchingStrategy
    confidenceThreshold?: number
  }[]
  autoApprove?: boolean
  requireCustomerApproval?: boolean
  notes?: string
}

/**
 * Bulk Link Result
 */
export interface BulkLinkResult {
  total: number
  successful: number
  failed: number
  links: MSDSSKULink[]
  errors: BulkLinkError[]
}

/**
 * Bulk Link Error
 */
export interface BulkLinkError {
  msdsId: string
  skuIds: string[]
  error: string
  code: string
}

// ============================================================================
// SEARCH & FILTER TYPES
// ============================================================================

/**
 * Link Search Filters
 */
export interface LinkSearchFilters {
  customerId?: string
  msdsId?: string
  skuId?: string
  status?: MSDSSKULinkStatus[]
  approvalLevel?: ApprovalLevel[]
  matchingStrategy?: MatchingStrategy[]
  minConfidence?: number
  maxConfidence?: number
  complianceStatus?: string[]
  dateRange?: {
    from: string
    to: string
  }
}

/**
 * Link Search Result
 */
export interface LinkSearchResult {
  links: MSDSSKULink[]
  total: number
  page: number
  pageSize: number
  filters: LinkSearchFilters
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * API Response
 */
export interface MSDSSKULinkAPIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  warnings?: string[]
}












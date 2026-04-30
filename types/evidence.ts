/**
 * Evidence & Lineage Tracking Type Definitions
 * Document/file/form evidence capture with validation states and audit trails
 * Supports integrity verification and lineage tracking
 */

// ============================================================================
// EVIDENCE TYPES
// ============================================================================

export type EvidenceType =
  | 'document'
  | 'email'
  | 'form'
  | 'file'
  | 'event'
  | 'approval'
  | 'incident'
  | 'image'
  | 'video'
  | 'audio'
  | 'signature'
  | 'certificate'
  | 'report'
  | 'measurement'
  | 'transaction'
  | 'custom'

export type ValidationState =
  | 'pending'
  | 'validating'
  | 'validated'
  | 'rejected'
  | 'expired'
  | 'revoked'

export interface Evidence {
  id: string
  tenantId?: string
  
  // Classification
  type: EvidenceType
  category: EvidenceCategory
  subCategory?: string
  
  // Content
  title: string
  description?: string
  content?: string // For text-based evidence
  fileUrl?: string // For file-based evidence
  thumbnailUrl?: string
  mimeType?: string
  fileSize?: number // bytes
  
  // Validation
  validationState: ValidationState
  validatedBy?: string
  validatedAt?: Date | string
  validationNotes?: string
  validationScore?: number // 0-100
  
  // Integrity
  hash: string // SHA-256 of content
  hashAlgorithm: 'sha256' | 'sha512' | 'md5'
  digitalSignature?: DigitalSignature
  
  // Lineage
  lineage: EvidenceLineage
  
  // Relations
  relatedEntities: RelatedEntity[]
  tags: string[]
  
  // Metadata
  metadata: EvidenceMetadata
  customFields?: Record<string, any>
  
  // Lifecycle
  status: 'active' | 'archived' | 'deleted'
  expiresAt?: Date | string
  retentionPeriod?: number // days
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  updatedBy?: string
}

export type EvidenceCategory =
  | 'compliance'
  | 'quality'
  | 'safety'
  | 'financial'
  | 'operational'
  | 'legal'
  | 'audit'
  | 'training'
  | 'incident'
  | 'approval'
  | 'communication'
  | 'other'

export interface DigitalSignature {
  signerId: string
  signerName: string
  signerRole?: string
  signedAt: Date | string
  signatureData: string // Base64 encoded
  certificateId?: string
  verificationStatus: 'valid' | 'invalid' | 'unknown'
}

export interface RelatedEntity {
  entityId: string
  entityType: string
  relationship: 'source' | 'subject' | 'reference' | 'attachment' | 'generated_from'
  addedAt: Date | string
  addedBy?: string
}

export interface EvidenceMetadata {
  source: string // Where evidence originated
  capturedAt: Date | string
  capturedBy?: string
  capturedMethod: 'upload' | 'scan' | 'api' | 'email' | 'manual' | 'generated' | 'imported'
  
  // Location
  location?: {
    latitude?: number
    longitude?: number
    address?: string
    facility?: string
  }
  
  // Device info (if captured from device)
  device?: {
    type: string
    id?: string
    name?: string
  }
  
  // Original file info
  originalFileName?: string
  originalFileType?: string
  
  // Processing
  processed: boolean
  processedAt?: Date | string
  processingResults?: Record<string, any>
  
  // OCR/AI extraction
  extractedText?: string
  extractedData?: Record<string, any>
  aiAnalysis?: Record<string, any>
  
  // Truth Engine specific fields
  sourceSystem?: string
  truthEngine?: boolean
  tamperingRisk?: number
  ocrText?: string
  hasSignature?: boolean
  hasWatermark?: boolean
  deepfakeRisk?: number
  voiceAuthenticationScore?: number
  speechToText?: string
  speakerIdentification?: string
}

// ============================================================================
// LINEAGE TRACKING
// ============================================================================

export interface EvidenceLineage {
  parentEvidenceId?: string // Direct parent
  rootEvidenceId?: string // Original source
  derivedFrom: string[] // All sources
  version: number
  changelog: ChangeLogEntry[]
  
  // Chain of custody
  custodyChain: CustodyTransfer[]
  
  // Derivation info
  derivationType?: 'copy' | 'extract' | 'transform' | 'merge' | 'split' | 'redact'
  derivationNotes?: string
}

export interface ChangeLogEntry {
  id: string
  timestamp: Date | string
  userId: string
  userName?: string
  action: ChangeAction
  field?: string // Which field changed
  previousValue?: any
  newValue?: any
  reason?: string
  ipAddress?: string
  userAgent?: string
}

export type ChangeAction =
  | 'create'
  | 'update'
  | 'validate'
  | 'reject'
  | 'expire'
  | 'revoke'
  | 'archive'
  | 'restore'
  | 'sign'
  | 'transfer'
  | 'view'
  | 'download'
  | 'share'
  | 'delete'

export interface CustodyTransfer {
  id: string
  fromUserId?: string
  fromUserName?: string
  toUserId: string
  toUserName?: string
  transferredAt: Date | string
  reason?: string
  acknowledged: boolean
  acknowledgedAt?: Date | string
  notes?: string
}

// ============================================================================
// EVIDENCE CHAIN
// ============================================================================

export interface EvidenceChain {
  id: string
  name: string
  description?: string
  
  // Chain members
  evidenceIds: string[]
  
  // Chain metadata
  chainType: 'audit_trail' | 'document_flow' | 'approval_chain' | 'incident_timeline' | 'custom'
  
  // Integrity
  chainHash: string // Combined hash of all evidence
  isValid: boolean
  lastValidatedAt?: Date | string
  
  // Lifecycle
  status: 'active' | 'sealed' | 'broken'
  sealedAt?: Date | string
  sealedBy?: string
  
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export interface ValidationRule {
  id: string
  name: string
  description: string
  
  // Scope
  appliesToTypes: EvidenceType[]
  appliesToCategories: EvidenceCategory[]
  
  // Rule definition
  ruleType: 'required_field' | 'format' | 'size' | 'age' | 'signature' | 'hash' | 'custom'
  condition: string // Expression or config
  parameters?: Record<string, any>
  
  // Behavior
  severity: 'error' | 'warning' | 'info'
  autoValidate: boolean
  
  // Status
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ValidationResult {
  evidenceId: string
  ruleId: string
  ruleName: string
  passed: boolean
  severity: 'error' | 'warning' | 'info'
  message: string
  details?: Record<string, any>
  validatedAt: Date | string
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

export interface EvidenceSearchQuery {
  query?: string
  tenantId?: string
  
  // Filters
  types?: EvidenceType[]
  categories?: EvidenceCategory[]
  validationStates?: ValidationState[]
  tags?: string[]
  
  // Date range
  createdAfter?: Date | string
  createdBefore?: Date | string
  
  // Related entity
  relatedEntityId?: string
  relatedEntityType?: string
  
  // Lineage
  hasParent?: boolean
  parentId?: string
  
  // Pagination
  limit?: number
  offset?: number
  
  // Sorting
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'validationState'
  sortOrder?: 'asc' | 'desc'
}

export interface EvidenceSearchResult {
  evidence: Evidence[]
  totalCount: number
  hasMore: boolean
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface EvidenceStats {
  totalCount: number
  byType: Record<EvidenceType, number>
  byCategory: Record<EvidenceCategory, number>
  byValidationState: Record<ValidationState, number>
  
  // Storage
  totalSizeBytes: number
  averageSizeBytes: number
  
  // Lineage
  withLineage: number
  averageChainLength: number
  
  // Validation
  pendingValidation: number
  validatedThisMonth: number
  rejectedThisMonth: number
  
  // Activity
  createdThisWeek: number
  updatedThisWeek: number
  viewedThisWeek: number
  
  calculatedAt: Date | string
}

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface EvidenceService {
  // CRUD
  create: (evidence: Omit<Evidence, 'id' | 'createdAt' | 'updatedAt' | 'lineage' | 'hash'> & { content?: string | Buffer }) => Promise<Evidence>
  get: (id: string) => Promise<Evidence | null>
  update: (id: string, updates: Partial<Evidence>, reason?: string) => Promise<Evidence>
  delete: (id: string, reason?: string) => Promise<boolean>
  archive: (id: string, reason?: string) => Promise<boolean>
  
  // Validation
  validate: (id: string, validatedBy: string, notes?: string) => Promise<Evidence>
  reject: (id: string, rejectedBy: string, reason: string) => Promise<Evidence>
  runValidationRules: (id: string) => Promise<ValidationResult[]>
  
  // Integrity
  verifyIntegrity: (id: string) => Promise<{ valid: boolean; issues: string[] }>
  generateHash: (content: string | Buffer) => string
  
  // Lineage
  getLineage: (id: string) => Promise<Evidence[]>
  getChildren: (id: string) => Promise<Evidence[]>
  createDerived: (parentId: string, derivation: { type: string; notes?: string }, newEvidence: Partial<Evidence>) => Promise<Evidence>
  
  // Chain
  createChain: (name: string, evidenceIds: string[], chainType: EvidenceChain['chainType']) => Promise<EvidenceChain>
  addToChain: (chainId: string, evidenceId: string) => Promise<EvidenceChain>
  sealChain: (chainId: string, sealedBy: string) => Promise<EvidenceChain>
  verifyChain: (chainId: string) => Promise<{ valid: boolean; issues: string[] }>
  
  // Custody
  transferCustody: (evidenceId: string, toUserId: string, reason?: string) => Promise<Evidence>
  acknowledgeCustody: (evidenceId: string, transferId: string) => Promise<Evidence>
  
  // Search
  search: (query: EvidenceSearchQuery) => Promise<EvidenceSearchResult>
  
  // Statistics
  getStats: (tenantId?: string) => Promise<EvidenceStats>
  
  // Changelog
  getChangelog: (evidenceId: string) => Promise<ChangeLogEntry[]>
  addChangelogEntry: (evidenceId: string, entry: Omit<ChangeLogEntry, 'id' | 'timestamp'>) => Promise<ChangeLogEntry>
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Evidence


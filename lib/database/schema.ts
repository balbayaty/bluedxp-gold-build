/**
 * Database Schema Definitions
 * Production-ready schema for all chemical management modules
 * Supports PostgreSQL (via Prisma) and MongoDB
 */

// ============================================================================
// CHEMICAL MANAGEMENT SCHEMAS
// ============================================================================

export interface ChemicalSchema {
  id: string
  name: string
  casNumber?: string
  unNumber?: string
  formula?: string
  molecularWeight?: number
  category: string
  subcategory?: string
  manufacturer?: string
  supplier?: string
  hazards: {
    nfpa?: {
      health: string
      flammability: string
      instability: string
      special?: string
    }
    ghs?: {
      pictograms: string[]
      signalWord: string
      hazardStatements: string[]
      precautionaryStatements: string[]
    }
    exposureLimits?: {
      oel?: number
      pel?: number
      tlv?: number
    }
  }
  storage: {
    temperatureRange?: {
      min: number
      max: number
      unit: string
    }
    humidityRange?: {
      min: number
      max: number
    }
    lightSensitive: boolean
    airSensitive: boolean
    moistureSensitive: boolean
    segregationRules: string[]
  }
  transport: {
    packingGroup?: string
    transportCategory?: string
    specialProvisions?: string[]
  }
  compliance: {
    ghsCompliant: boolean
    oshaCompliant: boolean
    reachCompliant: boolean
    regulatoryStatus: string[]
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    createdBy: string
    updatedBy?: string
    version: number
    tags: string[]
  }
}

export interface ContainerSchema {
  id: string
  chemicalId: string
  containerNumber: string
  barcode?: string
  qrCode?: string
  type: 'bottle' | 'drum' | 'tank' | 'cylinder' | 'bag' | 'other'
  capacity: number
  unit: 'ml' | 'l' | 'kg' | 'g' | 'gal' | 'lb'
  currentQuantity: number
  status: 'full' | 'partial' | 'empty' | 'disposed'
  location: {
    facility: string
    building?: string
    room?: string
    shelf?: string
    coordinates?: { x: number; y: number; z?: number }
  }
  receivedDate: Date
  expiryDate?: Date
  openedDate?: Date
  lastScanned?: Date
  metadata: {
    createdAt: Date
    updatedAt: Date
    createdBy: string
    version: number
  }
}

export interface MSDSSchema {
  id: string
  chemicalId?: string
  productName: string
  casNumber?: string
  version: string
  revisionDate?: Date
  supplier?: string
  fileUrl?: string
  fileType?: string
  fileSize?: number
  extractedData?: any
  status: 'pending' | 'review' | 'approved' | 'rejected'
  qrCode?: string
  qrCodeUrl?: string
  metadata: {
    uploadedAt: Date
    reviewedAt?: Date
    approvedAt?: Date
    uploadedBy: string
    reviewedBy?: string
    version: number
  }
}

export interface QRCodeSchema {
  id: string
  qrId: string
  documentId?: string
  containerId?: string
  chemicalId?: string
  documentType: 'msds' | 'certificate' | 'permit' | 'label' | 'report' | 'other'
  qrData: any
  qrImageUrl?: string
  isDynamic: boolean
  version: number
  analytics: {
    totalScans: number
    uniqueScans: number
    lastScanned?: Date
    firstScanned?: Date
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    createdBy: string
    expiresAt?: Date
  }
}

export interface QRScanEventSchema {
  id: string
  qrId: string
  timestamp: Date
  location?: string
  device?: string
  userAgent?: string
  ipAddress?: string
  userId?: string
  metadata: {
    createdAt: Date
  }
}

export interface NotificationSchema {
  id: string
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  channel: string | string[]
  title?: string
  message: string
  recipient?: string | string[]
  userId?: string
  tenantId?: string
  data?: any
  scheduledFor?: Date
  sentAt?: Date
  readAt?: Date
  status: 'pending' | 'sent' | 'failed' | 'read'
  read: boolean
  dismissed: boolean
  metadata: {
    createdAt: Date
    updatedAt: Date
  }
}

export interface OpenDataCacheSchema {
  id: string
  casNumber?: string
  chemicalName?: string
  source: string
  data: any
  confidence: number
  expiresAt: Date
  metadata: {
    cachedAt: Date
    version: number
  }
}

export interface AuditLogSchema {
  id: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete' | 'view' | 'approve' | 'reject' | 'export' | 'import' | 'login' | 'logout' | 'access_denied' | 'dispute'
  userId: string
  userName?: string
  timestamp: Date
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]
  metadata: {
    ipAddress?: string
    userAgent?: string
    sessionId?: string
    requestId?: string
  }
  compliance: {
    requiresAudit: boolean
    complianceType?: string
  }
}

export interface InventoryTransactionSchema {
  id: string
  containerId: string
  chemicalId: string
  type: 'receive' | 'issue' | 'transfer' | 'adjustment' | 'disposal'
  quantity: number
  unit: string
  fromLocation?: string
  toLocation?: string
  reason?: string
  userId: string
  timestamp: Date
  metadata: {
    createdAt: Date
    notes?: string
  }
}

// ============================================================================
// TRUTH ENGINE SCHEMAS
// ============================================================================

export interface TruthEventSchema {
  id: string
  tenant_id: string
  event_type: string
  happened_at: Date | string
  recorded_at: Date | string
  actor_type: string
  actor_id?: string
  actor_name?: string
  actor_role?: string
  entity_refs: Record<string, string> | string // JSON
  evidence_links: string[] | string // JSON
  confidence_score: number
  confidence_reason?: string
  derived_from: Record<string, any> | string // JSON
  business_impact?: Record<string, any> | string // JSON
  metadata?: Record<string, any> | string // JSON
  tags?: string[] | string // JSON
  status: 'active' | 'disputed' | 'corrected' | 'archived'
  disputed_by?: string
  disputed_at?: Date | string
  dispute_reason?: string
  corrected_event_id?: string
  created_at: Date | string
  updated_at?: Date | string
}

export interface TruthKPISchema {
  id: string
  name: string
  description: string
  formula: string
  required_event_types: string[] | string // JSON
  minimum_evidence_requirements: any[] | string // JSON
  value: number
  unit?: string
  calculated_at: Date | string
  calculation_method?: string
  evidence_ids: string[] | string // JSON
  breakdown: any[] | string // JSON
  trend?: 'up' | 'down' | 'stable'
  previous_value?: number
  change_percentage?: number
  target?: number
  threshold?: Record<string, number> | string // JSON
  category: string
  module?: string
  tags?: string[] | string // JSON
  validation_status: 'valid' | 'warning' | 'invalid' | 'pending'
  validation_issues?: string[] | string // JSON
  last_validated_at?: Date | string
}

export interface AdversarialReviewSchema {
  id: string
  decision_id: string
  decision_type: string
  personas: Record<string, any> | string // JSON
  overall_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  overall_confidence: number
  missing_evidence: string[] | string // JSON
  required_controls: any[] | string // JSON
  recommended_actions: any[] | string // JSON
  blockers: any[] | string // JSON
  reviewed_at: Date | string
  reviewed_by?: string
  review_method: string
  model_version?: string
  prompt_hash?: string
  review_duration?: number
  related_truth_events: string[] | string // JSON
  related_evidence: string[] | string // JSON
  related_decisions?: string[] | string // JSON
}

export interface BoardBriefSchema {
  id: string
  tenant_id: string
  generated_at: Date | string
  period_start: Date | string
  period_end: Date | string
  signals: any[] | string // JSON
  adversarial_insights: any[] | string // JSON
  total_evidence_items: number
  evidence_gaps: number
  low_confidence_events: number
  recommendations: any[] | string // JSON
}

// ============================================================================
// INDEXES FOR PERFORMANCE
// ============================================================================

export const DatabaseIndexes = {
  chemicals: [
    { fields: ['casNumber'], unique: false },
    { fields: ['name'], unique: false },
    { fields: ['category'], unique: false },
    { fields: ['metadata.createdAt'], unique: false },
  ],
  containers: [
    { fields: ['barcode'], unique: true },
    { fields: ['qrCode'], unique: true },
    { fields: ['chemicalId'], unique: false },
    { fields: ['status'], unique: false },
    { fields: ['location.facility'], unique: false },
  ],
  msds: [
    { fields: ['chemicalId'], unique: false },
    { fields: ['casNumber'], unique: false },
    { fields: ['status'], unique: false },
    { fields: ['metadata.uploadedAt'], unique: false },
  ],
  qrCodes: [
    { fields: ['qrId'], unique: true },
    { fields: ['documentId'], unique: false },
    { fields: ['containerId'], unique: false },
    { fields: ['isDynamic'], unique: false },
  ],
  qrScanEvents: [
    { fields: ['qrId'], unique: false },
    { fields: ['timestamp'], unique: false },
    { fields: ['userId'], unique: false },
  ],
  notifications: [
    { fields: ['userId'], unique: false },
    { fields: ['tenantId'], unique: false },
    { fields: ['status'], unique: false },
    { fields: ['read'], unique: false },
    { fields: ['metadata.createdAt'], unique: false },
  ],
  auditLogs: [
    { fields: ['entityType', 'entityId'], unique: false },
    { fields: ['userId'], unique: false },
    { fields: ['timestamp'], unique: false },
    { fields: ['action'], unique: false },
  ],
  inventoryTransactions: [
    { fields: ['containerId'], unique: false },
    { fields: ['chemicalId'], unique: false },
    { fields: ['type'], unique: false },
    { fields: ['timestamp'], unique: false },
  ],
  truthEvents: [
    { fields: ['tenant_id'], unique: false },
    { fields: ['event_type'], unique: false },
    { fields: ['happened_at'], unique: false },
    { fields: ['entity_refs'], unique: false },
    { fields: ['status'], unique: false },
    { fields: ['confidence_score'], unique: false },
  ],
  truthKPIs: [
    { fields: ['name'], unique: true },
    { fields: ['category'], unique: false },
    { fields: ['module'], unique: false },
    { fields: ['validation_status'], unique: false },
  ],
  adversarialReviews: [
    { fields: ['decision_id'], unique: false },
    { fields: ['reviewed_at'], unique: false },
    { fields: ['overall_risk'], unique: false },
  ],
  boardBriefs: [
    { fields: ['tenant_id'], unique: false },
    { fields: ['generated_at'], unique: false },
    { fields: ['period_start', 'period_end'], unique: false },
  ],
}

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

export interface DatabaseConfig {
  type: 'postgresql' | 'mongodb' | 'sqlite'
  connectionString?: string
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  ssl?: boolean
  pool?: {
    min: number
    max: number
  }
}




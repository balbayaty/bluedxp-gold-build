/**
 * ASN (Advanced Shipping Notice) Types
 * Complete type definitions for ASN module
 */

export enum ASNStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  RECEIVING = 'receiving',
  RECEIVED = 'received',
  EXCEPTION = 'exception',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum ASNPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ASNItemStatus {
  PENDING = 'pending',
  RECEIVING = 'receiving',
  RECEIVED = 'received',
  PARTIAL = 'partial',
  EXCEPTION = 'exception',
  COMPLETED = 'completed',
}

export enum ExceptionType {
  LATE_ARRIVAL = 'late_arrival',
  EARLY_ARRIVAL = 'early_arrival',
  QUANTITY_MISMATCH = 'quantity_mismatch',
  QUALITY_ISSUE = 'quality_issue',
  DAMAGE = 'damage',
  MISSING_ITEMS = 'missing_items',
  DOCUMENT_ISSUE = 'document_issue',
  COMPLIANCE_ISSUE = 'compliance_issue',
  PRICING_DISCREPANCY = 'pricing_discrepancy',
  SPECIFICATION_MISMATCH = 'specification_mismatch',
}

export enum ExceptionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ExceptionStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum ASNSource {
  EDI = 'edi',
  API = 'api',
  WEBHOOK = 'webhook',
  MANUAL = 'manual',
  PORTAL = 'portal',
  EMAIL = 'email',
}

export interface ASN {
  id: string
  asnNumber: string
  supplierId: string
  supplierName: string
  warehouseId: string
  warehouseName?: string
  expectedArrivalDate: Date
  actualArrivalDate?: Date
  status: ASNStatus
  priority: ASNPriority
  source: ASNSource
  
  // Quantities
  totalItems: number
  totalQuantity: number
  receivedQuantity?: number
  totalValue: number
  currency: string
  
  // Intelligence & Predictions
  predictedArrivalTime?: Date
  predictedArrivalConfidence?: number
  exceptionProbability?: number
  qualityScore?: number
  sustainabilityScore?: number
  
  // Items
  items: ASNItem[]
  
  // Documents
  documents: ASNDocument[]
  
  // Exceptions
  exceptions: ASNException[]
  
  // Tracking
  trackingEvents: TrackingEvent[]
  
  // Metadata
  metadata: Record<string, unknown>
  tags?: string[]
  notes?: string
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  receivedAt?: Date
  completedAt?: Date
  
  // Audit
  createdBy: string
  updatedBy: string
  receivedBy?: string
  tenantId: string
}

export interface ASNItem {
  id: string
  asnId: string
  lineNumber: number
  sku: string
  skuDescription?: string
  description: string
  quantity: number
  receivedQuantity?: number
  unitPrice: number
  totalPrice: number
  unitOfMeasure: string
  
  // Batch & Serial
  batchNumber?: string
  serialNumbers?: string[]
  expiryDate?: Date
  manufacturingDate?: Date
  
  // Location
  location?: string
  suggestedLocation?: string
  
  // Intelligence
  predictedQuality?: number
  exceptionRisk?: number
  qualityScore?: number
  
  // Status
  status: ASNItemStatus
  
  // Exceptions
  exceptions?: ASNException[]
  
  // Metadata
  metadata?: Record<string, unknown>
}

export interface ASNException {
  id: string
  asnId: string
  itemId?: string
  type: ExceptionType
  severity: ExceptionSeverity
  description: string
  detectedAt: Date
  detectedBy?: string
  resolvedAt?: Date
  resolvedBy?: string
  resolution?: string
  aiSuggestedResolution?: string
  rootCause?: string
  status: ExceptionStatus
  
  // Impact
  impactDescription?: string
  estimatedCost?: number
  estimatedDelay?: number // in hours
  
  // Resolution
  resolutionSteps?: string[]
  preventionMeasures?: string[]
  
  // Metadata
  metadata?: Record<string, unknown>
}

export interface ASNDocument {
  id: string
  asnId: string
  type: DocumentType
  name: string
  url: string
  mimeType?: string
  size?: number
  uploadedAt: Date
  uploadedBy?: string
  metadata?: Record<string, unknown>
}

export enum DocumentType {
  ASN_DOCUMENT = 'asn_document',
  INVOICE = 'invoice',
  PACKING_LIST = 'packing_list',
  CERTIFICATE = 'certificate',
  QUALITY_REPORT = 'quality_report',
  PHOTO = 'photo',
  VIDEO = 'video',
  OTHER = 'other',
}

export interface TrackingEvent {
  id: string
  asnId: string
  eventType: TrackingEventType
  description: string
  location?: string
  timestamp: Date
  userId?: string
  metadata?: Record<string, unknown>
}

export enum TrackingEventType {
  CREATED = 'created',
  SENT = 'sent',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  RECEIVING_STARTED = 'receiving_started',
  RECEIVING_COMPLETED = 'receiving_completed',
  EXCEPTION_DETECTED = 'exception_detected',
  EXCEPTION_RESOLVED = 'exception_resolved',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface ArrivalPrediction {
  asnId: string
  predictedArrival: Date
  confidence: number
  factors: PredictionFactor[]
  earliestArrival?: Date
  latestArrival?: Date
  updatedAt: Date
}

export interface PredictionFactor {
  name: string
  impact: number // -1 to 1
  description: string
  confidence: number
}

export interface SupplierIntelligence {
  supplierId: string
  supplierName: string
  
  // Performance Metrics
  onTimeDeliveryRate: number
  averageDeliveryTime: number
  qualityScore: number
  exceptionRate: number
  
  // Trends
  performanceTrend: 'improving' | 'stable' | 'declining'
  recentExceptions: number
  
  // Scores
  overallScore: number
  reliabilityScore: number
  qualityScore: number
  complianceScore: number
  
  // Recommendations
  recommendations?: string[]
  riskLevel: 'low' | 'medium' | 'high'
  
  // Metadata
  totalAsns: number
  lastAsnDate?: Date
  updatedAt: Date
}

export interface ASNAnalytics {
  // Time Period
  periodStart: Date
  periodEnd: Date
  
  // Volume Metrics
  totalAsns: number
  totalItems: number
  totalValue: number
  
  // Performance Metrics
  onTimeArrivalRate: number
  averageProcessingTime: number // in hours
  exceptionRate: number
  
  // Status Breakdown
  statusBreakdown: Record<ASNStatus, number>
  
  // Exception Breakdown
  exceptionBreakdown: Record<ExceptionType, number>
  
  // Supplier Performance
  topSuppliers: SupplierIntelligence[]
  
  // Trends
  dailyVolume: Array<{ date: Date; count: number }>
  exceptionTrend: Array<{ date: Date; count: number }>
  
  // Cost Metrics
  totalCost: number
  averageCostPerAsn: number
  costByExceptionType: Record<ExceptionType, number>
}

export interface ASNTemplate {
  id: string
  name: string
  description?: string
  type: TemplateType
  category?: string
  
  // Template Data
  structure: ASNTemplateStructure
  defaultValues?: Record<string, unknown>
  validationRules?: ValidationRule[]
  
  // Metadata
  isDefault: boolean
  isPublic: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
  tenantId: string
  
  // Usage
  usageCount?: number
  lastUsedAt?: Date
}

export enum TemplateType {
  ASN_TEMPLATE = 'asn_template',
  WORKFLOW_TEMPLATE = 'workflow_template',
  REPORT_TEMPLATE = 'report_template',
}

export interface ASNTemplateStructure {
  fields: TemplateField[]
  sections?: TemplateSection[]
  workflow?: WorkflowStep[]
}

export interface TemplateField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'file'
  required: boolean
  defaultValue?: unknown
  options?: Array<{ label: string; value: string }>
  validation?: ValidationRule[]
}

export interface TemplateSection {
  name: string
  label: string
  fields: string[] // field names
  order: number
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'approval' | 'inspection' | 'notification' | 'automation'
  order: number
  required: boolean
  assignee?: string
  conditions?: WorkflowCondition[]
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains'
  value: unknown
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: unknown
  message?: string
  validator?: (value: unknown) => boolean
}

// API Request/Response Types
export interface CreateASNRequest {
  asnNumber?: string
  supplierId: string
  warehouseId: string
  expectedArrivalDate: Date
  priority?: ASNPriority
  source?: ASNSource
  items: CreateASNItemRequest[]
  documents?: CreateASNDocumentRequest[]
  metadata?: Record<string, unknown>
  notes?: string
}

export interface CreateASNItemRequest {
  lineNumber: number
  sku: string
  description: string
  quantity: number
  unitPrice: number
  unitOfMeasure: string
  batchNumber?: string
  expiryDate?: Date
  metadata?: Record<string, unknown>
}

export interface CreateASNDocumentRequest {
  type: DocumentType
  name: string
  url: string
  mimeType?: string
  size?: number
  metadata?: Record<string, unknown>
}

export interface UpdateASNRequest {
  expectedArrivalDate?: Date
  priority?: ASNPriority
  status?: ASNStatus
  items?: UpdateASNItemRequest[]
  metadata?: Record<string, unknown>
  notes?: string
}

export interface UpdateASNItemRequest {
  id: string
  quantity?: number
  receivedQuantity?: number
  status?: ASNItemStatus
  location?: string
  metadata?: Record<string, unknown>
}

export interface ASNQueryParams {
  page?: number
  limit?: number
  status?: ASNStatus[]
  supplierId?: string
  warehouseId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  includeItems?: boolean
  includeExceptions?: boolean
  includeDocuments?: boolean
}

export interface ASNListResponse {
  data: ASN[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Dashboard Types
export interface ExecutiveDashboardData {
  summary: {
    totalAsns: number
    pendingAsns: number
    inTransitAsns: number
    exceptionAsns: number
    totalValue: number
  }
  trends: {
    asnVolume: Array<{ date: Date; count: number }>
    exceptionRate: Array<{ date: Date; rate: number }>
    onTimeRate: Array<{ date: Date; rate: number }>
  }
  topSuppliers: SupplierIntelligence[]
  recentExceptions: ASNException[]
  alerts: DashboardAlert[]
}

export interface OperationalDashboardData {
  queue: {
    pending: ASN[]
    inProgress: ASN[]
    exceptions: ASN[]
  }
  today: {
    expected: ASN[]
    arrived: ASN[]
    completed: ASN[]
  }
  resources: {
    receivingBays: Array<{ id: string; status: 'available' | 'occupied'; currentAsn?: string }>
    staff: Array<{ id: string; name: string; currentTask?: string }>
  }
  alerts: DashboardAlert[]
}

export interface AnalyticalDashboardData {
  analytics: ASNAnalytics
  predictions: {
    arrivalPredictions: ArrivalPrediction[]
    exceptionPredictions: Array<{ asnId: string; probability: number; type: ExceptionType }>
  }
  insights: DashboardInsight[]
  recommendations: string[]
}

export interface DashboardAlert {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  message: string
  asnId?: string
  timestamp: Date
  actionUrl?: string
}

export interface DashboardInsight {
  id: string
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  confidence: number
  recommendations?: string[]
  relatedAsns?: string[]
  timestamp: Date
}

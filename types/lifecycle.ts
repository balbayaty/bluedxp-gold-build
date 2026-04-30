/**
 * Universal Lifecycle Management System Types
 * Platform-wide lifecycle management for all entity types
 * Supports Sales Orders, Purchase Orders, ASNs, NCRs, CAPAs, etc.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type EntityType = 
  | 'SALES_ORDER'
  | 'PURCHASE_ORDER'
  | 'ASN'
  | 'TASK'
  | 'PICKING'
  | 'PUTAWAY'
  | 'CYCLE_COUNT'
  | 'GOODS_RECEIPT'
  | 'WAVE'
  | 'NCR'
  | 'CAPA'
  | 'SHIPMENT'
  | 'RFQ'
  | 'INSPECTION'
  | 'AUDIT'
  | 'CUSTOM'
  | 'CUSTOMS_DECLARATION'

export type LifecycleViewMode = 
  | 'timeline'
  | 'gantt'
  | 'kanban'
  | 'network'
  | 'journey'
  | 'process-mining'
  | 'workflow'

export type StageStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'BLOCKED'
  | 'FAILED'

export type StageTransitionType = 
  | 'AUTO'
  | 'MANUAL'
  | 'CONDITIONAL'
  | 'APPROVAL_REQUIRED'
  | 'ERROR'

// ============================================================================
// LIFECYCLE CONFIGURATION
// ============================================================================

export interface LifecycleConfig {
  entityType: EntityType
  name: string
  description: string
  stages: LifecycleStage[]
  defaultView?: LifecycleViewMode
  moduleIntegrations?: ModuleIntegration[]
  evidenceRequired?: string[]  // Stage IDs that require evidence
  slaRules?: SLARule[]
  autoTransitions?: AutoTransition[]
  permissions?: StagePermission[]
  customFields?: Record<string, any>
}

export interface LifecycleStage {
  id: string                    // Unique stage ID (e.g., 'created', 'picking')
  code: string                  // Status code (e.g., 'CREATED', 'PICKING')
  name: string                  // Display name
  description: string
  icon?: string                 // Icon identifier (e.g., 'ri-file-add-line')
  color?: string                // Theme color (e.g., '#06b6d4')
  order: number                 // Sequence order (1, 2, 3...)
  isRequired: boolean
  isOptional: boolean
  canSkip: boolean
  estimatedDuration?: number    // Estimated duration in seconds
  slaTarget?: number            // SLA target duration in seconds
  requiresApproval: boolean
  approvalRoles?: string[]
  autoTransition?: boolean
  conditions?: StageCondition[]
  moduleLinks?: ModuleLink[]
  actions?: StageAction[]
  metadata?: Record<string, any>
}

export interface StageCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in'
  value: any
  description?: string
}

export interface ModuleLink {
  module: string                 // Module identifier (e.g., 'picking', 'tracking')
  action: string                 // Action type (e.g., 'view', 'create', 'update')
  label: string                  // Display label
  href?: string                 // Optional direct link
  icon?: string                 // Icon identifier
  required?: boolean            // Whether this link is required
}

export interface StageAction {
  id: string
  name: string
  description?: string
  icon?: string
  actionType: 'navigate' | 'modal' | 'api' | 'workflow'
  target?: string
  requiresPermission?: string[]
  confirmationRequired?: boolean
}

export interface ModuleIntegration {
  stageId: string
  modules: string[]
  realTimeSync: boolean
  syncFields?: string[]
  onUpdate?: (data: any) => void
}

export interface SLARule {
  stageId: string
  targetDuration: number        // Target duration in seconds
  warningThreshold?: number    // Warning at X% of target (0-1)
  breachAction?: string        // Action on breach (e.g., 'notify_manager')
  escalationRoles?: string[]
}

export interface AutoTransition {
  fromStageId: string
  toStageId: string
  condition: string             // JavaScript expression or condition object
  delay?: number                // Delay in seconds before transition
}

export interface StagePermission {
  stageId: string
  roles: string[]
  actions: string[]             // Allowed actions (e.g., ['view', 'transition', 'edit'])
}

// ============================================================================
// LIFECYCLE INSTANCE
// ============================================================================

export interface EntityLifecycle {
  entityId: string
  entityType: EntityType
  currentStage: LifecycleStage
  currentStageId: string
  status: StageStatus
  progress: number              // 0-100
  startedAt: Date | string
  updatedAt: Date | string
  completedAt?: Date | string
  stages: StageInstance[]
  transitions: StageTransition[]
  metadata?: Record<string, any>
}

export interface StageInstance {
  stageId: string
  stage: LifecycleStage
  status: StageStatus
  startedAt?: Date | string
  completedAt?: Date | string
  duration?: number             // Actual duration in seconds
  assignedTo?: string[]
  evidence?: EvidenceReference[]
  moduleStatus?: ModuleStatus[]
  comments?: Comment[]
  metadata?: Record<string, any>
}

export interface StageTransition {
  id: string
  fromStageId: string
  toStageId: string
  transitionType: StageTransitionType
  triggeredBy: string
  triggeredAt: Date | string
  reason?: string
  context?: Record<string, any>
  approvedBy?: string
  approvedAt?: Date | string
}

export interface EvidenceReference {
  id: string
  evidenceId: string
  evidenceType: string
  attachedAt: Date | string
  attachedBy: string
  description?: string
}

export interface ModuleStatus {
  module: string
  status: 'connected' | 'disconnected' | 'syncing' | 'error'
  lastSync?: Date | string
  data?: Record<string, any>
  error?: string
}

export interface Comment {
  id: string
  stageId: string
  author: string
  content: string
  createdAt: Date | string
  attachments?: string[]
}

// ============================================================================
// LIFECYCLE UPDATE
// ============================================================================

export interface LifecycleUpdate {
  entityId: string
  entityType: EntityType
  updateType: 'stage_changed' | 'status_changed' | 'progress_updated' | 'module_synced' | 'evidence_added' | 'comment_added'
  stageId?: string
  previousStageId?: string
  status?: StageStatus
  progress?: number
  timestamp: Date | string
  triggeredBy?: string
  context?: Record<string, any>
}

// ============================================================================
// ANALYTICS & INSIGHTS
// ============================================================================

export interface StageAnalytics {
  stageId: string
  totalInstances: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  slaComplianceRate: number
  completionRate: number
  bottleneckScore: number        // 0-100, higher = more bottleneck
  resourceUtilization: number    // 0-100
  costPerInstance?: number
  qualityMetrics?: QualityMetrics
}

export interface QualityMetrics {
  defectRate: number
  reworkRate: number
  firstPassYield: number
  customerSatisfaction?: number
}

export interface PredictiveInsight {
  id: string
  type: 'risk' | 'optimization' | 'bottleneck' | 'sla_breach' | 'resource' | 'cost'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  stageId?: string
  predictedValue?: number
  confidence: number              // 0-100
  recommendations: string[]
  actionable: boolean
  expiresAt?: Date | string
}

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface LifecycleService {
  // Configuration
  registerLifecycle(entityType: EntityType, config: LifecycleConfig): void
  getLifecycleConfig(entityType: EntityType): LifecycleConfig | null
  getAllConfigs(): Map<EntityType, LifecycleConfig>
  
  // Entity lifecycle management
  getLifecycle(entityId: string, entityType: EntityType): Promise<EntityLifecycle | null>
  initializeLifecycle(entityId: string, entityType: EntityType, initialData?: Record<string, any>): Promise<EntityLifecycle>
  transitionStage(entityId: string, entityType: EntityType, toStageId: string, context?: Record<string, any>): Promise<EntityLifecycle>
  getCurrentStage(entityId: string, entityType: EntityType): Promise<LifecycleStage | null>
  getStageHistory(entityId: string, entityType: EntityType): Promise<StageTransition[]>
  
  // Real-time
  subscribe(entityId: string, entityType: EntityType, callback: (update: LifecycleUpdate) => void): LifecycleSubscription
  unsubscribe(subscription: LifecycleSubscription): void
  
  // Analytics
  getStageAnalytics(entityType: EntityType, stageId?: string, filters?: AnalyticsFilter): Promise<StageAnalytics[]>
  getPredictiveInsights(entityId: string, entityType: EntityType): Promise<PredictiveInsight[]>
  
  // Module integration
  getModuleStatus(entityId: string, entityType: EntityType, stageId: string): Promise<ModuleStatus[]>
  syncModule(entityId: string, entityType: EntityType, stageId: string, module: string): Promise<void>
  
  // Evidence
  getEvidence(entityId: string, entityType: EntityType, stageId?: string): Promise<EvidenceReference[]>
  attachEvidence(entityId: string, entityType: EntityType, stageId: string, evidence: EvidenceInput): Promise<EvidenceReference>
  
  // Comments
  addComment(entityId: string, entityType: EntityType, stageId: string, comment: CommentInput): Promise<Comment>
  getComments(entityId: string, entityType: EntityType, stageId?: string): Promise<Comment[]>
}

export interface LifecycleSubscription {
  id: string
  entityId: string
  entityType: EntityType
  unsubscribe: () => void
}

export interface EvidenceInput {
  evidenceId: string
  evidenceType: string
  description?: string
}

export interface CommentInput {
  content: string
  attachments?: string[]
}

export interface AnalyticsFilter {
  dateRange?: { start: Date | string; end: Date | string }
  entityIds?: string[]
  stageIds?: string[]
  statuses?: StageStatus[]
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface LifecycleViewProps {
  entityId: string
  entityType: EntityType
  viewMode?: LifecycleViewMode
  showLayers?: ('overview' | 'details' | 'events' | 'evidence' | 'modules' | 'ai')[]
  onStageClick?: (stage: LifecycleStage) => void
  onModuleLinkClick?: (module: string, action: string, href?: string) => void
  onStageTransition?: (fromStageId: string, toStageId: string) => void
  className?: string
  height?: number
  enableRealTime?: boolean
  enablePredictive?: boolean
}

export interface StageCardProps {
  stage: LifecycleStage
  instance?: StageInstance
  isActive: boolean
  isCompleted: boolean
  isPending: boolean
  onClick?: () => void
  onModuleLinkClick?: (module: string, action: string) => void
  showDetails?: boolean
}


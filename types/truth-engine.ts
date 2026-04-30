/**
 * Truth Engine / Digital Doppelgänger Layer
 * Evidence-based, audit-ready, adversarially reviewed platform layer
 * 
 * This is the foundational layer that makes every KPI "click-to-proof"
 * and every decision adversarially reviewed.
 * 
 * @module types/truth-engine
 */

import { DomainEvent } from '@/types/cqrs'
import { Evidence } from '@/types/evidence'

// ============================================================================
// TRUTH EVENT (Reality Timeline - "What Actually Happened")
// ============================================================================

/**
 * TruthEvent represents a canonical event in the business reality timeline.
 * Every significant business event should have a corresponding TruthEvent
 * with evidence links and confidence scores.
 */
export interface TruthEvent {
  id: string
  tenantId: string
  
  // Event classification
  eventType: TruthEventType
  happenedAt: Date | string // When it actually occurred (business time)
  recordedAt: Date | string // When we recorded it (system time)
  
  // Actor (who/what caused this)
  actor: {
    type: 'user' | 'system' | 'driver' | 'customer' | 'api' | 'iot_device' | 'automated_workflow'
    id?: string
    name?: string
    role?: string
    metadata?: Record<string, any>
  }
  
  // Entity references (what this event relates to)
  entityRefs: {
    shipmentId?: string
    customerId?: string
    laneId?: string
    contractId?: string
    invoiceId?: string
    msdsId?: string
    warehouseId?: string
    orderId?: string
    asnId?: string
    containerId?: string
    carrierId?: string
    routeId?: string
    complianceRecordId?: string
    ncrId?: string
    capaId?: string
    auditId?: string
    [key: string]: string | undefined
  }
  
  // Evidence links (FIRST-CLASS - every event must have evidence)
  evidenceLinks: string[] // EvidenceItem.id[]
  
  // Confidence & derivation
  confidenceScore: number // 0-1, how confident we are this event is true
  confidenceReason?: string // Why this confidence score
  derivedFrom: {
    rulesetId?: string
    modelId?: string
    humanConfirmation?: boolean
    sourceEventId?: string // Link to DomainEvent
    sourceSystem?: string
  }
  
  // Business context
  businessImpact?: {
    financial?: number
    operational?: string
    compliance?: string
    risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }
  
  // Metadata
  metadata?: Record<string, any>
  tags?: string[]
  
  // Lifecycle
  status: 'active' | 'disputed' | 'corrected' | 'archived'
  disputedBy?: string
  disputedAt?: Date | string
  disputeReason?: string
  correctedEventId?: string // If this event was corrected
  
  createdAt: Date | string
  updatedAt?: Date | string
}

/**
 * Comprehensive taxonomy of truth event types across all modules
 */
export type TruthEventType =
  // ===== LOGISTICS & TRANSPORTATION =====
  | 'quote_sent' | 'quote_accepted' | 'quote_rejected' | 'quote_expired'
  | 'truck_departed' | 'truck_arrived' | 'truck_delayed'
  | 'border_arrival' | 'border_clearance' | 'border_delay'
  | 'detention_started' | 'detention_ended' | 'detention_extended'
  | 'delivered' | 'delivery_failed' | 'delivery_rescheduled'
  | 'pod_captured' | 'pod_signed' | 'pod_rejected'
  | 'route_optimized' | 'route_deviation'
  | 'geofence_entered' | 'geofence_exited' | 'idle_detected'
  
  // ===== MSDS / HAZALYZE =====
  | 'msds_received' | 'msds_uploaded' | 'msds_classified'
  | 'msds_approved' | 'msds_rejected' | 'msds_expired'
  | 'msds_linked_to_sku' | 'msds_unlinked_from_sku'
  | 'hazard_detected' | 'hazard_classified'
  | 'compliance_verified' | 'compliance_failed'
  | 'chemical_restriction_applied' | 'chemical_restriction_removed'
  
  // ===== FINANCIAL =====
  | 'invoice_generated' | 'invoice_sent' | 'invoice_viewed'
  | 'payment_received' | 'payment_failed' | 'payment_partial'
  | 'credit_note_issued' | 'refund_processed'
  | 'pricing_changed' | 'discount_applied' | 'surcharge_applied'
  | 'margin_calculated' | 'margin_bridge_updated'
  
  // ===== COMPLIANCE & REGULATORY =====
  | 'license_expired' | 'license_renewed' | 'license_revoked'
  | 'audit_scheduled' | 'audit_started' | 'audit_completed' | 'audit_failed'
  | 'violation_detected' | 'violation_resolved' | 'violation_escalated'
  | 'compliance_score_updated' | 'compliance_debt_incurred' | 'compliance_debt_resolved'
  | 'regulatory_change_detected' | 'regulatory_update_applied'
  
  // ===== WMS OPERATIONS =====
  | 'asn_received' | 'asn_acknowledged' | 'asn_rejected'
  | 'inbound_received' | 'inbound_quality_gate_passed' | 'inbound_quality_gate_failed'
  | 'putaway_started' | 'putaway_completed' | 'putaway_failed'
  | 'picking_started' | 'picking_completed' | 'picking_failed'
  | 'cycle_count_performed' | 'discrepancy_found' | 'discrepancy_resolved'
  | 'stock_transfer_initiated' | 'stock_transfer_completed'
  | 'expiry_detected' | 'expiry_alert_sent'
  
  // ===== QUALITY & SAFETY =====
  | 'inspection_scheduled' | 'inspection_started' | 'inspection_completed'
  | 'ncr_created' | 'ncr_resolved' | 'ncr_escalated'
  | 'capa_created' | 'capa_approved' | 'capa_completed'
  | 'incident_reported' | 'incident_investigated' | 'incident_resolved'
  | 'damage_detected' | 'damage_assessed' | 'damage_resolved'
  
  // ===== CUSTOMER & RELATIONSHIPS =====
  | 'customer_onboarded' | 'customer_approved' | 'customer_suspended'
  | 'contract_signed' | 'contract_renewed' | 'contract_terminated'
  | 'sla_breached' | 'sla_met' | 'sla_warning'
  | 'term_creep_detected' | 'term_creep_resolved'
  
  // ===== SYSTEM & AUTOMATION =====
  | 'workflow_triggered' | 'workflow_completed' | 'workflow_failed'
  | 'ai_decision_made' | 'ai_recommendation_generated'
  | 'automated_action_executed' | 'automated_action_failed'
  | 'integration_synced' | 'integration_failed'
  
  // ===== CUSTOM =====
  | 'custom'

// ============================================================================
// EVIDENCE ITEM (extends existing Evidence)
// ============================================================================

/**
 * TruthEvidenceItem extends the existing Evidence type with Truth Engine
 * specific fields for source system tracking and enhanced chain of custody.
 */
export interface TruthEvidenceItem extends Evidence {
  // Source system tracking (where evidence originated)
  sourceSystem: EvidenceSourceSystem
  
  // Enhanced chain of custody
  chainOfCustody: CustodyEvent[]
  
  // Truth Engine metadata
  truthMetadata?: {
    automaticallyCaptured?: boolean
    requiresValidation?: boolean
    validationDeadline?: Date | string
    relatedTruthEventIds?: string[]
  }
}

export type EvidenceSourceSystem =
  | 'gmail' | 'google_drive' | 'whatsapp' | 'telegram'
  | 'wms' | 'tms' | 'erp' | 'crm'
  | 'manual_upload' | 'api' | 'webhook'
  | 'iot' | 'telematics' | 'gps'
  | 'ocr' | 'ai_vision' | 'document_scanner'
  | 'email' | 'sms' | 'voice'
  | 'blockchain' | 'digital_signature'
  | 'custom'

export interface CustodyEvent {
  id: string
  timestamp: Date | string
  fromActor?: string
  toActor: string
  action: 'captured' | 'transferred' | 'viewed' | 'validated' | 'archived' | 'deleted'
  reason?: string
  metadata?: Record<string, any>
}

// ============================================================================
// ADVERSARIAL REVIEW (Decision Stress Testing)
// ============================================================================

/**
 * AdversarialReview provides multi-persona stress testing of decisions.
 * Every significant decision should be reviewed through 4 adversarial lenses.
 */
export interface AdversarialReview {
  id: string
  decisionId: string
  decisionType: DecisionType
  
  // Personas (4 adversarial lenses)
  personas: {
    regulator: PersonaReview
    cfo: PersonaReview
    competitor: PersonaReview
    litigator: PersonaReview
  }
  
  // Overall assessment
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  overallConfidence: number // 0-1
  
  // Critical findings
  missingEvidence: string[] // Evidence IDs that should exist but don't
  requiredControls: Control[]
  recommendedActions: Action[]
  blockers: Blocker[] // Things that must be addressed before proceeding
  
  // Review metadata (for audit determinism)
  reviewedAt: Date | string
  reviewedBy?: string
  reviewMethod: 'rules_engine' | 'llm' | 'hybrid' | 'human'
  modelVersion?: string
  promptHash?: string // SHA-256 of prompt for audit determinism
  reviewDuration?: number // ms
  
  // Related entities
  relatedTruthEvents: string[]
  relatedEvidence: string[]
  relatedDecisions?: string[] // Related decision IDs
}

export type DecisionType =
  | 'pricing_change' | 'customer_onboarding' | 'customer_suspension'
  | 'msds_approval_batch' | 'compliance_override'
  | 'detention_claim' | 'damage_claim' | 'insurance_claim'
  | 'sla_proposal' | 'contract_amendment'
  | 'warehouse_expansion' | 'carrier_selection'
  | 'compliance_exception' | 'regulatory_waiver'
  | 'custom'

export interface PersonaReview {
  persona: 'regulator' | 'cfo' | 'competitor' | 'litigator'
  risks: Risk[]
  missingEvidence: string[]
  requiredControls: Control[]
  recommendedActions: Action[]
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidence: number // 0-1
  evidenceRefs: string[] // Evidence IDs used in analysis
  reasoning?: string // Why this persona sees these risks
  quotedRegulations?: string[] // Relevant regulations (for regulator)
  financialImpact?: number // For CFO
  competitiveRisk?: string // For competitor
  legalExposure?: string // For litigator
}

export interface Risk {
  id: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  likelihood: number // 0-1
  impact: string
  evidenceRefs: string[]
  mitigation?: string
  owner?: string
}

export interface Control {
  id: string
  description: string
  type: 'preventive' | 'detective' | 'corrective' | 'compensating'
  required: boolean
  evidenceRefs?: string[]
  implementation?: string
}

export interface Action {
  id: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  deadline?: Date | string
  owner?: string
  evidenceRefs?: string[]
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked'
}

export interface Blocker {
  id: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  requiredEvidence?: string[]
  requiredControls?: string[]
  resolution?: string
}

// ============================================================================
// TRUTH KPI (Click-to-Proof Metrics)
// ============================================================================

/**
 * TruthKPI represents a KPI that is fully evidence-backed.
 * Every KPI value can be drilled down to the exact evidence that supports it.
 */
export interface TruthKPI {
  id: string
  name: string
  description: string
  formula: string // Mathematical formula or description
  
  // Required event types for calculation
  requiredEventTypes: TruthEventType[]
  
  // Minimum evidence requirements per event type
  minimumEvidenceRequirements: {
    eventType: TruthEventType
    minEvidenceCount: number
    requiredEvidenceTypes?: string[] // Specific evidence types required
  }[]
  
  // Current value
  value: number
  unit?: string
  calculatedAt: Date | string
  calculationMethod?: 'sum' | 'average' | 'count' | 'formula' | 'custom'
  
  // Evidence links (click-to-proof)
  evidenceIds: string[] // All evidence used in calculation
  breakdown: KPIBreakdown[] // Dimensional breakdowns
  
  // Trend & comparison
  trend?: 'up' | 'down' | 'stable'
  previousValue?: number
  changePercentage?: number
  target?: number
  threshold?: {
    warning: number
    critical: number
  }
  
  // Metadata
  category: 'financial' | 'operational' | 'compliance' | 'quality' | 'safety' | 'customer'
  module?: string // Which module this KPI belongs to
  tags?: string[]
  
  // Validation
  validationStatus: 'valid' | 'warning' | 'invalid' | 'pending'
  validationIssues?: string[]
  lastValidatedAt?: Date | string
}

export interface KPIBreakdown {
  dimension: string // e.g., "by_customer", "by_lane", "by_month", "by_warehouse"
  values: Record<string, number>
  evidenceIds: Record<string, string[]> // Evidence per dimension value
  metadata?: Record<string, any>
}

// ============================================================================
// TRUTH TIMELINE (Unified View)
// ============================================================================

/**
 * TruthTimeline provides a unified view of all truth events for an entity.
 */
export interface TruthTimeline {
  entityType: string
  entityId: string
  events: TruthEvent[]
  evidence: TruthEvidenceItem[]
  confidenceScore: number // Overall confidence in timeline
  gaps?: TimelineGap[] // Missing events or evidence
  disputes?: TimelineDispute[]
}

export interface TimelineGap {
  id: string
  type: 'missing_event' | 'missing_evidence' | 'time_gap'
  description: string
  startTime?: Date | string
  endTime?: Date | string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  suggestedActions?: string[]
}

export interface TimelineDispute {
  id: string
  eventId: string
  disputedBy: string
  disputedAt: Date | string
  reason: string
  status: 'open' | 'resolved' | 'rejected'
  resolution?: string
  resolvedBy?: string
  resolvedAt?: Date | string
}

// ============================================================================
// BOARD BRIEF (Executive Signals)
// ============================================================================

/**
 * BoardBrief provides top signals for executive review.
 * These are the most critical insights that need attention.
 */
export interface BoardBrief {
  id: string
  tenantId: string
  generatedAt: Date | string
  period: {
    start: Date | string
    end: Date | string
  }
  
  // Top signals
  signals: BoardSignal[]
  
  // Adversarial insights
  adversarialInsights: AdversarialInsight[]
  
  // Evidence summary
  totalEvidenceItems: number
  evidenceGaps: number
  lowConfidenceEvents: number
  
  // Recommendations
  recommendations: BoardRecommendation[]
}

export interface BoardSignal {
  id: string
  type: 'margin_mirage' | 'detention_drift' | 'compliance_debt' | 'term_creep' | 
        'sla_breach' | 'quality_issue' | 'financial_anomaly' | 'custom'
  title: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  impact: {
    financial?: number
    operational?: string
    compliance?: string
  }
  evidenceIds: string[]
  relatedTruthEvents: string[]
  trend?: 'improving' | 'worsening' | 'stable'
  recommendedActions?: string[]
}

export interface AdversarialInsight {
  id: string
  persona: 'regulator' | 'cfo' | 'competitor' | 'litigator'
  insight: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  evidenceRefs: string[]
  relatedDecisions?: string[]
}

export interface BoardRecommendation {
  id: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  impact: string
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
  evidenceRefs: string[]
  relatedSignals?: string[]
}

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface TruthEngineService {
  // Evidence
  recordEvidence: (evidence: Omit<TruthEvidenceItem, 'id' | 'createdAt' | 'updatedAt' | 'lineage' | 'hash'> & { content?: string | Buffer }) => Promise<TruthEvidenceItem>
  
  // Truth Events
  recordTruthEvent: (event: Omit<TruthEvent, 'id' | 'createdAt'>) => Promise<TruthEvent>
  linkEvidenceToEvent: (eventId: string, evidenceIds: string[]) => Promise<TruthEvent>
  getTruthTimeline: (entityType: string, entityId: string, filters?: TimelineFilters) => Promise<TruthTimeline>
  disputeEvent: (eventId: string, disputedBy: string, reason: string) => Promise<TruthEvent>
  correctEvent: (eventId: string, correctedEvent: Omit<TruthEvent, 'id' | 'createdAt'>) => Promise<TruthEvent>
  
  // Adversarial Review
  reviewDecision: (decision: DecisionObject, context: ReviewContext) => Promise<AdversarialReview>
  getReview: (reviewId: string) => Promise<AdversarialReview | null>
  getReviewsForDecision: (decisionId: string) => Promise<AdversarialReview[]>
  
  // Truth KPIs
  registerKPI: (kpi: Omit<TruthKPI, 'id' | 'value' | 'calculatedAt' | 'evidenceIds' | 'breakdown'>) => Promise<TruthKPI>
  calculateKPI: (kpiId: string, filters?: KPIFilters) => Promise<TruthKPI>
  getKPIEvidence: (kpiId: string) => Promise<TruthEvidenceItem[]>
  getAllKPIs: (filters?: KPIFilters) => Promise<TruthKPI[]>
  
  // Board Brief
  generateBoardBrief: (tenantId: string, period?: { start: Date | string; end: Date | string }) => Promise<BoardBrief>
  
  // Search & Analytics
  searchTruthEvents: (query: TruthEventSearchQuery) => Promise<TruthEventSearchResult>
  getEvidenceChain: (evidenceId: string) => Promise<TruthEvidenceItem[]>
  validateTimeline: (entityType: string, entityId: string) => Promise<TimelineValidationResult>
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface DecisionObject {
  type: DecisionType
  id: string
  data: Record<string, any>
  relatedEntityIds: Record<string, string>
  proposedAction?: string
  impact?: {
    financial?: number
    operational?: string
    compliance?: string
  }
}

export interface ReviewContext {
  tenantId: string
  userId?: string
  relatedTruthEvents: string[]
  relatedEvidence: string[]
  urgency?: 'low' | 'medium' | 'high' | 'critical'
  deadline?: Date | string
}

export interface KPIFilters {
  tenantId?: string
  customerId?: string
  warehouseId?: string
  dateFrom?: Date | string
  dateTo?: Date | string
  category?: TruthKPI['category']
  module?: string
  [key: string]: any
}

export interface TimelineFilters {
  eventTypes?: TruthEventType[]
  dateFrom?: Date | string
  dateTo?: Date | string
  includeDisputed?: boolean
  minConfidence?: number
}

export interface TruthEventSearchQuery {
  tenantId?: string
  eventTypes?: TruthEventType[]
  entityRefs?: Record<string, string>
  dateFrom?: Date | string
  dateTo?: Date | string
  minConfidence?: number
  tags?: string[]
  actorType?: TruthEvent['actor']['type']
  limit?: number
  offset?: number
}

export interface TruthEventSearchResult {
  events: TruthEvent[]
  totalCount: number
  hasMore: boolean
}

export interface TimelineValidationResult {
  valid: boolean
  confidence: number
  gaps: TimelineGap[]
  issues: string[]
  recommendations: string[]
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TruthEvent










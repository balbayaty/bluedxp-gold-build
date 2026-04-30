/**
 * Performance Attribution Types
 *
 * Purpose:
 * - Attribute real operational activity to employees in a flexible, policy-driven way.
 * - Detect conflicts/mismatches (assignment vs actor vs verifier) and notify for review.
 * - Provide an audit trail and evidence hooks (Truth Engine integration).
 */

export type AttributionMethod = 'assignment' | 'actor' | 'verification' | 'hybrid'

export type AttributionDecisionStatus = 'accepted' | 'flagged' | 'rejected' | 'pending_review'

export type AttributionConfidence = 'low' | 'medium' | 'high'

export interface AttributionSignals {
  // What we know about who should get credit
  assignedEmployeeId?: string
  actorEmployeeId?: string
  verifierEmployeeId?: string

  assignedUserId?: string
  actorUserId?: string
  verifierUserId?: string
}

export interface AttributionContext {
  tenantId: string
  module: string // e.g. 'wms'
  activityType: string // e.g. 'picking_completed'
  entityType: string // e.g. 'PICKING'
  entityId: string
  customerId?: string
  warehouseId?: string
  orderId?: string
  asnId?: string

  happenedAt: string
  sourceEventId?: string
  sourceEventType?: string
  evidenceIds?: string[]
}

export interface AttributionPolicy {
  id: string
  name: string
  version: string
  enabled: boolean

  /**
   * Default behavior:
   * - Prefer verified credit when available
   * - Otherwise prefer actor
   * - Otherwise fall back to assignment
   */
  defaultMethod: AttributionMethod

  /**
   * Which lifecycle stages are considered “safe to credit” by default.
   * Example: credit only after VERIFIED/CLOSED to reduce gaming.
   */
  creditOnlyOnStages?: string[]

  /**
   * If true, mismatches trigger a notification and a pending review decision.
   */
  notifyOnMismatch: boolean

  /**
   * If true, a mismatch blocks auto-credit and requires human review.
   */
  requireReviewOnMismatch: boolean
}

export interface AttributionDecision {
  id: string
  tenantId: string
  policyId: string

  methodUsed: AttributionMethod
  status: AttributionDecisionStatus
  confidence: AttributionConfidence

  attributedEmployeeId?: string
  attributedUserId?: string

  signals: AttributionSignals
  context: AttributionContext

  mismatchReasons?: string[]
  createdAt: string
}





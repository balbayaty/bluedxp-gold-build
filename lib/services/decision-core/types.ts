/**
 * Decision Infrastructure Core Types
 * Unified Decision Ontology + Decision Primitives
 * Version 1.0 - Stable Schema
 *
 * This module provides a unified decision-making infrastructure across
 * the entire BlueDXP ecosystem without duplicating existing functionality.
 */

// ============================================================================
// DECISION STATUS GRAMMAR
// ============================================================================

/**
 * Decision Status Grammar
 * Comprehensive status covering all decision lifecycle states
 * Aligned with Saudi compliance practices and internal IMS
 */
export type DecisionStatus =
  | "DRAFT" // Initial creation, not yet submitted
  | "PENDING" // Awaiting decision
  | "APPROVED" // Approved without conditions
  | "APPROVED_WITH_CONDITIONS" // Approved but requires follow-up
  | "REJECTED" // Rejected
  | "ESCALATED" // Escalated to higher authority
  | "CLOSED" // Decision finalized and closed
  | "ON_HOLD" // Temporarily paused
  | "OVERRIDE_APPLIED"; // Override applied (with audit trail)

/**
 * Decision Status Transitions
 * Valid state transitions for decision lifecycle
 */
export const DECISION_STATUS_TRANSITIONS: Record<
  DecisionStatus,
  DecisionStatus[]
> = {
  DRAFT: ["PENDING", "CLOSED"],
  PENDING: [
    "APPROVED",
    "APPROVED_WITH_CONDITIONS",
    "REJECTED",
    "ESCALATED",
    "ON_HOLD",
    "CLOSED",
  ],
  APPROVED: ["CLOSED", "ON_HOLD"],
  APPROVED_WITH_CONDITIONS: ["APPROVED", "REJECTED", "CLOSED", "ON_HOLD"],
  REJECTED: ["PENDING", "ESCALATED", "CLOSED"],
  ESCALATED: [
    "APPROVED",
    "APPROVED_WITH_CONDITIONS",
    "REJECTED",
    "ON_HOLD",
    "CLOSED",
  ],
  CLOSED: [], // Terminal state
  ON_HOLD: [
    "PENDING",
    "APPROVED",
    "APPROVED_WITH_CONDITIONS",
    "REJECTED",
    "ESCALATED",
    "CLOSED",
  ],
  OVERRIDE_APPLIED: ["APPROVED", "CLOSED"],
};

// ============================================================================
// DECISION PRIMITIVES
// ============================================================================

/**
 * Decision Primitives
 * Atomic decision actions that can be composed
 * These are the building blocks of all decisions in the system
 */
export type DecisionPrimitive =
  | "ALLOW" // Permit the action
  | "ALLOW_WITH_CONDITIONS" // Permit with conditions
  | "BLOCK" // Prevent the action
  | "HOLD_UNTIL" // Temporarily hold until condition met
  | "ESCALATE_TO" // Escalated to higher authority
  | "OPEN_NCR" // Open Non-Conformance Report
  | "OPEN_CAPA" // Open Corrective Action Preventive Action
  | "REQUEST_EVIDENCE" // Request additional evidence
  | "REROUTE" // Reroute shipment/transport
  | "RESCHEDULE" // Reschedule operation
  | "ASSIGN_RESOURCE" // Assign resource to task
  | "APPROVE_SPEND" // Approve financial spend
  | "FLAG_FOR_PAYMENT_HOLD" // Flag for payment hold
  | "OVERRIDE"; // Override decision with authority

/**
 * Primitive Categories
 * Group primitives by their primary function
 */
export type PrimitiveCategory =
  | "APPROVAL" // Approval-related primitives
  | "BLOCKING" // Blocking/prevention primitives
  | "WORKFLOW" // Workflow management primitives
  | "COMPLIANCE" // Compliance-related primitives
  | "FINANCIAL" // Financial decision primitives
  | "OPERATIONAL"; // Operational decision primitives

export const PRIMITIVE_CATEGORIES: Record<
  DecisionPrimitive,
  PrimitiveCategory
> = {
  ALLOW: "APPROVAL",
  ALLOW_WITH_CONDITIONS: "APPROVAL",
  BLOCK: "BLOCKING",
  HOLD_UNTIL: "WORKFLOW",
  ESCALATE_TO: "WORKFLOW",
  OPEN_NCR: "COMPLIANCE",
  OPEN_CAPA: "COMPLIANCE",
  REQUEST_EVIDENCE: "COMPLIANCE",
  REROUTE: "OPERATIONAL",
  RESCHEDULE: "OPERATIONAL",
  ASSIGN_RESOURCE: "OPERATIONAL",
  APPROVE_SPEND: "FINANCIAL",
  FLAG_FOR_PAYMENT_HOLD: "FINANCIAL",
  OVERRIDE: "APPROVAL",
};

// ============================================================================
// DECISION RECORD SCHEMA
// ============================================================================

/**
 * Decision Record Schema (Versioned)
 * Stable, immutable record of all decisions across the ecosystem
 * Version 1.0 - Initial stable schema
 */
export interface DecisionRecord {
  // Identity
  id: string;
  version: number; // Schema version for migration (currently 1)
  tenantId: string;

  // Context
  module: string; // Source module (hazalyze, procurement, route-ops, etc.)
  entityType: string; // Type of entity (msds, po, shipment, etc.)
  entityId: string; // ID of the entity being decided upon

  // Decision
  status: DecisionStatus;
  primitive: DecisionPrimitive; // The action taken
  reason?: string; // Human-readable reason
  conditions?: string[]; // Conditions if APPROVED_WITH_CONDITIONS

  // Controls & Compliance
  controlsApplied: ControlReference[]; // Controls that influenced decision
  complianceChecks: ComplianceCheck[]; // Compliance validation results

  // Evidence
  evidenceIds: string[]; // Links to evidence service
  evidenceHashes: string[]; // Immutable evidence references

  // Decision Maker
  decidedBy?: string; // User ID who made decision
  decidedAt?: Date | string;
  approvedBy?: string; // If approved, who approved
  approvedAt?: Date | string;
  rejectedBy?: string; // If rejected, who rejected
  rejectedAt?: Date | string;

  // Override (if applicable)
  override?: {
    appliedBy: string;
    appliedAt: Date | string;
    reason: string;
    authority: string; // Role/authority that allowed override
    originalDecisionId?: string; // Reference to overridden decision
  };

  // Escalation
  escalatedTo?: string; // Role/user escalated to
  escalatedAt?: Date | string;
  escalationReason?: string;
  escalationPath?: string[]; // Full escalation chain

  // Hold
  holdReason?: string;
  holdUntil?: Date | string;
  holdAppliedBy?: string;
  holdAppliedAt?: Date | string;
  holdReleasedBy?: string;
  holdReleasedAt?: Date | string;

  // Related Decisions
  relatedDecisionIds: string[]; // Related decisions (e.g., parent/child)
  parentDecisionId?: string; // Parent decision if this is a sub-decision

  // Metadata
  metadata: Record<string, any>; // Module-specific data
  tags: string[];

  // Audit & Tracing
  correlationId: string; // For tracing across services
  traceId?: string; // Distributed tracing
  requestId?: string; // Original request ID

  // Lifecycle
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
  closedAt?: Date | string;
  closedBy?: string;
}

// ============================================================================
// CONTROL REFERENCE
// ============================================================================

/**
 * Control Reference
 * Links to internal SOPs, regulations, Iktva controls
 * NOT hardcoded legal claims - structured as configurable controls
 */
export interface ControlReference {
  controlId: string;
  controlType: "SOP" | "REGULATION" | "IKTVA" | "INTERNAL_POLICY" | "CUSTOM";
  reference: string; // SOP ID, regulation code, etc.
  category?: string; // Regulation category (Saudi, Global, etc.)
  version?: string;
  appliedAt: Date | string;
  result: "PASS" | "FAIL" | "WARNING" | "NOT_APPLICABLE" | "PENDING";
  notes?: string;
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  evidenceIds?: string[]; // Evidence supporting control validation
}

// ============================================================================
// COMPLIANCE CHECK
// ============================================================================

/**
 * Compliance Check
 * Result of compliance validation
 */
export interface ComplianceCheck {
  requirementId?: string;
  authority?: string; // RegulatoryAuthority from compliance types
  region?: string; // RegulatoryRegion
  status:
    | "COMPLIANT"
    | "NON_COMPLIANT"
    | "AT_RISK"
    | "PENDING_REVIEW"
    | "NOT_APPLICABLE";
  checkedAt: Date | string;
  checkedBy?: string;
  notes?: string;
  score?: number; // Compliance score 0-100
  violations?: string[]; // List of violations if non-compliant
}

// ============================================================================
// DECISION CONTEXT
// ============================================================================

/**
 * Decision Context
 * Input context for making a decision
 */
export interface DecisionContext {
  module: string;
  entityType: string;
  entityId: string;
  tenantId: string;
  userId?: string;

  // Business context
  data: Record<string, any>; // Entity data
  history?: DecisionRecord[]; // Previous decisions on this entity

  // Controls to check
  requiredControls?: string[]; // Control IDs to validate
  controlOverrides?: Record<string, any>; // Override control behavior

  // Options
  options?: {
    allowOverride?: boolean;
    requireEvidence?: boolean;
    escalationPath?: string[];
    autoApprove?: boolean;
    autoApproveThreshold?: number; // Score threshold for auto-approval
    notifyStakeholders?: boolean;
    notifyChannels?: ("email" | "sms" | "whatsapp" | "portal")[];
  };

  // External context
  externalData?: Record<string, any>; // Additional context from external systems
  riskScore?: number; // Pre-calculated risk score
  urgency?: "low" | "medium" | "high" | "critical";
}

// ============================================================================
// DECISION QUERY & FILTER
// ============================================================================

/**
 * Decision Query
 * Query interface for searching decisions
 */
export interface DecisionQuery {
  tenantId?: string;
  module?: string;
  entityType?: string;
  entityId?: string;
  status?: DecisionStatus[];
  primitive?: DecisionPrimitive[];
  decidedBy?: string;
  dateRange?: {
    from: Date | string;
    to: Date | string;
  };
  tags?: string[];
  correlationId?: string;
  traceId?: string;
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "decidedAt" | "status";
  sortOrder?: "asc" | "desc";
}

/**
 * Decision Statistics
 * Aggregated statistics about decisions
 */
export interface DecisionStatistics {
  total: number;
  byStatus: Record<DecisionStatus, number>;
  byPrimitive: Record<DecisionPrimitive, number>;
  byModule: Record<string, number>;
  byEntityType: Record<string, number>;
  averageDecisionTime: number; // milliseconds
  escalationRate: number; // percentage
  overrideRate: number; // percentage
  complianceRate: number; // percentage of compliant decisions
  recentDecisions: DecisionRecord[];
  pendingDecisions: DecisionRecord[];
  escalatedDecisions: DecisionRecord[];
}

// ============================================================================
// DECISION WORKFLOW
// ============================================================================

/**
 * Decision Workflow Step
 * Step in a multi-step decision workflow
 */
export interface DecisionWorkflowStep {
  id: string;
  stepNumber: number;
  name: string;
  description?: string;
  required: boolean;
  approverRole?: string;
  approverUserId?: string;
  timeout?: number; // hours
  escalationRole?: string;
  conditions?: string; // JSONLogic condition
  status: "pending" | "in_progress" | "completed" | "skipped" | "failed";
  completedAt?: Date | string;
  completedBy?: string;
  decisionId?: string; // Decision record for this step
}

/**
 * Decision Workflow
 * Multi-step decision workflow
 */
export interface DecisionWorkflow {
  id: string;
  name: string;
  description?: string;
  module: string;
  entityType: string;
  steps: DecisionWorkflowStep[];
  status: "draft" | "active" | "paused" | "archived";
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// DECISION EVENT
// ============================================================================

/**
 * Decision Event
 * Event published when decision state changes
 */
export interface DecisionEvent {
  type:
    | "decision.created"
    | "decision.updated"
    | "decision.status_changed"
    | "decision.escalated"
    | "decision.overridden";
  decisionId: string;
  decision: DecisionRecord;
  previousStatus?: DecisionStatus;
  correlationId: string;
  timestamp: Date | string;
  metadata?: Record<string, any>;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  DecisionRecord,
  DecisionContext,
  DecisionQuery,
  DecisionStatistics,
  DecisionWorkflow,
  DecisionWorkflowStep,
  DecisionEvent,
  ControlReference,
  ComplianceCheck,
};

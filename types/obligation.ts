/**
 * Obligation Types - Legal Reality Engine
 * 
 * Formal representation of contractual, regulatory, operational, and procedural obligations
 * Maps obligations to events for automatic compliance tracking
 */

export type ObligationType = 
  | 'CONTRACTUAL'    // From contracts (payment terms, delivery obligations, etc.)
  | 'REGULATORY'     // From regulations (licensing, reporting, compliance requirements)
  | 'OPERATIONAL'    // From SOPs and operational procedures
  | 'PROCEDURAL'     // From policies and internal procedures

export type ObligationSourceType =
  | 'CONTRACT'       // Source is a contract
  | 'REGULATION'     // Source is a regulation or law
  | 'SLA'            // Source is a Service Level Agreement
  | 'POLICY'         // Source is an internal policy
  | 'PROCEDURE'      // Source is a standard operating procedure
  | 'LICENSE'        // Source is a license requirement
  | 'PERMIT'         // Source is a permit requirement

export type ObligationStatus =
  | 'PENDING'        // Not yet due or started
  | 'IN_PROGRESS'    // Currently being fulfilled
  | 'MET'            // Successfully fulfilled
  | 'FAILED'         // Failed to meet obligation
  | 'WAIVED'         // Obligation waived by authority
  | 'DISPUTED'       // Obligation status is disputed
  | 'OVERDUE'        // Past deadline but not yet failed
  | 'CANCELLED'      // Obligation cancelled

export type ObligationFrequency =
  | 'ONCE'           // One-time obligation
  | 'DAILY'          // Daily recurrence
  | 'WEEKLY'         // Weekly recurrence
  | 'MONTHLY'        // Monthly recurrence
  | 'QUARTERLY'      // Quarterly recurrence
  | 'YEARLY'         // Annual recurrence
  | 'ON_EVENT'       // Triggered by specific event
  | 'CONTINUOUS'     // Continuous obligation (always active)

export type ObligationSeverity =
  | 'CRITICAL'       // Critical legal/regulatory obligation
  | 'HIGH'           // High importance
  | 'MEDIUM'         // Medium importance
  | 'LOW'            // Low importance

export type ResponsiblePartyType =
  | 'CUSTOMER'
  | 'WAREHOUSE'
  | 'CARRIER'
  | 'SUPPLIER'
  | 'BROKER'
  | 'MANUFACTURER'
  | 'DISTRIBUTOR'
  | 'THIRD_PARTY'
  | 'REGULATORY_BODY'
  | 'INTERNAL'

// ============================================================================
// CORE OBLIGATION INTERFACE
// ============================================================================

export interface Obligation {
  id: string
  type: ObligationType
  source: string                    // ID of source (contract, regulation, etc.)
  sourceType: ObligationSourceType
  
  // Obligation Details
  name: string
  description: string
  requirement: string               // Full text of requirement
  
  // Timing
  dueDate?: Date | string          // When obligation is due
  deadline?: Date | string         // Hard deadline (if different from due date)
  duration?: number                // Expected duration in seconds (for process obligations)
  frequency?: ObligationFrequency
  nextOccurrence?: Date | string   // For recurring obligations
  
  // Authority & Jurisdiction
  jurisdiction: string             // e.g., "Saudi Arabia", "UAE", "Global"
  jurisdictionCode?: string        // ISO country code or region code
  authority: string                // Regulatory body, contract party, etc.
  authorityId?: string             // ID of authority entity
  
  // Parties
  responsibleParty: string         // Name of responsible party
  responsiblePartyId: string       // ID of responsible party
  responsiblePartyType: ResponsiblePartyType
  accountableParty?: string        // Who is ultimately accountable (may differ from responsible)
  accountablePartyId?: string
  
  // Event Mapping (Machine-Readable)
  triggerEvents?: string[]         // Event types that trigger this obligation
  completionEvents?: string[]      // Event types that mark obligation as complete
  evidenceRequired?: string[]      // Types of evidence required to prove completion
  
  // Status & Tracking
  status: ObligationStatus
  progress?: number                // 0-100 percentage of completion
  metAt?: Date | string           // When obligation was met
  failedAt?: Date | string        // When obligation failed
  overdueAt?: Date | string       // When obligation became overdue
  reason?: string                  // Reason for failure, waiver, dispute, etc.
  
  // Conditions (Machine-Readable Logic)
  machineReadable: boolean
  conditions?: ObligationCondition[]
  
  // Notifications & Escalation
  notificationRules?: NotificationRule[]
  escalationRules?: EscalationRule[]
  
  // Consequences
  consequencesOfBreach?: string[]  // What happens if obligation not met
  penaltyAmount?: number          // Financial penalty if applicable
  penaltyCurrency?: string
  
  // Related Entities
  relatedObligations?: string[]    // IDs of related obligations
  dependsOn?: string[]             // IDs of prerequisite obligations
  
  // Evidence & Audit
  evidenceIds?: string[]           // IDs of evidence proving completion
  auditLogIds?: string[]           // IDs of relevant audit logs
  complianceRecordIds?: string[]   // IDs of compliance records
  
  // Metadata
  severity: ObligationSeverity
  tags?: string[]
  notes?: string
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  updatedBy?: string
  tenantId: string
}

// ============================================================================
// OBLIGATION CONDITIONS (Machine-Readable Logic)
// ============================================================================

export interface ObligationCondition {
  id: string
  type: 'IF' | 'AND' | 'OR' | 'NOT'
  field?: string                   // Field to check (e.g., "shipment.status", "temperature")
  operator?: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'IN'
  value?: any                      // Value to compare against
  conditions?: ObligationCondition[] // Nested conditions for AND/OR
}

// ============================================================================
// NOTIFICATION & ESCALATION RULES
// ============================================================================

export interface NotificationRule {
  id: string
  trigger: 'DUE_SOON' | 'OVERDUE' | 'FAILED' | 'STATUS_CHANGE'
  daysBeforeDue?: number          // For DUE_SOON trigger
  hoursAfterOverdue?: number      // For OVERDUE trigger
  recipients: string[]            // User IDs or role names
  channels: ('EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP')[]
  template?: string               // Notification template ID
}

export interface EscalationRule {
  id: string
  level: 'WARNING' | 'CRITICAL' | 'EXECUTIVE'
  trigger: 'OVERDUE' | 'FAILED' | 'DISPUTED'
  hoursAfterTrigger: number
  escalateTo: string[]            // User IDs or role names
  actions: ('NOTIFY' | 'BLOCK' | 'ALERT' | 'AUTO_WAIVE')[]
}

// ============================================================================
// OBLIGATION HISTORY & CHANGES
// ============================================================================

export interface ObligationHistory {
  id: string
  obligationId: string
  changeType: 'CREATED' | 'STATUS_CHANGED' | 'UPDATED' | 'WAIVED' | 'CANCELLED'
  previousStatus?: ObligationStatus
  newStatus?: ObligationStatus
  changes?: Record<string, any>   // Field changes
  reason?: string
  changedBy: string
  changedAt: Date | string
  tenantId: string
}

// ============================================================================
// OBLIGATION MAPPING RESULT
// ============================================================================

export interface ObligationMappingResult {
  sourceId: string
  sourceType: ObligationSourceType
  obligationsCreated: Obligation[]
  obligationsUpdated: Obligation[]
  errors?: string[]
  warnings?: string[]
  mappedAt: Date | string
  mappedBy: string
}

// ============================================================================
// OBLIGATION COMPLIANCE STATUS
// ============================================================================

export interface ObligationComplianceStatus {
  obligationId: string
  obligation: Obligation
  
  // Status
  compliant: boolean
  status: ObligationStatus
  compliancePercentage: number    // 0-100
  
  // Timing
  daysUntilDue?: number
  daysOverdue?: number
  
  // Evidence
  evidenceProvided: boolean
  evidenceCount: number
  requiredEvidenceCount: number
  
  // Related Events
  relevantEvents: string[]        // Event IDs related to this obligation
  completionEvents: string[]      // Events that completed this obligation
  
  // Risks
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  breachProbability?: number      // 0-100 probability of breach
  
  // Actions Needed
  actionsNeeded: string[]
  blockers?: string[]
  
  checkedAt: Date | string
  tenantId: string
}

// ============================================================================
// OBLIGATION QUERY FILTERS
// ============================================================================

export interface ObligationQueryFilter {
  tenantId: string
  
  // Status Filters
  status?: ObligationStatus | ObligationStatus[]
  compliant?: boolean
  overdue?: boolean
  
  // Type Filters
  type?: ObligationType | ObligationType[]
  sourceType?: ObligationSourceType | ObligationSourceType[]
  
  // Party Filters
  responsiblePartyId?: string
  responsiblePartyType?: ResponsiblePartyType | ResponsiblePartyType[]
  
  // Time Filters
  dueBefore?: Date | string
  dueAfter?: Date | string
  createdBefore?: Date | string
  createdAfter?: Date | string
  
  // Authority Filters
  jurisdiction?: string | string[]
  authority?: string | string[]
  
  // Severity
  severity?: ObligationSeverity | ObligationSeverity[]
  
  // Search
  searchText?: string
  tags?: string[]
  
  // Pagination
  limit?: number
  offset?: number
  sortBy?: 'dueDate' | 'createdAt' | 'status' | 'severity'
  sortOrder?: 'ASC' | 'DESC'
}

// ============================================================================
// OBLIGATION DASHBOARD METRICS
// ============================================================================

export interface ObligationDashboard {
  tenantId: string
  
  // Overall Stats
  totalObligations: number
  activeObligations: number
  metObligations: number
  failedObligations: number
  overdueObligations: number
  
  // By Status
  byStatus: Record<ObligationStatus, number>
  
  // By Type
  byType: Record<ObligationType, number>
  
  // By Severity
  bySeverity: Record<ObligationSeverity, number>
  
  // By Party
  byResponsibleParty: Record<string, number>
  
  // Compliance Metrics
  overallComplianceRate: number   // 0-100
  onTimeCompletionRate: number    // 0-100
  
  // Upcoming & Overdue
  dueTodayCount: number
  dueThisWeekCount: number
  dueThisMonthCount: number
  overdueCount: number
  
  // Risk Metrics
  criticalRiskCount: number
  highRiskCount: number
  
  generatedAt: Date | string
}

// ============================================================================
// OBLIGATION SERVICE INTERFACE
// ============================================================================

export interface ObligationMappingEngine {
  // Create & Map
  createObligation(obligation: Omit<Obligation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Obligation>
  mapContractToObligations(contractId: string, tenantId: string): Promise<ObligationMappingResult>
  mapRegulationToObligations(regulationId: string, tenantId: string): Promise<ObligationMappingResult>
  mapSLAToObligations(slaId: string, tenantId: string): Promise<ObligationMappingResult>
  
  // Read
  getObligation(obligationId: string, tenantId: string): Promise<Obligation | null>
  getObligations(filter: ObligationQueryFilter): Promise<Obligation[]>
  getObligationHistory(obligationId: string, tenantId: string): Promise<ObligationHistory[]>
  
  // Update
  updateObligation(obligationId: string, updates: Partial<Obligation>, tenantId: string): Promise<Obligation>
  updateObligationStatus(obligationId: string, status: ObligationStatus, reason?: string, tenantId?: string): Promise<Obligation>
  
  // Compliance Checking
  checkObligationCompliance(obligationId: string, tenantId: string): Promise<ObligationComplianceStatus>
  checkAllObligationsCompliance(tenantId: string): Promise<ObligationComplianceStatus[]>
  
  // Event Handling
  handleEvent(event: any, tenantId: string): Promise<void> // Updates obligation status based on events
  
  // Dashboard
  getDashboard(tenantId: string): Promise<ObligationDashboard>
  
  // Notifications
  sendObligationNotifications(tenantId: string): Promise<void>
}

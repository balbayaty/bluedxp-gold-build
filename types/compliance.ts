/**
 * Comprehensive Compliance Module Type Definitions
 * Covers Saudi Arabia, Middle East, and Global Regulations
 * Includes AI Strategy, Data Security, and Governance
 */

// ============================================================================
// REGULATORY FRAMEWORKS
// ============================================================================

export type RegulatoryRegion = 
  | 'SAUDI_ARABIA' 
  | 'UAE' 
  | 'KUWAIT' 
  | 'QATAR' 
  | 'BAHRAIN' 
  | 'OMAN' 
  | 'EGYPT' 
  | 'JORDAN' 
  | 'LEBANON' 
  | 'GLOBAL' 
  | 'EU' 
  | 'US' 
  | 'ASIA_PACIFIC'

export type RegulatoryAuthority = 
  // Saudi Arabia
  | 'TGA' // Transport General Authority
  | 'MOT' // Ministry of Transport
  | 'ABSHER' // Absher Platform
  | 'NAFATH' // National Authentication Framework
  | 'NAJIZ' // Najiz Platform
  | 'SABER' // Saudi Product Safety Program
  | 'SFDA' // Saudi Food and Drug Authority
  | 'SASO' // Saudi Standards, Metrology and Quality Organization
  | 'MODON' // Saudi Industrial Property Authority
  | 'ZATCA' // Zakat, Tax and Customs Authority
  | 'MOC' // Ministry of Commerce
  | 'MOI' // Ministry of Interior
  | 'MOMRA' // Ministry of Municipal, Rural Affairs and Housing
  | 'MISA' // Ministry of Investment
  | 'SAMA' // Saudi Central Bank
  | 'CITC' // Communications and Information Technology Commission
  | 'NCSC' // National Cybersecurity Authority
  | 'SDAIA' // Saudi Data and AI Authority
  // Middle East
  | 'UAE_MOC' // UAE Ministry of Commerce
  | 'UAE_MOI' // UAE Ministry of Interior
  | 'ADGM' // Abu Dhabi Global Market
  | 'DIFC' // Dubai International Financial Centre
  | 'QFC' // Qatar Financial Centre
  | 'CBK' // Central Bank of Kuwait
  // Global
  | 'ISO' // International Organization for Standardization
  | 'IEC' // International Electrotechnical Commission
  | 'GDPR' // General Data Protection Regulation
  | 'CCPA' // California Consumer Privacy Act
  | 'HIPAA' // Health Insurance Portability and Accountability Act
  | 'SOC2' // Service Organization Control 2
  | 'PCI_DSS' // Payment Card Industry Data Security Standard
  | 'NIST' // National Institute of Standards and Technology
  | 'COBIT' // Control Objectives for Information and Related Technologies
  | 'ITIL' // IT Infrastructure Library

export type ComplianceCategory =
  | 'DATA_SECURITY'
  | 'DATA_PRIVACY'
  | 'AI_STRATEGY'
  | 'TRANSPORTATION'
  | 'WAREHOUSING'
  | 'CUSTOMS'
  | 'PRODUCT_SAFETY'
  | 'FOOD_DRUG'
  | 'ENVIRONMENTAL'
  | 'LABOR'
  | 'FINANCIAL'
  | 'CYBERSECURITY'
  | 'QUALITY_MANAGEMENT'
  | 'SUPPLY_CHAIN'
  | 'TRADE'
  | 'LICENSING'
  | 'AUTHENTICATION'
  | 'IDENTITY_VERIFICATION'
  | 'DOCUMENTATION'
  | 'REPORTING'
  | 'GOVERNANCE'

export type ComplianceStatus = 
  | 'COMPLIANT'
  | 'NON_COMPLIANT'
  | 'AT_RISK'
  | 'PENDING_REVIEW'
  | 'REQUIRES_ACTION'
  | 'EXPIRED'
  | 'NOT_APPLICABLE'

export type CompliancePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type ApprovalStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REQUIRES_REVISION'
  | 'AUTO_APPROVED'

// ============================================================================
// REGULATORY REQUIREMENTS
// ============================================================================

export interface RegulatoryRequirement {
  id: string
  code: string // e.g., "TGA-TRANS-001"
  title: string
  description: string
  authority: RegulatoryAuthority
  region: RegulatoryRegion
  category: ComplianceCategory
  
  // Requirements Details
  requirements: RequirementDetail[]
  applicableTo: ApplicabilityScope[]
  
  // Compliance Rules
  rules: ComplianceRule[]
  validationCriteria: ValidationCriteria[]
  
  // Documentation
  requiredDocuments: DocumentRequirement[]
  apiEndpoints?: APIEndpoint[]
  
  // Lifecycle
  effectiveDate: Date | string
  expiryDate?: Date | string
  lastUpdated: Date | string
  version: string
  
  // Metadata
  tags: string[]
  keywords: string[]
  relatedRequirements: string[] // IDs of related requirements
  supersedes?: string[] // IDs of superseded requirements
  
  // Status
  status: 'ACTIVE' | 'DEPRECATED' | 'DRAFT' | 'ARCHIVED'
  priority: CompliancePriority
  
  // AI/ML Integration
  mlModelId?: string
  autoComplianceCheck: boolean
  requiresManualReview: boolean
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  updatedBy?: string
}

export interface RequirementDetail {
  id: string
  section: string
  subsection?: string
  requirement: string
  description: string
  mandatory: boolean
  priority: CompliancePriority
  evidenceRequired: boolean
  validationMethod: 'AUTOMATED' | 'MANUAL' | 'HYBRID'
}

export interface ApplicabilityScope {
  entityType: 'TENANT' | 'CUSTOMER' | 'WAREHOUSE' | 'VEHICLE' | 'PRODUCT' | 'USER'
  conditions?: Record<string, any>
  exemptions?: string[]
}

export interface ComplianceRule {
  id: string
  name: string
  description: string
  ruleType: 'VALIDATION' | 'TRANSFORMATION' | 'NOTIFICATION' | 'BLOCKING'
  condition: string // JSONLogic or similar
  action: RuleAction
  priority: CompliancePriority
  enabled: boolean
}

export interface RuleAction {
  type: 'ALLOW' | 'BLOCK' | 'WARN' | 'NOTIFY' | 'AUTO_CORRECT' | 'REQUIRE_APPROVAL'
  target: string[]
  parameters?: Record<string, any>
}

export interface ValidationCriteria {
  id: string
  field: string
  validationType: 'REQUIRED' | 'FORMAT' | 'RANGE' | 'ENUM' | 'CUSTOM' | 'API_CHECK'
  value?: any
  errorMessage: string
  warningMessage?: string
}

export interface DocumentRequirement {
  id: string
  documentType: string
  name: string
  description: string
  mandatory: boolean
  format?: string[] // e.g., ['PDF', 'JPG']
  maxSize?: number // bytes
  templateUrl?: string
  exampleUrl?: string
  validityPeriod?: number // days
  renewalRequired: boolean
}

export interface APIEndpoint {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  authentication: APIAuthentication
  requestSchema?: Record<string, any>
  responseSchema?: Record<string, any>
  documentation?: string
  rateLimit?: {
    requests: number
    period: number // seconds
  }
  status: 'ACTIVE' | 'DEPRECATED' | 'TESTING'
}

export interface APIAuthentication {
  type: 'API_KEY' | 'OAUTH2' | 'BASIC' | 'BEARER' | 'CERTIFICATE'
  credentials?: {
    apiKey?: string
    clientId?: string
    clientSecret?: string
    certificate?: string
  }
  headers?: Record<string, string>
}

// ============================================================================
// COMPLIANCE RECORDS
// ============================================================================

export interface ComplianceRecord {
  id: string
  tenantId: string
  customerId?: string
  warehouseId?: string
  
  // Requirement Reference
  requirementId: string
  requirement: RegulatoryRequirement
  
  // Compliance Status
  status: ComplianceStatus
  complianceScore: number // 0-100
  lastChecked: Date | string
  nextCheckDue: Date | string
  
  // Evidence & Documentation
  evidence: ComplianceEvidence[]
  documents: ComplianceDocument[]
  certificates: ComplianceCertificate[]
  
  // Findings
  findings: ComplianceFinding[]
  violations: ComplianceViolation[]
  
  // Actions
  actions: ComplianceAction[]
  recommendations: ComplianceRecommendation[]
  
  // Approval
  approvalStatus: ApprovalStatus
  approvedBy?: string
  approvedAt?: Date | string
  rejectionReason?: string
  
  // Audit Trail
  auditTrail: AuditLogEntry[]
  
  // Metadata
  tags: string[]
  notes?: string
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  updatedBy?: string
}

export interface ComplianceEvidence {
  id: string
  type: 'DOCUMENT' | 'API_RESPONSE' | 'SYSTEM_LOG' | 'MANUAL_ENTRY' | 'ML_PREDICTION'
  source: string
  data: Record<string, any>
  timestamp: Date | string
  verified: boolean
  verifiedBy?: string
  verifiedAt?: Date | string
  confidence?: number // 0-100 for ML predictions
}

export interface ComplianceDocument {
  id: string
  requirementId: string
  documentType: string
  name: string
  fileUrl: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  uploadedAt: Date | string
  expiryDate?: Date | string
  status: 'VALID' | 'EXPIRED' | 'PENDING_VALIDATION' | 'REJECTED'
  metadata?: Record<string, any>
}

export interface ComplianceCertificate {
  id: string
  certificateNumber: string
  certificateType: string
  issuer: RegulatoryAuthority
  issueDate: Date | string
  expiryDate: Date | string
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED'
  documentUrl?: string
  verified: boolean
  verifiedAt?: Date | string
}

export interface ComplianceFinding {
  id: string
  type: 'COMPLIANCE' | 'NON_COMPLIANCE' | 'RISK' | 'OPPORTUNITY'
  severity: CompliancePriority
  description: string
  requirementId: string
  evidence: string[] // Evidence IDs
  recommendation?: string
  status: 'OPEN' | 'RESOLVED' | 'MITIGATED' | 'ACCEPTED'
  resolvedAt?: Date | string
  resolvedBy?: string
}

export interface ComplianceViolation {
  id: string
  requirementId: string
  violationType: 'MISSING_DOCUMENT' | 'EXPIRED_CERTIFICATE' | 'RULE_VIOLATION' | 'API_FAILURE' | 'DATA_MISMATCH'
  description: string
  severity: CompliancePriority
  detectedAt: Date | string
  resolvedAt?: Date | string
  resolution?: string
  penalty?: {
    amount?: number
    currency?: string
    description?: string
  }
  status: 'OPEN' | 'RESOLVED' | 'APPEALED'
}

export interface ComplianceAction {
  id: string
  type: 'REMEDIATION' | 'PREVENTIVE' | 'CORRECTIVE' | 'IMPROVEMENT'
  title: string
  description: string
  priority: CompliancePriority
  assignedTo?: string
  dueDate?: Date | string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  completedAt?: Date | string
  completedBy?: string
  result?: string
}

export interface ComplianceRecommendation {
  id: string
  source: 'AI_ANALYSIS' | 'ML_MODEL' | 'MANUAL_REVIEW' | 'REGULATORY_UPDATE'
  type: 'AUTO_APPROVE' | 'REQUIRE_REVIEW' | 'UPDATE_RULE' | 'ADD_REQUIREMENT' | 'REMOVE_REQUIREMENT'
  title: string
  description: string
  confidence: number // 0-100
  priority: CompliancePriority
  suggestedChanges?: Record<string, any>
  status: ApprovalStatus
  approvedBy?: string
  approvedAt?: Date | string
  implemented: boolean
  implementedAt?: Date | string
}

export interface AuditLogEntry {
  id: string
  timestamp: Date | string
  userId?: string
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, { old: any; new: any }>
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

// ============================================================================
// COMPLIANCE MONITORING & AUTO-UPDATES
// ============================================================================

export interface ComplianceMonitoringConfig {
  id: string
  tenantId: string
  requirementId: string
  
  // Monitoring Settings
  enabled: boolean
  checkFrequency: 'REAL_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  autoRemediation: boolean
  notificationChannels: NotificationChannel[]
  
  // ML/AI Settings
  useMLPrediction: boolean
  mlModelId?: string
  confidenceThreshold: number // 0-100
  autoApproveThreshold: number // 0-100
  
  // Approval Workflow
  requiresApproval: boolean
  approvalWorkflow?: ApprovalWorkflow
  
  createdAt: Date | string
  updatedAt: Date | string
}

export interface NotificationChannel {
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK' | 'SLACK' | 'TEAMS'
  recipient: string
  enabled: boolean
  triggers: NotificationTrigger[]
}

export type NotificationTrigger = 
  | 'NON_COMPLIANCE_DETECTED'
  | 'CERTIFICATE_EXPIRING'
  | 'REQUIREMENT_UPDATED'
  | 'VIOLATION_RESOLVED'
  | 'APPROVAL_REQUIRED'
  | 'AUTO_UPDATE_APPLIED'

export interface ApprovalWorkflow {
  id: string
  name: string
  steps: ApprovalStep[]
  autoApproveConditions?: Record<string, any>
}

export interface ApprovalStep {
  id: string
  stepNumber: number
  approverRole: string
  approverUserId?: string
  required: boolean
  timeout?: number // hours
  escalationRole?: string
}

// ============================================================================
// KNOWLEDGE BASE INTEGRATION
// ============================================================================

export interface ComplianceKnowledgeEntry {
  id: string
  knowledgeBaseId: string // Reference to knowledge base entry
  
  // Regulatory Content
  regulationText: string
  interpretation: string
  examples: string[]
  caseStudies?: string[]
  
  // Updates & Changes
  changeHistory: RegulationChange[]
  impactAnalysis?: string
  
  // Learning
  mlInsights: MLInsight[]
  userFeedback: UserFeedback[]
  
  // Metadata
  source: string
  sourceUrl?: string
  lastVerified: Date | string
  verifiedBy?: string
  
  createdAt: Date | string
  updatedAt: Date | string
}

export interface RegulationChange {
  id: string
  changeType: 'ADDED' | 'MODIFIED' | 'DELETED' | 'CLARIFIED'
  description: string
  effectiveDate: Date | string
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  affectedRequirements: string[] // Requirement IDs
  actionRequired: boolean
  actionDescription?: string
}

export interface MLInsight {
  id: string
  modelId: string
  insightType: 'PATTERN' | 'ANOMALY' | 'PREDICTION' | 'RECOMMENDATION'
  description: string
  confidence: number
  data: Record<string, any>
  timestamp: Date | string
}

export interface UserFeedback {
  id: string
  userId: string
  feedbackType: 'CORRECT' | 'INCORRECT' | 'MISLEADING' | 'OUTDATED' | 'SUGGESTION'
  comment: string
  rating?: number // 1-5
  timestamp: Date | string
  resolved: boolean
}

// ============================================================================
// API INTEGRATIONS
// ============================================================================

export interface RegulatoryAPIIntegration {
  id: string
  authority: RegulatoryAuthority
  name: string
  baseUrl: string
  version: string
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING' | 'DEPRECATED'
  
  // Authentication
  authentication: APIAuthentication
  refreshToken?: string
  tokenExpiry?: Date | string
  
  // Endpoints
  endpoints: APIEndpoint[]
  
  // Configuration
  timeout: number // milliseconds
  retryPolicy: RetryPolicy
  rateLimiting: RateLimitConfig
  
  // Monitoring
  lastSync: Date | string
  syncFrequency: 'REAL_TIME' | 'HOURLY' | 'DAILY'
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN'
  errorLog: APIError[]
  
  // Metadata
  documentation?: string
  supportContact?: string
  
  createdAt: Date | string
  updatedAt: Date | string
}

export interface RetryPolicy {
  maxRetries: number
  retryDelay: number // milliseconds
  backoffMultiplier: number
  retryableStatusCodes: number[]
}

export interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
  strategy: 'FIXED' | 'SLIDING' | 'TOKEN_BUCKET'
}

export interface APIError {
  id: string
  timestamp: Date | string
  endpoint: string
  statusCode?: number
  errorMessage: string
  requestData?: Record<string, any>
  responseData?: Record<string, any>
  resolved: boolean
}

// ============================================================================
// COMPLIANCE DASHBOARD & REPORTING
// ============================================================================

export interface ComplianceDashboard {
  tenantId: string
  
  // Overview Metrics
  overallComplianceScore: number // 0-100
  totalRequirements: number
  compliantRequirements: number
  nonCompliantRequirements: number
  atRiskRequirements: number
  pendingReview: number
  
  // By Category
  complianceByCategory: Record<ComplianceCategory, CategoryCompliance>
  
  // By Authority
  complianceByAuthority: Record<RegulatoryAuthority, AuthorityCompliance>
  
  // By Region
  complianceByRegion: Record<RegulatoryRegion, RegionCompliance>
  
  // Recent Activity
  recentViolations: ComplianceViolation[]
  recentFindings: ComplianceFinding[]
  recentActions: ComplianceAction[]
  pendingApprovals: ComplianceRecommendation[]
  
  // Trends
  complianceTrend: ComplianceTrendPoint[]
  violationTrend: ViolationTrendPoint[]
  
  // Alerts
  criticalAlerts: ComplianceAlert[]
  warnings: ComplianceAlert[]
  
  lastUpdated: Date | string
}

export interface CategoryCompliance {
  category: ComplianceCategory
  totalRequirements: number
  compliant: number
  nonCompliant: number
  atRisk: number
  complianceScore: number
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING'
}

export interface AuthorityCompliance {
  authority: RegulatoryAuthority
  totalRequirements: number
  compliant: number
  nonCompliant: number
  atRisk: number
  complianceScore: number
  lastSync?: Date | string
  apiStatus?: 'HEALTHY' | 'DEGRADED' | 'DOWN'
}

export interface RegionCompliance {
  region: RegulatoryRegion
  totalRequirements: number
  compliant: number
  nonCompliant: number
  atRisk: number
  complianceScore: number
}

export interface ComplianceTrendPoint {
  date: Date | string
  complianceScore: number
  compliantCount: number
  nonCompliantCount: number
}

export interface ViolationTrendPoint {
  date: Date | string
  violations: number
  resolved: number
  severityBreakdown: Record<CompliancePriority, number>
}

export interface ComplianceAlert {
  id: string
  type: 'CRITICAL' | 'WARNING' | 'INFO'
  title: string
  description: string
  requirementId?: string
  recordId?: string
  priority: CompliancePriority
  createdAt: Date | string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date | string
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  RegulatoryRequirement,
  ComplianceRecord,
  ComplianceMonitoringConfig,
  ComplianceKnowledgeEntry,
  RegulatoryAPIIntegration,
  ComplianceDashboard,
  ComplianceCategory,
}


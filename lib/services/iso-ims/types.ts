/**
 * ISO IMS Service Types
 * Comprehensive type definitions for ISO Integrated Management System
 *
 * Deep architecture with full type safety
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export interface ISOIMSBase {
  id: string;
  tenantId: string;
  customerId?: string;
  warehouseId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  recordStatus: "ACTIVE" | "INACTIVE" | "ARCHIVED"; // Record-level status (different from entity status)
  metadata?: Record<string, unknown>;
}

// ============================================================================
// CAPA TYPES
// ============================================================================

export type CAPAStatus =
  | "DRAFT"
  | "OPEN"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "IMPLEMENTED"
  | "EFFECTIVENESS_REVIEW"
  | "COMPLETED"
  | "CLOSED"
  | "CANCELLED";

export type CAPAPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type CAPAType = "CORRECTIVE_ACTION" | "PREVENTIVE_ACTION";
export type CAPASource =
  | "NCR"
  | "AUDIT"
  | "RISK_ASSESSMENT"
  | "CUSTOMER_COMPLAINT"
  | "MANAGEMENT_REVIEW"
  | "INCIDENT"
  | "INTERNAL_REVIEW"
  | "OTHER";

export interface CAPA extends ISOIMSBase {
  capaNumber: string;
  subject: string;
  description: string;
  status: CAPAStatus;
  priority: CAPAPriority;
  capaType: CAPAType;
  capaSource: CAPASource;

  // Assignment
  assignedTo: string;
  assignedToName?: string;
  department: string;
  owner: string;
  ownerName?: string;

  // Dates
  targetDate: Date;
  completionDate?: Date;
  effectivenessReviewDate?: Date;

  // Root Cause Analysis
  rootCause?: string;
  rootCauseAnalysis?: {
    method: "5_WHY" | "FISHBONE" | "FMEA" | "PARETO" | "OTHER";
    analysis: string;
    contributingFactors: string[];
  };

  // Action Plan
  actionPlan: string;
  actionItems: CAPAActionItem[];
  resourcesRequired?: string;
  estimatedCost?: number;

  // Effectiveness
  effectivenessReview?: string;
  effectivenessScore?: number;
  lessonsLearned?: string;

  // Links
  linkedNCR?: string;
  linkedNCRNumber?: string;
  linkedAudit?: string;
  linkedAuditNumber?: string;
  linkedMaterial?: string;
  linkedMaterialNumber?: string;
  linkedOrder?: string;
  linkedOrderNumber?: string;
  linkedLocation?: string;
  linkedLocationCode?: string;
  linkedCustomer?: string;
  linkedCustomerNumber?: string;
  linkedSupplier?: string;
  linkedSupplierNumber?: string;
  linkedRisk?: string;
  linkedIncident?: string;

  // AI Insights
  aiInsights?: {
    suggestedActions?: string[];
    riskLevel?: "LOW" | "MEDIUM" | "HIGH";
    similarCAPAs?: string[];
    recommendations?: string[];
  };

  // Workflow
  workflowStage?: string;
  approvalChain?: ApprovalStep[];
  currentApprover?: string;
  comments?: Comment[];
  attachments?: string[];

  // Metrics
  daysOpen?: number;
  daysToComplete?: number;
  effectivenessRating?: number;
}

export interface CAPAActionItem {
  id: string;
  description: string;
  assignedTo: string;
  assignedToName?: string;
  dueDate: Date;
  completedDate?: Date;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  completionNotes?: string;
}

// ============================================================================
// NCR TYPES
// ============================================================================

export type NCRStatus =
  | "DRAFT"
  | "OPEN"
  | "UNDER_INVESTIGATION"
  | "AWAITING_CAPA"
  | "CAPA_ASSIGNED"
  | "UNDER_CORRECTION"
  | "AWAITING_VERIFICATION"
  | "VERIFIED"
  | "CLOSED"
  | "CANCELLED";

export type NCRPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type NCRSeverity = "MINOR" | "MAJOR" | "CRITICAL";
export type NCRType =
  | "PRODUCT"
  | "PROCESS"
  | "SYSTEM"
  | "SUPPLIER"
  | "CUSTOMER"
  | "DOCUMENTATION"
  | "TRAINING"
  | "OTHER";

export interface NCR extends ISOIMSBase {
  ncrNumber: string;
  subject: string;
  description: string;
  status: NCRStatus;
  priority: NCRPriority;
  severity: NCRSeverity;
  ncType: NCRType;

  // Reporting
  reportedBy: string;
  reportedByName?: string;
  reportedDate: Date;
  reportedLocation?: string;

  // Assignment
  assignedTo?: string;
  assignedToName?: string;
  department?: string;

  // Investigation
  immediateAction?: string;
  immediateActionTaken?: boolean;
  immediateActionDate?: Date;
  rootCause?: string;
  rootCauseAnalysis?: {
    method: "5_WHY" | "FISHBONE" | "FMEA" | "PARETO" | "OTHER";
    analysis: string;
    contributingFactors: string[];
  };
  containmentAction?: string;

  // Links
  linkedMaterial?: string;
  linkedMaterialNumber?: string;
  linkedBatch?: string;
  linkedSO?: string;
  linkedSONumber?: string;
  linkedPO?: string;
  linkedPONumber?: string;
  linkedLocation?: string;
  linkedLocationCode?: string;
  linkedCustomer?: string;
  linkedCustomerNumber?: string;
  linkedSupplier?: string;
  linkedSupplierNumber?: string;
  linkedAudit?: string;
  linkedAuditNumber?: string;
  linkedCAPA?: string;
  linkedCAPANumber?: string;
  linkedInspection?: string;

  // AI Insights
  aiInsights?: {
    suggestedRootCause?: string[];
    suggestedCAPAs?: string[];
    riskLevel?: "LOW" | "MEDIUM" | "HIGH";
    similarNCRs?: string[];
    recommendations?: string[];
  };

  // Workflow
  workflowStage?: string;
  approvalChain?: ApprovalStep[];
  currentApprover?: string;
  comments?: Comment[];
  attachments?: string[];

  // Metrics
  daysOpen?: number;
  daysToResolution?: number;
  impactAssessment?: string;
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export type AuditStatus =
  | "PLANNED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "FOLLOW_UP_REQUIRED"
  | "CLOSED";

export type AuditType =
  | "INTERNAL"
  | "EXTERNAL"
  | "SUPPLIER"
  | "CUSTOMER"
  | "CERTIFICATION"
  | "SURVEILLANCE"
  | "RECERTIFICATION"
  | "SPECIAL";

export type AuditScope =
  | "FULL_SYSTEM"
  | "PARTIAL"
  | "PROCESS"
  | "DEPARTMENT"
  | "PRODUCT"
  | "SITE";

export interface Audit extends ISOIMSBase {
  auditNumber: string;
  title: string;
  description: string;
  status: AuditStatus;
  auditType: AuditType;
  scope: AuditScope;

  // Standards
  isoStandards: string[]; // ISO 9001, ISO 14001, etc.
  clauses: string[]; // Specific clauses being audited

  // Scheduling
  plannedDate: Date;
  scheduledDate?: Date;
  startDate?: Date;
  endDate?: Date;
  duration?: number; // in days

  // Team
  leadAuditor: string;
  leadAuditorName?: string;
  auditTeam: AuditTeamMember[];

  // Location
  auditLocation?: string;
  auditLocationCode?: string;
  warehouseId?: string;
  customerId?: string;

  // Findings
  findings: AuditFinding[];
  nonConformances: number;
  opportunitiesForImprovement: number;
  observations: number;

  // Results
  auditScore?: number;
  complianceScore?: number;
  overallRating?:
    | "EXCELLENT"
    | "GOOD"
    | "SATISFACTORY"
    | "NEEDS_IMPROVEMENT"
    | "NON_COMPLIANT";
  auditReport?: string;
  auditReportUrl?: string;

  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpActions?: string[];

  // Links
  linkedNCRs?: string[];
  linkedCAPAs?: string[];
  linkedDocuments?: string[];
  linkedRisks?: string[];

  // AI Insights
  aiInsights?: {
    suggestedFocusAreas?: string[];
    riskAreas?: string[];
    recommendations?: string[];
    compliancePredictions?: Record<string, number>;
  };

  // Workflow
  workflowStage?: string;
  approvalChain?: ApprovalStep[];
  currentApprover?: string;
  comments?: Comment[];
  attachments?: string[];
}

export interface AuditTeamMember {
  userId: string;
  userName?: string;
  role: "LEAD_AUDITOR" | "AUDITOR" | "OBSERVER" | "TECHNICAL_EXPERT";
  expertise?: string[];
}

export interface AuditFinding {
  id: string;
  type: "NON_CONFORMANCE" | "OPPORTUNITY_FOR_IMPROVEMENT" | "OBSERVATION";
  severity: "MINOR" | "MAJOR" | "CRITICAL";
  clause: string;
  description: string;
  evidence?: string;
  rootCause?: string;
  recommendation?: string;
  linkedNCR?: string;
  linkedCAPA?: string;
  status: "OPEN" | "ADDRESSED" | "VERIFIED" | "CLOSED";
}

// ============================================================================
// DOCUMENT TYPES
// ============================================================================

export type DocumentStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "OBSOLETE"
  | "ARCHIVED";

export type DocumentType =
  | "POLICY"
  | "PROCEDURE"
  | "WORK_INSTRUCTION"
  | "FORM"
  | "RECORD"
  | "MANUAL"
  | "SPECIFICATION"
  | "CERTIFICATE"
  | "OTHER";

export type DocumentCategory =
  | "QUALITY"
  | "ENVIRONMENTAL"
  | "SAFETY"
  | "INFORMATION_SECURITY"
  | "GENERAL";

export interface Document extends ISOIMSBase {
  documentNumber: string;
  title: string;
  description?: string;
  status: DocumentStatus;
  documentType: DocumentType;
  category: DocumentCategory;

  // Versioning
  version: string;
  revision: number;
  effectiveDate?: Date;
  reviewDate?: Date;
  nextReviewDate?: Date;
  obsoleteDate?: Date;

  // Standards
  isoStandards?: string[];
  clauses?: string[];

  // Content
  content?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;

  // Ownership
  owner: string;
  ownerName?: string;
  author: string;
  authorName?: string;
  reviewer?: string;
  reviewerName?: string;
  approver?: string;
  approverName?: string;

  // Links
  linkedDocuments?: string[];
  linkedMaterials?: string[];
  linkedProcesses?: string[];
  linkedNCRs?: string[];
  linkedCAPAs?: string[];
  linkedAudits?: string[];

  // Facility Management Integration
  facilityId?: string;
  linkedFacilities?: string[];
  linkedAssets?: string[];
  linkedSpaces?: string[];
  linkedCADDrawings?: string[];

  // Distribution
  distributionList?: string[];
  accessLevel: "PUBLIC" | "RESTRICTED" | "CONFIDENTIAL";

  // Workflow
  workflowStage?: string;
  approvalChain?: ApprovalStep[];
  currentApprover?: string;
  comments?: Comment[];
  attachments?: string[];

  // Metrics
  views?: number;
  downloads?: number;
  lastAccessed?: Date;
  accessCount?: number;

  // Intelligent Sorting Metadata
  relevanceScore?: number;
  compliancePriority?: number;
  userPreferences?: Record<string, any>;

  // Intelligence Metadata
  intelligenceMetadata?: {
    classificationConfidence?: number;
    autoClassified?: boolean;
    complianceChecked?: boolean;
    complianceScore?: number;
    semanticSimilarity?: Record<string, number>;
    suggestedLinks?: Array<{
      type:
        | "FACILITY"
        | "ASSET"
        | "SPACE"
        | "CAD"
        | "STANDARD"
        | "NCR"
        | "CAPA";
      id: string;
      confidence: number;
      reason: string;
    }>;
  };
}

// ============================================================================
// RISK TYPES
// ============================================================================

export type RiskStatus =
  | "IDENTIFIED"
  | "ASSESSED"
  | "TREATMENT_PLANNED"
  | "TREATMENT_IN_PROGRESS"
  | "MONITORED"
  | "CLOSED";

export type RiskCategory =
  | "QUALITY"
  | "ENVIRONMENTAL"
  | "SAFETY"
  | "INFORMATION_SECURITY"
  | "FINANCIAL"
  | "OPERATIONAL"
  | "REPUTATIONAL"
  | "COMPLIANCE"
  | "STRATEGIC";

export interface Risk extends ISOIMSBase {
  riskNumber: string;
  title: string;
  description: string;
  status: RiskStatus;
  category: RiskCategory;

  // Assessment
  likelihood: 1 | 2 | 3 | 4 | 5; // 1 = Very Low, 5 = Very High
  impact: 1 | 2 | 3 | 4 | 5; // 1 = Very Low, 5 = Very High
  riskScore: number; // likelihood * impact
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  // Treatment
  treatmentStrategy?: "AVOID" | "MITIGATE" | "TRANSFER" | "ACCEPT";
  treatmentPlan?: string;
  treatmentActions?: RiskTreatmentAction[];
  residualRisk?: {
    likelihood: number;
    impact: number;
    riskScore: number;
    riskLevel: string;
  };

  // Ownership
  owner: string;
  ownerName?: string;
  assignedTo?: string;
  assignedToName?: string;

  // Links
  linkedNCRs?: string[];
  linkedCAPAs?: string[];
  linkedAudits?: string[];
  linkedDocuments?: string[];
  linkedMaterials?: string[];
  linkedProcesses?: string[];

  // AI Insights
  aiInsights?: {
    predictedLikelihood?: number;
    predictedImpact?: number;
    suggestedTreatments?: string[];
    similarRisks?: string[];
    recommendations?: string[];
  };

  // Monitoring
  monitoringFrequency?:
    | "DAILY"
    | "WEEKLY"
    | "MONTHLY"
    | "QUARTERLY"
    | "ANNUALLY";
  lastAssessed?: Date;
  nextAssessmentDate?: Date;

  // Workflow
  workflowStage?: string;
  approvalChain?: ApprovalStep[];
  currentApprover?: string;
  comments?: Comment[];
  attachments?: string[];
}

export interface RiskTreatmentAction {
  id: string;
  description: string;
  assignedTo: string;
  assignedToName?: string;
  dueDate: Date;
  completedDate?: Date;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  effectiveness?: number;
}

// ============================================================================
// TRAINING TYPES
// ============================================================================

export type TrainingStatus =
  | "PLANNED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type TrainingType =
  | "INITIAL"
  | "REFRESHER"
  | "ON_THE_JOB"
  | "E_LEARNING"
  | "CLASSROOM"
  | "WORKSHOP"
  | "CERTIFICATION";

export interface Training extends ISOIMSBase {
  trainingNumber: string;
  title: string;
  description: string;
  status: TrainingStatus;
  trainingType: TrainingType;

  // Standards
  isoStandards?: string[];
  competencies?: string[];

  // Scheduling
  scheduledDate?: Date;
  startDate?: Date;
  endDate?: Date;
  duration?: number; // in hours

  // Participants
  trainer: string;
  trainerName?: string;
  participants: TrainingParticipant[];
  maxParticipants?: number;

  // Location
  location?: string;
  locationType?: "ON_SITE" | "OFF_SITE" | "VIRTUAL";

  // Content
  content?: string;
  materials?: string[];
  objectives?: string[];

  // Assessment
  assessmentRequired: boolean;
  passingScore?: number;
  assessmentResults?: TrainingAssessmentResult[];

  // Links
  linkedCAPAs?: string[];
  linkedNCRs?: string[];
  linkedAudits?: string[];
  linkedDocuments?: string[];
  linkedRisks?: string[];

  // Workflow
  workflowStage?: string;
  approvalChain?: ApprovalStep[];
  currentApprover?: string;
  comments?: Comment[];
  attachments?: string[];

  // Metrics
  completionRate?: number;
  averageScore?: number;
  effectivenessRating?: number;
}

export interface TrainingParticipant {
  userId: string;
  userName?: string;
  status: "REGISTERED" | "ATTENDED" | "COMPLETED" | "FAILED" | "NO_SHOW";
  completionDate?: Date;
  score?: number;
  certificateIssued?: boolean;
  certificateUrl?: string;
}

export interface TrainingAssessmentResult {
  participantId: string;
  participantName?: string;
  score: number;
  passed: boolean;
  completedDate: Date;
  answers?: Record<string, unknown>;
}

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface ApprovalStep {
  id: string;
  stepNumber: number;
  approverId: string;
  approverName?: string;
  role?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
  approvedAt?: Date;
  rejectedAt?: Date;
  comments?: string;
  required: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName?: string;
  comment: string;
  createdAt: Date;
  editedAt?: Date;
  attachments?: string[];
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export interface ISOIMSFilter {
  status?: string[];
  priority?: string[];
  assignedTo?: string[];
  department?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
  linkedEntity?: {
    type:
      | "MATERIAL"
      | "ORDER"
      | "LOCATION"
      | "CUSTOMER"
      | "SUPPLIER"
      | "NCR"
      | "CAPA"
      | "AUDIT";
    id: string;
  };
}

export interface ISOIMSQuery {
  tenantId: string;
  customerId?: string;
  warehouseId?: string;
  filter?: ISOIMSFilter;
  pagination?: {
    page: number;
    pageSize: number;
  };
  sort?: {
    field: string;
    direction: "ASC" | "DESC";
  };
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface ISOIMSAnalytics {
  overview: {
    totalCAPAs: number;
    openCAPAs: number;
    completedCAPAs: number;
    overdueCAPAs: number;
    totalNCRs: number;
    openNCRs: number;
    closedNCRs: number;
    totalAudits: number;
    plannedAudits: number;
    completedAudits: number;
    complianceScore: number;
  };
  trends: {
    capaTrend: Array<{ date: string; count: number }>;
    ncrTrend: Array<{ date: string; count: number }>;
    auditTrend: Array<{ date: string; count: number }>;
    complianceTrend: Array<{ date: string; score: number }>;
  };
  metrics: {
    averageCAPAClosureTime: number;
    averageNCRResolutionTime: number;
    capaEffectivenessRate: number;
    ncrToCAPAConversionRate: number;
    auditFindingRate: number;
    complianceImprovementRate: number;
  };
  insights: {
    topRisks: Risk[];
    overdueItems: Array<{ type: string; id: string; daysOverdue: number }>;
    recommendations: string[];
    alerts: Array<{ type: string; message: string; priority: string }>;
  };
}

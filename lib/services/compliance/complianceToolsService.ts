/**
 * Interactive Compliance Tools Service
 * Provides fully functional and interactive compliance management tools
 * - Requirement Builder
 * - Compliance Checker
 * - Document Manager
 * - Risk Analyzer
 * - Compliance Simulator
 */

import {
  RegulatoryRequirement,
  ComplianceRecord,
  ComplianceStatus,
  ComplianceFinding,
  ComplianceViolation,
  ComplianceAction,
  DocumentRequirement,
  ComplianceDocument,
} from "@/types/compliance";
import {
  LocalRegulation,
  LocalRequirement,
} from "@/types/compliance-hierarchy";
import { complianceService } from "./complianceService";
import { authorityHierarchyService } from "./authorityHierarchyService";

// ============================================================================
// REQUIREMENT BUILDER
// ============================================================================

export interface RequirementBuilderInput {
  title: string;
  description: string;
  authorityId: string;
  category: string;
  requirements: RequirementDetailInput[];
  rules?: RuleInput[];
  documents?: DocumentInput[];
  applicableTo?: string[];
}

export interface RequirementDetailInput {
  section: string;
  subsection?: string;
  requirement: string;
  description: string;
  mandatory: boolean;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  validationMethod: "AUTOMATED" | "MANUAL" | "HYBRID";
}

export interface RuleInput {
  name: string;
  description: string;
  ruleType: "VALIDATION" | "TRANSFORMATION" | "NOTIFICATION" | "BLOCKING";
  condition: string;
  action: {
    type:
      | "ALLOW"
      | "BLOCK"
      | "WARN"
      | "NOTIFY"
      | "AUTO_CORRECT"
      | "REQUIRE_APPROVAL";
    target: string[];
  };
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface DocumentInput {
  documentType: string;
  name: string;
  description: string;
  mandatory: boolean;
  format?: string[];
  maxSize?: number;
  validityPeriod?: number;
  renewalRequired: boolean;
}

/**
 * Build requirement from input
 */
export async function buildRequirement(
  input: RequirementBuilderInput,
): Promise<RegulatoryRequirement> {
  // Get authority
  const authority = authorityHierarchyService.getNode(input.authorityId);
  if (!authority) {
    throw new Error(`Authority ${input.authorityId} not found`);
  }

  // Generate requirement code
  const code = `${authority.code}-${input.category.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  // Build requirement
  const requirement: Omit<RegulatoryRequirement, "createdAt" | "updatedAt"> = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    code,
    title: input.title,
    description: input.description,
    authority: authority.code as any,
    region: authority.region,
    category: input.category as any,
    requirements: input.requirements.map((r, idx) => ({
      id: `req-detail-${idx}`,
      section: r.section,
      subsection: r.subsection,
      requirement: r.requirement,
      description: r.description,
      mandatory: r.mandatory,
      priority: r.priority,
      evidenceRequired: true,
      validationMethod: r.validationMethod,
    })),
    applicableTo: (input.applicableTo || []).map((type) => ({
      entityType: type as any,
    })),
    rules: (input.rules || []).map((r, idx) => ({
      id: `rule-${idx}`,
      name: r.name,
      description: r.description,
      ruleType: r.ruleType,
      condition: r.condition,
      action: r.action,
      priority: r.priority,
      enabled: true,
    })),
    validationCriteria: [],
    requiredDocuments: (input.documents || []).map((d, idx) => ({
      id: `doc-${idx}`,
      documentType: d.documentType,
      name: d.name,
      description: d.description,
      mandatory: d.mandatory,
      format: d.format,
      maxSize: d.maxSize,
      renewalRequired: d.renewalRequired,
      validityPeriod: d.validityPeriod,
    })),
    effectiveDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
    tags: [authority.code, input.category],
    keywords: [input.title, input.description]
      .join(" ")
      .split(" ")
      .filter((w) => w.length > 3),
    relatedRequirements: [],
    status: "DRAFT",
    priority: input.requirements.some((r) => r.priority === "CRITICAL")
      ? "CRITICAL"
      : "HIGH",
    autoComplianceCheck: true,
    requiresManualReview: input.requirements.some(
      (r) => r.validationMethod === "MANUAL",
    ),
  };

  return await complianceService.createOrUpdateRequirement(requirement);
}

// ============================================================================
// COMPLIANCE CHECKER
// ============================================================================

export interface ComplianceCheckInput {
  recordId?: string;
  requirementId: string;
  tenantId: string;
  evidence: EvidenceInput[];
  documents: DocumentUploadInput[];
  context?: Record<string, any>;
}

export interface EvidenceInput {
  type: "DOCUMENT" | "API_RESPONSE" | "SYSTEM_LOG" | "MANUAL_ENTRY";
  source: string;
  data: Record<string, any>;
  verified?: boolean;
}

export interface DocumentUploadInput {
  documentType: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  expiryDate?: string;
}

export interface ComplianceCheckResult {
  record: ComplianceRecord;
  findings: ComplianceFinding[];
  violations: ComplianceViolation[];
  complianceScore: number;
  status: ComplianceStatus;
  recommendations: string[];
  actions: ComplianceAction[];
}

/**
 * Perform comprehensive compliance check
 */
export async function performComplianceCheck(
  input: ComplianceCheckInput,
): Promise<ComplianceCheckResult> {
  // Get requirement
  const requirement = complianceService.getRequirement(input.requirementId);
  if (!requirement) {
    throw new Error(`Requirement ${input.requirementId} not found`);
  }

  // Get or create record
  let record: ComplianceRecord;
  if (input.recordId) {
    const existing = complianceService.getRecord(input.recordId);
    if (!existing) {
      throw new Error(`Record ${input.recordId} not found`);
    }
    record = existing;
  } else {
    record = await complianceService.createComplianceRecord({
      tenantId: input.tenantId,
      requirementId: input.requirementId,
      requirement,
      status: "PENDING_REVIEW",
      complianceScore: 0,
      lastChecked: new Date().toISOString(),
      nextCheckDue: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      evidence: [],
      documents: [],
      certificates: [],
      findings: [],
      violations: [],
      actions: [],
      recommendations: [],
      approvalStatus: "PENDING",
      auditTrail: [],
      tags: [],
    });
  }

  // Update evidence and documents
  record.evidence = input.evidence.map((e, idx) => ({
    id: `ev-${idx}`,
    type: e.type,
    source: e.source,
    data: e.data,
    timestamp: new Date().toISOString(),
    verified: e.verified || false,
    confidence:
      e.type === "API_RESPONSE" ? 95 : e.type === "SYSTEM_LOG" ? 90 : 70,
  }));

  record.documents = input.documents.map((d, idx) => ({
    id: `doc-${idx}`,
    requirementId: input.requirementId,
    documentType: d.documentType,
    name: d.name,
    fileUrl: d.fileUrl,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    uploadedBy: "system",
    uploadedAt: new Date().toISOString(),
    expiryDate: d.expiryDate,
    status:
      d.expiryDate && new Date(d.expiryDate) < new Date() ? "EXPIRED" : "VALID",
  }));

  // Perform compliance check
  const checkedRecord = await complianceService.performComplianceCheck(
    record.id,
  );

  // Generate recommendations
  const recommendations = generateRecommendations(checkedRecord);

  // Generate actions
  const actions = generateActions(checkedRecord);

  return {
    record: checkedRecord,
    findings: checkedRecord.findings,
    violations: checkedRecord.violations,
    complianceScore: checkedRecord.complianceScore,
    status: checkedRecord.status,
    recommendations,
    actions,
  };
}

/**
 * Generate recommendations based on check results
 */
function generateRecommendations(record: ComplianceRecord): string[] {
  const recommendations: string[] = [];

  if (record.complianceScore < 70) {
    recommendations.push(
      "Compliance score is below acceptable threshold. Immediate action required.",
    );
  }

  if (record.violations.some((v) => v.severity === "CRITICAL")) {
    recommendations.push(
      "Critical violations detected. Operations may be blocked until resolved.",
    );
  }

  if (record.findings.some((f) => f.severity === "HIGH")) {
    recommendations.push(
      "High-priority findings require attention to prevent violations.",
    );
  }

  const missingDocs = record.requirement.requiredDocuments.filter(
    (doc) =>
      !record.documents.some(
        (d) => d.documentType === doc.documentType && doc.mandatory,
      ),
  );
  if (missingDocs.length > 0) {
    recommendations.push(
      `Missing ${missingDocs.length} mandatory document(s): ${missingDocs.map((d) => d.name).join(", ")}`,
    );
  }

  const expiredDocs = record.documents.filter((d) => d.status === "EXPIRED");
  if (expiredDocs.length > 0) {
    recommendations.push(
      `${expiredDocs.length} document(s) have expired and need renewal: ${expiredDocs.map((d) => d.name).join(", ")}`,
    );
  }

  return recommendations;
}

/**
 * Generate actions based on check results
 */
function generateActions(record: ComplianceRecord): ComplianceAction[] {
  const actions: ComplianceAction[] = [];

  // Actions for violations
  for (const violation of record.violations) {
    if (violation.status === "OPEN") {
      actions.push({
        id: `action-${violation.id}`,
        type: "REMEDIATION",
        title: `Resolve: ${violation.description}`,
        description: `Address violation: ${violation.description}`,
        priority: violation.severity,
        status: "PENDING",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  // Actions for findings
  for (const finding of record.findings) {
    if (finding.status === "OPEN" && finding.severity === "HIGH") {
      actions.push({
        id: `action-${finding.id}`,
        type: "PREVENTIVE",
        title: `Address: ${finding.description}`,
        description: finding.recommendation || finding.description,
        priority: finding.severity,
        status: "PENDING",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  // Actions for missing documents
  const missingDocs = record.requirement.requiredDocuments.filter(
    (doc) =>
      !record.documents.some(
        (d) => d.documentType === doc.documentType && doc.mandatory,
      ),
  );
  for (const doc of missingDocs) {
    actions.push({
      id: `action-doc-${doc.id}`,
      type: "CORRECTIVE",
      title: `Upload: ${doc.name}`,
      description: `Upload required document: ${doc.name}`,
      priority: doc.mandatory ? "HIGH" : "MEDIUM",
      status: "PENDING",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return actions;
}

// ============================================================================
// DOCUMENT MANAGER
// ============================================================================

export interface DocumentManagerInput {
  recordId: string;
  document: DocumentUploadInput;
}

/**
 * Manage compliance documents
 */
export async function manageDocument(
  input: DocumentManagerInput,
): Promise<ComplianceDocument> {
  const record = complianceService.getRecord(input.recordId);
  if (!record) {
    throw new Error(`Record ${input.recordId} not found`);
  }

  // Check if document type is required
  const docRequirement = record.requirement.requiredDocuments.find(
    (d) => d.documentType === input.document.documentType,
  );

  if (!docRequirement) {
    throw new Error(
      `Document type ${input.document.documentType} is not required for this requirement`,
    );
  }

  // Validate format
  if (
    docRequirement.format &&
    !docRequirement.format.includes(
      input.document.mimeType.split("/")[1].toUpperCase(),
    )
  ) {
    throw new Error(
      `Document format not allowed. Allowed formats: ${docRequirement.format.join(", ")}`,
    );
  }

  // Validate size
  if (
    docRequirement.maxSize &&
    input.document.fileSize > docRequirement.maxSize
  ) {
    throw new Error(
      `Document size exceeds maximum allowed size: ${docRequirement.maxSize} bytes`,
    );
  }

  // Create document
  const document: ComplianceDocument = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    requirementId: record.requirementId,
    documentType: input.document.documentType,
    name: input.document.name,
    fileUrl: input.document.fileUrl,
    fileSize: input.document.fileSize,
    mimeType: input.document.mimeType,
    uploadedBy: "system", // Would be actual user ID
    uploadedAt: new Date().toISOString(),
    expiryDate: input.document.expiryDate,
    status:
      input.document.expiryDate &&
      new Date(input.document.expiryDate) < new Date()
        ? "EXPIRED"
        : "VALID",
  };

  // Add to record
  record.documents.push(document);
  record.updatedAt = new Date().toISOString();

  // Re-check compliance
  await complianceService.performComplianceCheck(record.id);

  return document;
}

// ============================================================================
// RISK ANALYZER
// ============================================================================

export interface RiskAnalysisResult {
  overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number; // 0-100
  riskFactors: RiskFactor[];
  recommendations: string[];
  mitigationActions: ComplianceAction[];
}

export interface RiskFactor {
  factor: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  impact: string;
  likelihood: number; // 0-100
}

/**
 * Analyze compliance risk
 */
export async function analyzeRisk(
  recordId: string,
): Promise<RiskAnalysisResult> {
  const record = complianceService.getRecord(recordId);
  if (!record) {
    throw new Error(`Record ${recordId} not found`);
  }

  const riskFactors: RiskFactor[] = [];

  // Risk from violations
  for (const violation of record.violations) {
    if (violation.status === "OPEN") {
      riskFactors.push({
        factor: "Open Violation",
        severity: violation.severity,
        description: violation.description,
        impact: "Operations may be blocked or penalties may apply",
        likelihood:
          violation.severity === "CRITICAL"
            ? 90
            : violation.severity === "HIGH"
              ? 70
              : 50,
      });
    }
  }

  // Risk from low compliance score
  if (record.complianceScore < 70) {
    riskFactors.push({
      factor: "Low Compliance Score",
      severity: record.complianceScore < 50 ? "CRITICAL" : "HIGH",
      description: `Compliance score is ${record.complianceScore}%`,
      impact: "Increased risk of violations and regulatory action",
      likelihood: 100 - record.complianceScore,
    });
  }

  // Risk from missing documents
  const missingDocs = record.requirement.requiredDocuments.filter(
    (doc) =>
      !record.documents.some(
        (d) => d.documentType === doc.documentType && doc.mandatory,
      ),
  );
  if (missingDocs.length > 0) {
    riskFactors.push({
      factor: "Missing Documents",
      severity: missingDocs.some((d) => d.mandatory) ? "HIGH" : "MEDIUM",
      description: `${missingDocs.length} required document(s) missing`,
      impact: "Cannot demonstrate compliance without required documents",
      likelihood: 80,
    });
  }

  // Risk from expired documents
  const expiredDocs = record.documents.filter((d) => d.status === "EXPIRED");
  if (expiredDocs.length > 0) {
    riskFactors.push({
      factor: "Expired Documents",
      severity: "HIGH",
      description: `${expiredDocs.length} document(s) expired`,
      impact: "Expired documents may invalidate compliance status",
      likelihood: 70,
    });
  }

  // Calculate overall risk
  const maxSeverity =
    riskFactors.length > 0
      ? riskFactors.reduce((max, f) => {
          const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          return severityOrder[f.severity] > severityOrder[max]
            ? f.severity
            : max;
        }, "LOW" as const)
      : "LOW";

  const riskScore =
    riskFactors.length > 0
      ? riskFactors.reduce((sum, f) => sum + f.likelihood, 0) /
        riskFactors.length
      : 0;

  // Generate recommendations
  const recommendations = generateRiskRecommendations(riskFactors, record);

  // Generate mitigation actions
  const mitigationActions = generateMitigationActions(riskFactors);

  return {
    overallRisk: maxSeverity,
    riskScore,
    riskFactors,
    recommendations,
    mitigationActions,
  };
}

/**
 * Generate risk recommendations
 */
function generateRiskRecommendations(
  riskFactors: RiskFactor[],
  record: ComplianceRecord,
): string[] {
  const recommendations: string[] = [];

  if (riskFactors.some((f) => f.severity === "CRITICAL")) {
    recommendations.push(
      "Immediate action required to address critical risk factors",
    );
  }

  if (record.complianceScore < 70) {
    recommendations.push(
      "Improve compliance score by addressing violations and findings",
    );
  }

  const missingDocs = record.requirement.requiredDocuments.filter(
    (doc) =>
      !record.documents.some(
        (d) => d.documentType === doc.documentType && doc.mandatory,
      ),
  );
  if (missingDocs.length > 0) {
    recommendations.push(
      `Upload missing mandatory documents: ${missingDocs.map((d) => d.name).join(", ")}`,
    );
  }

  return recommendations;
}

/**
 * Generate mitigation actions
 */
function generateMitigationActions(
  riskFactors: RiskFactor[],
): ComplianceAction[] {
  const actions: ComplianceAction[] = [];

  for (const factor of riskFactors) {
    if (factor.severity === "CRITICAL" || factor.severity === "HIGH") {
      actions.push({
        id: `mitigation-${factor.factor}`,
        type: "PREVENTIVE",
        title: `Mitigate: ${factor.factor}`,
        description: factor.description,
        priority: factor.severity,
        status: "PENDING",
        dueDate: new Date(
          Date.now() +
            (factor.severity === "CRITICAL" ? 1 : 7) * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });
    }
  }

  return actions;
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const complianceToolsService = {
  // Requirement Builder
  buildRequirement,

  // Compliance Checker
  performComplianceCheck,

  // Document Manager
  manageDocument,

  // Risk Analyzer
  analyzeRisk,
};

export default complianceToolsService;

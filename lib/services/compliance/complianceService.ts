/**
 * Comprehensive Compliance Service
 * Integrates with Knowledge Base, ML Models, and Regulatory APIs
 * Provides automated compliance monitoring, updates, and recommendations
 */

import {
  RegulatoryRequirement,
  ComplianceRecord,
  ComplianceStatus,
  RegulatoryAuthority,
  RegulatoryRegion,
  ComplianceMonitoringConfig,
  ComplianceKnowledgeEntry,
  RegulatoryAPIIntegration,
  ComplianceDashboard,
  ComplianceRecommendation,
  ApprovalStatus,
  ComplianceFinding,
  ComplianceViolation,
  ComplianceAction,
  NotificationTrigger,
} from "@/types/compliance";

// Import ComplianceCategory separately to avoid circular dependency
import type { ComplianceCategory } from "@/types/compliance";
import { knowledgeBaseService } from "../knowledge-base";
import { KnowledgeEntry, KnowledgeCategory } from "@/types/knowledgeBase";

// ============================================================================
// IN-MEMORY STORAGE (Will be replaced with database)
// ============================================================================

class ComplianceStore {
  private requirements: Map<string, RegulatoryRequirement> = new Map();
  private records: Map<string, ComplianceRecord> = new Map();
  private monitoringConfigs: Map<string, ComplianceMonitoringConfig> =
    new Map();
  private apiIntegrations: Map<string, RegulatoryAPIIntegration> = new Map();
  private knowledgeEntries: Map<string, ComplianceKnowledgeEntry> = new Map();
  private dashboards: Map<string, ComplianceDashboard> = new Map();

  // Requirements
  getRequirement(id: string): RegulatoryRequirement | undefined {
    return this.requirements.get(id);
  }

  setRequirement(req: RegulatoryRequirement): void {
    this.requirements.set(req.id, req);
  }

  getAllRequirements(): RegulatoryRequirement[] {
    return Array.from(this.requirements.values());
  }

  getRequirementsByAuthority(
    authority: RegulatoryAuthority,
  ): RegulatoryRequirement[] {
    return this.getAllRequirements().filter((r) => r.authority === authority);
  }

  getRequirementsByRegion(region: RegulatoryRegion): RegulatoryRequirement[] {
    return this.getAllRequirements().filter((r) => r.region === region);
  }

  getRequirementsByCategory(
    category: ComplianceCategory,
  ): RegulatoryRequirement[] {
    return this.getAllRequirements().filter((r) => r.category === category);
  }

  // Records
  getRecord(id: string): ComplianceRecord | undefined {
    return this.records.get(id);
  }

  setRecord(record: ComplianceRecord): void {
    this.records.set(record.id, record);
  }

  getRecordsByTenant(tenantId: string): ComplianceRecord[] {
    return Array.from(this.records.values()).filter(
      (r) => r.tenantId === tenantId,
    );
  }

  getRecordsByRequirement(requirementId: string): ComplianceRecord[] {
    return Array.from(this.records.values()).filter(
      (r) => r.requirementId === requirementId,
    );
  }

  // Monitoring Configs
  getMonitoringConfig(id: string): ComplianceMonitoringConfig | undefined {
    return this.monitoringConfigs.get(id);
  }

  setMonitoringConfig(config: ComplianceMonitoringConfig): void {
    this.monitoringConfigs.set(config.id, config);
  }

  getMonitoringConfigsByTenant(tenantId: string): ComplianceMonitoringConfig[] {
    return Array.from(this.monitoringConfigs.values()).filter(
      (c) => c.tenantId === tenantId,
    );
  }

  // API Integrations
  getAPIIntegration(id: string): RegulatoryAPIIntegration | undefined {
    return this.apiIntegrations.get(id);
  }

  setAPIIntegration(integration: RegulatoryAPIIntegration): void {
    this.apiIntegrations.set(integration.id, integration);
  }

  getAllAPIIntegrations(): RegulatoryAPIIntegration[] {
    return Array.from(this.apiIntegrations.values());
  }

  // Knowledge Entries
  getKnowledgeEntry(id: string): ComplianceKnowledgeEntry | undefined {
    return this.knowledgeEntries.get(id);
  }

  setKnowledgeEntry(entry: ComplianceKnowledgeEntry): void {
    this.knowledgeEntries.set(entry.id, entry);
  }

  // Dashboards
  getDashboard(tenantId: string): ComplianceDashboard | undefined {
    return this.dashboards.get(tenantId);
  }

  setDashboard(tenantId: string, dashboard: ComplianceDashboard): void {
    this.dashboards.set(tenantId, dashboard);
  }
}

const store = new ComplianceStore();

// ============================================================================
// REQUIREMENT MANAGEMENT
// ============================================================================

/**
 * Create or update a regulatory requirement
 */
export async function createOrUpdateRequirement(
  requirement: Omit<RegulatoryRequirement, "createdAt" | "updatedAt">,
): Promise<RegulatoryRequirement> {
  const existing = store.getRequirement(requirement.id);
  const now = new Date().toISOString();

  const updated: RegulatoryRequirement = {
    ...requirement,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  store.setRequirement(updated);

  // Sync with knowledge base
  await syncRequirementToKnowledgeBase(updated);

  return updated;
}

/**
 * Sync requirement to knowledge base for semantic search and learning
 */
async function syncRequirementToKnowledgeBase(
  requirement: RegulatoryRequirement,
): Promise<void> {
  const content = `
    Regulatory Requirement: ${requirement.title}
    Authority: ${requirement.authority}
    Region: ${requirement.region}
    Category: ${requirement.category}
    
    Description: ${requirement.description}
    
    Requirements:
    ${requirement.requirements.map((r) => `- ${r.requirement}`).join("\n")}
    
    Tags: ${requirement.tags.join(", ")}
    Keywords: ${requirement.keywords.join(", ")}
  `.trim();

  const searchableText = `
    ${requirement.title} ${requirement.description} 
    ${requirement.authority} ${requirement.region} ${requirement.category}
    ${requirement.tags.join(" ")} ${requirement.keywords.join(" ")}
  `.trim();

  try {
    // Check if knowledge entry exists
    const existing = await knowledgeBaseService.search({
      query: requirement.title,
      filters: {
        categories: ["regulatory_compliance"],
      },
      limit: 1,
    });

    if (existing.length > 0 && existing[0].score > 0.9) {
      // Update existing
      await knowledgeBaseService.update(existing[0].entry.id, {
        content,
        searchableText,
        metadata: {
          ...existing[0].entry.metadata,
          requirementId: requirement.id,
          authority: requirement.authority,
          region: requirement.region,
          category: requirement.category,
          version: requirement.version,
        },
      });
    } else {
      // Create new
      await knowledgeBaseService.create({
        tenantId: undefined, // Global knowledge
        type: "regulation",
        category: "regulatory_compliance",
        content,
        summary: requirement.description.substring(0, 200),
        searchableText,
        keywords: requirement.keywords,
        source: "regulatory_authority",
        metadata: {
          requirementId: requirement.id,
          authority: requirement.authority,
          region: requirement.region,
          category: requirement.category,
          version: requirement.version,
        },
        confidence: 100,
        verified: true,
        feedbackScore: 0,
        usageCount: 0,
        status: "active",
      });
    }
  } catch (error) {
    console.error("Error syncing requirement to knowledge base:", error);
  }
}

/**
 * Search requirements using semantic search
 */
export async function searchRequirements(
  query: string,
  filters?: {
    authority?: RegulatoryAuthority;
    region?: RegulatoryRegion;
    category?: ComplianceCategory;
    status?: "ACTIVE" | "DEPRECATED" | "DRAFT";
  },
): Promise<RegulatoryRequirement[]> {
  // Use knowledge base for semantic search
  const kbResults = await knowledgeBaseService.search({
    query,
    filters: {
      categories: ["regulatory_compliance"],
      minConfidence: 70,
    },
    limit: 50,
  });

  // Map to requirements
  const requirementIds = kbResults
    .map((r) => r.entry.metadata?.requirementId)
    .filter((id): id is string => !!id);

  let requirements = requirementIds
    .map((id) => store.getRequirement(id))
    .filter((req): req is RegulatoryRequirement => !!req);

  // Apply filters
  if (filters?.authority) {
    requirements = requirements.filter(
      (r) => r.authority === filters.authority,
    );
  }
  if (filters?.region) {
    requirements = requirements.filter((r) => r.region === filters.region);
  }
  if (filters?.category) {
    requirements = requirements.filter((r) => r.category === filters.category);
  }
  if (filters?.status) {
    requirements = requirements.filter((r) => r.status === filters.status);
  }

  return requirements;
}

// ============================================================================
// COMPLIANCE RECORD MANAGEMENT
// ============================================================================

/**
 * Create a compliance record
 */
export async function createComplianceRecord(
  data: Omit<ComplianceRecord, "id" | "createdAt" | "updatedAt" | "auditTrail">,
): Promise<ComplianceRecord> {
  const requirement = store.getRequirement(data.requirementId);
  if (!requirement) {
    throw new Error(`Requirement ${data.requirementId} not found`);
  }

  const now = new Date().toISOString();
  const id = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const record: ComplianceRecord = {
    ...data,
    id,
    requirement,
    auditTrail: [
      {
        id: `audit-${Date.now()}`,
        timestamp: now,
        action: "RECORD_CREATED",
        entityType: "COMPLIANCE_RECORD",
        entityId: id,
        userId: data.createdBy,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  store.setRecord(record);

  // Auto-check compliance if enabled
  if (requirement.autoComplianceCheck) {
    await performComplianceCheck(record.id);
  }

  return record;
}

/**
 * Perform automated compliance check
 */
export async function performComplianceCheck(
  recordId: string,
): Promise<ComplianceRecord> {
  const record = store.getRecord(recordId);
  if (!record) {
    throw new Error(`Compliance record ${recordId} not found`);
  }

  const requirement = record.requirement;
  const findings: ComplianceFinding[] = [];
  const violations: ComplianceViolation[] = [];
  let complianceScore = 100;

  // Check each requirement detail
  for (const reqDetail of requirement.requirements) {
    if (reqDetail.mandatory) {
      const evidence = record.evidence.find(
        (e) => e.type === (reqDetail.validationMethod.toLowerCase() as any),
      );

      if (!evidence) {
        violations.push({
          id: `viol-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          requirementId: requirement.id,
          violationType: "MISSING_DOCUMENT",
          description: `Missing evidence for requirement: ${reqDetail.requirement}`,
          severity: reqDetail.priority,
          detectedAt: new Date().toISOString(),
          status: "OPEN",
        });
        complianceScore -= 10;
      } else if (!evidence.verified) {
        findings.push({
          id: `find-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "RISK",
          severity: reqDetail.priority,
          description: `Unverified evidence for requirement: ${reqDetail.requirement}`,
          requirementId: requirement.id,
          evidence: [evidence.id],
          status: "OPEN",
        });
        complianceScore -= 5;
      }
    }
  }

  // Check certificate expiry
  for (const cert of record.certificates) {
    if (cert.status === "EXPIRED" || cert.status === "SUSPENDED") {
      violations.push({
        id: `viol-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        requirementId: requirement.id,
        violationType: "EXPIRED_CERTIFICATE",
        description: `Certificate ${cert.certificateNumber} is ${cert.status.toLowerCase()}`,
        severity: "CRITICAL",
        detectedAt: new Date().toISOString(),
        status: "OPEN",
      });
      complianceScore -= 20;
    }
  }

  // Determine status
  let status: ComplianceStatus = "COMPLIANT";
  if (violations.length > 0) {
    status = violations.some((v) => v.severity === "CRITICAL")
      ? "NON_COMPLIANT"
      : "AT_RISK";
  } else if (findings.length > 0) {
    status = "AT_RISK";
  } else if (complianceScore < 100) {
    status = "REQUIRES_ACTION";
  }

  const updated: ComplianceRecord = {
    ...record,
    status,
    complianceScore: Math.max(0, complianceScore),
    findings: [...record.findings, ...findings],
    violations: [...record.violations, ...violations],
    lastChecked: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    auditTrail: [
      ...record.auditTrail,
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "COMPLIANCE_CHECK_PERFORMED",
        entityType: "COMPLIANCE_RECORD",
        entityId: recordId,
        changes: {
          status: { old: record.status, new: status },
          complianceScore: {
            old: record.complianceScore,
            new: Math.max(0, complianceScore),
          },
        },
      },
    ],
  };

  store.setRecord(updated);

  // Generate ML recommendations if enabled
  if (requirement.mlModelId) {
    await generateMLRecommendations(updated);
  }

  return updated;
}

// ============================================================================
// ML/AI RECOMMENDATIONS
// ============================================================================

/**
 * Generate ML-based compliance recommendations
 */
async function generateMLRecommendations(
  record: ComplianceRecord,
): Promise<void> {
  // This would integrate with ML models
  // For now, we'll create basic recommendations based on patterns

  const recommendations: ComplianceRecommendation[] = [];

  // Analyze violations
  if (record.violations.length > 0) {
    const criticalViolations = record.violations.filter(
      (v) => v.severity === "CRITICAL",
    );
    if (criticalViolations.length > 0) {
      recommendations.push({
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        source: "AI_ANALYSIS",
        type: "REQUIRE_REVIEW",
        title: "Critical Violations Detected",
        description: `${criticalViolations.length} critical violation(s) require immediate attention`,
        confidence: 95,
        priority: "CRITICAL",
        status: "PENDING",
        implemented: false,
      });
    }
  }

  // Check compliance score trend
  if (record.complianceScore < 70) {
    recommendations.push({
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      source: "ML_MODEL",
      type: "REQUIRE_REVIEW",
      title: "Low Compliance Score",
      description: `Compliance score is ${record.complianceScore}. Consider reviewing requirements and evidence.`,
      confidence: 85,
      priority: "HIGH",
      status: "PENDING",
      implemented: false,
    });
  }

  // Add recommendations to record
  const updated: ComplianceRecord = {
    ...record,
    recommendations: [...record.recommendations, ...recommendations],
    updatedAt: new Date().toISOString(),
  };

  store.setRecord(updated);
}

/**
 * Process ML recommendation for approval
 */
export async function processRecommendation(
  recordId: string,
  recommendationId: string,
  action: "APPROVE" | "REJECT" | "REQUIRE_REVISION",
  approverId: string,
  comments?: string,
): Promise<ComplianceRecord> {
  const record = store.getRecord(recordId);
  if (!record) {
    throw new Error(`Compliance record ${recordId} not found`);
  }

  const recommendation = record.recommendations.find(
    (r) => r.id === recommendationId,
  );
  if (!recommendation) {
    throw new Error(`Recommendation ${recommendationId} not found`);
  }

  const now = new Date().toISOString();

  if (action === "APPROVE") {
    recommendation.status = "APPROVED";
    recommendation.approvedBy = approverId;
    recommendation.approvedAt = now;

    // Implement recommendation if it's auto-implementable
    if (
      recommendation.type === "AUTO_APPROVE" ||
      recommendation.type === "UPDATE_RULE"
    ) {
      recommendation.implemented = true;
      recommendation.implementedAt = now;
      // Apply changes
      await applyRecommendationChanges(record, recommendation);
    }
  } else if (action === "REJECT") {
    recommendation.status = "REJECTED";
  } else {
    recommendation.status = "REQUIRES_REVISION";
  }

  const updated: ComplianceRecord = {
    ...record,
    recommendations: record.recommendations.map((r) =>
      r.id === recommendationId ? recommendation : r,
    ),
    updatedAt: now,
    auditTrail: [
      ...record.auditTrail,
      {
        id: `audit-${Date.now()}`,
        timestamp: now,
        userId: approverId,
        action: `RECOMMENDATION_${action}`,
        entityType: "COMPLIANCE_RECORD",
        entityId: recordId,
        metadata: { recommendationId, comments },
      },
    ],
  };

  store.setRecord(updated);
  return updated;
}

/**
 * Apply recommendation changes to compliance record
 */
async function applyRecommendationChanges(
  record: ComplianceRecord,
  recommendation: ComplianceRecommendation,
): Promise<void> {
  if (
    recommendation.type === "UPDATE_RULE" &&
    recommendation.suggestedChanges
  ) {
    // Update rules based on recommendation
    // This would modify the requirement rules
    console.log("Applying rule updates:", recommendation.suggestedChanges);
  }
  // Other implementation logic...
}

// ============================================================================
// REGULATORY API INTEGRATION
// ============================================================================

/**
 * Register a regulatory API integration
 */
export async function registerAPIIntegration(
  integration: Omit<RegulatoryAPIIntegration, "id" | "createdAt" | "updatedAt">,
): Promise<RegulatoryAPIIntegration> {
  const id = `api-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const now = new Date().toISOString();

  const fullIntegration: RegulatoryAPIIntegration = {
    ...integration,
    id,
    createdAt: now,
    updatedAt: now,
  };

  store.setAPIIntegration(fullIntegration);
  return fullIntegration;
}

/**
 * Sync with regulatory API
 */
export async function syncWithRegulatoryAPI(
  integrationId: string,
  endpointId: string,
  data?: Record<string, any>,
): Promise<any> {
  const integration = store.getAPIIntegration(integrationId);
  if (!integration) {
    throw new Error(`API integration ${integrationId} not found`);
  }

  const endpoint = integration.endpoints.find((e) => e.id === endpointId);
  if (!endpoint) {
    throw new Error(`Endpoint ${endpointId} not found`);
  }

  try {
    // Build request
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...endpoint.authentication.headers,
    };

    // Add authentication
    if (
      integration.authentication.type === "API_KEY" &&
      integration.authentication.credentials?.apiKey
    ) {
      headers["X-API-Key"] = integration.authentication.credentials.apiKey;
    }

    const response = await fetch(`${integration.baseUrl}${endpoint.url}`, {
      method: endpoint.method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();

    // Update last sync
    integration.lastSync = new Date().toISOString();
    integration.healthStatus = "HEALTHY";
    store.setAPIIntegration(integration);

    return result;
  } catch (error: any) {
    // Log error
    const apiError = {
      id: `err-${Date.now()}`,
      timestamp: new Date().toISOString(),
      endpoint: endpoint.url,
      errorMessage: error.message,
      requestData: data,
      resolved: false,
    };

    integration.errorLog.push(apiError);
    integration.healthStatus = "DEGRADED";
    store.setAPIIntegration(integration);

    throw error;
  }
}

// ============================================================================
// DASHBOARD GENERATION
// ============================================================================

/**
 * Generate compliance dashboard for tenant
 */
export async function generateDashboard(
  tenantId: string,
): Promise<ComplianceDashboard> {
  const records = store.getRecordsByTenant(tenantId);
  const requirements = store.getAllRequirements();

  // Calculate overall metrics
  const totalRequirements = requirements.filter(
    (r) => r.status === "ACTIVE",
  ).length;
  const compliantRecords = records.filter((r) => r.status === "COMPLIANT");
  const nonCompliantRecords = records.filter(
    (r) => r.status === "NON_COMPLIANT",
  );
  const atRiskRecords = records.filter((r) => r.status === "AT_RISK");
  const pendingRecords = records.filter((r) => r.status === "PENDING_REVIEW");

  const overallScore =
    records.length > 0
      ? records.reduce((sum, r) => sum + r.complianceScore, 0) / records.length
      : 100;

  // Group by category
  const complianceByCategory: Record<string, any> = {} as any;
  const categories: ComplianceCategory[] = [
    "DATA_SECURITY",
    "DATA_PRIVACY",
    "AI_STRATEGY",
    "TRANSPORTATION",
    "WAREHOUSING",
    "CUSTOMS",
    "PRODUCT_SAFETY",
    "FOOD_DRUG",
    "ENVIRONMENTAL",
    "LABOR",
    "FINANCIAL",
    "CYBERSECURITY",
    "QUALITY_MANAGEMENT",
    "SUPPLY_CHAIN",
    "TRADE",
    "LICENSING",
    "AUTHENTICATION",
    "IDENTITY_VERIFICATION",
    "DOCUMENTATION",
  ];
  for (const category of categories) {
    const categoryRecords = records.filter(
      (r) => r.requirement.category === category,
    );
    complianceByCategory[category] = {
      category,
      totalRequirements: requirements.filter(
        (r) => r.category === category && r.status === "ACTIVE",
      ).length,
      compliant: categoryRecords.filter((r) => r.status === "COMPLIANT").length,
      nonCompliant: categoryRecords.filter((r) => r.status === "NON_COMPLIANT")
        .length,
      atRisk: categoryRecords.filter((r) => r.status === "AT_RISK").length,
      complianceScore:
        categoryRecords.length > 0
          ? categoryRecords.reduce((sum, r) => sum + r.complianceScore, 0) /
            categoryRecords.length
          : 100,
      trend: "STABLE", // Would calculate from historical data
    };
  }

  // Recent activity
  const recentViolations = records
    .flatMap((r) => r.violations)
    .sort(
      (a, b) =>
        new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
    )
    .slice(0, 10);

  const recentFindings = records
    .flatMap((r) => r.findings)
    .sort((a, b) => new Date(b.id).localeCompare(a.id))
    .slice(0, 10);

  const recentActions = records
    .flatMap((r) => r.actions)
    .filter((a) => a.status === "PENDING" || a.status === "IN_PROGRESS")
    .slice(0, 10);

  const pendingApprovals = records
    .flatMap((r) => r.recommendations)
    .filter((r) => r.status === "PENDING")
    .slice(0, 10);

  // Alerts
  const criticalAlerts = records
    .filter(
      (r) =>
        r.status === "NON_COMPLIANT" &&
        r.violations.some((v) => v.severity === "CRITICAL"),
    )
    .map((r) => ({
      id: `alert-${r.id}`,
      type: "CRITICAL" as const,
      title: "Critical Compliance Violation",
      description: `${r.requirement.title} has critical violations`,
      requirementId: r.requirementId,
      recordId: r.id,
      priority: "CRITICAL" as const,
      createdAt: r.updatedAt,
      acknowledged: false,
    }));

  const dashboard: ComplianceDashboard = {
    tenantId,
    overallComplianceScore: overallScore,
    totalRequirements,
    compliantRequirements: compliantRecords.length,
    nonCompliantRequirements: nonCompliantRecords.length,
    atRiskRequirements: atRiskRecords.length,
    pendingReview: pendingRecords.length,
    complianceByCategory,
    complianceByAuthority: {} as any, // Would calculate similarly
    complianceByRegion: {} as any, // Would calculate similarly
    recentViolations,
    recentFindings,
    recentActions,
    pendingApprovals,
    complianceTrend: [], // Would calculate from historical data
    violationTrend: [], // Would calculate from historical data
    criticalAlerts,
    warnings: [],
    lastUpdated: new Date().toISOString(),
  };

  store.setDashboard(tenantId, dashboard);
  return dashboard;
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const complianceService = {
  // Requirements
  createOrUpdateRequirement,
  searchRequirements,
  getRequirement: (id: string) => store.getRequirement(id),
  getAllRequirements: () => store.getAllRequirements(),
  getRequirementsByAuthority: (authority: RegulatoryAuthority) =>
    store.getRequirementsByAuthority(authority),
  getRequirementsByRegion: (region: RegulatoryRegion) =>
    store.getRequirementsByRegion(region),
  getRequirementsByCategory: (category: ComplianceCategory) =>
    store.getRequirementsByCategory(category),

  // Records
  createComplianceRecord,
  getRecord: (id: string) => store.getRecord(id),
  getRecordsByTenant: (tenantId: string) => store.getRecordsByTenant(tenantId),
  performComplianceCheck,
  processRecommendation,

  // API Integrations
  registerAPIIntegration,
  syncWithRegulatoryAPI,
  getAPIIntegration: (id: string) => store.getAPIIntegration(id),
  getAllAPIIntegrations: () => store.getAllAPIIntegrations(),

  // Dashboard
  generateDashboard,
  getDashboard: (tenantId: string) => store.getDashboard(tenantId),
};

export default complianceService;

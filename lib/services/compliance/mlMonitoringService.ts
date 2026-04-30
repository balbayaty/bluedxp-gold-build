/**
 * ML/AI Compliance Monitoring Service
 * Continuous learning, auto-updates, and intelligent recommendations
 */

import {
  ComplianceRecord,
  ComplianceRecommendation,
  RegulatoryRequirement,
  ComplianceKnowledgeEntry,
  RegulationChange,
  MLInsight,
} from "@/types/compliance";
import { complianceService } from "./complianceService";
import { knowledgeBaseService } from "../knowledge-base";

// ============================================================================
// ML MODEL INTERFACE
// ============================================================================

interface MLModel {
  id: string;
  name: string;
  version: string;
  type: "CLASSIFICATION" | "REGRESSION" | "ANOMALY_DETECTION" | "PREDICTION";
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  confidence: number;
  lastTrained: Date | string;
}

// ============================================================================
// CONTINUOUS LEARNING ENGINE
// ============================================================================

class ContinuousLearningEngine {
  private models: Map<string, MLModel> = new Map();
  private trainingQueue: Array<{ recordId: string; data: any }> = [];
  private insights: MLInsight[] = [];

  /**
   * Register ML model
   */
  registerModel(model: MLModel): void {
    this.models.set(model.id, model);
  }

  /**
   * Analyze compliance record and generate insights
   */
  async analyzeComplianceRecord(
    record: ComplianceRecord,
  ): Promise<MLInsight[]> {
    const insights: MLInsight[] = [];

    // Pattern detection
    const patterns = await detectPatterns(record);
    insights.push(...patterns);

    // Anomaly detection
    const anomalies = await detectAnomalies(record);
    insights.push(...anomalies);

    // Predictive analysis
    const predictions = await predictComplianceRisk(record);
    insights.push(...predictions);

    // Store insights
    this.insights.push(...insights);

    return insights;
  }

  /**
   * Detect patterns in compliance data
   */
  private async detectPatterns(record: ComplianceRecord): Promise<MLInsight[]> {
    const insights: MLInsight[] = [];

    // Analyze violation patterns
    if (record.violations.length > 0) {
      const violationTypes = record.violations.map((v) => v.violationType);
      const mostCommonType = getMostFrequent(violationTypes);

      if (mostCommonType) {
        insights.push({
          id: `insight-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          modelId: "pattern-detection-v1",
          insightType: "PATTERN",
          description: `Most common violation type: ${mostCommonType}. Consider preventive measures.`,
          confidence: 85,
          data: {
            violationType: mostCommonType,
            count: violationTypes.filter((v) => v === mostCommonType).length,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Analyze compliance score trends
    if (record.complianceScore < 70) {
      insights.push({
        id: `insight-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        modelId: "trend-analysis-v1",
        insightType: "PATTERN",
        description:
          "Compliance score below threshold. Review evidence and documentation.",
        confidence: 90,
        data: { complianceScore: record.complianceScore },
        timestamp: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Detect anomalies in compliance data
   */
  private async detectAnomalies(
    record: ComplianceRecord,
  ): Promise<MLInsight[]> {
    const insights: MLInsight[] = [];

    // Check for sudden drops in compliance score
    // (Would compare with historical data in real implementation)

    // Check for unusual violation patterns
    if (record.violations.length > 3) {
      insights.push({
        id: `insight-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        modelId: "anomaly-detection-v1",
        insightType: "ANOMALY",
        description: `Unusually high number of violations (${record.violations.length}). Requires investigation.`,
        confidence: 80,
        data: { violationCount: record.violations.length },
        timestamp: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Predict compliance risk
   */
  private async predictComplianceRisk(
    record: ComplianceRecord,
  ): Promise<MLInsight[]> {
    const insights: MLInsight[] = [];

    // Predict certificate expiry risk
    const expiringCertificates = record.certificates.filter((cert) => {
      if (!cert.expiryDate) return false;
      const expiryDate = new Date(cert.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });

    if (expiringCertificates.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        modelId: "risk-prediction-v1",
        insightType: "PREDICTION",
        description: `${expiringCertificates.length} certificate(s) expiring within 30 days. Renewal required.`,
        confidence: 95,
        data: {
          expiringCertificates: expiringCertificates.map(
            (c) => c.certificateNumber,
          ),
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Predict compliance degradation
    if (record.complianceScore < 80 && record.violations.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        modelId: "risk-prediction-v1",
        insightType: "PREDICTION",
        description:
          "Risk of further compliance degradation. Immediate action recommended.",
        confidence: 75,
        data: {
          currentScore: record.complianceScore,
          violationCount: record.violations.length,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Generate recommendations from insights
   */
  async generateRecommendations(
    record: ComplianceRecord,
    insights: MLInsight[],
  ): Promise<ComplianceRecommendation[]> {
    const recommendations: ComplianceRecommendation[] = [];

    for (const insight of insights) {
      if (insight.insightType === "PREDICTION" && insight.confidence >= 80) {
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          source: "ML_MODEL",
          type: "REQUIRE_REVIEW",
          title: "ML Prediction Alert",
          description: insight.description,
          confidence: insight.confidence,
          priority: insight.confidence >= 90 ? "CRITICAL" : "HIGH",
          status: "PENDING",
          implemented: false,
        });
      } else if (insight.insightType === "ANOMALY") {
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          source: "AI_ANALYSIS",
          type: "REQUIRE_REVIEW",
          title: "Anomaly Detected",
          description: insight.description,
          confidence: insight.confidence,
          priority: "HIGH",
          status: "PENDING",
          implemented: false,
        });
      }
    }

    return recommendations;
  }
}

const learningEngine = new ContinuousLearningEngine();

// ============================================================================
// REGULATORY UPDATE DETECTOR
// ============================================================================

class RegulatoryUpdateDetector {
  private updateSources: Array<{
    authority: string;
    url: string;
    lastChecked: Date;
  }> = [];
  private detectedChanges: RegulationChange[] = [];

  /**
   * Monitor regulatory sources for updates
   */
  async monitorRegulatoryUpdates(): Promise<RegulationChange[]> {
    const changes: RegulationChange[] = [];

    // This would integrate with regulatory APIs and web scraping
    // For now, we'll simulate detection

    // Check knowledge base for new regulations
    const recentKnowledge = await knowledgeBaseService.search({
      query: "new regulation update",
      filters: {
        categories: ["regulatory_compliance"],
      },
      limit: 10,
    });

    for (const kbEntry of recentKnowledge) {
      if (kbEntry.entry.metadata?.requirementId) {
        const requirement = complianceService.getRequirement(
          kbEntry.entry.metadata.requirementId,
        );
        if (requirement) {
          // Detect changes
          const change = await detectRequirementChanges(
            requirement,
            kbEntry.entry,
          );
          if (change) {
            changes.push(change);
          }
        }
      }
    }

    this.detectedChanges.push(...changes);
    return changes;
  }

  /**
   * Detect changes in requirement
   */
  private async detectRequirementChanges(
    requirement: RegulatoryRequirement,
    knowledgeEntry: any,
  ): Promise<RegulationChange | null> {
    // Compare versions, content, etc.
    // This would use NLP and diff algorithms in production

    // For now, create a generic change if version differs
    if (knowledgeEntry.metadata?.version !== requirement.version) {
      return {
        id: `change-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        changeType: "MODIFIED",
        description: `Regulation ${requirement.title} has been updated to version ${knowledgeEntry.metadata?.version}`,
        effectiveDate: new Date().toISOString(),
        impact: "MEDIUM",
        affectedRequirements: [requirement.id],
        actionRequired: true,
        actionDescription:
          "Review updated requirements and update compliance records",
      };
    }

    return null;
  }

  /**
   * Auto-update requirements based on detected changes
   */
  async autoUpdateRequirements(changes: RegulationChange[]): Promise<void> {
    for (const change of changes) {
      if (change.impact === "LOW" && !change.actionRequired) {
        // Auto-update low-impact changes
        for (const reqId of change.affectedRequirements) {
          const requirement = complianceService.getRequirement(reqId);
          if (requirement) {
            // Update requirement
            await complianceService.createOrUpdateRequirement({
              ...requirement,
              lastUpdated: new Date().toISOString(),
              version: incrementVersion(requirement.version),
            });

            // Notify affected records
            await notifyAffectedRecords(reqId, change);
          }
        }
      } else {
        // Create recommendations for manual review
        await createUpdateRecommendations(change);
      }
    }
  }

  /**
   * Notify affected compliance records
   */
  private async notifyAffectedRecords(
    requirementId: string,
    change: RegulationChange,
  ): Promise<void> {
    const records = complianceService.getRecordsByRequirement(requirementId);
    for (const record of records) {
      // Trigger re-check
      await complianceService.performComplianceCheck(record.id);
    }
  }

  /**
   * Create recommendations for manual review
   */
  private async createUpdateRecommendations(
    change: RegulationChange,
  ): Promise<void> {
    for (const reqId of change.affectedRequirements) {
      const records = complianceService.getRecordsByRequirement(reqId);
      for (const record of records) {
        const recommendation: ComplianceRecommendation = {
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          source: "REGULATORY_UPDATE",
          type: "UPDATE_RULE",
          title: "Regulatory Update Detected",
          description: change.description,
          confidence: 100,
          priority:
            change.impact === "CRITICAL"
              ? "CRITICAL"
              : change.impact === "HIGH"
                ? "HIGH"
                : "MEDIUM",
          status: "PENDING",
          suggestedChanges: {
            requirementId: reqId,
            changeType: change.changeType,
            effectiveDate: change.effectiveDate,
          },
          implemented: false,
        };

        // Add to record
        const updated: ComplianceRecord = {
          ...record,
          recommendations: [...record.recommendations, recommendation],
          updatedAt: new Date().toISOString(),
        };
        // Would update in store
      }
    }
  }
}

const updateDetector = new RegulatoryUpdateDetector();

// ============================================================================
// AUTO-UPDATE SERVICE
// ============================================================================

/**
 * Process ML recommendations and auto-approve if threshold met
 */
export async function processAutoUpdates(
  recordId: string,
  autoApproveThreshold: number = 90,
): Promise<ComplianceRecord> {
  const record = complianceService.getRecord(recordId);
  if (!record) {
    throw new Error(`Compliance record ${recordId} not found`);
  }

  // Analyze with ML
  const insights = await learningEngine.analyzeComplianceRecord(record);
  const recommendations = await learningEngine.generateRecommendations(
    record,
    insights,
  );

  // Auto-approve high-confidence recommendations
  for (const rec of recommendations) {
    if (rec.confidence >= autoApproveThreshold && rec.type === "AUTO_APPROVE") {
      await complianceService.processRecommendation(
        recordId,
        rec.id,
        "APPROVE",
        "system",
        "Auto-approved by ML",
      );
    }
  }

  // Update record with new recommendations
  const updated: ComplianceRecord = {
    ...record,
    recommendations: [...record.recommendations, ...recommendations],
    updatedAt: new Date().toISOString(),
  };

  return updated;
}

/**
 * Monitor and detect regulatory updates
 */
export async function monitorRegulatoryUpdates(): Promise<RegulationChange[]> {
  const changes = await updateDetector.monitorRegulatoryUpdates();

  // Auto-update low-impact changes
  await updateDetector.autoUpdateRequirements(
    changes.filter((c) => c.impact === "LOW"),
  );

  return changes;
}

/**
 * Continuous monitoring loop (would run as background job)
 */
export async function startContinuousMonitoring(
  tenantId: string,
): Promise<void> {
  // This would be a background service
  // For now, we'll provide the interface

  setInterval(
    async () => {
      try {
        // Check for regulatory updates
        await monitorRegulatoryUpdates();

        // Process auto-updates for all records
        const records = complianceService.getRecordsByTenant(tenantId);
        for (const record of records) {
          await processAutoUpdates(record.id);
        }
      } catch (error) {
        console.error("Error in continuous monitoring:", error);
      }
    },
    60 * 60 * 1000,
  ); // Run every hour
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMostFrequent<T>(items: T[]): T | null {
  if (items.length === 0) return null;

  const frequency: Record<string, number> = {};
  for (const item of items) {
    const key = String(item);
    frequency[key] = (frequency[key] || 0) + 1;
  }

  const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
  return sorted[0] ? (sorted[0][0] as T) : null;
}

function incrementVersion(version: string): string {
  const parts = version.split(".");
  if (parts.length === 0) return "1.0.0";

  const major = parseInt(parts[0]) || 1;
  const minor = parseInt(parts[1]) || 0;
  const patch = parseInt(parts[2]) || 0;

  return `${major}.${minor}.${patch + 1}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const mlMonitoringService = {
  analyzeComplianceRecord: (record: ComplianceRecord) =>
    learningEngine.analyzeComplianceRecord(record),
  generateRecommendations: (record: ComplianceRecord, insights: MLInsight[]) =>
    learningEngine.generateRecommendations(record, insights),
  processAutoUpdates,
  monitorRegulatoryUpdates,
  startContinuousMonitoring,
  registerModel: (model: MLModel) => learningEngine.registerModel(model),
};

export default mlMonitoringService;

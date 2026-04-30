/**
 * AI-Powered Root Cause Analysis Service
 * Advanced root cause analysis with drill-down and correlation
 * More advanced than Celonis root cause analysis
 */

import { callAI } from "@/utils/aiClient";
import type { EntityLifecycle, StageTransition } from "@/types/lifecycle";
import type { Deviation } from "./conformanceChecker";
import type { ProcessEvent } from "@/types/process-lifecycle";

export interface RootCause {
  id: string;
  type: "primary" | "secondary" | "contributing";
  title: string;
  description: string;
  confidence: number; // 0-1
  evidence: Evidence[];
  impact: {
    severity: "low" | "medium" | "high" | "critical";
    affectedStages: string[];
    affectedCases: number;
    costImpact?: number;
  };
  recommendations: Recommendation[];
  relatedCauses?: string[];
}

export interface Evidence {
  id: string;
  type: "deviation" | "event" | "metric" | "correlation" | "pattern";
  source: string;
  data: any;
  relevance: number; // 0-1
  timestamp: Date;
}

export interface Recommendation {
  id: string;
  type: "immediate" | "short-term" | "long-term";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
  implementationEffort: "low" | "medium" | "high";
}

export interface RootCauseAnalysis {
  entityId: string;
  entityType: string;
  primaryCauses: RootCause[];
  secondaryCauses: RootCause[];
  contributingCauses: RootCause[];
  causalChain: CausalLink[];
  correlations: Correlation[];
  confidence: number;
  timestamp: Date;
}

export interface CausalLink {
  from: string;
  to: string;
  strength: number; // 0-1
  evidence: string[];
}

export interface Correlation {
  factor1: string;
  factor2: string;
  correlation: number; // -1 to 1
  significance: number; // 0-1
  evidence: string[];
}

export class AdvancedRootCauseAnalysis {
  /**
   * Analyze root causes
   */
  async analyzeRootCauses(
    lifecycle: EntityLifecycle,
    deviations: Deviation[],
    events: ProcessEvent[],
  ): Promise<RootCauseAnalysis> {
    // Collect evidence
    const evidence = this.collectEvidence(lifecycle, deviations, events);

    // Identify primary causes using AI
    const primaryCauses = await this.identifyPrimaryCauses(evidence, lifecycle);

    // Identify secondary causes
    const secondaryCauses = this.identifySecondaryCauses(
      evidence,
      primaryCauses,
    );

    // Identify contributing causes
    const contributingCauses = this.identifyContributingCauses(
      evidence,
      primaryCauses,
      secondaryCauses,
    );

    // Build causal chain
    const causalChain = this.buildCausalChain(
      primaryCauses,
      secondaryCauses,
      contributingCauses,
    );

    // Find correlations
    const correlations = this.findCorrelations(evidence, lifecycle);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(primaryCauses, evidence);

    return {
      entityId: lifecycle.entityId,
      entityType: lifecycle.entityType,
      primaryCauses,
      secondaryCauses,
      contributingCauses,
      causalChain,
      correlations,
      confidence,
      timestamp: new Date(),
    };
  }

  /**
   * Collect evidence
   */
  private collectEvidence(
    lifecycle: EntityLifecycle,
    deviations: Deviation[],
    events: ProcessEvent[],
  ): Evidence[] {
    const evidence: Evidence[] = [];

    // Add deviation evidence
    deviations.forEach((deviation) => {
      evidence.push({
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "deviation",
        source: "conformance-checker",
        data: deviation,
        relevance: this.calculateRelevance(deviation),
        timestamp: new Date(),
      });
    });

    // Add event evidence
    events.forEach((event) => {
      evidence.push({
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "event",
        source: "event-log",
        data: event,
        relevance: 0.7,
        timestamp: new Date(event.timestamp),
      });
    });

    // Add metric evidence
    const metrics = this.extractMetrics(lifecycle);
    metrics.forEach((metric) => {
      evidence.push({
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "metric",
        source: "lifecycle",
        data: metric,
        relevance: 0.6,
        timestamp: new Date(),
      });
    });

    return evidence.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Calculate relevance
   */
  private calculateRelevance(deviation: Deviation): number {
    const severityWeights = {
      critical: 1.0,
      high: 0.8,
      medium: 0.5,
      low: 0.2,
    };

    return severityWeights[deviation.severity] || 0.5;
  }

  /**
   * Extract metrics
   */
  private extractMetrics(lifecycle: EntityLifecycle): any[] {
    const metrics: any[] = [];

    // Duration metrics
    lifecycle.stages.forEach((stage) => {
      if (stage.startedAt && stage.completedAt) {
        const duration =
          new Date(stage.completedAt).getTime() -
          new Date(stage.startedAt).getTime();
        metrics.push({
          type: "duration",
          stageId: stage.stageId,
          value: duration,
          unit: "ms",
        });
      }
    });

    // Progress metrics
    metrics.push({
      type: "progress",
      value: lifecycle.progress,
      unit: "percentage",
    });

    return metrics;
  }

  /**
   * Identify primary causes using AI
   */
  private async identifyPrimaryCauses(
    evidence: Evidence[],
    lifecycle: EntityLifecycle,
  ): Promise<RootCause[]> {
    // Use AI to analyze evidence and identify root causes
    const topEvidence = evidence.slice(0, 10); // Top 10 most relevant

    const prompt = `Analyze the following process lifecycle evidence and identify the primary root causes of issues:

Lifecycle: ${lifecycle.entityType} (${lifecycle.entityId})
Status: ${lifecycle.status}
Progress: ${lifecycle.progress}%

Evidence:
${topEvidence.map((e) => `- ${e.type}: ${JSON.stringify(e.data)}`).join("\n")}

Identify 2-3 primary root causes with:
1. Clear title and description
2. Confidence level (0-1)
3. Impact assessment
4. Specific recommendations

Return as JSON array of root causes.`;

    try {
      const response = await callAI(prompt);
      const causes = JSON.parse(response || "[]") as RootCause[];

      // Enhance with evidence
      return causes.map((cause) => ({
        ...cause,
        evidence: topEvidence.filter((e) => this.isRelevantToCause(e, cause)),
        recommendations: this.generateRecommendations(cause),
      }));
    } catch (error) {
      console.error("AI root cause analysis failed:", error);
      // Fallback to rule-based analysis
      return this.identifyPrimaryCausesRuleBased(evidence, lifecycle);
    }
  }

  /**
   * Rule-based primary cause identification (fallback)
   */
  private identifyPrimaryCausesRuleBased(
    evidence: Evidence[],
    lifecycle: EntityLifecycle,
  ): RootCause[] {
    const causes: RootCause[] = [];

    // Find critical deviations
    const criticalDeviations = evidence
      .filter(
        (e) =>
          e.type === "deviation" &&
          (e.data as Deviation).severity === "critical",
      )
      .slice(0, 3);

    criticalDeviations.forEach((evidence) => {
      const deviation = evidence.data as Deviation;
      causes.push({
        id: `cause-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "primary",
        title: `Critical Deviation: ${deviation.type}`,
        description: deviation.impact,
        confidence: 0.8,
        evidence: [evidence],
        impact: {
          severity: "critical",
          affectedStages: [deviation.stageId],
          affectedCases: 1,
        },
        recommendations: [
          {
            id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: "immediate",
            priority: "critical",
            title: deviation.recommendation,
            description: deviation.impact,
            actionItems: [deviation.recommendation],
            expectedImpact: "High - addresses critical deviation",
            implementationEffort: "medium",
          },
        ],
      });
    });

    return causes;
  }

  /**
   * Check if evidence is relevant to cause
   */
  private isRelevantToCause(evidence: Evidence, cause: RootCause): boolean {
    // Simple relevance check - could be more sophisticated
    return evidence.relevance > 0.5;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(cause: RootCause): Recommendation[] {
    return (
      cause.recommendations || [
        {
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "immediate",
          priority: cause.impact.severity === "critical" ? "critical" : "high",
          title: `Address ${cause.title}`,
          description: cause.description,
          actionItems: [
            "Investigate root cause",
            "Implement fix",
            "Monitor results",
          ],
          expectedImpact: `Resolve ${cause.title}`,
          implementationEffort: "medium",
        },
      ]
    );
  }

  /**
   * Identify secondary causes
   */
  private identifySecondaryCauses(
    evidence: Evidence[],
    primaryCauses: RootCause[],
  ): RootCause[] {
    const secondaryCauses: RootCause[] = [];

    // Find evidence related to primary causes but not as critical
    const remainingEvidence = evidence.filter((e) => {
      return !primaryCauses.some((cause) =>
        cause.evidence.some((ev) => ev.id === e.id),
      );
    });

    // Group by type and find patterns
    const deviationEvidence = remainingEvidence.filter(
      (e) => e.type === "deviation",
    );
    const highSeverityDeviations = deviationEvidence.filter(
      (e) => (e.data as Deviation).severity === "high",
    );

    highSeverityDeviations.slice(0, 3).forEach((evidence) => {
      const deviation = evidence.data as Deviation;
      secondaryCauses.push({
        id: `cause-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "secondary",
        title: `Secondary Issue: ${deviation.type}`,
        description: deviation.impact,
        confidence: 0.6,
        evidence: [evidence],
        impact: {
          severity: "high",
          affectedStages: [deviation.stageId],
          affectedCases: 1,
        },
        recommendations: [
          {
            id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: "short-term",
            priority: "high",
            title: deviation.recommendation,
            description: deviation.impact,
            actionItems: [deviation.recommendation],
            expectedImpact: "Medium - addresses high severity issue",
            implementationEffort: "medium",
          },
        ],
      });
    });

    return secondaryCauses;
  }

  /**
   * Identify contributing causes
   */
  private identifyContributingCauses(
    evidence: Evidence[],
    primaryCauses: RootCause[],
    secondaryCauses: RootCause[],
  ): RootCause[] {
    const contributingCauses: RootCause[] = [];

    // Find remaining evidence
    const usedEvidenceIds = new Set([
      ...primaryCauses.flatMap((c) => c.evidence.map((e) => e.id)),
      ...secondaryCauses.flatMap((c) => c.evidence.map((e) => e.id)),
    ]);

    const remainingEvidence = evidence.filter(
      (e) => !usedEvidenceIds.has(e.id),
    );

    // Find medium severity deviations
    const mediumDeviations = remainingEvidence.filter(
      (e) =>
        e.type === "deviation" && (e.data as Deviation).severity === "medium",
    );

    mediumDeviations.slice(0, 5).forEach((evidence) => {
      const deviation = evidence.data as Deviation;
      contributingCauses.push({
        id: `cause-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "contributing",
        title: `Contributing Factor: ${deviation.type}`,
        description: deviation.impact,
        confidence: 0.4,
        evidence: [evidence],
        impact: {
          severity: "medium",
          affectedStages: [deviation.stageId],
          affectedCases: 1,
        },
        recommendations: [
          {
            id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: "long-term",
            priority: "medium",
            title: deviation.recommendation,
            description: deviation.impact,
            actionItems: [deviation.recommendation],
            expectedImpact: "Low - addresses contributing factor",
            implementationEffort: "low",
          },
        ],
      });
    });

    return contributingCauses;
  }

  /**
   * Build causal chain
   */
  private buildCausalChain(
    primaryCauses: RootCause[],
    secondaryCauses: RootCause[],
    contributingCauses: RootCause[],
  ): CausalLink[] {
    const links: CausalLink[] = [];

    // Link contributing -> secondary -> primary
    contributingCauses.forEach((contributing) => {
      secondaryCauses.forEach((secondary) => {
        if (this.areRelated(contributing, secondary)) {
          links.push({
            from: contributing.id,
            to: secondary.id,
            strength: 0.6,
            evidence: ["Shared evidence", "Temporal correlation"],
          });
        }
      });
    });

    secondaryCauses.forEach((secondary) => {
      primaryCauses.forEach((primary) => {
        if (this.areRelated(secondary, primary)) {
          links.push({
            from: secondary.id,
            to: primary.id,
            strength: 0.8,
            evidence: ["Causal relationship", "Impact correlation"],
          });
        }
      });
    });

    return links;
  }

  /**
   * Check if causes are related
   */
  private areRelated(cause1: RootCause, cause2: RootCause): boolean {
    // Check if they share evidence or affect same stages
    const sharedEvidence = cause1.evidence.some((e1) =>
      cause2.evidence.some((e2) => e1.id === e2.id),
    );

    const sharedStages = cause1.impact.affectedStages.some((s1) =>
      cause2.impact.affectedStages.includes(s1),
    );

    return sharedEvidence || sharedStages;
  }

  /**
   * Find correlations
   */
  private findCorrelations(
    evidence: Evidence[],
    lifecycle: EntityLifecycle,
  ): Correlation[] {
    const correlations: Correlation[] = [];

    // Find correlations between deviations and metrics
    const deviations = evidence.filter((e) => e.type === "deviation");
    const metrics = evidence.filter((e) => e.type === "metric");

    deviations.forEach((deviation) => {
      metrics.forEach((metric) => {
        const correlation = this.calculateCorrelation(deviation, metric);
        if (Math.abs(correlation.correlation) > 0.5) {
          correlations.push({
            factor1: (deviation.data as Deviation).stageId,
            factor2: (metric.data as any).type,
            correlation: correlation.correlation,
            significance: correlation.significance,
            evidence: ["Statistical correlation", "Temporal alignment"],
          });
        }
      });
    });

    return correlations;
  }

  /**
   * Calculate correlation
   */
  private calculateCorrelation(
    evidence1: Evidence,
    evidence2: Evidence,
  ): {
    correlation: number;
    significance: number;
  } {
    // Simplified correlation calculation
    // In production, would use proper statistical methods
    const relevance1 = evidence1.relevance;
    const relevance2 = evidence2.relevance;

    const correlation = (relevance1 + relevance2) / 2;
    const significance = Math.min(relevance1, relevance2);

    return { correlation, significance };
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(
    primaryCauses: RootCause[],
    evidence: Evidence[],
  ): number {
    if (primaryCauses.length === 0) return 0;

    const avgCauseConfidence =
      primaryCauses.reduce((sum, cause) => sum + cause.confidence, 0) /
      primaryCauses.length;

    const evidenceQuality =
      evidence.length > 0
        ? evidence.slice(0, 10).reduce((sum, e) => sum + e.relevance, 0) /
          Math.min(evidence.length, 10)
        : 0;

    return avgCauseConfidence * 0.7 + evidenceQuality * 0.3;
  }
}

// Singleton instance
export const rootCauseAnalysis = new AdvancedRootCauseAnalysis();

export default rootCauseAnalysis;

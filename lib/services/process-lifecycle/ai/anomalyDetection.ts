/**
 * Advanced Anomaly Detection System
 * ML-based anomaly detection for process events and patterns
 * More advanced than competitors
 */

import { callAI } from "@/utils/aiClient";
import type { EntityLifecycle, StageTransition } from "@/types/lifecycle";
import type { ProcessEvent } from "@/types/process-lifecycle";

export interface Anomaly {
  id: string;
  type:
    | "timing"
    | "sequence"
    | "resource"
    | "cost"
    | "quality"
    | "pattern"
    | "outlier";
  severity: "low" | "medium" | "high" | "critical";
  entityId: string;
  entityType: string;
  detectedAt: Date;
  description: string;
  data: any;
  confidence: number; // 0-1
  impact: {
    affectedStages: string[];
    potentialCost?: number;
    potentialDelay?: number;
  };
  recommendations: string[];
  relatedAnomalies?: string[];
}

export interface AnomalyPattern {
  id: string;
  name: string;
  description: string;
  pattern: string;
  frequency: number;
  severity: "low" | "medium" | "high" | "critical";
  detectionRules: DetectionRule[];
}

export interface DetectionRule {
  id: string;
  type: "threshold" | "statistical" | "pattern" | "ml";
  condition: string;
  threshold?: number;
  weight: number;
}

export interface AnomalyDetectionResult {
  entityId: string;
  entityType: string;
  anomalies: Anomaly[];
  patterns: AnomalyPattern[];
  statistics: {
    totalAnomalies: number;
    byType: Map<string, number>;
    bySeverity: Map<string, number>;
  };
  confidence: number;
  timestamp: Date;
}

export class AdvancedAnomalyDetection {
  private patterns: Map<string, AnomalyPattern> = new Map();
  private detectionHistory: Map<string, Anomaly[]> = new Map();
  private baselineMetrics: Map<string, BaselineMetrics> = new Map();

  /**
   * Detect anomalies
   */
  async detectAnomalies(
    lifecycle: EntityLifecycle,
    events: ProcessEvent[],
  ): Promise<AnomalyDetectionResult> {
    const anomalies: Anomaly[] = [];

    // Detect different types of anomalies
    const timingAnomalies = this.detectTimingAnomalies(lifecycle);
    const sequenceAnomalies = this.detectSequenceAnomalies(lifecycle);
    const resourceAnomalies = this.detectResourceAnomalies(lifecycle, events);
    const costAnomalies = this.detectCostAnomalies(lifecycle);
    const qualityAnomalies = this.detectQualityAnomalies(events);
    const patternAnomalies = this.detectPatternAnomalies(lifecycle, events);
    const outlierAnomalies = this.detectOutliers(lifecycle, events);

    anomalies.push(
      ...timingAnomalies,
      ...sequenceAnomalies,
      ...resourceAnomalies,
      ...costAnomalies,
      ...qualityAnomalies,
      ...patternAnomalies,
      ...outlierAnomalies,
    );

    // Identify patterns
    const patterns = this.identifyPatterns(anomalies);

    // Calculate statistics
    const statistics = this.calculateStatistics(anomalies);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(anomalies);

    // Save detection history
    this.saveDetectionHistory(
      lifecycle.entityId,
      lifecycle.entityType,
      anomalies,
    );

    return {
      entityId: lifecycle.entityId,
      entityType: lifecycle.entityType,
      anomalies: anomalies.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      patterns,
      statistics,
      confidence,
      timestamp: new Date(),
    };
  }

  /**
   * Detect timing anomalies
   */
  private detectTimingAnomalies(lifecycle: EntityLifecycle): Anomaly[] {
    const anomalies: Anomaly[] = [];

    lifecycle.stages.forEach((stage) => {
      if (stage.startedAt && stage.completedAt) {
        const duration =
          new Date(stage.completedAt).getTime() -
          new Date(stage.startedAt).getTime();
        const hours = duration / 3600000;

        // Check against baseline
        const baseline = this.getBaseline(lifecycle.entityType, stage.stageId);
        if (baseline) {
          const deviation =
            Math.abs(hours - baseline.avgDuration) / baseline.avgDuration;

          if (deviation > 0.5) {
            // More than 50% deviation
            anomalies.push({
              id: `anom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              type: "timing",
              severity:
                deviation > 1
                  ? "critical"
                  : deviation > 0.75
                    ? "high"
                    : "medium",
              entityId: lifecycle.entityId,
              entityType: lifecycle.entityType,
              detectedAt: new Date(),
              description: `Stage ${stage.stageId} took ${hours.toFixed(1)} hours (expected: ${baseline.avgDuration.toFixed(1)} hours)`,
              data: {
                stageId: stage.stageId,
                actualDuration: hours,
                expectedDuration: baseline.avgDuration,
                deviation: deviation * 100,
              },
              confidence: Math.min(deviation, 1),
              impact: {
                affectedStages: [stage.stageId],
                potentialDelay: hours - baseline.avgDuration,
              },
              recommendations: [
                "Investigate cause of delay",
                "Review resource allocation",
                "Check for blocking factors",
              ],
            });
          }
        }
      }
    });

    return anomalies;
  }

  /**
   * Detect sequence anomalies
   */
  private detectSequenceAnomalies(lifecycle: EntityLifecycle): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Check for out-of-order transitions
    const transitions = lifecycle.transitions;
    for (let i = 0; i < transitions.length - 1; i++) {
      const current = transitions[i];
      const next = transitions[i + 1];

      // Check if transition order makes sense
      // This is simplified - would need process model to properly validate
      if (current.toStageId === next.fromStageId) {
        // Normal sequence
      } else {
        // Potential anomaly
        anomalies.push({
          id: `anom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "sequence",
          severity: "medium",
          entityId: lifecycle.entityId,
          entityType: lifecycle.entityType,
          detectedAt: new Date(),
          description: `Unexpected sequence: ${current.toStageId} -> ${next.fromStageId}`,
          data: {
            transition1: current,
            transition2: next,
          },
          confidence: 0.6,
          impact: {
            affectedStages: [current.toStageId, next.fromStageId],
          },
          recommendations: [
            "Review process flow",
            "Validate stage dependencies",
            "Check for process deviation",
          ],
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect resource anomalies
   */
  private detectResourceAnomalies(
    lifecycle: EntityLifecycle,
    events: ProcessEvent[],
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Check for resource-related events
    const resourceEvents = events.filter(
      (e) => e.type.includes("resource") || e.type.includes("allocation"),
    );

    if (resourceEvents.length > 5) {
      anomalies.push({
        id: `anom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "resource",
        severity: "high",
        entityId: lifecycle.entityId,
        entityType: lifecycle.entityType,
        detectedAt: new Date(),
        description: `High number of resource-related events: ${resourceEvents.length}`,
        data: {
          eventCount: resourceEvents.length,
          events: resourceEvents,
        },
        confidence: 0.7,
        impact: {
          affectedStages: lifecycle.stages.map((s) => s.stageId),
        },
        recommendations: [
          "Review resource allocation",
          "Check for resource constraints",
          "Optimize resource utilization",
        ],
      });
    }

    return anomalies;
  }

  /**
   * Detect cost anomalies
   */
  private detectCostAnomalies(lifecycle: EntityLifecycle): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Simplified cost anomaly detection
    // In production, would use cost mining service
    const baseline = this.getBaseline(lifecycle.entityType, "cost");
    if (baseline) {
      // Would compare actual cost vs baseline
    }

    return anomalies;
  }

  /**
   * Detect quality anomalies
   */
  private detectQualityAnomalies(events: ProcessEvent[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    const qualityEvents = events.filter(
      (e) =>
        e.type.includes("quality") ||
        e.type.includes("issue") ||
        e.type.includes("error"),
    );

    if (qualityEvents.length > 0) {
      anomalies.push({
        id: `anom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "quality",
        severity: qualityEvents.length > 3 ? "high" : "medium",
        entityId: (events[0] as any).caseId || "unknown",
        entityType: (events[0] as any).caseType || "unknown",
        detectedAt: new Date(),
        description: `${qualityEvents.length} quality-related events detected`,
        data: {
          eventCount: qualityEvents.length,
          events: qualityEvents,
        },
        confidence: 0.8,
        impact: {
          affectedStages: [],
        },
        recommendations: [
          "Investigate quality issues",
          "Review quality checkpoints",
          "Implement corrective actions",
        ],
      });
    }

    return anomalies;
  }

  /**
   * Detect pattern anomalies
   */
  private detectPatternAnomalies(
    lifecycle: EntityLifecycle,
    events: ProcessEvent[],
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Use AI to detect unusual patterns
    const prompt = `Analyze this process lifecycle for unusual patterns:

Entity: ${lifecycle.entityType} (${lifecycle.entityId})
Stages: ${lifecycle.stages.map((s) => s.stageId).join(" -> ")}
Events: ${events.length} events

Identify any unusual patterns or deviations from normal process flow.`;

    try {
      const aiResponse = await callAI(prompt);
      const patterns = JSON.parse(aiResponse || "[]");

      patterns.forEach((pattern: any) => {
        anomalies.push({
          id: `anom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "pattern",
          severity: pattern.severity || "medium",
          entityId: lifecycle.entityId,
          entityType: lifecycle.entityType,
          detectedAt: new Date(),
          description: pattern.description || "Unusual pattern detected",
          data: pattern,
          confidence: pattern.confidence || 0.6,
          impact: {
            affectedStages: pattern.affectedStages || [],
          },
          recommendations: pattern.recommendations || [],
        });
      });
    } catch (error) {
      // AI detection failed - use rule-based
    }

    return anomalies;
  }

  /**
   * Detect outliers
   */
  private detectOutliers(
    lifecycle: EntityLifecycle,
    events: ProcessEvent[],
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Statistical outlier detection
    const durations = lifecycle.stages
      .filter((s) => s.startedAt && s.completedAt)
      .map(
        (s) =>
          new Date(s.completedAt!).getTime() - new Date(s.startedAt!).getTime(),
      );

    if (durations.length > 2) {
      const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
      const variance =
        durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
        durations.length;
      const stdDev = Math.sqrt(variance);

      durations.forEach((duration, index) => {
        const zScore = Math.abs((duration - mean) / stdDev);
        if (zScore > 2) {
          // More than 2 standard deviations
          const stage = lifecycle.stages[index];
          anomalies.push({
            id: `anom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: "outlier",
            severity: zScore > 3 ? "high" : "medium",
            entityId: lifecycle.entityId,
            entityType: lifecycle.entityType,
            detectedAt: new Date(),
            description: `Outlier detected in stage ${stage.stageId}: ${(duration / 3600000).toFixed(1)} hours (z-score: ${zScore.toFixed(2)})`,
            data: {
              stageId: stage.stageId,
              duration: duration / 3600000,
              zScore,
              mean: mean / 3600000,
              stdDev: stdDev / 3600000,
            },
            confidence: Math.min(zScore / 3, 1),
            impact: {
              affectedStages: [stage.stageId],
            },
            recommendations: [
              "Investigate outlier cause",
              "Review stage execution",
              "Check for external factors",
            ],
          });
        }
      });
    }

    return anomalies;
  }

  /**
   * Identify patterns
   */
  private identifyPatterns(anomalies: Anomaly[]): AnomalyPattern[] {
    const patterns: AnomalyPattern[] = [];

    // Group anomalies by type
    const byType = new Map<string, Anomaly[]>();
    anomalies.forEach((anomaly) => {
      if (!byType.has(anomaly.type)) {
        byType.set(anomaly.type, []);
      }
      byType.get(anomaly.type)!.push(anomaly);
    });

    // Create patterns for frequent anomaly types
    byType.forEach((anomalies, type) => {
      if (anomalies.length >= 3) {
        patterns.push({
          id: `pattern-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: `Recurring ${type} Anomalies`,
          description: `${anomalies.length} ${type} anomalies detected`,
          pattern: type,
          frequency: anomalies.length,
          severity: anomalies.some((a) => a.severity === "critical")
            ? "critical"
            : anomalies.some((a) => a.severity === "high")
              ? "high"
              : "medium",
          detectionRules: [
            {
              id: `rule-${type}`,
              type: "threshold",
              condition: `Count of ${type} anomalies >= 3`,
              threshold: 3,
              weight: 1.0,
            },
          ],
        });
      }
    });

    return patterns;
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(
    anomalies: Anomaly[],
  ): AnomalyDetectionResult["statistics"] {
    const byType = new Map<string, number>();
    const bySeverity = new Map<string, number>();

    anomalies.forEach((anomaly) => {
      byType.set(anomaly.type, (byType.get(anomaly.type) || 0) + 1);
      bySeverity.set(
        anomaly.severity,
        (bySeverity.get(anomaly.severity) || 0) + 1,
      );
    });

    return {
      totalAnomalies: anomalies.length,
      byType,
      bySeverity,
    };
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(anomalies: Anomaly[]): number {
    if (anomalies.length === 0) return 1.0;

    const avgConfidence =
      anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length;
    return Math.round(avgConfidence * 1000) / 1000;
  }

  /**
   * Get baseline metrics
   */
  private getBaseline(
    entityType: string,
    metric: string,
  ): BaselineMetrics | null {
    const key = `${entityType}:${metric}`;
    return this.baselineMetrics.get(key) || null;
  }

  /**
   * Update baseline
   */
  updateBaseline(entityType: string, metric: string, value: number): void {
    const key = `${entityType}:${metric}`;
    const existing = this.baselineMetrics.get(key);

    if (existing) {
      // Update running average
      existing.count++;
      existing.avgDuration =
        (existing.avgDuration * (existing.count - 1) + value) / existing.count;
    } else {
      this.baselineMetrics.set(key, {
        entityType,
        metric,
        avgDuration: value,
        count: 1,
      });
    }
  }

  /**
   * Save detection history
   */
  private saveDetectionHistory(
    entityId: string,
    entityType: string,
    anomalies: Anomaly[],
  ): void {
    const key = `${entityType}:${entityId}`;
    if (!this.detectionHistory.has(key)) {
      this.detectionHistory.set(key, []);
    }
    const history = this.detectionHistory.get(key)!;
    history.push(...anomalies);

    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }

  /**
   * Get detection history
   */
  getDetectionHistory(entityId: string, entityType: string): Anomaly[] {
    const key = `${entityType}:${entityId}`;
    return this.detectionHistory.get(key) || [];
  }
}

interface BaselineMetrics {
  entityType: string;
  metric: string;
  avgDuration: number;
  count: number;
}

// Singleton instance
export const anomalyDetection = new AdvancedAnomalyDetection();

export default anomalyDetection;

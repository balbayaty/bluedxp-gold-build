/**
 * Anomaly Detection Service
 * Detects unusual patterns, deviations, and anomalies in vision data
 * Supports predictive alerts and continuous learning
 */

import { VisionAnalysisResult } from "./visionService";
import { TrackedObject } from "./objectTrackingService";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";

// ============================================================================
// TYPES
// ============================================================================

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number; // 0-100
  description: string;
  detectedAt: string;
  location?: string;

  // Context
  context: {
    imageId?: string;
    frameNumber?: number;
    timestamp?: number;
    detectedObjects?: string[];
    relatedIssues?: string[];
  };

  // Analysis
  analysis: {
    normalPattern?: string;
    deviation?: string;
    expectedValue?: any;
    actualValue?: any;
    reason?: string;
  };

  // Recommendations
  recommendations: string[];
  requiresAction: boolean;
  actionPriority: "low" | "medium" | "high" | "urgent";
}

export type AnomalyType =
  | "unusual_object"
  | "missing_object"
  | "unexpected_behavior"
  | "safety_violation"
  | "quality_issue"
  | "compliance_deviation"
  | "environmental_change"
  | "temporal_anomaly"
  | "spatial_anomaly"
  | "pattern_deviation";

export interface AnomalyDetectionConfig {
  enableLearning: boolean;
  enablePredictiveAlerts: boolean;
  sensitivity: "low" | "medium" | "high"; // Detection sensitivity
  minConfidence: number; // Minimum confidence to report (0-100)
  learningThreshold: number; // Confidence threshold for learning (0-100)
  checkHistoricalPatterns: boolean;
  maxAnomaliesPerAnalysis: number;
}

export interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  summary: {
    totalAnomalies: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    requiresImmediateAction: boolean;
    riskScore: number; // 0-100
  };
  patterns: {
    normalPatterns: string[];
    deviations: string[];
    trends: string[];
  };
  recommendations: string[];
}

// ============================================================================
// ANOMALY DETECTION SERVICE
// ============================================================================

class AnomalyDetectionService {
  private normalPatterns: Map<string, any> = new Map();
  private anomalyHistory: Anomaly[] = [];
  private defaultConfig: AnomalyDetectionConfig = {
    enableLearning: true,
    enablePredictiveAlerts: true,
    sensitivity: "medium",
    minConfidence: 60,
    learningThreshold: 0.7,
    checkHistoricalPatterns: true,
    maxAnomaliesPerAnalysis: 20,
  };

  /**
   * Detect anomalies in vision analysis
   */
  async detectAnomalies(
    visionResult: VisionAnalysisResult,
    trackedObjects?: TrackedObject[],
    config?: Partial<AnomalyDetectionConfig>,
  ): Promise<AnomalyDetectionResult> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const anomalies: Anomaly[] = [];

    // 1. Detect unusual objects
    const unusualObjects = await this.detectUnusualObjects(
      visionResult,
      mergedConfig,
    );
    anomalies.push(...unusualObjects);

    // 2. Detect missing expected objects
    const missingObjects = await this.detectMissingObjects(
      visionResult,
      mergedConfig,
    );
    anomalies.push(...missingObjects);

    // 3. Detect safety violations
    const safetyAnomalies = this.detectSafetyAnomalies(
      visionResult,
      mergedConfig,
    );
    anomalies.push(...safetyAnomalies);

    // 4. Detect quality issues
    const qualityAnomalies = this.detectQualityAnomalies(
      visionResult,
      mergedConfig,
    );
    anomalies.push(...qualityAnomalies);

    // 5. Detect compliance deviations
    const complianceAnomalies = this.detectComplianceAnomalies(
      visionResult,
      mergedConfig,
    );
    anomalies.push(...complianceAnomalies);

    // 6. Detect temporal anomalies (if tracked objects provided)
    if (trackedObjects && trackedObjects.length > 0) {
      const temporalAnomalies = this.detectTemporalAnomalies(
        trackedObjects,
        mergedConfig,
      );
      anomalies.push(...temporalAnomalies);
    }

    // 7. Detect pattern deviations
    const patternAnomalies = await this.detectPatternDeviations(
      visionResult,
      mergedConfig,
    );
    anomalies.push(...patternAnomalies);

    // Filter by confidence and limit
    const filteredAnomalies = anomalies
      .filter((a) => a.confidence >= mergedConfig.minConfidence)
      .slice(0, mergedConfig.maxAnomaliesPerAnalysis);

    // Generate summary
    const summary = this.generateSummary(filteredAnomalies);

    // Analyze patterns
    const patterns = await this.analyzePatterns(
      visionResult,
      filteredAnomalies,
      mergedConfig,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      filteredAnomalies,
      summary,
    );

    // Store for learning if enabled
    if (mergedConfig.enableLearning && filteredAnomalies.length > 0) {
      await this.storeForLearning(
        filteredAnomalies,
        visionResult,
        mergedConfig,
      );
    }

    return {
      anomalies: filteredAnomalies,
      summary,
      patterns,
      recommendations,
    };
  }

  /**
   * Detect unusual objects not typically seen
   */
  private async detectUnusualObjects(
    visionResult: VisionAnalysisResult,
    config: AnomalyDetectionConfig,
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    const detectedObjects = visionResult.analysis.detectedObjects || [];

    // Check against normal patterns
    if (config.checkHistoricalPatterns) {
      try {
        // Search knowledge base for normal patterns
        const normalPatterns = await knowledgeBaseService.semanticSearch({
          query: "normal objects detected typical scene",
          limit: 10,
          threshold: 0.5,
        });

        // Check each detected object
        for (const obj of detectedObjects) {
          const isNormal = normalPatterns.some((pattern) => {
            const content =
              typeof pattern.entry.content === "string"
                ? pattern.entry.content.toLowerCase()
                : JSON.stringify(pattern.entry.content).toLowerCase();
            return content.includes(obj.object.toLowerCase());
          });

          if (!isNormal && obj.confidence > 70) {
            anomalies.push({
              id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              type: "unusual_object",
              severity: this.calculateSeverity(obj.confidence),
              confidence: obj.confidence,
              description: `Unusual object detected: ${obj.object}`,
              detectedAt: visionResult.timestamp,
              context: {
                imageId: visionResult.id,
                detectedObjects: [obj.object],
              },
              analysis: {
                normalPattern: "Typical scene does not include this object",
                deviation: `Object ${obj.object} is not typically seen in this context`,
                actualValue: obj.object,
              },
              recommendations: [
                `Verify if ${obj.object} should be present`,
                "Check if this is a new addition or unauthorized item",
                "Review security protocols if applicable",
              ],
              requiresAction: true,
              actionPriority: this.calculatePriority(
                "unusual_object",
                obj.confidence,
              ),
            });
          }
        }
      } catch (error) {
        console.warn("Failed to check historical patterns:", error);
      }
    }

    return anomalies;
  }

  /**
   * Detect missing expected objects
   */
  private async detectMissingObjects(
    visionResult: VisionAnalysisResult,
    config: AnomalyDetectionConfig,
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // This would typically check against expected objects based on context
    // For now, we'll check for missing safety equipment if safety context is detected
    const hasSafetyContext =
      visionResult.analysis.description?.toLowerCase().includes("safety") ||
      visionResult.analysis.safetyIssues?.length > 0;

    if (hasSafetyContext) {
      const detectedObjects =
        visionResult.analysis.detectedObjects?.map((o) =>
          o.object.toLowerCase(),
        ) || [];
      const expectedSafetyObjects = [
        "helmet",
        "hard hat",
        "safety glasses",
        "goggles",
        "gloves",
        "vest",
        "ppe",
      ];

      for (const expected of expectedSafetyObjects) {
        if (!detectedObjects.some((detected) => detected.includes(expected))) {
          anomalies.push({
            id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            type: "missing_object",
            severity: "high",
            confidence: 75,
            description: `Expected safety equipment not detected: ${expected}`,
            detectedAt: visionResult.timestamp,
            context: {
              imageId: visionResult.id,
            },
            analysis: {
              normalPattern: `Safety equipment ${expected} should be present`,
              deviation: `Missing expected safety equipment: ${expected}`,
              expectedValue: expected,
            },
            recommendations: [
              `Ensure ${expected} is worn/used`,
              "Review safety protocols",
              "Conduct safety training if needed",
            ],
            requiresAction: true,
            actionPriority: "high",
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect safety anomalies
   */
  private detectSafetyAnomalies(
    visionResult: VisionAnalysisResult,
    config: AnomalyDetectionConfig,
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const safetyIssues = visionResult.analysis.safetyIssues || [];

    for (const issue of safetyIssues) {
      if (issue.severity === "critical" || issue.severity === "high") {
        anomalies.push({
          id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "safety_violation",
          severity: issue.severity === "critical" ? "critical" : "high",
          confidence: issue.confidence,
          description: `Safety violation detected: ${issue.issue}`,
          detectedAt: visionResult.timestamp,
          context: {
            imageId: visionResult.id,
            relatedIssues: [issue.issue],
          },
          analysis: {
            normalPattern: "Safe working conditions",
            deviation: issue.issue,
            actualValue: issue.issue,
            reason: issue.location || "Location not specified",
          },
          recommendations: [
            "Address safety issue immediately",
            "Review safety protocols",
            "Conduct safety inspection",
          ],
          requiresAction: true,
          actionPriority: issue.severity === "critical" ? "urgent" : "high",
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect quality anomalies
   */
  private detectQualityAnomalies(
    visionResult: VisionAnalysisResult,
    config: AnomalyDetectionConfig,
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const qualityIssues = visionResult.analysis.qualityIssues || [];

    for (const issue of qualityIssues) {
      if (issue.severity === "critical" || issue.severity === "major") {
        anomalies.push({
          id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "quality_issue",
          severity: issue.severity === "critical" ? "critical" : "high",
          confidence: issue.confidence,
          description: `Quality issue detected: ${issue.issue} (${issue.type})`,
          detectedAt: visionResult.timestamp,
          context: {
            imageId: visionResult.id,
            relatedIssues: [issue.issue],
          },
          analysis: {
            normalPattern: "Expected quality standards",
            deviation: `${issue.type}: ${issue.issue}`,
            actualValue: issue.issue,
          },
          recommendations: [
            `Address ${issue.type} issue`,
            "Review quality control procedures",
            "Document for quality improvement",
          ],
          requiresAction: true,
          actionPriority: issue.severity === "critical" ? "urgent" : "high",
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect compliance anomalies
   */
  private detectComplianceAnomalies(
    visionResult: VisionAnalysisResult,
    config: AnomalyDetectionConfig,
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const complianceIssues = visionResult.analysis.complianceIssues || [];

    for (const issue of complianceIssues) {
      anomalies.push({
        id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "compliance_deviation",
        severity: "high",
        confidence: issue.confidence,
        description: `Compliance deviation: ${issue.violation} (${issue.standard})`,
        detectedAt: visionResult.timestamp,
        context: {
          imageId: visionResult.id,
          relatedIssues: [issue.violation],
        },
        analysis: {
          normalPattern: `Compliance with ${issue.standard}`,
          deviation: issue.violation,
          actualValue: issue.violation,
        },
        recommendations: [
          issue.recommendation,
          `Review ${issue.standard} compliance requirements`,
          "Update procedures if needed",
        ],
        requiresAction: true,
        actionPriority: "high",
      });
    }

    return anomalies;
  }

  /**
   * Detect temporal anomalies in tracked objects
   */
  private detectTemporalAnomalies(
    trackedObjects: TrackedObject[],
    config: AnomalyDetectionConfig,
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];

    for (const track of trackedObjects) {
      if (track.behavior?.anomalyScore && track.behavior.anomalyScore >= 70) {
        anomalies.push({
          id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "temporal_anomaly",
          severity: track.behavior.anomalyScore >= 90 ? "high" : "medium",
          confidence: track.behavior.anomalyScore,
          description: `Temporal anomaly detected in ${track.name}: ${track.behavior.movementPattern} movement`,
          detectedAt: new Date(track.lastSeen).toISOString(),
          context: {
            frameNumber: track.lastSeen,
            timestamp: track.lastSeen,
            detectedObjects: [track.name],
          },
          analysis: {
            normalPattern: "Expected movement pattern",
            deviation: `${track.behavior.movementPattern} movement pattern`,
            actualValue: {
              speed: track.velocity?.speed,
              pattern: track.behavior.movementPattern,
            },
          },
          recommendations: [
            "Review object behavior",
            "Check if movement is expected",
            "Investigate if this is a security concern",
          ],
          requiresAction: track.behavior.anomalyScore >= 80,
          actionPriority: track.behavior.anomalyScore >= 90 ? "high" : "medium",
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect pattern deviations
   */
  private async detectPatternDeviations(
    visionResult: VisionAnalysisResult,
    config: AnomalyDetectionConfig,
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // This would compare against learned patterns
    // For now, we'll check for unusual combinations of objects
    const detectedObjects = visionResult.analysis.detectedObjects || [];

    if (detectedObjects.length === 0 && visionResult.analysis.description) {
      // Empty scene when objects are expected
      anomalies.push({
        id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "pattern_deviation",
        severity: "medium",
        confidence: 65,
        description: "Unexpected empty scene - no objects detected",
        detectedAt: visionResult.timestamp,
        context: {
          imageId: visionResult.id,
        },
        analysis: {
          normalPattern: "Expected objects in scene",
          deviation: "No objects detected",
        },
        recommendations: [
          "Verify scene is correct",
          "Check if objects should be present",
          "Review if this is expected",
        ],
        requiresAction: false,
        actionPriority: "low",
      });
    }

    return anomalies;
  }

  /**
   * Analyze patterns
   */
  private async analyzePatterns(
    visionResult: VisionAnalysisResult,
    anomalies: Anomaly[],
    config: AnomalyDetectionConfig,
  ): Promise<AnomalyDetectionResult["patterns"]> {
    const normalPatterns: string[] = [];
    const deviations: string[] = [];
    const trends: string[] = [];

    // Extract normal patterns from description
    if (visionResult.analysis.description) {
      normalPatterns.push("Scene analysis completed");
    }

    // Extract deviations from anomalies
    for (const anomaly of anomalies) {
      if (anomaly.analysis.deviation) {
        deviations.push(anomaly.analysis.deviation);
      }
    }

    // Analyze trends (would use historical data)
    if (anomalies.length > 0) {
      trends.push(`Detected ${anomalies.length} anomaly(ies) in this analysis`);
    }

    return {
      normalPatterns,
      deviations,
      trends,
    };
  }

  /**
   * Generate summary
   */
  private generateSummary(
    anomalies: Anomaly[],
  ): AnomalyDetectionResult["summary"] {
    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byType: Record<string, number> = {};

    for (const anomaly of anomalies) {
      bySeverity[anomaly.severity] = (bySeverity[anomaly.severity] || 0) + 1;
      byType[anomaly.type] = (byType[anomaly.type] || 0) + 1;
    }

    const requiresImmediateAction = anomalies.some(
      (a) => a.actionPriority === "urgent" || a.severity === "critical",
    );

    // Calculate risk score
    const riskScore = Math.min(
      100,
      anomalies.reduce((score, a) => {
        const severityWeight =
          a.severity === "critical"
            ? 30
            : a.severity === "high"
              ? 20
              : a.severity === "medium"
                ? 10
                : 5;
        return score + severityWeight;
      }, 0),
    );

    return {
      totalAnomalies: anomalies.length,
      bySeverity,
      byType,
      requiresImmediateAction,
      riskScore,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    anomalies: Anomaly[],
    summary: AnomalyDetectionResult["summary"],
  ): string[] {
    const recommendations: string[] = [];

    if (summary.requiresImmediateAction) {
      recommendations.push(
        "URGENT: Immediate action required for critical anomalies",
      );
    }

    if (summary.bySeverity.critical > 0) {
      recommendations.push(
        `Address ${summary.bySeverity.critical} critical anomaly(ies) immediately`,
      );
    }

    if (summary.bySeverity.high > 0) {
      recommendations.push(
        `Review ${summary.bySeverity.high} high-severity anomaly(ies) within 24 hours`,
      );
    }

    if (summary.riskScore > 70) {
      recommendations.push(
        "High risk score detected - comprehensive review recommended",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue monitoring for anomalies");
    }

    return recommendations;
  }

  /**
   * Store anomalies for learning
   */
  private async storeForLearning(
    anomalies: Anomaly[],
    visionResult: VisionAnalysisResult,
    config: AnomalyDetectionConfig,
  ): Promise<void> {
    try {
      for (const anomaly of anomalies) {
        if (anomaly.confidence >= config.learningThreshold * 100) {
          await knowledgeBaseService.learn({
            type: "anomaly_detection",
            category: "ai_vision",
            content: `Anomaly: ${anomaly.description}\nType: ${anomaly.type}\nSeverity: ${anomaly.severity}`,
            metadata: {
              anomalyId: anomaly.id,
              anomalyType: anomaly.type,
              severity: anomaly.severity,
              confidence: anomaly.confidence,
              imageId: visionResult.id,
              timestamp: anomaly.detectedAt,
            },
            tags: ["anomaly", "vision", anomaly.type, anomaly.severity],
          });
        }
      }
    } catch (error) {
      console.error("Failed to store anomalies for learning:", error);
    }
  }

  /**
   * Calculate severity from confidence
   */
  private calculateSeverity(confidence: number): Anomaly["severity"] {
    if (confidence >= 90) return "critical";
    if (confidence >= 75) return "high";
    if (confidence >= 60) return "medium";
    return "low";
  }

  /**
   * Calculate priority from type and confidence
   */
  private calculatePriority(
    type: AnomalyType,
    confidence: number,
  ): Anomaly["actionPriority"] {
    if (type === "safety_violation" && confidence >= 80) return "urgent";
    if (type === "quality_issue" && confidence >= 90) return "urgent";
    if (confidence >= 85) return "high";
    if (confidence >= 70) return "medium";
    return "low";
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const anomalyDetectionService = new AnomalyDetectionService();
export default anomalyDetectionService;

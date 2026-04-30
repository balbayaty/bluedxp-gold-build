/**
 * Truth Engine Predictive Analytics Service
 * Integrates with existing QHSE predictive analytics service
 * No duplication - reuses existing AI/ML infrastructure
 */

import { predictiveAnalyticsService } from "@/lib/services/qhse/ai/predictiveAnalyticsService";
import { truthEngineService } from "../truthEngineService";
import { TruthEvent, TruthKPI } from "@/types/truth-engine";

export interface TruthPrediction {
  id: string;
  predictionType:
    | "TRUTH_SCORE"
    | "EVIDENCE_GAP"
    | "CONFIDENCE_DEGRADATION"
    | "COMPLIANCE_RISK";
  entityType: string;
  entityId: string;
  predictedValue: number;
  confidence: number;
  timeframe: {
    start: Date;
    end: Date;
  };
  factors: Array<{
    factor: string;
    contribution: number;
    impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  }>;
  recommendations: string[];
  metadata: Record<string, any>;
}

export interface TruthAnomaly {
  id: string;
  anomalyType:
    | "CONFIDENCE_DROP"
    | "EVIDENCE_GAP"
    | "TIMELINE_GAP"
    | "KPI_ANOMALY";
  entityType: string;
  entityId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  detectedAt: Date;
  description: string;
  metrics: {
    value: number;
    expected: number;
    deviation: number;
  };
  context: Record<string, any>;
  recommendations: string[];
}

export class TruthPredictiveAnalyticsService {
  /**
   * Predict future truth score for an entity
   */
  async predictTruthScore(
    entityType: string,
    entityId: string,
    timeframe: { start: Date; end: Date },
  ): Promise<TruthPrediction> {
    // Get historical truth events
    const timeline = await truthEngineService.getTruthTimeline(
      entityType,
      entityId,
      {
        dateFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Last 90 days
      },
    );

    // Calculate historical truth scores
    const historicalScores = this.calculateHistoricalScores(timeline.events);

    // Use existing predictive analytics service
    const prediction = await predictiveAnalyticsService.predictRisk({
      entityType,
      entityId,
      riskType: "COMPLIANCE",
      historicalData: historicalScores,
      timeframe,
    });

    return {
      id: `pred-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      predictionType: "TRUTH_SCORE",
      entityType,
      entityId,
      predictedValue: prediction.output.probability,
      confidence: prediction.output.confidence,
      timeframe,
      factors: prediction.output.factors.map((f) => ({
        factor: f.factor,
        contribution: f.contribution,
        impact: f.impact as "POSITIVE" | "NEGATIVE" | "NEUTRAL",
      })),
      recommendations: prediction.output.recommendations,
      metadata: {
        modelId: prediction.modelId,
        modelVersion: prediction.metadata.modelVersion,
      },
    };
  }

  /**
   * Predict evidence gaps
   */
  async predictEvidenceGaps(
    entityType: string,
    entityId: string,
  ): Promise<TruthPrediction> {
    const timeline = await truthEngineService.getTruthTimeline(
      entityType,
      entityId,
    );
    const gaps = await truthEngineService.detectTimelineGaps(
      entityType,
      entityId,
    );

    // Analyze gap patterns
    const gapPattern = this.analyzeGapPattern(gaps);

    // Predict future gaps
    const prediction = await predictiveAnalyticsService.predictRisk({
      entityType,
      entityId,
      riskType: "OPERATIONAL",
      historicalData: gapPattern,
      timeframe: {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
      },
    });

    return {
      id: `pred-gap-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      predictionType: "EVIDENCE_GAP",
      entityType,
      entityId,
      predictedValue: prediction.output.probability,
      confidence: prediction.output.confidence,
      timeframe: {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      factors: prediction.output.factors.map((f) => ({
        factor: f.factor,
        contribution: f.contribution,
        impact: f.impact as "POSITIVE" | "NEGATIVE" | "NEUTRAL",
      })),
      recommendations: prediction.output.recommendations,
      metadata: {
        currentGaps: gaps.length,
        gapPattern,
      },
    };
  }

  /**
   * Detect anomalies in truth events
   */
  async detectAnomalies(
    entityType: string,
    entityId: string,
  ): Promise<TruthAnomaly[]> {
    const timeline = await truthEngineService.getTruthTimeline(
      entityType,
      entityId,
    );

    // Use existing anomaly detection
    const anomalies = await predictiveAnalyticsService.detectAnomalies({
      entityType,
      entityId,
      data: timeline.events.map((e) => ({
        timestamp: new Date(e.happenedAt),
        value: e.confidenceScore,
        metadata: e.metadata,
      })),
    });

    return anomalies.map((a) => ({
      id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      anomalyType: this.mapAnomalyType(a.anomalyType),
      entityType,
      entityId,
      severity: a.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      detectedAt: a.detectedAt,
      description: a.description,
      metrics: {
        value: a.metrics.value,
        expected: a.metrics.expected,
        deviation: a.metrics.deviation,
      },
      context: a.context,
      recommendations: a.recommendations,
    }));
  }

  /**
   * Predict confidence degradation
   */
  async predictConfidenceDegradation(
    entityType: string,
    entityId: string,
  ): Promise<TruthPrediction> {
    const timeline = await truthEngineService.getTruthTimeline(
      entityType,
      entityId,
    );

    // Calculate confidence trends
    const confidenceTrend = this.calculateConfidenceTrend(timeline.events);

    // Predict degradation
    const prediction = await predictiveAnalyticsService.predictFailure({
      equipmentId: entityId,
      equipmentName: `${entityType}-${entityId}`,
      historicalData: confidenceTrend,
    });

    return {
      id: `pred-conf-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      predictionType: "CONFIDENCE_DEGRADATION",
      entityType,
      entityId,
      predictedValue: prediction.probability,
      confidence: prediction.confidence,
      timeframe: {
        start: new Date(),
        end: prediction.predictedFailureDate,
      },
      factors: prediction.indicators.map((i) => ({
        factor: i.indicator,
        contribution:
          i.severity === "CRITICAL" ? 0.5 : i.severity === "HIGH" ? 0.3 : 0.2,
        impact: "NEGATIVE" as const,
      })),
      recommendations: prediction.recommendations,
      metadata: {
        predictedDate: prediction.predictedFailureDate,
        remainingLife: prediction.remainingLife,
      },
    };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private calculateHistoricalScores(
    events: TruthEvent[],
  ): Array<{ timestamp: Date; value: number }> {
    // Group events by day and calculate average confidence
    const dailyScores = new Map<string, number[]>();

    events.forEach((event) => {
      const date = new Date(event.happenedAt).toISOString().split("T")[0];
      if (!dailyScores.has(date)) {
        dailyScores.set(date, []);
      }
      dailyScores.get(date)!.push(event.confidenceScore);
    });

    return Array.from(dailyScores.entries()).map(([date, scores]) => ({
      timestamp: new Date(date),
      value: scores.reduce((a, b) => a + b, 0) / scores.length,
    }));
  }

  private analyzeGapPattern(
    gaps: any[],
  ): Array<{ timestamp: Date; value: number }> {
    // Analyze gap frequency over time
    const gapFrequency = new Map<string, number>();

    gaps.forEach((gap) => {
      const date = new Date(gap.startTime).toISOString().split("T")[0];
      gapFrequency.set(date, (gapFrequency.get(date) || 0) + 1);
    });

    return Array.from(gapFrequency.entries()).map(([date, count]) => ({
      timestamp: new Date(date),
      value: count,
    }));
  }

  private calculateConfidenceTrend(
    events: TruthEvent[],
  ): Array<{ timestamp: Date; value: number }> {
    return events
      .sort(
        (a, b) =>
          new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime(),
      )
      .map((event) => ({
        timestamp: new Date(event.happenedAt),
        value: event.confidenceScore,
      }));
  }

  private mapAnomalyType(type: string): TruthAnomaly["anomalyType"] {
    const mapping: Record<string, TruthAnomaly["anomalyType"]> = {
      STATISTICAL: "KPI_ANOMALY",
      TEMPORAL: "TIMELINE_GAP",
      PATTERN: "EVIDENCE_GAP",
      BEHAVIORAL: "CONFIDENCE_DROP",
    };
    return mapping[type] || "KPI_ANOMALY";
  }
}

export const truthPredictiveAnalyticsService =
  new TruthPredictiveAnalyticsService();

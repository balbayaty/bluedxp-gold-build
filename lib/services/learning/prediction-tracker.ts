/**
 * Prediction Tracker Service
 *
 * Tracks predictions vs outcomes
 * Calculates accuracy
 * Generates learning signals
 *
 * @module learning
 */

import { signalCaptureService } from "./signal-capture";
import { eventStore } from "@/lib/services/event-store";
import type {
  LearningSignal,
  PredictionType,
  LearningSignalMetadata,
} from "./signals";

// ============================================================================
// PREDICTION TRACKER SERVICE
// ============================================================================

export class PredictionTrackerService {
  private predictions: Map<
    string,
    {
      prediction: LearningSignal["prediction"];
      metadata?: LearningSignalMetadata;
      timestamp: Date;
    }
  > = new Map();

  /**
   * Register prediction
   */
  async registerPrediction(
    predictionId: string,
    prediction: LearningSignal["prediction"],
    metadata?: LearningSignalMetadata,
  ): Promise<void> {
    this.predictions.set(predictionId, {
      prediction,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Record outcome and generate learning signal
   */
  async recordOutcome(
    predictionId: string,
    outcome: {
      value: any;
      observedAt: Date;
      source: string;
      metadata?: Record<string, any>;
    },
  ): Promise<LearningSignal> {
    const predictionRecord = this.predictions.get(predictionId);
    if (!predictionRecord) {
      throw new Error(`Prediction ${predictionId} not found`);
    }

    // Generate learning signal
    const signal = await signalCaptureService.captureSignal(
      predictionRecord.prediction,
      outcome,
      predictionRecord.metadata?.sourceEntityId?.split("-")[0] || "default",
      predictionRecord.metadata,
    );

    // Remove prediction (already matched with outcome)
    this.predictions.delete(predictionId);

    return signal;
  }

  /**
   * Track prediction accuracy over time
   */
  async trackAccuracy(
    predictionType: PredictionType,
    tenantId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<{
    totalPredictions: number;
    averageAccuracy: number;
    accuracyTrend: Array<{ date: Date; accuracy: number }>;
    byModel: Record<string, { count: number; avgAccuracy: number }>;
  }> {
    const filter: any = {
      predictionType,
      tenantId,
      ...(dateRange && { dateRange }),
    };

    const signals = await signalCaptureService.getSignals(filter);

    if (signals.length === 0) {
      return {
        totalPredictions: 0,
        averageAccuracy: 0,
        accuracyTrend: [],
        byModel: {},
      };
    }

    // Calculate average accuracy
    const averageAccuracy =
      signals.reduce((sum, s) => sum + s.signal.accuracy, 0) / signals.length;

    // Group by date for trend
    const byDate = new Map<string, { count: number; totalAccuracy: number }>();
    for (const signal of signals) {
      const dateKey = signal.timestamp.toISOString().split("T")[0];
      const existing = byDate.get(dateKey) || { count: 0, totalAccuracy: 0 };
      existing.count++;
      existing.totalAccuracy += signal.signal.accuracy;
      byDate.set(dateKey, existing);
    }

    const accuracyTrend = Array.from(byDate.entries())
      .map(([date, data]) => ({
        date: new Date(date),
        accuracy: data.totalAccuracy / data.count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by model
    const byModel: Record<string, { count: number; totalAccuracy: number }> =
      {};
    for (const signal of signals) {
      const model = signal.prediction.model;
      if (!byModel[model]) {
        byModel[model] = { count: 0, totalAccuracy: 0 };
      }
      byModel[model].count++;
      byModel[model].totalAccuracy += signal.signal.accuracy;
    }

    const byModelResult: Record<
      string,
      { count: number; avgAccuracy: number }
    > = {};
    for (const [model, data] of Object.entries(byModel)) {
      byModelResult[model] = {
        count: data.count,
        avgAccuracy: data.totalAccuracy / data.count,
      };
    }

    return {
      totalPredictions: signals.length,
      averageAccuracy,
      accuracyTrend,
      byModel: byModelResult,
    };
  }

  /**
   * Find predictions waiting for outcomes
   */
  async getPendingPredictions(
    tenantId?: string,
    predictionType?: PredictionType,
  ): Promise<
    Array<{
      predictionId: string;
      prediction: LearningSignal["prediction"];
      age: number; // hours
      metadata?: LearningSignalMetadata;
    }>
  > {
    const pending: Array<{
      predictionId: string;
      prediction: LearningSignal["prediction"];
      age: number;
      metadata?: LearningSignalMetadata;
    }> = [];

    for (const [id, record] of this.predictions.entries()) {
      if (
        tenantId &&
        record.metadata?.sourceEntityId?.split("-")[0] !== tenantId
      ) {
        continue;
      }

      if (predictionType && record.prediction.type !== predictionType) {
        continue;
      }

      const age = (Date.now() - record.timestamp.getTime()) / (1000 * 60 * 60);

      pending.push({
        predictionId: id,
        prediction: record.prediction,
        age,
        metadata: record.metadata,
      });
    }

    return pending.sort((a, b) => b.age - a.age); // Oldest first
  }

  /**
   * Clean up old predictions (no outcome after threshold)
   */
  async cleanupOldPredictions(maxAgeHours: number = 168): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, record] of this.predictions.entries()) {
      const age = (now - record.timestamp.getTime()) / (1000 * 60 * 60);
      if (age > maxAgeHours) {
        this.predictions.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get prediction by ID
   */
  async getPrediction(predictionId: string): Promise<{
    prediction: LearningSignal["prediction"];
    metadata?: LearningSignalMetadata;
    timestamp: Date;
  } | null> {
    const record = this.predictions.get(predictionId);
    return record || null;
  }
}

// Export singleton
export const predictionTrackerService = new PredictionTrackerService();

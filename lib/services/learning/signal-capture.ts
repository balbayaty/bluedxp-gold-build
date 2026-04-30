/**
 * Signal Capture Service
 *
 * Captures learning signals from predictions and outcomes
 * Stores signals for processing
 *
 * @module learning
 */

import { eventStore, eventBus, createEvent } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type {
  LearningSignal,
  PredictionType,
  LearningSignalMetadata,
  LearningSignalFilter,
  LearningSignalStats,
} from "./signals";

// ============================================================================
// IN-MEMORY STORE (Will be replaced with database)
// ============================================================================

class SignalStore {
  private signals: Map<string, LearningSignal> = new Map();

  get(id: string): LearningSignal | undefined {
    return this.signals.get(id);
  }

  set(id: string, signal: LearningSignal): void {
    this.signals.set(id, signal);
  }

  getAll(): LearningSignal[] {
    return Array.from(this.signals.values());
  }

  getByFilter(filter: LearningSignalFilter): LearningSignal[] {
    let results = this.getAll();

    if (filter.tenantId) {
      results = results.filter((s) => s.tenantId === filter.tenantId);
    }

    if (filter.predictionType) {
      results = results.filter(
        (s) => s.prediction.type === filter.predictionType,
      );
    }

    if (filter.dateRange) {
      results = results.filter((s) => {
        const timestamp = s.timestamp.getTime();
        return (
          timestamp >= filter.dateRange!.from.getTime() &&
          timestamp <= filter.dateRange!.to.getTime()
        );
      });
    }

    if (filter.processed !== undefined) {
      results = results.filter((s) => s.processed === filter.processed);
    }

    if (filter.applied !== undefined) {
      results = results.filter((s) => s.applied === filter.applied);
    }

    if (filter.minAccuracy !== undefined) {
      results = results.filter((s) => s.signal.accuracy >= filter.minAccuracy!);
    }

    if (filter.maxAccuracy !== undefined) {
      results = results.filter((s) => s.signal.accuracy <= filter.maxAccuracy!);
    }

    if (filter.sourceService) {
      // Would check metadata
    }

    return results;
  }
}

const store = new SignalStore();

// ============================================================================
// SIGNAL CAPTURE SERVICE
// ============================================================================

export class SignalCaptureService {
  /**
   * Capture learning signal
   */
  async captureSignal(
    prediction: {
      type: PredictionType;
      value: any;
      confidence: number;
      model: string;
      context: string[];
      metadata?: Record<string, any>;
    },
    outcome: {
      value: any;
      observedAt: Date;
      source: string;
      metadata?: Record<string, any>;
    },
    tenantId: string,
    metadata?: LearningSignalMetadata,
  ): Promise<LearningSignal> {
    // Calculate accuracy
    const accuracy = this.calculateAccuracy(prediction, outcome);

    // Calculate error metrics
    const errorMetrics = this.calculateErrorMetrics(prediction, outcome);

    // Generate knowledge updates
    const knowledgeUpdates = await this.generateKnowledgeUpdates(
      prediction,
      outcome,
      accuracy,
      errorMetrics,
    );

    // Create signal
    const signal: LearningSignal = {
      id: `signal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId,
      timestamp: new Date(),
      prediction,
      outcome,
      signal: {
        accuracy,
        errorMagnitude: errorMetrics.magnitude,
        errorDirection: errorMetrics.direction,
        errorPercentage: errorMetrics.percentage,
        knowledgeUpdates,
      },
      processed: false,
      applied: false,
    };

    // Store signal
    store.set(signal.id, signal);

    // Store in Knowledge Base for persistence
    try {
      await knowledgeBaseService.learn({
        tenantId,
        agentId: metadata?.sourceService || "signal-capture",
        type: "learning_signal",
        trigger: `Learning signal for ${prediction.type}`,
        input: {
          prediction: {
            type: prediction.type,
            value: this.serializeValue(prediction.value),
            confidence: prediction.confidence,
            model: prediction.model,
          },
          context: prediction.context,
        },
        output: {
          outcome: {
            value: this.serializeValue(outcome.value),
            source: outcome.source,
          },
          accuracy,
          errorMagnitude: errorMetrics.magnitude,
        },
        confidence: Math.abs(accuracy),
        success: accuracy > 0,
      });
    } catch (error) {
      console.warn("Error storing learning signal in knowledge base:", error);
    }

    // Publish event
    await eventBus.publish(
      createEvent(
        "LearningSignalCaptured",
        metadata?.sourceEntityId || "system",
        metadata?.sourceEntityType || "System",
        {
          signalId: signal.id,
          predictionType: prediction.type,
          accuracy,
          errorMagnitude: errorMetrics.magnitude,
        },
        1,
        {
          tenantId,
          correlationId: metadata?.correlationId || `signal-${Date.now()}`,
          userId: metadata?.userId || "signal-capture-service",
        },
      ),
    );

    return signal;
  }

  /**
   * Get signal by ID
   */
  async getSignal(signalId: string): Promise<LearningSignal | null> {
    return store.get(signalId) || null;
  }

  /**
   * Get signals by filter
   */
  async getSignals(filter: LearningSignalFilter): Promise<LearningSignal[]> {
    return store.getByFilter(filter);
  }

  /**
   * Mark signal as processed
   */
  async markProcessed(signalId: string): Promise<void> {
    const signal = store.get(signalId);
    if (signal) {
      signal.processed = true;
      signal.processedAt = new Date();
      store.set(signalId, signal);
    }
  }

  /**
   * Mark signal as applied
   */
  async markApplied(signalId: string): Promise<void> {
    const signal = store.get(signalId);
    if (signal) {
      signal.applied = true;
      signal.appliedAt = new Date();
      store.set(signalId, signal);
    }
  }

  /**
   * Get statistics
   */
  async getStats(tenantId?: string): Promise<LearningSignalStats> {
    const signals = tenantId ? store.getByFilter({ tenantId }) : store.getAll();

    const byType: Record<PredictionType, number> = {} as any;
    const bySource: Record<string, number> = {};
    let totalAccuracy = 0;
    let processedCount = 0;
    let appliedCount = 0;
    const accuracyDistribution = {
      excellent: 0,
      good: 0,
      poor: 0,
      wrong: 0,
    };

    for (const signal of signals) {
      // Count by type
      byType[signal.prediction.type] =
        (byType[signal.prediction.type] || 0) + 1;

      // Count by source
      const source = signal.outcome.source;
      bySource[source] = (bySource[source] || 0) + 1;

      // Accuracy stats
      totalAccuracy += signal.signal.accuracy;
      if (signal.processed) processedCount++;
      if (signal.applied) appliedCount++;

      // Distribution
      if (signal.signal.accuracy > 0.8) {
        accuracyDistribution.excellent++;
      } else if (signal.signal.accuracy > 0.5) {
        accuracyDistribution.good++;
      } else if (signal.signal.accuracy > 0) {
        accuracyDistribution.poor++;
      } else {
        accuracyDistribution.wrong++;
      }
    }

    return {
      totalSignals: signals.length,
      byType,
      averageAccuracy: signals.length > 0 ? totalAccuracy / signals.length : 0,
      processedCount,
      appliedCount,
      bySource,
      accuracyDistribution,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate accuracy (-1 to +1)
   */
  private calculateAccuracy(
    prediction: LearningSignal["prediction"],
    outcome: LearningSignal["outcome"],
  ): number {
    // Different calculation based on prediction type
    switch (prediction.type) {
      case "shipment_eta":
        return this.calculateETAAccuracy(prediction.value, outcome.value);

      case "quantum_state":
      case "psychology_state":
        return this.calculateStateAccuracy(prediction.value, outcome.value);

      case "intent_detection":
      case "sentiment_analysis":
        return this.calculateClassificationAccuracy(
          prediction.value,
          outcome.value,
          prediction.confidence,
        );

      case "vendor_reliability":
      case "compliance_status":
        return this.calculateScoreAccuracy(prediction.value, outcome.value);

      default:
        // Generic comparison
        if (prediction.value === outcome.value) {
          return 1.0;
        } else if (
          typeof prediction.value === "number" &&
          typeof outcome.value === "number"
        ) {
          const diff = Math.abs(prediction.value - outcome.value);
          const maxDiff = Math.max(
            Math.abs(prediction.value),
            Math.abs(outcome.value),
            1,
          );
          return 1 - diff / maxDiff;
        } else {
          return 0;
        }
    }
  }

  /**
   * Calculate ETA accuracy
   */
  private calculateETAAccuracy(predicted: Date, actual: Date): number {
    const errorHours =
      Math.abs(actual.getTime() - predicted.getTime()) / (1000 * 60 * 60);
    // Perfect if within 1 hour, degrade linearly
    return Math.max(-1, 1 - errorHours / 24);
  }

  /**
   * Calculate state accuracy
   */
  private calculateStateAccuracy(predicted: string, actual: string): number {
    return predicted === actual ? 1.0 : -0.5;
  }

  /**
   * Calculate classification accuracy
   */
  private calculateClassificationAccuracy(
    predicted: string,
    actual: string,
    confidence: number,
  ): number {
    if (predicted === actual) {
      return confidence; // Reward high confidence correct predictions
    } else {
      return -confidence; // Penalize high confidence wrong predictions
    }
  }

  /**
   * Calculate score accuracy
   */
  private calculateScoreAccuracy(predicted: number, actual: number): number {
    const diff = Math.abs(predicted - actual);
    const maxDiff = 100; // Assuming 0-100 scale
    return 1 - diff / maxDiff;
  }

  /**
   * Calculate error metrics
   */
  private calculateErrorMetrics(
    prediction: LearningSignal["prediction"],
    outcome: LearningSignal["outcome"],
  ): {
    magnitude: number;
    direction: "over" | "under" | "none";
    percentage: number;
  } {
    if (
      typeof prediction.value === "number" &&
      typeof outcome.value === "number"
    ) {
      const diff = outcome.value - prediction.value;
      const magnitude = Math.abs(diff);
      const direction = diff > 0 ? "over" : diff < 0 ? "under" : "none";
      const percentage =
        prediction.value !== 0 ? (diff / Math.abs(prediction.value)) * 100 : 0;

      return { magnitude, direction, percentage };
    }

    return { magnitude: 0, direction: "none", percentage: 0 };
  }

  /**
   * Generate knowledge updates
   */
  private async generateKnowledgeUpdates(
    prediction: LearningSignal["prediction"],
    outcome: LearningSignal["outcome"],
    accuracy: number,
    errorMetrics: {
      magnitude: number;
      direction: "over" | "under" | "none";
      percentage: number;
    },
  ): Promise<LearningSignal["signal"]["knowledgeUpdates"]> {
    const updates: LearningSignal["signal"]["knowledgeUpdates"] = {
      graphEdges: [],
      vectorWeights: [],
      ruleUpdates: [],
      modelWeights: [],
    };

    // Generate graph edge updates based on context
    if (prediction.context.length >= 2) {
      for (let i = 0; i < prediction.context.length - 1; i++) {
        updates.graphEdges!.push({
          fromNode: prediction.context[i],
          toNode: prediction.context[i + 1],
          edgeType: "performance",
          confidenceAdjustment: accuracy * 0.1, // Scale adjustment
          reason: `Learning from ${prediction.type} prediction`,
        });
      }
    }

    // Generate model weight update
    updates.modelWeights!.push({
      modelId: prediction.model,
      weightAdjustment: accuracy * 0.05, // Scale adjustment
      reason: `Model ${prediction.model} accuracy: ${(accuracy * 100).toFixed(1)}%`,
    });

    return updates;
  }

  /**
   * Serialize value for storage
   */
  private serializeValue(value: any): any {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    return value;
  }
}

// Export singleton
export const signalCaptureService = new SignalCaptureService();

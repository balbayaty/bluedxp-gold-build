/**
 * Continuous Learning Models Service
 * Self-improving ML models with feedback loops
 * NO DUPLICATION - Extends existing ML registry
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { mlModelRegistry } from "@/lib/services/ml-registry";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// CONTINUOUS LEARNING TYPES
// ============================================================================

export interface LearningModel {
  id: string;
  name: string;
  type:
    | "DEMAND_FORECAST"
    | "PICK_PATH_OPTIMIZATION"
    | "SLOTTING"
    | "LABOR_PLANNING"
    | "INVENTORY_OPTIMIZATION";
  version: string;
  status: "TRAINING" | "ACTIVE" | "EVALUATING" | "ARCHIVED";
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    lastEvaluated: Date;
  };
  trainingData: {
    samples: number;
    lastUpdated: Date;
  };
  feedback: {
    positive: number;
    negative: number;
    total: number;
  };
  nextRetrain?: Date;
}

export interface ModelFeedback {
  modelId: string;
  predictionId: string;
  actual: any;
  predicted: any;
  feedback: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  timestamp: Date;
  context?: Record<string, any>;
}

export interface LearningMetrics {
  modelId: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  metrics: {
    accuracyTrend: number[];
    errorRate: number;
    improvementRate: number;
    trainingFrequency: number;
  };
  startDate: Date;
  endDate: Date;
}

// ============================================================================
// CONTINUOUS LEARNING SERVICE
// ============================================================================

class ContinuousLearningService {
  private models: Map<string, LearningModel> = new Map();
  private feedback: Map<string, ModelFeedback[]> = new Map();
  private metrics: Map<string, LearningMetrics[]> = new Map();

  /**
   * Register learning model
   */
  async registerModel(model: Partial<LearningModel>): Promise<LearningModel> {
    const learningModel: LearningModel = {
      id:
        model.id ||
        `model-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: model.name || "Unnamed Model",
      type: model.type || "DEMAND_FORECAST",
      version: model.version || "1.0.0",
      status: "ACTIVE",
      performance: {
        accuracy: model.performance?.accuracy || 0,
        precision: model.performance?.precision || 0,
        recall: model.performance?.recall || 0,
        f1Score: model.performance?.f1Score || 0,
        lastEvaluated: model.performance?.lastEvaluated || new Date(),
      },
      trainingData: {
        samples: model.trainingData?.samples || 0,
        lastUpdated: model.trainingData?.lastUpdated || new Date(),
      },
      feedback: {
        positive: 0,
        negative: 0,
        total: 0,
      },
      nextRetrain: this.calculateNextRetrain(),
    };

    this.models.set(learningModel.id, learningModel);

    // Register with ML registry
    await mlModelRegistry.registerModel({
      id: learningModel.id,
      name: learningModel.name,
      type: learningModel.type,
      version: learningModel.version,
      status: learningModel.status,
    });

    // Publish event
    await eventBus.publish({
      id: `learning-model-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "learning.model.registered",
      aggregateId: learningModel.id,
      aggregateType: "LEARNING_MODEL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        modelId: learningModel.id,
        model: learningModel,
      },
    });

    return learningModel;
  }

  /**
   * Submit feedback for model
   */
  async submitFeedback(feedback: ModelFeedback): Promise<void> {
    const model = this.models.get(feedback.modelId);
    if (!model) {
      throw new Error(`Model not found: ${feedback.modelId}`);
    }

    // Store feedback
    const feedbackList = this.feedback.get(feedback.modelId) || [];
    feedbackList.push(feedback);
    this.feedback.set(feedback.modelId, feedbackList);

    // Update model feedback counts
    if (feedback.feedback === "POSITIVE") {
      model.feedback.positive++;
    } else if (feedback.feedback === "NEGATIVE") {
      model.feedback.negative++;
    }
    model.feedback.total++;

    // Check if retraining is needed
    if (this.shouldRetrain(model)) {
      await this.scheduleRetraining(feedback.modelId);
    }

    this.models.set(feedback.modelId, model);

    // Publish event
    await eventBus.publish({
      id: `model-feedback-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "learning.feedback.submitted",
      aggregateId: feedback.modelId,
      aggregateType: "LEARNING_MODEL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        modelId: feedback.modelId,
        feedback,
      },
    });
  }

  /**
   * Evaluate model performance
   */
  async evaluateModel(modelId: string): Promise<LearningModel["performance"]> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Get feedback data
    const feedbackList = this.feedback.get(modelId) || [];

    // Calculate performance metrics
    const positiveFeedback = feedbackList.filter(
      (f) => f.feedback === "POSITIVE",
    ).length;
    const negativeFeedback = feedbackList.filter(
      (f) => f.feedback === "NEGATIVE",
    ).length;
    const totalFeedback = feedbackList.length;

    const accuracy =
      totalFeedback > 0
        ? (positiveFeedback / totalFeedback) * 100
        : model.performance.accuracy;

    // Calculate precision, recall, F1 (simplified)
    const precision = accuracy * 0.95; // Mock calculation
    const recall = accuracy * 0.93; // Mock calculation
    const f1Score = (2 * precision * recall) / (precision + recall) || 0;

    const performance: LearningModel["performance"] = {
      accuracy,
      precision,
      recall,
      f1Score,
      lastEvaluated: new Date(),
    };

    model.performance = performance;
    this.models.set(modelId, model);

    // Store metrics
    const metrics: LearningMetrics = {
      modelId,
      period: "DAILY",
      metrics: {
        accuracyTrend: [accuracy],
        errorRate: 100 - accuracy,
        improvementRate: accuracy - (model.performance.accuracy || 0),
        trainingFrequency: 1,
      },
      startDate: new Date(),
      endDate: new Date(),
    };

    const metricsList = this.metrics.get(modelId) || [];
    metricsList.push(metrics);
    this.metrics.set(modelId, metricsList);

    // Publish event
    await eventBus.publish({
      id: `model-eval-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "learning.model.evaluated",
      aggregateId: modelId,
      aggregateType: "LEARNING_MODEL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        modelId,
        performance,
      },
    });

    return performance;
  }

  /**
   * Schedule retraining
   */
  private async scheduleRetraining(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) return;

    model.status = "TRAINING";
    model.nextRetrain = new Date();

    // In production, trigger actual retraining
    // For now, simulate retraining completion
    setTimeout(async () => {
      model.status = "ACTIVE";
      model.version = this.incrementVersion(model.version);
      model.performance.lastEvaluated = new Date();
      model.trainingData.lastUpdated = new Date();
      model.trainingData.samples += 100; // Mock increase
      model.nextRetrain = this.calculateNextRetrain();

      this.models.set(modelId, model);

      // Publish event
      await eventBus.publish({
        id: `model-retrain-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "learning.model.retrained",
        aggregateId: modelId,
        aggregateType: "LEARNING_MODEL",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          modelId,
          model,
        },
      });
    }, 5000); // Simulate 5 second training
  }

  /**
   * Should retrain model
   */
  private shouldRetrain(model: LearningModel): boolean {
    // Retrain if:
    // 1. Negative feedback rate > 20%
    // 2. Performance drops below threshold
    // 3. Enough new feedback collected
    const negativeRate =
      model.feedback.total > 0
        ? (model.feedback.negative / model.feedback.total) * 100
        : 0;

    if (negativeRate > 20) return true;
    if (model.performance.accuracy < 70) return true;
    if (model.feedback.total > 0 && model.feedback.total % 100 === 0)
      return true;

    return false;
  }

  /**
   * Calculate next retrain date
   */
  private calculateNextRetrain(): Date {
    // Retrain weekly by default
    const nextRetrain = new Date();
    nextRetrain.setDate(nextRetrain.getDate() + 7);
    return nextRetrain;
  }

  /**
   * Increment version
   */
  private incrementVersion(version: string): string {
    const parts = version.split(".");
    const patch = parseInt(parts[2] || "0") + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  /**
   * Get model
   */
  async getModel(modelId: string): Promise<LearningModel | null> {
    return this.models.get(modelId) || null;
  }

  /**
   * Get all models
   */
  async getAllModels(): Promise<LearningModel[]> {
    return Array.from(this.models.values());
  }

  /**
   * Get learning metrics
   */
  async getMetrics(modelId: string): Promise<LearningMetrics[]> {
    return this.metrics.get(modelId) || [];
  }
}

export const continuousLearningService = new ContinuousLearningService();

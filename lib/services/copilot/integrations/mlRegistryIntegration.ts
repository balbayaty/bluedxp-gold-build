/**
 * ML Registry Integration for Copilot
 * Connects copilot to ML models for predictions and recommendations
 * 4IR & 5IR Aligned • Continuous Learning • Predictive Intelligence
 */

import { mlModelRegistry, type MLModel, type PredictionResult } from "../../ml-registry";
import { copilotMLFeedback } from "../mlFeedbackService";
import { eventBus } from "../../event-store";
import { createEvent } from "../../event-store/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface CopilotPrediction {
  modelId: string;
  modelName: string;
  prediction: any;
  confidence: number;
  explanation?: string;
  features?: Record<string, any>;
  processingTime: number;
}

export interface CopilotRecommendation {
  type: "response_improvement" | "tool_suggestion" | "confidence_boost" | "intent_prediction";
  value: any;
  confidence: number;
  source: string;
}

// ============================================================================
// ML REGISTRY INTEGRATION SERVICE
// ============================================================================

class CopilotMLRegistryIntegration {
  private readonly COPILOT_MODELS = [
    "copilot_intent_classifier",
    "copilot_response_quality",
    "copilot_tool_recommender",
    "copilot_confidence_predictor",
  ];

  /**
   * Get ML-powered recommendations for a copilot query
   */
  async getRecommendations(
    tenantId: string,
    query: string,
    context: {
      moduleId?: string;
      pathname?: string;
      conversationHistory?: string[];
    }
  ): Promise<CopilotRecommendation[]> {
    const recommendations: CopilotRecommendation[] = [];

    try {
      // 1. Try intent classification model
      const intentModel = await this.getModel("copilot_intent_classifier");
      if (intentModel) {
        const intentPrediction = await this.predict(intentModel.id, tenantId, {
          query,
          context: context.moduleId || "general",
        });
        
        if (intentPrediction) {
          recommendations.push({
            type: "intent_prediction",
            value: intentPrediction.prediction,
            confidence: intentPrediction.confidence,
            source: intentModel.name,
          });
        }
      }

      // 2. Get tool suggestions from ML
      const toolModel = await this.getModel("copilot_tool_recommender");
      if (toolModel) {
        const toolPrediction = await this.predict(toolModel.id, tenantId, {
          query,
          intent: recommendations.find(r => r.type === "intent_prediction")?.value || "unknown",
          moduleContext: context.moduleId,
        });

        if (toolPrediction) {
          recommendations.push({
            type: "tool_suggestion",
            value: toolPrediction.prediction,
            confidence: toolPrediction.confidence,
            source: toolModel.name,
          });
        }
      }

      // 3. Get learning-based recommendations from feedback service
      const feedbackRecommendations = copilotMLFeedback.getRecommendations(tenantId, query);
      if (feedbackRecommendations.suggestedTools.length > 0) {
        recommendations.push({
          type: "tool_suggestion",
          value: feedbackRecommendations.suggestedTools,
          confidence: 0.7 + feedbackRecommendations.confidenceBoost,
          source: "feedback_learning",
        });
      }

      if (feedbackRecommendations.confidenceBoost !== 0) {
        recommendations.push({
          type: "confidence_boost",
          value: feedbackRecommendations.confidenceBoost,
          confidence: 0.8,
          source: "pattern_learning",
        });
      }

    } catch (error) {
      console.error("[MLRegistryIntegration] Error getting recommendations:", error);
    }

    return recommendations;
  }

  /**
   * Get a model by name
   */
  private async getModel(name: string): Promise<MLModel | null> {
    try {
      const models = await mlModelRegistry.listModels();
      return models.find(m => m.name === name && m.status === "deployed") || null;
    } catch (error) {
      console.error(`[MLRegistryIntegration] Error getting model ${name}:`, error);
      return null;
    }
  }

  /**
   * Make a prediction using a model
   */
  private async predict(
    modelId: string,
    tenantId: string,
    input: Record<string, any>
  ): Promise<CopilotPrediction | null> {
    const startTime = Date.now();

    try {
      const result = await mlModelRegistry.predict(modelId, input);
      
      const prediction: CopilotPrediction = {
        modelId,
        modelName: result.modelName,
        prediction: result.output,
        confidence: result.confidence,
        explanation: result.explanation,
        features: result.features,
        processingTime: Date.now() - startTime,
      };

      // Publish prediction event
      await eventBus.publish(
        createEvent(
          "copilot.ml_prediction",
          tenantId,
          "MLPrediction",
          {
            modelId,
            confidence: result.confidence,
            processingTime: prediction.processingTime,
          },
          1,
          { tenantId }
        )
      ).catch(err => console.warn("[MLRegistryIntegration] Failed to publish event:", err));

      return prediction;
    } catch (error) {
      console.error(`[MLRegistryIntegration] Prediction failed for model ${modelId}:`, error);
      return null;
    }
  }

  /**
   * Register copilot-specific ML models
   */
  async registerCopilotModels(): Promise<void> {
    const modelsToRegister = [
      {
        name: "copilot_intent_classifier",
        description: "Classifies user intent from copilot queries",
        type: "classification" as const,
        config: {
          algorithm: "transformer_classifier",
          hyperparameters: {
            maxTokens: 512,
            numLabels: 20,
            temperature: 0.7,
          },
          features: ["query_text", "context"],
        },
        tags: ["copilot", "nlp", "intent"],
      },
      {
        name: "copilot_response_quality",
        description: "Predicts response quality based on patterns",
        type: "regression" as const,
        config: {
          algorithm: "gradient_boosting",
          hyperparameters: {
            estimators: 100,
            maxDepth: 6,
          },
          features: ["query_intent", "tool_count", "knowledge_used", "confidence"],
        },
        tags: ["copilot", "quality", "prediction"],
      },
      {
        name: "copilot_tool_recommender",
        description: "Recommends tools based on query and context",
        type: "recommendation" as const,
        config: {
          algorithm: "collaborative_filtering",
          hyperparameters: {
            topK: 5,
            minConfidence: 0.5,
          },
          features: ["query_intent", "module_context", "user_history"],
        },
        tags: ["copilot", "recommendation", "tools"],
      },
      {
        name: "copilot_confidence_predictor",
        description: "Predicts actual helpfulness based on query complexity",
        type: "regression" as const,
        config: {
          algorithm: "neural_network",
          hyperparameters: {
            layers: [64, 32, 16],
            activation: "relu",
          },
          features: ["query_complexity", "knowledge_coverage", "historical_success"],
        },
        tags: ["copilot", "confidence", "prediction"],
      },
    ];

    for (const model of modelsToRegister) {
      try {
        // Check if model already exists
        const existing = mlModelRegistry.listModels().find(m => m.name === model.name);
        if (!existing) {
          await mlModelRegistry.registerModel({
            name: model.name,
            description: model.description,
            type: model.type,
            config: {
              algorithm: model.config.algorithm,
              hyperparameters: model.config.hyperparameters,
              features: model.config.features,
            },
            tags: model.tags,
          });
          console.log(`[MLRegistryIntegration] ✅ Registered model: ${model.name}`);
        }
      } catch (error) {
        console.warn(`[MLRegistryIntegration] Failed to register model ${model.name}:`, error);
      }
    }
  }

  /**
   * Send training data to ML models
   */
  async sendTrainingData(
    tenantId: string,
    data: {
      query: string;
      intent: string;
      toolsUsed: string[];
      confidence: number;
      isPositive: boolean;
      rating?: number;
    }
  ): Promise<void> {
    try {
      // This would typically send to a training pipeline
      // For now, we store it via the feedback service
      const trainingData = copilotMLFeedback.getTrainingData(tenantId);
      
      console.log(`[MLRegistryIntegration] 📊 Training data collected:`, {
        tenantId,
        totalSamples: trainingData.length,
        latestIntent: data.intent,
        isPositive: data.isPositive,
      });

      // Publish training data event
      await eventBus.publish(
        createEvent(
          "copilot.training_data",
          tenantId,
          "TrainingData",
          {
            intent: data.intent,
            toolsUsed: data.toolsUsed,
            isPositive: data.isPositive,
          },
          1,
          { tenantId }
        )
      ).catch(err => console.warn("[MLRegistryIntegration] Failed to publish event:", err));
    } catch (error) {
      console.error("[MLRegistryIntegration] Error sending training data:", error);
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const copilotMLRegistry = new CopilotMLRegistryIntegration();
export default copilotMLRegistry;

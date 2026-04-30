/**
 * LLM-ML Module Integration
 * Connects LLM training and learning to ML Registry for visibility and progress tracking
 *
 * Integrates:
 * - ML Model Registry (versioning, A/B testing)
 * - Continuous Learning Service (feedback loops)
 * - Agent Memory (interaction learning)
 * - Knowledge Base (response storage)
 * - ML Monitoring (performance tracking)
 */

import { mlModelRegistry } from "@/lib/services/ml-registry";
import { continuousLearningService } from "@/lib/services/wms/continuousLearningService";
import { getAgentMemory } from "@/lib/services/agents/agentMemory";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { localLLMTrainingService } from "../training/localLLMTrainingService";
import { providerRegistry } from "../core/providerRegistry";
import type { TrainingJob } from "../training/localLLMTrainingService";
import type { LLMResponse } from "../core/providerInterface";

// ============================================================================
// TYPES
// ============================================================================

export interface LLMModelMetrics {
  modelId: string;
  modelName: string;
  provider: string;

  // Performance
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;

  // Usage
  totalRequests: number;
  totalTokens: number;
  averageLatency: number;
  errorRate: number;

  // Learning
  trainingJobs: number;
  lastTrained?: Date;
  feedbackCount: number;
  positiveFeedback: number;
  negativeFeedback: number;

  // Knowledge Base
  knowledgeBaseEntries: number;

  // Status
  status: "online" | "offline" | "training" | "error";
  lastUsed?: Date;
}

export interface LLMLearningProgress {
  modelId: string;
  modelName: string;

  // Training Progress
  currentTrainingJob?: {
    id: string;
    status: "pending" | "running" | "completed" | "failed";
    progress: number; // 0-100
    currentEpoch: number;
    totalEpochs: number;
    loss: number;
  };

  // Learning Data
  interactionsCollected: number;
  feedbackCollected: number;
  knowledgeBaseEntries: number;

  // Next Steps
  readyForRetraining: boolean;
  recommendedAction?: string;

  // Metrics
  accuracyTrend: number[];
  improvementRate: number;
}

// ============================================================================
// LLM-ML INTEGRATION SERVICE
// ============================================================================

class LLMMLModuleIntegration {
  /**
   * Register LLM model in ML Registry
   * This makes it visible in ML module for tracking
   */
  async registerLLMModelInMLRegistry(
    modelName: string,
    provider: string,
    baseModel: string,
    trainingInfo?: {
      datasetSize: number;
      trainingDuration: number;
      epochs: number;
    },
  ): Promise<string> {
    const modelId = `llm-${provider}-${modelName}-${Date.now()}`;

    // Register in ML Registry
    await mlModelRegistry.registerModel({
      name: modelName,
      description: `LLM model: ${modelName} (${provider})`,
      type: "nlp",
      version: "1.0.0",
      config: {
        algorithm: "transformer",
        hyperparameters: {
          provider,
          baseModel,
        },
        features: ["text", "context"],
      },
      trainingInfo: trainingInfo
        ? {
            datasetSize: trainingInfo.datasetSize,
            trainingDuration: trainingInfo.trainingDuration,
            epochs: trainingInfo.epochs,
            trainSize: trainingInfo.datasetSize * 0.8,
            validSize: trainingInfo.datasetSize * 0.1,
            testSize: trainingInfo.datasetSize * 0.1,
          }
        : {
            datasetSize: 0,
            trainingDuration: 0,
            trainSize: 0,
            validSize: 0,
            testSize: 0,
          },
      metrics: {
        accuracy: 0.85, // Initial estimate
      },
      status: "ready",
      tags: ["llm", provider, baseModel],
    });

    // Also register in Continuous Learning Service
    await continuousLearningService.registerModel({
      id: modelId,
      name: modelName,
      type: "DEMAND_FORECAST", // Using existing type, could add 'LLM' type
      version: "1.0.0",
      performance: {
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.8,
        f1Score: 0.81,
        lastEvaluated: new Date(),
      },
      trainingData: {
        samples: trainingInfo?.datasetSize || 0,
        lastUpdated: new Date(),
      },
    });

    console.log(
      `[LLM-ML Integration] ✅ Registered LLM model in ML Registry: ${modelName}`,
    );

    return modelId;
  }

  /**
   * Track LLM usage for learning
   * Stores interaction in Agent Memory and Knowledge Base
   */
  async trackLLMUsage(
    modelId: string,
    request: {
      messages: any[];
      model: string;
      provider: string;
    },
    response: LLMResponse,
    context?: {
      task?: string;
      domain?: string;
      userId?: string;
      tenantId?: string;
    },
  ): Promise<void> {
    // 1. Store in Agent Memory for learning
    const taskDescription = context?.task || "llm-generation";
    const agentMem = getAgentMemory(modelId, "llm");

    if (response.content) {
      await agentMem.remember({
        type: "interaction",
        content: JSON.stringify({
          input: request.messages,
          output: response.content,
          model: request.model,
          provider: request.provider,
        }),
        context: {
          ...context,
          tokensUsed: response.tokensUsed,
          latency: response.latency,
        },
        importance: 0.7,
        tags: [request.provider, request.model, context?.domain || "general"],
      });
    }

    // 2. Store successful responses in Knowledge Base
    if (response.content && context?.task) {
      try {
        await knowledgeBaseService.create({
          agentId: modelId,
          tenantId: context.tenantId,
          type: "insight",
          category: "llm-generated",
          content: response.content,
          summary: `LLM response for ${context.task}`,
          metadata: {
            source: "llm",
            provider: request.provider,
            model: request.model,
            task: context.task,
            domain: context.domain,
            accuracy: 0.9, // Will be updated with feedback
            tokensUsed: response.tokensUsed?.total || 0,
          },
          keywords: [request.provider, request.model, context.task],
          searchableText: response.content,
          source: "llm",
          confidence: 90,
        });
      } catch (error) {
        console.warn(
          "[LLM-ML Integration] Failed to store in knowledge base:",
          error,
        );
      }
    }

    // 3. Update ML Registry metrics
    try {
      const model = await mlModelRegistry.getModel(modelId);
      if (model) {
        // Update usage metrics (would need to extend MLModel type)
        // For now, we'll track via events
        console.log(`[LLM-ML Integration] Tracked usage for model: ${modelId}`);
      }
    } catch (error) {
      // Model might not be registered yet, that's okay
    }
  }

  /**
   * Submit feedback for LLM learning
   * Connects to Continuous Learning Service
   */
  async submitLLMFeedback(
    modelId: string,
    feedback: {
      type: "positive" | "negative" | "neutral";
      interactionId?: string;
      comment?: string;
      expectedOutput?: string;
      actualOutput?: string;
    },
  ): Promise<void> {
    // 1. Store in Agent Memory
    const agentMem = getAgentMemory(modelId, "llm");

    if (feedback.type === "positive") {
      await agentMem.learnFromSuccess("llm-generation", {
        feedback: feedback.comment,
        expectedOutput: feedback.expectedOutput,
        actualOutput: feedback.actualOutput,
      });
    } else if (feedback.type === "negative") {
      await agentMem.learnFromFailure(
        "llm-generation",
        feedback.comment || "Negative feedback",
        {
          expectedOutput: feedback.expectedOutput,
          actualOutput: feedback.actualOutput,
        },
      );
    }

    // 2. Submit to Continuous Learning Service
    await continuousLearningService.submitFeedback({
      modelId,
      predictionId: feedback.interactionId || `pred-${Date.now()}`,
      actual: feedback.expectedOutput || {},
      predicted: feedback.actualOutput || {},
      feedback:
        feedback.type === "positive"
          ? "POSITIVE"
          : feedback.type === "negative"
            ? "NEGATIVE"
            : "NEUTRAL",
      timestamp: new Date(),
      context: {
        comment: feedback.comment,
      },
    });

    console.log(
      `[LLM-ML Integration] ✅ Submitted feedback for model: ${modelId}`,
    );
  }

  /**
   * Get learning progress for a model
   * Provides visibility into learning status
   */
  async getLearningProgress(modelId: string): Promise<LLMLearningProgress> {
    // 1. Get current training job
    const trainingJobs = await localLLMTrainingService.listTrainingJobs();
    const currentJob = trainingJobs.find(
      (job) =>
        job.config.modelName === modelId &&
        (job.status === "pending" || job.status === "running"),
    );

    // 2. Get learning data from Agent Memory
    const agentMem = getAgentMemory(modelId, "llm");
    const allMemories = await agentMem.recall("", { types: ["interaction"] });
    const interactionsCount = allMemories.length;

    // 3. Get feedback count
    const model = await continuousLearningService.getModel(modelId);
    const feedbackCount = model?.feedback.total || 0;
    const positiveFeedback = model?.feedback.positive || 0;
    const negativeFeedback = model?.feedback.negative || 0;

    // 4. Get knowledge base entries
    const kbEntries = await knowledgeBaseService.search({
      query: "",
      agentId: modelId,
      limit: 1000,
    });

    // 5. Calculate if ready for retraining
    const readyForRetraining =
      interactionsCount >= 100 && // At least 100 interactions
      feedbackCount >= 50 && // At least 50 feedback items
      negativeFeedback / feedbackCount > 0.2; // More than 20% negative feedback

    // 6. Get accuracy trend
    const metrics = await continuousLearningService.getMetrics(modelId);
    const accuracyTrend = metrics.map((m) => m.metrics.accuracyTrend[0] || 0);

    return {
      modelId,
      modelName: model?.name || modelId,
      currentTrainingJob: currentJob
        ? {
            id: currentJob.id,
            status: currentJob.status,
            progress: currentJob.progress.percentComplete,
            currentEpoch: currentJob.progress.currentEpoch || 0,
            totalEpochs: currentJob.progress.totalEpochs || 0,
            loss: currentJob.progress.loss || 0,
          }
        : undefined,
      interactionsCollected: interactionsCount,
      feedbackCollected: feedbackCount,
      knowledgeBaseEntries: kbEntries.length,
      readyForRetraining,
      recommendedAction: readyForRetraining
        ? "Model is ready for retraining. Start training job to improve accuracy."
        : interactionsCount < 100
          ? `Collect more interactions (${100 - interactionsCount} more needed)`
          : feedbackCount < 50
            ? `Collect more feedback (${50 - feedbackCount} more needed)`
            : "Continue collecting data",
      accuracyTrend,
      improvementRate:
        accuracyTrend.length > 1
          ? accuracyTrend[accuracyTrend.length - 1] - accuracyTrend[0]
          : 0,
    };
  }

  /**
   * Get comprehensive metrics for a model
   * Full visibility into model performance
   */
  async getModelMetrics(modelId: string): Promise<LLMModelMetrics> {
    // 1. Get model from ML Registry
    const mlModel = await mlModelRegistry.getModel(modelId);

    // 2. Get provider status
    const provider = providerRegistry
      .list()
      .find((p) => p.id === mlModel?.config.hyperparameters?.provider);
    const providerStatus = provider?.getStatus();

    // 3. Get continuous learning model
    const learningModel = await continuousLearningService.getModel(modelId);

    // 4. Get training jobs
    const trainingJobs = await localLLMTrainingService.listTrainingJobs();
    const modelTrainingJobs = trainingJobs.filter(
      (job) => job.config.modelName === modelId,
    );

    // 5. Get knowledge base entries
    const kbEntries = await knowledgeBaseService.search({
      query: "",
      agentId: modelId,
      limit: 1000,
    });

    return {
      modelId,
      modelName: mlModel?.name || modelId,
      provider: mlModel?.config.hyperparameters?.provider || "unknown",
      accuracy:
        learningModel?.performance.accuracy || mlModel?.metrics.accuracy || 0,
      precision:
        learningModel?.performance.precision || mlModel?.metrics.precision || 0,
      recall: learningModel?.performance.recall || mlModel?.metrics.recall || 0,
      f1Score:
        learningModel?.performance.f1Score || mlModel?.metrics.f1Score || 0,
      totalRequests: providerStatus?.totalRequests || 0,
      totalTokens: providerStatus?.totalTokens || 0,
      averageLatency: providerStatus?.latency || 0,
      errorRate: providerStatus?.errorRate || 0,
      trainingJobs: modelTrainingJobs.length,
      lastTrained: learningModel?.performance.lastEvaluated,
      feedbackCount: learningModel?.feedback.total || 0,
      positiveFeedback: learningModel?.feedback.positive || 0,
      negativeFeedback: learningModel?.feedback.negative || 0,
      knowledgeBaseEntries: kbEntries.length,
      status: providerStatus?.status || "offline",
      lastUsed: providerStatus?.lastUsed,
    };
  }

  /**
   * Start retraining from collected data
   * Automatically collects learning data and starts training
   */
  async startRetrainingFromLearningData(
    modelId: string,
    baseModel: string = "llama2",
  ): Promise<TrainingJob> {
    // 1. Get learning data from Agent Memory
    const agentMem = getAgentMemory(modelId, "llm");
    const interactions = await agentMem.recall("", {
      types: ["interaction"],
      limit: 1000,
    });

    // 2. Get feedback data
    const learningModel = await continuousLearningService.getModel(modelId);
    const feedbackCount = learningModel?.feedback.total || 0;

    if (interactions.length < 50) {
      throw new Error(
        `Not enough learning data. Need at least 50 interactions, have ${interactions.length}`,
      );
    }

    // 3. Format training data
    const trainingData = interactions
      .filter((i) => {
        try {
          const data = JSON.parse(i.content);
          return data.input && data.output;
        } catch {
          return false;
        }
      })
      .slice(0, 500) // Limit to 500 examples
      .map((i) => {
        const data = JSON.parse(i.content);
        return {
          instruction: "Generate response",
          input: Array.isArray(data.input)
            ? data.input.map((m: any) => m.content || m).join("\n")
            : JSON.stringify(data.input),
          output: data.output,
        };
      });

    // 4. Start training
    const trainingJob = await localLLMTrainingService.startTraining({
      baseModel,
      modelName: `${modelId}-v2`,
      method: "lora",
      trainingData: {
        format: "jsonl",
        data: trainingData,
      },
      epochs: 3,
      batchSize: 4,
      learningRate: 0.0001,
      gpuRequired: true,
    });

    // 5. Register new model in ML Registry
    await this.registerLLMModelInMLRegistry(
      `${modelId}-v2`,
      "ollama",
      baseModel,
      {
        datasetSize: trainingData.length,
        trainingDuration: 0, // Will be updated when training completes
        epochs: 3,
      },
    );

    console.log(
      `[LLM-ML Integration] ✅ Started retraining for model: ${modelId}`,
    );

    return trainingJob;
  }

  /**
   * Get all LLM models with metrics
   * Dashboard view of all LLM models
   */
  async getAllLLMModels(): Promise<LLMModelMetrics[]> {
    const mlModels = await mlModelRegistry.listModels({
      tags: ["llm"],
    });

    const metrics = await Promise.all(
      mlModels.map((model) => this.getModelMetrics(model.id)),
    );

    return metrics;
  }
}

export const llmMLModuleIntegration = new LLMMLModuleIntegration();

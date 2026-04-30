/**
 * Auto-Register Trained Models
 * Automatically registers trained LLM models in ML Registry
 * Runs after training completes
 */

import { llmMLModuleIntegration } from "./mlModuleIntegration";
import { localLLMTrainingService } from "../training/localLLMTrainingService";
import { eventBus } from "@/lib/services/event-bus";

/**
 * Listen for training completion events and auto-register models
 */
export async function initializeAutoRegistration(): Promise<void> {
  // Listen for training completion
  eventBus.subscribe("llm.training.completed", async (event) => {
    try {
      const { jobId, modelName, finalLoss } = event.data;

      // Get training job details
      const job = localLLMTrainingService.getTrainingJob(jobId);
      if (!job || !job.result) {
        console.warn("[Auto-Register] Training job not found or incomplete");
        return;
      }

      // Register in ML Registry
      await llmMLModuleIntegration.registerLLMModelInMLRegistry(
        modelName,
        "ollama",
        job.config.baseModel,
        {
          datasetSize: job.config.trainingData.data.length,
          trainingDuration: job.result.trainingTime,
          epochs: job.config.epochs,
        },
      );

      console.log(`[Auto-Register] ✅ Registered trained model: ${modelName}`);
    } catch (error) {
      console.error("[Auto-Register] Failed to register model:", error);
    }
  });

  console.log(
    "[Auto-Register] ✅ Initialized auto-registration for trained models",
  );
}

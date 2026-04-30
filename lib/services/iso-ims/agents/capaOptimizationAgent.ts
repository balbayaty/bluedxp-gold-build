/**
 * CAPA Optimization Agent
 *
 * Autonomous agent that optimizes CAPA effectiveness:
 * - Suggests improvements
 * - Predicts CAPA success
 * - Optimizes action items
 * - Learns from past CAPAs
 */

import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";
import { capaService } from "../capaService";
import { intelligenceService } from "../intelligenceService";
import { eventBus, createEvent } from "@/lib/services/event-bus";

export class CAPAOptimizationAgent {
  private agentId = "capa-optimization-agent";

  async initialize(): Promise<void> {
    await agentOrchestrator.registerAgent({
      id: this.agentId,
      type: "capa-optimization",
      name: "CAPA Optimization Agent",
      description: "Optimizes CAPA effectiveness and predicts success",
      capabilities: [
        {
          id: "optimize-capa",
          name: "Optimize CAPA",
          description: "Suggest improvements to CAPA action items",
          categories: ["capa", "optimization"],
          confidenceThreshold: 0.8,
          priority: 8,
        },
        {
          id: "predict-capa-success",
          name: "Predict CAPA Success",
          description: "Predict likelihood of CAPA success",
          categories: ["capa", "prediction"],
          confidenceThreshold: 0.75,
          priority: 7,
        },
      ],
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Subscribe to CAPA events
    this.subscribeToEvents();
  }

  /**
   * Subscribe to CAPA events
   */
  private subscribeToEvents(): void {
    // Subscribe to CAPA creation
    eventBus.subscribe("iso-ims.capa.created", async (event) => {
      if (event.payload && event.metadata?.tenantId) {
        const { capaId } = event.payload as any;
        const { tenantId } = event.metadata;
        if (capaId && tenantId) {
          // Optimize CAPA asynchronously
          Promise.resolve().then(async () => {
            try {
              await this.optimizeCAPA(capaId, tenantId);
            } catch (error) {
              console.warn("CAPA optimization failed:", error);
            }
          });
        }
      }
    });

    console.log("✅ CAPA Optimization Agent event subscriptions registered");
  }

  async optimizeCAPA(
    capaId: string,
    tenantId: string,
  ): Promise<{
    suggestions: Array<{ action: string; reason: string; priority: string }>;
    predictedSuccess: number;
  }> {
    try {
      const capa = await capaService.getCAPA(capaId, tenantId);
      if (!capa) throw new Error("CAPA not found");

      // Use intelligence to predict success
      const prediction = await intelligenceService.predictCAPASuccess({
        capaId,
        tenantId,
        actionItems: capa.actionItems || [],
        rootCause: capa.rootCause,
      });

      // Generate optimization suggestions
      const suggestions = await this.generateOptimizationSuggestions(capa);

      return {
        suggestions,
        predictedSuccess: prediction.confidence || 0.7,
      };
    } catch (error) {
      console.error("Error optimizing CAPA:", error);
      return { suggestions: [], predictedSuccess: 0.5 };
    }
  }

  private async generateOptimizationSuggestions(
    capa: any,
  ): Promise<Array<{ action: string; reason: string; priority: string }>> {
    const suggestions: Array<{
      action: string;
      reason: string;
      priority: string;
    }> = [];

    // Check if action items are specific enough
    if (!capa.actionItems || capa.actionItems.length === 0) {
      suggestions.push({
        action: "Add specific action items",
        reason: "CAPA lacks specific action items",
        priority: "HIGH",
      });
    }

    // Check if root cause is identified
    if (!capa.rootCause || capa.rootCause.length === 0) {
      suggestions.push({
        action: "Perform root cause analysis",
        reason: "Root cause not identified",
        priority: "CRITICAL",
      });
    }

    // Check if due dates are realistic
    const overdueItems =
      capa.actionItems?.filter(
        (item: any) =>
          item.dueDate &&
          new Date(item.dueDate) < new Date() &&
          item.status !== "COMPLETED",
      ) || [];

    if (overdueItems.length > 0) {
      suggestions.push({
        action: "Update due dates for overdue items",
        reason: `${overdueItems.length} action items are overdue`,
        priority: "HIGH",
      });
    }

    return suggestions;
  }
}

export const capaOptimizationAgent = new CAPAOptimizationAgent();

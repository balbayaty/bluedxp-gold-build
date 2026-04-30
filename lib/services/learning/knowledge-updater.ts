/**
 * Knowledge Updater Service
 *
 * Updates knowledge graph, vector weights, and rules based on learning signals
 *
 * @module learning
 */

import { signalCaptureService } from "./signal-capture";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { entityGraphService } from "@/lib/services/graph";
import { eventBus, createEvent } from "@/lib/services/event-store";
import type {
  LearningSignal,
  GraphEdgeUpdate,
  VectorWeightUpdate,
  RuleUpdate,
  ModelWeightUpdate,
} from "./signals";

// ============================================================================
// KNOWLEDGE UPDATER SERVICE
// ============================================================================

export class KnowledgeUpdaterService {
  /**
   * Process learning signal and update knowledge
   */
  async processSignal(signalId: string): Promise<void> {
    const signal = await signalCaptureService.getSignal(signalId);
    if (!signal) {
      throw new Error(`Signal ${signalId} not found`);
    }

    if (signal.processed) {
      console.log(`Signal ${signalId} already processed`);
      return;
    }

    // Apply knowledge updates
    await this.applyKnowledgeUpdates(signal);

    // Mark as processed
    await signalCaptureService.markProcessed(signalId);

    // Publish event
    await eventBus.publish(
      createEvent(
        "LearningSignalProcessed",
        signalId,
        "LearningSignal",
        {
          signalId,
          predictionType: signal.prediction.type,
          accuracy: signal.signal.accuracy,
        },
        1,
        {
          tenantId: signal.tenantId,
          correlationId: `process-${Date.now()}`,
          userId: "knowledge-updater",
        },
      ),
    );
  }

  /**
   * Apply knowledge updates from signal
   */
  async applyKnowledgeUpdates(signal: LearningSignal): Promise<void> {
    // 1. Update graph edges
    if (signal.signal.knowledgeUpdates.graphEdges) {
      await this.updateGraphEdges(
        signal.signal.knowledgeUpdates.graphEdges,
        signal.tenantId,
      );
    }

    // 2. Update vector weights
    if (signal.signal.knowledgeUpdates.vectorWeights) {
      await this.updateVectorWeights(
        signal.signal.knowledgeUpdates.vectorWeights,
        signal.tenantId,
      );
    }

    // 3. Update rules
    if (signal.signal.knowledgeUpdates.ruleUpdates) {
      await this.updateRules(
        signal.signal.knowledgeUpdates.ruleUpdates,
        signal.tenantId,
      );
    }

    // 4. Update model weights
    if (signal.signal.knowledgeUpdates.modelWeights) {
      await this.updateModelWeights(
        signal.signal.knowledgeUpdates.modelWeights,
        signal.tenantId,
      );
    }

    // Mark as applied
    await signalCaptureService.markApplied(signal.id);
  }

  /**
   * Update graph edges
   */
  private async updateGraphEdges(
    updates: GraphEdgeUpdate[],
    tenantId: string,
  ): Promise<void> {
    for (const update of updates) {
      try {
        // Get existing edge
        const existingEdge = await entityGraphService.getEdge(
          update.fromNode,
          update.toNode,
          update.edgeType,
          tenantId,
        );

        if (existingEdge) {
          // Update confidence
          const newConfidence = Math.max(
            0,
            Math.min(1, existingEdge.confidence + update.confidenceAdjustment),
          );

          await entityGraphService.updateEdge(
            existingEdge.id,
            {
              confidence: newConfidence,
              properties: {
                ...existingEdge.properties,
                lastUpdated: new Date().toISOString(),
                updateReason: update.reason,
              },
            },
            tenantId,
          );
        } else {
          // Create new edge
          await entityGraphService.createEdge(
            {
              fromNode: update.fromNode,
              toNode: update.toNode,
              edgeType: update.edgeType,
              confidence: 0.5 + update.confidenceAdjustment,
              properties: {
                createdFrom: "learning_signal",
                reason: update.reason,
              },
            },
            tenantId,
          );
        }
      } catch (error) {
        console.warn(
          `Error updating graph edge ${update.fromNode} -> ${update.toNode}:`,
          error,
        );
      }
    }
  }

  /**
   * Update vector weights
   */
  private async updateVectorWeights(
    updates: VectorWeightUpdate[],
    tenantId: string,
  ): Promise<void> {
    for (const update of updates) {
      try {
        // Update vector weight in Knowledge Base
        // This would adjust retrieval relevance
        await knowledgeBaseService.update({
          id: update.vectorId,
          tenantId,
          metadata: {
            weightAdjustment: update.weightAdjustment,
            updateReason: update.reason,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.warn(`Error updating vector weight ${update.vectorId}:`, error);
      }
    }
  }

  /**
   * Update rules
   */
  private async updateRules(
    updates: RuleUpdate[],
    tenantId: string,
  ): Promise<void> {
    for (const update of updates) {
      try {
        // Store rule update in Knowledge Base
        await knowledgeBaseService.create({
          tenantId,
          agentId: "knowledge-updater",
          type: "rule_update",
          category: "learning",
          content: JSON.stringify(update),
          summary: `Rule update: ${update.ruleId} - ${update.reason}`,
          metadata: {
            ruleId: update.ruleId,
            ruleType: update.ruleType,
            update: update.update,
            reason: update.reason,
          },
          keywords: ["rule", "update", update.ruleId],
          searchableText: `rule update ${update.ruleId} ${update.reason}`,
          source: "knowledge_updater",
          confidence: 0.8,
          verified: false,
          feedbackScore: 0,
          usageCount: 0,
          status: "active",
        });
      } catch (error) {
        console.warn(`Error updating rule ${update.ruleId}:`, error);
      }
    }
  }

  /**
   * Update model weights
   */
  private async updateModelWeights(
    updates: ModelWeightUpdate[],
    tenantId: string,
  ): Promise<void> {
    for (const update of updates) {
      try {
        // Store model weight update in Knowledge Base
        await knowledgeBaseService.create({
          tenantId,
          agentId: "knowledge-updater",
          type: "model_weight_update",
          category: "learning",
          content: JSON.stringify(update),
          summary: `Model weight update: ${update.modelId} - ${update.reason}`,
          metadata: {
            modelId: update.modelId,
            weightAdjustment: update.weightAdjustment,
            reason: update.reason,
          },
          keywords: ["model", "weight", update.modelId],
          searchableText: `model weight update ${update.modelId} ${update.reason}`,
          source: "knowledge_updater",
          confidence: 0.8,
          verified: false,
          feedbackScore: 0,
          usageCount: 0,
          status: "active",
        });
      } catch (error) {
        console.warn(`Error updating model weight ${update.modelId}:`, error);
      }
    }
  }

  /**
   * Process all unprocessed signals
   */
  async processAllUnprocessed(tenantId?: string): Promise<number> {
    const filter = {
      processed: false,
      ...(tenantId && { tenantId }),
    };

    const signals = await signalCaptureService.getSignals(filter);
    let processed = 0;

    for (const signal of signals) {
      try {
        await this.processSignal(signal.id);
        processed++;
      } catch (error) {
        console.error(`Error processing signal ${signal.id}:`, error);
      }
    }

    return processed;
  }

  /**
   * Evolve rules based on accumulated learning
   */
  async evolveRules(
    ruleId: string,
    signals: LearningSignal[],
    tenantId: string,
  ): Promise<void> {
    // Analyze signals related to this rule
    const relevantSignals = signals.filter((s) =>
      s.signal.knowledgeUpdates.ruleUpdates?.some((r) => r.ruleId === ruleId),
    );

    if (relevantSignals.length === 0) {
      return;
    }

    // Calculate average accuracy
    const avgAccuracy =
      relevantSignals.reduce((sum, s) => sum + s.signal.accuracy, 0) /
      relevantSignals.length;

    // If accuracy is consistently poor, suggest rule modification
    if (avgAccuracy < 0.3 && relevantSignals.length >= 5) {
      // Store evolution suggestion
      await knowledgeBaseService.create({
        tenantId,
        agentId: "knowledge-updater",
        type: "rule_evolution",
        category: "learning",
        content: JSON.stringify({
          ruleId,
          currentAccuracy: avgAccuracy,
          signalCount: relevantSignals.length,
          suggestion: "Consider modifying rule parameters or conditions",
        }),
        summary: `Rule evolution suggestion for ${ruleId}`,
        metadata: {
          ruleId,
          avgAccuracy,
          signalCount: relevantSignals.length,
        },
        keywords: ["rule", "evolution", ruleId],
        searchableText: `rule evolution ${ruleId} accuracy ${avgAccuracy}`,
        source: "knowledge_updater",
        confidence: 0.7,
        verified: false,
        feedbackScore: 0,
        usageCount: 0,
        status: "active",
      });
    }
  }
}

// Export singleton
export const knowledgeUpdaterService = new KnowledgeUpdaterService();

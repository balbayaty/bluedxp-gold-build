/**
 * Human-in-the-Loop Service for Vision Module
 * Manages human feedback, approvals, and learning from corrections
 * Integrates with agent system and knowledge base
 * NO DUPLICATION - Uses existing feedback systems
 */

import { visionAgentIntegration } from "./visionAgentIntegration";
import { visionDatabaseService } from "./visionDatabaseService";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { getAgentMemory } from "@/lib/services/agents/agentMemory";
import { eventBus } from "@/lib/services/event-store";
// Self-learning service - loaded dynamically when needed
async function getSelfLearningService() {
  try {
    const imported = await import("./v2/selfLearningVisionService");
    return imported.selfLearningVisionService || imported.default;
  } catch (error) {
    console.warn("Self-learning vision service not available:", error);
    return null;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface HumanFeedbackRequest {
  id: string;
  analysisId: string;
  type: "approval" | "correction" | "validation" | "escalation";
  priority: "low" | "medium" | "high" | "urgent";
  reason: string;
  context: {
    analysis: any;
    suggestedActions?: any[];
    questions?: string[];
    confidence?: number;
  };
  requestedBy?: string; // System or agent ID
  requestedAt: Date;
  tenantId?: string;
  userId?: string;
}

export interface HumanFeedback {
  id: string;
  requestId: string;
  analysisId: string;
  userId: string;
  type: "approval" | "correction" | "validation" | "escalation";

  // Feedback data
  approved: boolean;
  corrections?: {
    field: string;
    originalValue: any;
    correctedValue: any;
    reason?: string;
  }[];
  comments?: string;
  confidence?: number; // Human's confidence in their feedback

  // Actions taken
  actionsTaken?: string[];
  followUpRequired?: boolean;
  followUpNotes?: string;

  // Metadata
  submittedAt: Date;
  processingTime?: number; // Time taken by human to review
  metadata?: Record<string, any>;
}

export interface FeedbackLearningImpact {
  patternUpdates: number;
  knowledgeBaseUpdates: number;
  agentMemoryUpdates: number;
  confidenceImprovements: Record<string, number>;
  newRulesGenerated: number;
}

// ============================================================================
// HUMAN-IN-THE-LOOP SERVICE
// ============================================================================

class HumanInTheLoopService {
  private pendingRequests: Map<string, HumanFeedbackRequest> = new Map();
  private agentMemory = getAgentMemory("vision-agent");

  /**
   * Create human feedback request
   */
  async createFeedbackRequest(
    request: Omit<HumanFeedbackRequest, "id" | "requestedAt">,
  ): Promise<HumanFeedbackRequest> {
    const feedbackRequest: HumanFeedbackRequest = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      ...request,
      requestedAt: new Date(),
    };

    this.pendingRequests.set(feedbackRequest.id, feedbackRequest);

    // Emit event
    await eventBus.publish({
      type: "ai.vision.human.feedback.requested",
      aggregateId: feedbackRequest.analysisId,
      aggregateType: "VisionAnalysis",
      payload: {
        requestId: feedbackRequest.id,
        analysisId: feedbackRequest.analysisId,
        type: feedbackRequest.type,
        priority: feedbackRequest.priority,
        reason: feedbackRequest.reason,
      },
      metadata: {
        requestedBy: request.requestedBy,
        timestamp: new Date().toISOString(),
      },
    });

    // Store in knowledge base for tracking
    await knowledgeBaseService.addEntry({
      id: `feedback-request-${feedbackRequest.id}`,
      type: "feedback_request",
      category: "vision_intelligence",
      title: `Human Feedback Request: ${feedbackRequest.type}`,
      content: JSON.stringify(feedbackRequest),
      source: "human_in_loop",
      metadata: {
        requestId: feedbackRequest.id,
        analysisId: feedbackRequest.analysisId,
        type: feedbackRequest.type,
        priority: feedbackRequest.priority,
      },
      tenantId: feedbackRequest.tenantId,
    });

    return feedbackRequest;
  }

  /**
   * Submit human feedback
   */
  async submitFeedback(
    feedback: Omit<HumanFeedback, "id" | "submittedAt">,
  ): Promise<{
    feedback: HumanFeedback;
    learningImpact: FeedbackLearningImpact;
  }> {
    const startTime = Date.now();
    const fullFeedback: HumanFeedback = {
      id: `human-feedback-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      ...feedback,
      submittedAt: new Date(),
      processingTime: Date.now() - startTime,
    };

    // Remove from pending requests
    this.pendingRequests.delete(feedback.requestId);

    // Process feedback through agent integration
    await visionAgentIntegration.processHumanFeedback(feedback.analysisId, {
      approved: feedback.approved,
      corrections: feedback.corrections?.reduce(
        (acc, corr) => {
          acc[corr.field] = corr.correctedValue;
          return acc;
        },
        {} as Record<string, any>,
      ),
      comments: feedback.comments,
      userId: feedback.userId,
    });

    // Learn from feedback
    const learningImpact = await this.learnFromFeedback(fullFeedback);

    // Store feedback in database
    await visionDatabaseService.createFeedback({
      tenantId: feedback.metadata?.tenantId,
      userId: feedback.userId,
      analysisId: feedback.analysisId,
      userCorrection: feedback.corrections as any,
      validated: feedback.approved,
      validatedBy: feedback.userId,
      validatedAt: fullFeedback.submittedAt,
      learningImpact: learningImpact as any,
      metadata: feedback.metadata,
    });

    // Emit feedback submitted event
    await eventBus.publish({
      type: "ai.vision.human.feedback.submitted",
      aggregateId: feedback.analysisId,
      aggregateType: "VisionAnalysis",
      payload: {
        feedbackId: fullFeedback.id,
        analysisId: feedback.analysisId,
        approved: feedback.approved,
        hasCorrections: (feedback.corrections?.length || 0) > 0,
        learningImpact,
      },
      metadata: {
        userId: feedback.userId,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      feedback: fullFeedback,
      learningImpact,
    };
  }

  /**
   * Learn from human feedback
   */
  private async learnFromFeedback(
    feedback: HumanFeedback,
  ): Promise<FeedbackLearningImpact> {
    const impact: FeedbackLearningImpact = {
      patternUpdates: 0,
      knowledgeBaseUpdates: 0,
      agentMemoryUpdates: 0,
      confidenceImprovements: {},
      newRulesGenerated: 0,
    };

    try {
      // 1. Update patterns if corrections provided
      if (feedback.corrections && feedback.corrections.length > 0) {
        for (const correction of feedback.corrections) {
          // Find matching patterns
          const patterns = await visionDatabaseService.getPatterns({
            analysisId: feedback.analysisId,
          });

          for (const pattern of patterns) {
            // Update pattern confidence based on feedback
            const confidenceChange = feedback.approved ? 5 : -10;
            const newConfidence = Math.max(
              0,
              Math.min(100, (pattern.confidence || 0) + confidenceChange),
            );

            await visionDatabaseService.upsertPattern({
              patternId: pattern.patternId,
              tenantId: pattern.tenantId,
              name: pattern.name,
              description: pattern.description,
              visualFeatures: pattern.visualFeatures as any,
              context: pattern.context as any,
              confidence: newConfidence,
              occurrenceCount: pattern.occurrenceCount,
              accuracy: pattern.accuracy,
              firstSeen: pattern.firstSeen
                ? new Date(pattern.firstSeen)
                : undefined,
              lastSeen: new Date(),
              autoGeneratedRules: pattern.autoGeneratedRules as any,
              preventionSuggestions: pattern.preventionSuggestions as any,
              tags: pattern.tags as any,
              analysisId: pattern.analysisId,
            });

            impact.patternUpdates++;
            impact.confidenceImprovements[pattern.patternId] = confidenceChange;
          }
        }
      }

      // 2. Update knowledge base
      await knowledgeBaseService.addEntry({
        id: `feedback-learning-${feedback.id}`,
        type: "learning_event",
        category: "vision_intelligence",
        title: `Learning from Human Feedback: ${feedback.approved ? "Approved" : "Corrected"}`,
        content: JSON.stringify({
          feedback,
          corrections: feedback.corrections,
          approved: feedback.approved,
        }),
        source: "human_feedback",
        metadata: {
          feedbackId: feedback.id,
          analysisId: feedback.analysisId,
          approved: feedback.approved,
          correctionsCount: feedback.corrections?.length || 0,
        },
      });
      impact.knowledgeBaseUpdates++;

      // 3. Update agent memory
      await this.agentMemory.add({
        agentId: "vision-agent",
        agentType: "vision",
        type: "preference",
        content: `Human feedback: ${feedback.approved ? "approved" : "corrected"} analysis ${feedback.analysisId}`,
        summary:
          feedback.comments ||
          `Feedback received: ${feedback.approved ? "approved" : "needs correction"}`,
        importance: 0.95, // Very high importance
        context: {
          feedbackId: feedback.id,
          analysisId: feedback.analysisId,
          approved: feedback.approved,
          corrections: feedback.corrections,
        },
        tags: ["human_feedback", feedback.approved ? "approved" : "correction"],
      });
      impact.agentMemoryUpdates++;

      // 4. Generate new rules if significant corrections
      if (feedback.corrections && feedback.corrections.length >= 2) {
        const newRules = await this.generateRulesFromFeedback(feedback);
        impact.newRulesGenerated = newRules.length;

        // Store new rules in knowledge base
        for (const rule of newRules) {
          await knowledgeBaseService.addEntry({
            id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: "rule",
            category: "vision_intelligence",
            title: `Auto-generated Rule: ${rule.name}`,
            content: rule.description,
            source: "human_feedback_learning",
            metadata: {
              ruleId: rule.id,
              generatedFrom: feedback.id,
            },
          });
        }
      }

      // 5. Update self-learning service
      if (feedback.corrections && feedback.corrections.length > 0) {
        try {
          const selfLearningService = await getSelfLearningService();
          if (selfLearningService) {
            // Process through self-learning service
            await selfLearningService.processFeedback({
              id: feedback.id,
              patternId: feedback.analysisId,
              photoId: feedback.analysisId,
              damageRecordId: feedback.analysisId,
              userCorrection: feedback.corrections.reduce(
                (acc: any, corr: any) => {
                  acc[corr.field] = {
                    originalPrediction: corr.originalValue,
                    correctedValue: corr.correctedValue,
                    field: corr.field,
                  };
                  return acc;
                },
                {},
              ),
              validated: feedback.approved,
              validatedBy: feedback.userId,
              validatedAt: feedback.submittedAt,
              learningImpact: {
                patternConfidenceChange: 0,
                ruleUpdates: [],
                knowledgeBaseUpdates: [],
              },
              createdAt: feedback.submittedAt,
            } as any);
          }
        } catch (error) {
          console.warn(
            "Error processing feedback through self-learning service:",
            error,
          );
          // Continue without failing
        }
      }
    } catch (error) {
      console.error("Error learning from feedback:", error);
      // Don't fail the entire process
    }

    return impact;
  }

  /**
   * Generate rules from feedback
   */
  private async generateRulesFromFeedback(feedback: HumanFeedback): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      conditions: any[];
    }>
  > {
    const rules: Array<{
      id: string;
      name: string;
      description: string;
      conditions: any[];
    }> = [];

    if (!feedback.corrections || feedback.corrections.length === 0)
      return rules;

    // Generate rules based on corrections
    for (const correction of feedback.corrections) {
      rules.push({
        id: `rule-${correction.field}-${Date.now()}`,
        name: `Correction Rule: ${correction.field}`,
        description: `When ${correction.field} is detected as "${correction.originalValue}", it should be corrected to "${correction.correctedValue}". Reason: ${correction.reason || "Human correction"}`,
        conditions: [
          {
            field: correction.field,
            operator: "equals",
            value: correction.originalValue,
          },
        ],
      });
    }

    return rules;
  }

  /**
   * Get pending feedback requests
   */
  async getPendingRequests(options: {
    tenantId?: string;
    userId?: string;
    type?: HumanFeedbackRequest["type"];
    priority?: HumanFeedbackRequest["priority"];
  }): Promise<HumanFeedbackRequest[]> {
    let requests = Array.from(this.pendingRequests.values());

    if (options.tenantId) {
      requests = requests.filter((r) => r.tenantId === options.tenantId);
    }
    if (options.userId) {
      requests = requests.filter((r) => r.userId === options.userId);
    }
    if (options.type) {
      requests = requests.filter((r) => r.type === options.type);
    }
    if (options.priority) {
      requests = requests.filter((r) => r.priority === options.priority);
    }

    // Sort by priority and requested time
    return requests.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.requestedAt.getTime() - a.requestedAt.getTime();
    });
  }

  /**
   * Get feedback history
   */
  async getFeedbackHistory(options: {
    analysisId?: string;
    userId?: string;
    tenantId?: string;
    limit?: number;
  }): Promise<HumanFeedback[]> {
    // Get from database
    const analyses = await visionDatabaseService.listAnalyses({
      tenantId: options.tenantId,
      limit: options.limit || 50,
    });

    // Get feedback for each analysis
    const feedbacks: HumanFeedback[] = [];
    for (const analysis of analyses.analyses) {
      if (options.analysisId && analysis.analysisId !== options.analysisId)
        continue;

      const feedback = await visionDatabaseService.getPatterns({
        analysisId: analysis.id,
      });

      // Convert to HumanFeedback format (simplified)
      // In production, you'd have a proper feedback table
    }

    return feedbacks;
  }

  /**
   * Auto-approve if confidence is very high and no critical issues
   */
  async shouldAutoApprove(analysisId: string): Promise<boolean> {
    try {
      const analysis =
        await visionDatabaseService.getAnalysisByAnalysisId(analysisId);
      if (!analysis) return false;

      // High confidence and no critical issues
      const highConfidence = (analysis.complianceScore || 0) >= 90;
      const noCriticalIssues = (analysis.criticalIssues || 0) === 0;
      const isCompliant = analysis.isCompliant;

      return highConfidence && noCriticalIssues && isCompliant;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton
export const humanInTheLoopService = new HumanInTheLoopService();
export default humanInTheLoopService;

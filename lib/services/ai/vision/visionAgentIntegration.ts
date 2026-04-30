/**
 * Vision Agent Integration Service
 * Connects Vision Services to Agent Orchestrator
 * Enables intelligent agent-based vision analysis with self-learning
 * NO DUPLICATION - Uses existing agentOrchestrator and vision services
 */

import {
  agentOrchestrator,
  TaskRequest,
  TaskResult,
} from "@/lib/services/agents/agentOrchestrator";
import { getAgentMemory } from "@/lib/services/agents/agentMemory";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { visionService } from "../visionService";
import { enhancedVisionService } from "../enhancedVisionService";
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
import { visionDatabaseService } from "./visionDatabaseService";
import { visionEventIntegration } from "./visionEventIntegration";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface VisionAgentTask {
  id: string;
  type:
    | "analysis"
    | "pattern_learning"
    | "feedback_processing"
    | "automated_decision"
    | "quality_improvement";
  priority: "low" | "medium" | "high" | "urgent";
  input: {
    imageFile?: File | string;
    analysisId?: string;
    feedbackId?: string;
    context?: string;
    module?: string;
    tenantId?: string;
    userId?: string;
  };
  metadata?: Record<string, any>;
}

export interface VisionAgentResult {
  taskId: string;
  status: "success" | "partial" | "needs_human" | "failed";
  result: any;
  confidence: number;
  agentUsed?: string;
  learningNotes?: string[];
  suggestedActions?: Array<{
    action: string;
    priority: number;
    reasoning: string;
  }>;
  humanFeedbackRequired?: {
    reason: string;
    questions: string[];
    context: any;
  };
}

// ============================================================================
// VISION AGENT INTEGRATION SERVICE
// ============================================================================

class VisionAgentIntegrationService {
  private agentMemory = getAgentMemory("vision-agent");
  private learningThreshold = 0.75; // Confidence threshold for auto-learning

  /**
   * Process vision analysis using AI agents
   * Intelligently routes to appropriate agents based on context
   */
  async processWithAgents(task: VisionAgentTask): Promise<VisionAgentResult> {
    const startTime = Date.now();

    try {
      // Step 1: Determine which agents to use based on task type and context
      const agentTasks = await this.determineAgentTasks(task);

      // Step 2: Execute agent tasks in parallel where possible
      const agentResults = await this.executeAgentTasks(agentTasks, task);

      // Step 3: Synthesize results from multiple agents
      const synthesizedResult = await this.synthesizeResults(
        agentResults,
        task,
      );

      // Step 4: Check if human feedback is needed
      const humanFeedbackCheck = await this.checkHumanFeedbackNeeded(
        synthesizedResult,
        task,
      );

      // Step 5: Learn from the analysis
      if (synthesizedResult.confidence >= this.learningThreshold) {
        await this.learnFromAnalysis(synthesizedResult, task);
      }

      // Step 6: Store in agent memory
      await this.storeInMemory(task, synthesizedResult);

      return {
        taskId: task.id,
        status: humanFeedbackCheck.required ? "needs_human" : "success",
        result: synthesizedResult,
        confidence: synthesizedResult.confidence,
        agentUsed: agentResults.map((r) => r.agentId).join(", "),
        learningNotes: synthesizedResult.learningNotes,
        suggestedActions: synthesizedResult.suggestedActions,
        humanFeedbackRequired: humanFeedbackCheck.required
          ? humanFeedbackCheck
          : undefined,
      };
    } catch (error) {
      console.error("Vision agent integration error:", error);
      return {
        taskId: task.id,
        status: "failed",
        result: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        confidence: 0,
      };
    }
  }

  /**
   * Determine which agents to use for the task
   */
  private async determineAgentTasks(
    task: VisionAgentTask,
  ): Promise<TaskRequest[]> {
    const tasks: TaskRequest[] = [];

    // Always use vision-agent for image analysis
    if (task.type === "analysis" && task.input.imageFile) {
      tasks.push({
        id: `${task.id}-vision-analysis`,
        type: "image-analysis",
        description: "Analyze image for safety, quality, and compliance issues",
        input: {
          imageFile: task.input.imageFile,
          context: task.input.context,
          module: task.input.module,
        },
        requiredCapabilities: ["image-analysis"],
        preferredAgent: "vision-agent",
        priority: task.priority,
        tenantId: task.input.tenantId,
        userId: task.input.userId,
        correlationId: task.id,
      });
    }

    // Use safety-agent if safety issues are likely
    if (
      task.input.module === "qhse" ||
      task.input.context?.includes("safety")
    ) {
      tasks.push({
        id: `${task.id}-safety-analysis`,
        type: "hazard-analysis",
        description: "Analyze safety and compliance aspects",
        input: {
          context: task.input.context,
          module: task.input.module,
        },
        requiredCapabilities: ["hazard-analysis", "compliance-check"],
        preferredAgent: "safety-agent",
        priority: task.priority,
        tenantId: task.input.tenantId,
        userId: task.input.userId,
        correlationId: task.id,
      });
    }

    // Use quality-agent if quality issues are likely
    if (
      task.input.module === "iso-ims" ||
      task.input.context?.includes("quality")
    ) {
      tasks.push({
        id: `${task.id}-quality-analysis`,
        type: "ncr-analysis",
        description: "Analyze quality and non-conformance aspects",
        input: {
          context: task.input.context,
          module: task.input.module,
        },
        requiredCapabilities: ["ncr-analysis", "capa-suggestion"],
        preferredAgent: "quality-agent",
        priority: task.priority,
        tenantId: task.input.tenantId,
        userId: task.input.userId,
        correlationId: task.id,
      });
    }

    // Use rca-agent for root cause analysis if issues detected
    if (task.type === "analysis") {
      tasks.push({
        id: `${task.id}-rca`,
        type: "root-cause-analysis",
        description: "Perform root cause analysis if issues are detected",
        input: {
          context: task.input.context,
          module: task.input.module,
        },
        requiredCapabilities: ["root-cause-analysis", "pattern-detection"],
        preferredAgent: "rca-agent",
        priority: "medium", // Lower priority, only if issues found
        tenantId: task.input.tenantId,
        userId: task.input.userId,
        correlationId: task.id,
      });
    }

    return tasks;
  }

  /**
   * Execute agent tasks
   */
  private async executeAgentTasks(
    agentTasks: TaskRequest[],
    originalTask: VisionAgentTask,
  ): Promise<TaskResult[]> {
    const results: TaskResult[] = [];

    // Execute vision analysis first (required)
    const visionTask = agentTasks.find(
      (t) => t.preferredAgent === "vision-agent",
    );
    if (visionTask) {
      try {
        // Use enhanced vision service with RAG
        const visionResult = await enhancedVisionService.analyzeWithRAG(
          originalTask.input.imageFile!,
          originalTask.input.context,
          {
            enableRAG: true,
            enableLearning: true,
            enableIndustryAnalysis: true,
            extractText: true,
            searchSimilarCases: true,
            industryContext: this.getIndustryContext(originalTask.input.module),
          },
        );

        results.push({
          taskId: visionTask.id,
          agentId: "vision-agent",
          status: "success",
          output: {
            analysis: visionResult,
            confidence: this.calculateConfidence(visionResult),
          },
          confidence: this.calculateConfidence(visionResult),
          processingTime: Date.now() - Date.now(), // Will be calculated properly
        });
      } catch (error) {
        results.push({
          taskId: visionTask.id,
          agentId: "vision-agent",
          status: "failure",
          error: error instanceof Error ? error.message : "Unknown error",
          confidence: 0,
          processingTime: 0,
        });
      }
    }

    // Execute other agent tasks using agent orchestrator
    const otherTasks = agentTasks.filter(
      (t) => t.preferredAgent !== "vision-agent",
    );
    for (const task of otherTasks) {
      try {
        const result = await agentOrchestrator.executeTask(task);
        results.push(result);
      } catch (error) {
        console.warn(`Agent task ${task.id} failed:`, error);
        // Continue with other tasks
      }
    }

    return results;
  }

  /**
   * Synthesize results from multiple agents
   */
  private async synthesizeResults(
    agentResults: TaskResult[],
    task: VisionAgentTask,
  ): Promise<any> {
    const visionResult = agentResults.find((r) => r.agentId === "vision-agent");
    const safetyResult = agentResults.find((r) => r.agentId === "safety-agent");
    const qualityResult = agentResults.find(
      (r) => r.agentId === "quality-agent",
    );
    const rcaResult = agentResults.find((r) => r.agentId === "rca-agent");

    // Base result from vision analysis
    const baseAnalysis = visionResult?.output?.analysis || {};

    // Synthesize insights
    const insights = {
      vision: baseAnalysis,
      safety: safetyResult?.output || null,
      quality: qualityResult?.output || null,
      rootCause: rcaResult?.output || null,
    };

    // Calculate overall confidence
    const confidences = agentResults
      .filter((r) => r.status === "success")
      .map((r) => r.confidence);
    const overallConfidence =
      confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0;

    // Generate suggested actions
    const suggestedActions = await this.generateSuggestedActions(
      insights,
      task,
    );

    // Generate learning notes
    const learningNotes = this.generateLearningNotes(agentResults, task);

    return {
      insights,
      confidence: overallConfidence,
      suggestedActions,
      learningNotes,
      agentResults: agentResults.map((r) => ({
        agentId: r.agentId,
        status: r.status,
        confidence: r.confidence,
      })),
    };
  }

  /**
   * Check if human feedback is needed
   */
  private async checkHumanFeedbackNeeded(
    result: any,
    task: VisionAgentTask,
  ): Promise<{
    required: boolean;
    reason: string;
    questions: string[];
    context: any;
  }> {
    // Low confidence requires human review
    if (result.confidence < 0.6) {
      return {
        required: true,
        reason: "Low confidence in analysis results",
        questions: [
          "Please review the analysis and confirm accuracy",
          "Are there any issues that were missed?",
          "Is the severity assessment correct?",
        ],
        context: result,
      };
    }

    // Critical issues always need human confirmation
    const criticalIssues =
      result.insights?.vision?.analysis?.safetyIssues?.filter(
        (i: any) => i.severity === "critical",
      ) || [];
    if (criticalIssues.length > 0) {
      return {
        required: true,
        reason: "Critical safety issues detected",
        questions: [
          "Please confirm the critical issues identified",
          "What immediate actions should be taken?",
          "Is emergency response required?",
        ],
        context: result,
      };
    }

    // Check agent memory for similar cases that needed human feedback
    const similarCases = await this.agentMemory.search({
      query: task.input.context || "",
      limit: 3,
      minRelevance: 0.7,
    });

    const needsHumanPattern = similarCases.find(
      (c: any) => c.metadata?.neededHumanFeedback === true,
    );
    if (needsHumanPattern) {
      return {
        required: true,
        reason: "Similar cases in the past required human review",
        questions: [
          "Based on similar past cases, please review this analysis",
          "Are there patterns we should be aware of?",
        ],
        context: { result, similarCase: needsHumanPattern },
      };
    }

    return {
      required: false,
      reason: "",
      questions: [],
      context: {},
    };
  }

  /**
   * Learn from analysis
   */
  private async learnFromAnalysis(
    result: any,
    task: VisionAgentTask,
  ): Promise<void> {
    try {
      // Store in knowledge base
      if (result.insights?.vision) {
        await knowledgeBaseService.addEntry({
          id: `vision-${task.id}`,
          type: "vision_analysis",
          category: "vision_intelligence",
          title: `Vision Analysis: ${task.input.module || "general"}`,
          content: JSON.stringify(result.insights.vision),
          source: "vision_agent",
          metadata: {
            analysisId: task.id,
            module: task.input.module,
            confidence: result.confidence,
            agentUsed: result.agentResults
              ?.map((r: any) => r.agentId)
              .join(", "),
          },
          tenantId: task.input.tenantId,
        });
      }

      // Update agent memory
      await this.agentMemory.add({
        agentId: "vision-agent",
        agentType: "vision",
        type: "fact",
        content: `Vision analysis completed for ${task.input.module || "general"} context`,
        importance: result.confidence,
        context: {
          taskId: task.id,
          confidence: result.confidence,
          module: task.input.module,
        },
        tags: ["vision", "analysis", task.input.module || "general"],
      });

      // Emit learning event
      await eventBus.publish({
        type: "ai.vision.agent.learned",
        aggregateId: task.id,
        aggregateType: "VisionAgentTask",
        payload: {
          taskId: task.id,
          confidence: result.confidence,
          learningNotes: result.learningNotes,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn("Error learning from analysis:", error);
      // Don't fail the entire process if learning fails
    }
  }

  /**
   * Store in agent memory
   */
  private async storeInMemory(
    task: VisionAgentTask,
    result: any,
  ): Promise<void> {
    try {
      await this.agentMemory.add({
        agentId: "vision-agent",
        agentType: "vision",
        type: "interaction",
        content: `Vision analysis task: ${task.type}`,
        summary: `Analyzed ${task.input.module || "general"} context with ${(result.confidence * 100).toFixed(0)}% confidence`,
        importance: result.confidence,
        context: {
          taskId: task.id,
          result: result,
          module: task.input.module,
        },
        tags: ["vision", task.type, task.input.module || "general"],
      });
    } catch (error) {
      console.warn("Error storing in agent memory:", error);
    }
  }

  /**
   * Generate suggested actions
   */
  private async generateSuggestedActions(
    insights: any,
    task: VisionAgentTask,
  ): Promise<
    Array<{
      action: string;
      priority: number;
      reasoning: string;
    }>
  > {
    const actions: Array<{
      action: string;
      priority: number;
      reasoning: string;
    }> = [];

    // Check for safety issues
    const safetyIssues = insights.vision?.analysis?.safetyIssues || [];
    if (safetyIssues.length > 0) {
      const critical = safetyIssues.filter(
        (i: any) => i.severity === "critical",
      ).length;
      if (critical > 0) {
        actions.push({
          action: "CREATE_INCIDENT_REPORT",
          priority: 10,
          reasoning: `${critical} critical safety issue(s) detected - immediate action required`,
        });
      }
    }

    // Check for quality issues
    const qualityIssues = insights.vision?.analysis?.qualityIssues || [];
    if (qualityIssues.length > 0) {
      actions.push({
        action: "CREATE_NCR",
        priority: 8,
        reasoning: `${qualityIssues.length} quality issue(s) detected - NCR creation recommended`,
      });
    }

    // Check for compliance issues
    const complianceIssues = insights.vision?.analysis?.complianceIssues || [];
    if (complianceIssues.length > 0) {
      actions.push({
        action: "CREATE_CAPA",
        priority: 7,
        reasoning: `${complianceIssues.length} compliance issue(s) detected - CAPA creation recommended`,
      });
    }

    // Use root cause analysis suggestions
    if (insights.rootCause?.recommendations) {
      insights.rootCause.recommendations.forEach((rec: string, idx: number) => {
        actions.push({
          action: `FOLLOW_RCA_RECOMMENDATION_${idx + 1}`,
          priority: 6,
          reasoning: rec,
        });
      });
    }

    return actions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate learning notes
   */
  private generateLearningNotes(
    agentResults: TaskResult[],
    task: VisionAgentTask,
  ): string[] {
    const notes: string[] = [];

    agentResults.forEach((result) => {
      if (result.learningNotes) {
        notes.push(...result.learningNotes);
      }
    });

    // Add pattern learning notes
    if (task.type === "pattern_learning") {
      notes.push("Pattern learning task completed");
    }

    return notes;
  }

  /**
   * Calculate confidence from vision result
   */
  private calculateConfidence(visionResult: any): number {
    if (!visionResult || !visionResult.analysis) return 0.5;

    const analysis = visionResult.analysis;
    const issues = [
      ...(analysis.safetyIssues || []),
      ...(analysis.qualityIssues || []),
      ...(analysis.complianceIssues || []),
    ];

    if (issues.length === 0) return 0.9; // High confidence if no issues

    const avgConfidence =
      issues.reduce((sum: number, issue: any) => {
        return sum + (issue.confidence || 50) / 100;
      }, 0) / issues.length;

    return Math.min(0.95, Math.max(0.5, avgConfidence));
  }

  /**
   * Get industry context from module
   */
  private getIndustryContext(
    module?: string,
  ): "manufacturing" | "logistics" | "healthcare" | "chemical" | "general" {
    switch (module) {
      case "wms":
        return "logistics";
      case "qhse":
        return "healthcare";
      case "iso-ims":
        return "manufacturing";
      case "msds":
        return "chemical";
      default:
        return "general";
    }
  }

  /**
   * Process human feedback and update learning
   */
  async processHumanFeedback(
    taskId: string,
    feedback: {
      approved: boolean;
      corrections?: Record<string, any>;
      comments?: string;
      userId: string;
    },
  ): Promise<void> {
    try {
      // Update agent memory with feedback
      await this.agentMemory.add({
        agentId: "vision-agent",
        agentType: "vision",
        type: "preference",
        content: `Human feedback for task ${taskId}: ${feedback.approved ? "approved" : "needs correction"}`,
        importance: 0.9, // High importance for human feedback
        context: {
          taskId,
          feedback,
        },
        tags: ["human_feedback", feedback.approved ? "approved" : "correction"],
      });

      // If corrections provided, learn from them
      if (
        feedback.corrections &&
        Object.keys(feedback.corrections).length > 0
      ) {
        try {
          const selfLearningService = await getSelfLearningService();
          if (selfLearningService) {
            // Convert corrections to proper format
            const userCorrection: Record<
              string,
              { originalPrediction: any; correctedValue: any; field: string }
            > = {};
            for (const [field, value] of Object.entries(feedback.corrections)) {
              userCorrection[field] = {
                originalPrediction: value, // We don't have original, use current
                correctedValue: value,
                field,
              };
            }

            await selfLearningService.processFeedback({
              id: `feedback-${taskId}`,
              patternId: taskId,
              photoId: taskId,
              damageRecordId: taskId,
              userCorrection,
              validated: feedback.approved,
              validatedBy: feedback.userId,
              validatedAt: new Date(),
              learningImpact: {
                patternConfidenceChange: 0,
                ruleUpdates: [],
                knowledgeBaseUpdates: [],
              },
              createdAt: new Date(),
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

      // Store in knowledge base
      await knowledgeBaseService.addEntry({
        id: `feedback-${taskId}`,
        type: "feedback",
        category: "vision_intelligence",
        title: `Human Feedback: ${taskId}`,
        content: JSON.stringify(feedback),
        source: "human_feedback",
        metadata: {
          taskId,
          approved: feedback.approved,
        },
      });

      // Emit feedback event
      await eventBus.publish({
        type: "ai.vision.human.feedback.received",
        aggregateId: taskId,
        aggregateType: "VisionAgentTask",
        payload: {
          taskId,
          approved: feedback.approved,
          hasCorrections: !!feedback.corrections,
        },
        metadata: {
          userId: feedback.userId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error processing human feedback:", error);
      throw error;
    }
  }
}

// Export singleton
export const visionAgentIntegration = new VisionAgentIntegrationService();
export default visionAgentIntegration;

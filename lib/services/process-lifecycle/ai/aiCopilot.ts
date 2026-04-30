/**
 * Advanced AI Copilot for Process Lifecycle Module
 * GPT/LLM integration for natural language workflow creation and assistance
 * More advanced than Power Automate AI Builder
 */

import { callAI } from "@/utils/aiClient";
import { workflowService } from "../workflow/workflowService";
import { lifecycleService } from "../lifecycle/lifecycleService";
import type { Workflow, WorkflowStep } from "../workflow/workflowService";
import type { LifecycleConfig } from "@/types/lifecycle";

export interface CopilotRequest {
  query: string;
  context?: {
    entityType?: string;
    entityId?: string;
    workflowId?: string;
    userId?: string;
    tenantId?: string;
  };
  type: "create" | "modify" | "explain" | "optimize" | "query" | "recommend";
}

export interface CopilotResponse {
  success: boolean;
  type: "workflow" | "lifecycle" | "recommendation" | "explanation" | "error";
  data?: any;
  message: string;
  confidence?: number;
  suggestions?: string[];
  followUpQuestions?: string[];
}

export interface WorkflowSuggestion {
  id: string;
  name: string;
  description: string;
  workflow: Partial<Workflow>;
  confidence: number;
  reasoning: string;
}

export class AdvancedAICopilot {
  private conversationHistory: Map<string, CopilotRequest[]> = new Map();
  private maxHistorySize: number = 10;

  /**
   * Process copilot request
   */
  async processRequest(request: CopilotRequest): Promise<CopilotResponse> {
    try {
      // Get conversation history
      const history = this.getConversationHistory(
        request.context?.userId || "default",
      );

      // Build context prompt
      const contextPrompt = this.buildContextPrompt(request, history);

      // Process based on type
      switch (request.type) {
        case "create":
          return await this.handleCreate(request, contextPrompt);
        case "modify":
          return await this.handleModify(request, contextPrompt);
        case "explain":
          return await this.handleExplain(request, contextPrompt);
        case "optimize":
          return await this.handleOptimize(request, contextPrompt);
        case "query":
          return await this.handleQuery(request, contextPrompt);
        case "recommend":
          return await this.handleRecommend(request, contextPrompt);
        default:
          return {
            success: false,
            type: "error",
            message: `Unknown request type: ${request.type}`,
          };
      }
    } catch (error) {
      console.error("AI Copilot error:", error);
      return {
        success: false,
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle create request
   */
  private async handleCreate(
    request: CopilotRequest,
    contextPrompt: string,
  ): Promise<CopilotResponse> {
    const prompt = `${contextPrompt}

User wants to create: ${request.query}

Generate a workflow definition in JSON format with:
- name: Descriptive name
- description: What the workflow does
- steps: Array of workflow steps with id, name, type, config, position, connections
- triggers: Array of triggers

Return only valid JSON.`;

    try {
      const response = await callAI(prompt);
      const workflowData = JSON.parse(response || "{}");

      // Validate and create workflow
      if (workflowData.name && workflowData.steps) {
        const workflow = await workflowService.createWorkflow({
          name: workflowData.name,
          description: workflowData.description || "",
          steps: workflowData.steps,
          triggers: workflowData.triggers || [],
          status: "draft",
        });

        return {
          success: true,
          type: "workflow",
          data: workflow,
          message: `Created workflow "${workflow.name}"`,
          confidence: 0.8,
          suggestions: [
            "Review the workflow steps",
            "Test the workflow",
            "Add more conditions if needed",
          ],
        };
      } else {
        return {
          success: false,
          type: "error",
          message: "Invalid workflow structure generated",
        };
      }
    } catch (error) {
      return {
        success: false,
        type: "error",
        message: "Failed to create workflow from natural language",
      };
    }
  }

  /**
   * Handle modify request
   */
  private async handleModify(
    request: CopilotRequest,
    contextPrompt: string,
  ): Promise<CopilotResponse> {
    if (!request.context?.workflowId) {
      return {
        success: false,
        type: "error",
        message: "Workflow ID required for modification",
      };
    }

    const workflow = await workflowService.getWorkflow(
      request.context.workflowId,
    );
    if (!workflow) {
      return {
        success: false,
        type: "error",
        message: "Workflow not found",
      };
    }

    const prompt = `${contextPrompt}

Current workflow:
${JSON.stringify(workflow, null, 2)}

User wants to modify: ${request.query}

Generate updated workflow definition in JSON format. Return only valid JSON.`;

    try {
      const response = await callAI(prompt);
      const updates = JSON.parse(response || "{}");

      const updated = await workflowService.updateWorkflow(
        request.context.workflowId,
        updates,
      );

      return {
        success: true,
        type: "workflow",
        data: updated,
        message: `Modified workflow "${workflow.name}"`,
        confidence: 0.75,
      };
    } catch (error) {
      return {
        success: false,
        type: "error",
        message: "Failed to modify workflow",
      };
    }
  }

  /**
   * Handle explain request
   */
  private async handleExplain(
    request: CopilotRequest,
    contextPrompt: string,
  ): Promise<CopilotResponse> {
    let data: any = null;
    let explanation = "";

    if (request.context?.workflowId) {
      data = await workflowService.getWorkflow(request.context.workflowId);
    } else if (request.context?.entityId && request.context?.entityType) {
      data = await lifecycleService.getLifecycle(
        request.context.entityId,
        request.context.entityType,
      );
    }

    if (!data) {
      return {
        success: false,
        type: "error",
        message: "No data found to explain",
      };
    }

    const prompt = `${contextPrompt}

Data to explain:
${JSON.stringify(data, null, 2)}

User question: ${request.query}

Provide a clear, concise explanation.`;

    try {
      explanation = await callAI(prompt);

      return {
        success: true,
        type: "explanation",
        data,
        message: explanation,
        confidence: 0.9,
      };
    } catch (error) {
      return {
        success: false,
        type: "error",
        message: "Failed to generate explanation",
      };
    }
  }

  /**
   * Handle optimize request
   */
  private async handleOptimize(
    request: CopilotRequest,
    contextPrompt: string,
  ): Promise<CopilotResponse> {
    if (!request.context?.workflowId) {
      return {
        success: false,
        type: "error",
        message: "Workflow ID required for optimization",
      };
    }

    const workflow = await workflowService.getWorkflow(
      request.context.workflowId,
    );
    if (!workflow) {
      return {
        success: false,
        type: "error",
        message: "Workflow not found",
      };
    }

    const prompt = `${contextPrompt}

Current workflow:
${JSON.stringify(workflow, null, 2)}

User wants to optimize: ${request.query}

Analyze the workflow and provide:
1. Optimization recommendations
2. Updated workflow definition (if applicable)
3. Expected improvements

Return as JSON with structure:
{
  "recommendations": [...],
  "optimizedWorkflow": {...},
  "improvements": {...}
}`;

    try {
      const response = await callAI(prompt);
      const optimization = JSON.parse(response || "{}");

      return {
        success: true,
        type: "recommendation",
        data: optimization,
        message: "Workflow optimization analysis complete",
        confidence: 0.8,
        suggestions: optimization.recommendations || [],
      };
    } catch (error) {
      return {
        success: false,
        type: "error",
        message: "Failed to optimize workflow",
      };
    }
  }

  /**
   * Handle query request
   */
  private async handleQuery(
    request: CopilotRequest,
    contextPrompt: string,
  ): Promise<CopilotResponse> {
    const prompt = `${contextPrompt}

User query: ${request.query}

Answer the question based on available process lifecycle data. If you need specific data, indicate what is needed.`;

    try {
      const response = await callAI(prompt);

      return {
        success: true,
        type: "explanation",
        message: response,
        confidence: 0.7,
        followUpQuestions: this.generateFollowUpQuestions(request.query),
      };
    } catch (error) {
      return {
        success: false,
        type: "error",
        message: "Failed to process query",
      };
    }
  }

  /**
   * Handle recommend request
   */
  private async handleRecommend(
    request: CopilotRequest,
    contextPrompt: string,
  ): Promise<CopilotResponse> {
    const prompt = `${contextPrompt}

User request: ${request.query}

Generate workflow recommendations based on the request. Return as JSON array:
[
  {
    "name": "...",
    "description": "...",
    "reasoning": "...",
    "confidence": 0.0-1.0
  }
]`;

    try {
      const response = await callAI(prompt);
      const recommendations = JSON.parse(response || "[]");

      return {
        success: true,
        type: "recommendation",
        data: recommendations,
        message: `Generated ${recommendations.length} recommendations`,
        confidence: 0.75,
        suggestions: recommendations.map((r: any) => r.name),
      };
    } catch (error) {
      return {
        success: false,
        type: "error",
        message: "Failed to generate recommendations",
      };
    }
  }

  /**
   * Build context prompt
   */
  private buildContextPrompt(
    request: CopilotRequest,
    history: CopilotRequest[],
  ): string {
    let prompt = `You are an AI assistant for a Process Lifecycle Management system. 
You help users create, modify, and optimize workflows and process lifecycles using natural language.

Available entity types: SALES_ORDER, PURCHASE_ORDER, ASN, TASK, PICKING, PUTAWAY, CYCLE_COUNT, GOODS_RECEIPT, WAVE

Workflow step types: action, condition, approval, notification, integration, loop, parallel, delay

`;

    if (history.length > 0) {
      prompt += `\nRecent conversation history:\n`;
      history.slice(-5).forEach((req, index) => {
        prompt += `${index + 1}. ${req.type}: ${req.query}\n`;
      });
    }

    if (request.context) {
      prompt += `\nCurrent context:\n`;
      if (request.context.entityType) {
        prompt += `- Entity Type: ${request.context.entityType}\n`;
      }
      if (request.context.entityId) {
        prompt += `- Entity ID: ${request.context.entityId}\n`;
      }
      if (request.context.workflowId) {
        prompt += `- Workflow ID: ${request.context.workflowId}\n`;
      }
    }

    return prompt;
  }

  /**
   * Get conversation history
   */
  private getConversationHistory(userId: string): CopilotRequest[] {
    return this.conversationHistory.get(userId) || [];
  }

  /**
   * Add to conversation history
   */
  private addToHistory(userId: string, request: CopilotRequest): void {
    const history = this.getConversationHistory(userId);
    history.push(request);

    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    this.conversationHistory.set(userId, history);
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(query: string): string[] {
    // Simple follow-up question generation
    return [
      "Would you like more details on this?",
      "Should I create a workflow for this?",
      "Do you want to optimize this process?",
    ];
  }

  /**
   * Suggest workflows based on lifecycle
   */
  async suggestWorkflowsForLifecycle(
    entityType: string,
    lifecycleConfig?: LifecycleConfig,
  ): Promise<WorkflowSuggestion[]> {
    const prompt = `Based on the ${entityType} lifecycle, suggest 3-5 useful workflows that could automate or improve the process.

Entity Type: ${entityType}
${lifecycleConfig ? `Stages: ${lifecycleConfig.stages.map((s) => s.name).join(", ")}` : ""}

Return as JSON array of workflow suggestions with name, description, and basic structure.`;

    try {
      const response = await callAI(prompt);
      const suggestions = JSON.parse(response || "[]");

      return suggestions.map((s: any, index: number) => ({
        id: `suggestion-${Date.now()}-${index}`,
        name: s.name || `Workflow ${index + 1}`,
        description: s.description || "",
        workflow: s.workflow || {},
        confidence: s.confidence || 0.7,
        reasoning: s.reasoning || "AI-generated suggestion",
      }));
    } catch (error) {
      console.error("Failed to generate workflow suggestions:", error);
      return [];
    }
  }
}

// Singleton instance
export const aiCopilot = new AdvancedAICopilot();

export default aiCopilot;

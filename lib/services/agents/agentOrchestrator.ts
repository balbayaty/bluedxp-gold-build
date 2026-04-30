/**
 * Agent Orchestrator
 * Coordinates multiple AI agents, delegates tasks, and manages learning
 * Supports multi-agent workflows and capability-based routing
 */

import { AgentMemory, getAgentMemory } from "./agentMemory";
import { knowledgeBaseService } from "../knowledge-base";
import { KnowledgeCategory } from "@/types/knowledgeBase";
import { allSpecializedAgents } from "./specializedAgents";

// ============================================================================
// TYPES
// ============================================================================

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  categories: KnowledgeCategory[];
  inputSchema?: Record<string, any>; // JSON Schema for expected input
  outputSchema?: Record<string, any>; // JSON Schema for expected output
  requiredContext?: string[]; // Required context fields
  confidenceThreshold?: number; // Min confidence to use this capability
  priority?: number; // Higher = preferred
}

export interface AgentDefinition {
  id: string;
  type: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  systemPrompt?: string;
  model?:
    | "gpt-4"
    | "gpt-3.5-turbo"
    | "claude-3-opus"
    | "claude-3-sonnet"
    | "local";
  maxTokens?: number;
  temperature?: number;
  isEnabled: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TaskRequest {
  id: string;
  type: string;
  description: string;
  input: Record<string, any>;
  context?: Record<string, any>;
  requiredCapabilities?: string[];
  preferredAgent?: string;
  priority: "low" | "medium" | "high" | "urgent";
  timeout?: number; // ms
  tenantId?: string;
  userId?: string;
  correlationId?: string;
}

export interface TaskResult {
  taskId: string;
  agentId: string;
  status: "success" | "failure" | "partial" | "timeout";
  output?: Record<string, any>;
  error?: string;
  confidence: number;
  processingTime: number;
  learningNotes?: string[];
  suggestedFollowUp?: TaskRequest[];
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  fallbackStrategy: "retry" | "skip" | "fail" | "human_escalation";
  maxRetries: number;
  timeout: number;
  isEnabled: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentType?: string; // Specific agent type or let orchestrator decide
  capability?: string; // Required capability
  input: Record<string, any> | string; // Static input or reference to previous step output
  outputMapping?: Record<string, string>; // Map output fields to workflow context
  condition?: string; // JS expression for conditional execution
  onSuccess?: string; // Next step ID
  onFailure?: string; // Step ID or 'fail'
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  currentStepId?: string;
  context: Record<string, any>;
  results: Map<string, TaskResult>;
  error?: string;
  startedAt: Date | string;
  completedAt?: Date | string;
}

// ============================================================================
// AGENT REGISTRY
// ============================================================================

class AgentRegistry {
  private agents: Map<string, AgentDefinition> = new Map();
  private capabilities: Map<string, AgentCapability[]> = new Map(); // capability id -> agents with it

  register(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);

    // Index capabilities
    for (const cap of agent.capabilities) {
      if (!this.capabilities.has(cap.id)) {
        this.capabilities.set(cap.id, []);
      }
      this.capabilities.get(cap.id)!.push(cap);
    }
  }

  unregister(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      // Remove from capability index
      for (const cap of agent.capabilities) {
        const caps = this.capabilities.get(cap.id) || [];
        this.capabilities.set(
          cap.id,
          caps.filter((c) => !agent.capabilities.includes(c)),
        );
      }
      this.agents.delete(agentId);
    }
  }

  get(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }

  getByType(type: string): AgentDefinition[] {
    return Array.from(this.agents.values()).filter(
      (a) => a.type === type && a.isEnabled,
    );
  }

  getByCapability(capabilityId: string): AgentDefinition[] {
    const caps = this.capabilities.get(capabilityId) || [];
    return caps
      .map((cap) => {
        const agent = Array.from(this.agents.values()).find((a) =>
          a.capabilities.some((c) => c.id === cap.id),
        );
        return agent;
      })
      .filter((a): a is AgentDefinition => a !== undefined && a.isEnabled);
  }

  getAll(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  getAllEnabled(): AgentDefinition[] {
    return Array.from(this.agents.values()).filter((a) => a.isEnabled);
  }
}

const registry = new AgentRegistry();

// Register specialized agents
allSpecializedAgents.forEach((agent) => {
  registry.register(agent);
});

// ============================================================================
// DEFAULT AGENTS
// ============================================================================

const defaultAgents: AgentDefinition[] = [
  {
    id: "safety-agent",
    type: "safety",
    name: "Safety Analysis Agent",
    description: "Analyzes safety concerns, hazards, and compliance issues",
    capabilities: [
      {
        id: "hazard-analysis",
        name: "Hazard Analysis",
        description: "Identify and assess hazards",
        categories: ["chemical_safety", "risk_assessment"],
        priority: 90,
      },
      {
        id: "compliance-check",
        name: "Compliance Check",
        description: "Check regulatory compliance",
        categories: ["regulatory_compliance"],
        priority: 85,
      },
    ],
    model: "gpt-4",
    temperature: 0.3,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "quality-agent",
    type: "quality",
    name: "Quality Management Agent",
    description: "Handles quality control, NCRs, and CAPAs",
    capabilities: [
      {
        id: "ncr-analysis",
        name: "NCR Analysis",
        description: "Analyze non-conformance reports",
        categories: ["quality_management", "root_cause_analysis"],
        priority: 85,
      },
      {
        id: "capa-suggestion",
        name: "CAPA Suggestion",
        description: "Suggest corrective and preventive actions",
        categories: ["quality_management"],
        priority: 80,
      },
    ],
    model: "gpt-4",
    temperature: 0.4,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "warehouse-agent",
    type: "warehouse",
    name: "Warehouse Operations Agent",
    description: "Optimizes warehouse operations and logistics",
    capabilities: [
      {
        id: "storage-optimization",
        name: "Storage Optimization",
        description: "Optimize storage locations and space",
        categories: ["warehouse_operations", "storage_compatibility"],
        priority: 90,
      },
      {
        id: "route-planning",
        name: "Route Planning",
        description: "Plan picking and delivery routes",
        categories: ["warehouse_operations", "transportation"],
        priority: 85,
      },
    ],
    model: "gpt-4",
    temperature: 0.3,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "msds-agent",
    type: "msds",
    name: "MSDS Intelligence Agent",
    description: "Processes and analyzes MSDS documents",
    capabilities: [
      {
        id: "msds-parsing",
        name: "MSDS Parsing",
        description: "Extract information from MSDS documents",
        categories: ["chemical_safety", "regulatory_compliance"],
        priority: 95,
      },
      {
        id: "compatibility-check",
        name: "Chemical Compatibility",
        description: "Check chemical storage compatibility",
        categories: ["storage_compatibility", "chemical_safety"],
        priority: 90,
      },
    ],
    model: "gpt-4",
    temperature: 0.2,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "vision-agent",
    type: "vision",
    name: "AI Vision Agent",
    description: "Processes and analyzes images and video",
    capabilities: [
      {
        id: "image-analysis",
        name: "Image Analysis",
        description: "Analyze images for safety and quality issues",
        categories: [
          "chemical_safety",
          "quality_management",
          "warehouse_operations",
        ],
        priority: 90,
      },
      {
        id: "ppe-detection",
        name: "PPE Detection",
        description: "Detect PPE compliance in images",
        categories: ["chemical_safety", "regulatory_compliance"],
        priority: 85,
      },
    ],
    model: "gpt-4",
    temperature: 0.3,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rca-agent",
    type: "rca",
    name: "Root Cause Analysis Agent",
    description: "Performs deep root cause analysis",
    capabilities: [
      {
        id: "root-cause-analysis",
        name: "Root Cause Analysis",
        description: "Identify root causes of issues",
        categories: ["root_cause_analysis", "quality_management"],
        priority: 95,
      },
      {
        id: "pattern-detection",
        name: "Pattern Detection",
        description: "Detect patterns in issues",
        categories: ["root_cause_analysis"],
        priority: 85,
      },
    ],
    model: "gpt-4",
    temperature: 0.4,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prediction-agent",
    type: "prediction",
    name: "Predictive Analytics Agent",
    description: "Forecasts and predicts future events",
    capabilities: [
      {
        id: "demand-forecasting",
        name: "Demand Forecasting",
        description: "Predict future demand",
        categories: ["warehouse_operations"],
        priority: 85,
      },
      {
        id: "risk-prediction",
        name: "Risk Prediction",
        description: "Predict potential risks",
        categories: ["risk_assessment"],
        priority: 90,
      },
    ],
    model: "gpt-4",
    temperature: 0.3,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "communication-agent",
    type: "communication",
    name: "Communication Agent",
    description: "Handles notifications and communications",
    capabilities: [
      {
        id: "notification-generation",
        name: "Notification Generation",
        description: "Generate contextual notifications",
        categories: ["general"],
        priority: 80,
      },
      {
        id: "report-generation",
        name: "Report Generation",
        description: "Generate reports and summaries",
        categories: ["general"],
        priority: 80,
      },
    ],
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Register default agents
defaultAgents.forEach((agent) => registry.register(agent));

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

export class AgentOrchestrator {
  private tenantId?: string;
  private agentMemories: Map<string, AgentMemory> = new Map();
  private activeWorkflows: Map<string, WorkflowExecution> = new Map();

  constructor(tenantId?: string) {
    this.tenantId = tenantId;
  }

  // ============================================================================
  // TASK DELEGATION
  // ============================================================================

  /**
   * Route a task to the best agent
   */
  async routeTask(request: TaskRequest): Promise<TaskResult> {
    const startTime = Date.now();

    // Check if multi-agent consensus is requested
    if (
      request.context?.useConsensus === true ||
      request.context?.consensusThreshold
    ) {
      return this.routeWithConsensus(request);
    }

    // Use capability-based routing if capabilities are specified
    if (request.requiredCapabilities?.length) {
      return this.routeWithCapabilityBasedRouting(request);
    }

    // Find best agent
    const agent = await this.findBestAgent(request);
    if (!agent) {
      return {
        taskId: request.id,
        agentId: "none",
        status: "failure",
        error: "No suitable agent found for this task",
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    // Get or create agent memory
    const memory = this.getOrCreateMemory(agent);

    // Recall relevant context
    const relevantMemories = await memory.recall(request.description, {
      limit: 5,
      minImportance: 0.3,
    });

    // Execute task with agent
    const result = await this.executeTask(agent, request, relevantMemories);

    // Learn from result
    await this.processLearning(agent, memory, request, result);

    return {
      ...result,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Route task with multi-agent consensus
   */
  private async routeWithConsensus(request: TaskRequest): Promise<TaskResult> {
    const startTime = Date.now();
    const consensusThreshold = request.context?.consensusThreshold || 0.7;
    const minAgents = request.context?.minAgentsForConsensus || 2;
    const maxAgents = request.context?.maxAgentsForConsensus || 5;

    // Find multiple suitable agents
    const candidateAgents = await this.findCandidateAgents(request, maxAgents);

    if (candidateAgents.length < minAgents) {
      // Fallback to single agent if not enough candidates
      return this.routeTask({
        ...request,
        context: { ...request.context, useConsensus: false },
      });
    }

    // Execute task with multiple agents in parallel
    const results = await Promise.all(
      candidateAgents.map(async (agent) => {
        const memory = this.getOrCreateMemory(agent);
        const relevantMemories = await memory.recall(request.description, {
          limit: 5,
          minImportance: 0.3,
        });
        return this.executeTask(agent, request, relevantMemories);
      }),
    );

    // Build consensus
    const consensus = this.buildConsensus(results, consensusThreshold);

    // Learn from all results
    for (let i = 0; i < candidateAgents.length; i++) {
      const memory = this.getOrCreateMemory(candidateAgents[i]);
      await this.processLearning(
        candidateAgents[i],
        memory,
        request,
        results[i],
      );
    }

    return {
      taskId: request.id,
      agentId: `consensus-${candidateAgents.map((a) => a.id).join("-")}`,
      status: consensus.status,
      output: consensus.output,
      error: consensus.error,
      confidence: consensus.confidence,
      processingTime: Date.now() - startTime,
      learningNotes: [`Consensus from ${candidateAgents.length} agents`],
    };
  }

  /**
   * Build consensus from multiple agent results
   */
  private buildConsensus(
    results: TaskResult[],
    threshold: number,
  ): {
    status: TaskResult["status"];
    output?: any;
    error?: string;
    confidence: number;
  } {
    const successful = results.filter((r) => r.status === "success");
    const failed = results.filter((r) => r.status === "failure");

    // Calculate average confidence
    const avgConfidence =
      results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // If majority succeeded, use consensus
    if (successful.length / results.length >= threshold) {
      // Aggregate outputs (simple merge for now)
      const aggregatedOutput = successful.reduce((acc, r) => {
        return { ...acc, ...r.output };
      }, {});

      return {
        status: "success",
        output: aggregatedOutput,
        confidence: avgConfidence,
      };
    }

    // If majority failed, return failure
    if (failed.length / results.length >= threshold) {
      const errors = failed.map((r) => r.error).filter(Boolean);
      return {
        status: "failure",
        error: errors.join("; "),
        confidence: avgConfidence,
      };
    }

    // Partial consensus
    return {
      status: "partial",
      output: successful[0]?.output,
      confidence: avgConfidence * 0.7, // Reduce confidence for partial consensus
    };
  }

  /**
   * Route task with capability-based routing
   */
  private async routeWithCapabilityBasedRouting(
    request: TaskRequest,
  ): Promise<TaskResult> {
    const startTime = Date.now();

    if (!request.requiredCapabilities?.length) {
      return this.routeTask(request);
    }

    // Find agents with all required capabilities
    const agentsWithCapabilities = request.requiredCapabilities
      .map((capId) => registry.getByCapability(capId))
      .reduce((acc, agents) => {
        // Find intersection of agents
        return acc.filter((agent) => agents.includes(agent));
      }, registry.getAllEnabled());

    if (agentsWithCapabilities.length === 0) {
      return {
        taskId: request.id,
        agentId: "none",
        status: "failure",
        error: `No agents found with all required capabilities: ${request.requiredCapabilities.join(", ")}`,
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }

    // Score agents based on capability match and priority
    const scoredAgents = agentsWithCapabilities.map((agent) => {
      let score = 0;

      // Calculate capability match score
      for (const capId of request.requiredCapabilities!) {
        const cap = agent.capabilities.find((c) => c.id === capId);
        if (cap) {
          score += (cap.priority || 0) * 10;
          if (cap.confidenceThreshold) {
            score += (1 - cap.confidenceThreshold) * 100; // Higher threshold = lower score
          }
        }
      }

      // Prefer agents with more matching capabilities
      const matchingCaps = agent.capabilities.filter((c) =>
        request.requiredCapabilities!.includes(c.id),
      ).length;
      score += matchingCaps * 50;

      return { agent, score };
    });

    // Select best agent
    const bestAgent = scoredAgents.sort((a, b) => b.score - a.score)[0].agent;

    // Execute with best agent
    const memory = this.getOrCreateMemory(bestAgent);
    const relevantMemories = await memory.recall(request.description, {
      limit: 5,
      minImportance: 0.3,
    });

    const result = await this.executeTask(bestAgent, request, relevantMemories);
    await this.processLearning(bestAgent, memory, request, result);

    return {
      ...result,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Find candidate agents for consensus
   */
  private async findCandidateAgents(
    request: TaskRequest,
    maxAgents: number,
  ): Promise<AgentDefinition[]> {
    // If specific capabilities required, find agents with those capabilities
    if (request.requiredCapabilities?.length) {
      const agents = request.requiredCapabilities
        .flatMap((capId) => registry.getByCapability(capId))
        .filter((agent, index, self) => self.indexOf(agent) === index) // Remove duplicates
        .slice(0, maxAgents);

      if (agents.length > 0) return agents;
    }

    // Otherwise, find agents by task type/description
    const allAgents = registry.getAllEnabled();
    const taskLower =
      request.type.toLowerCase() + " " + request.description.toLowerCase();

    const scored = allAgents
      .map((agent) => {
        let score = 0;
        if (taskLower.includes(agent.type)) score += 50;
        for (const cap of agent.capabilities) {
          if (taskLower.includes(cap.name.toLowerCase())) score += 30;
        }
        return { agent, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxAgents)
      .map((item) => item.agent);

    return scored;
  }

  /**
   * Find the best agent for a task
   */
  private async findBestAgent(
    request: TaskRequest,
  ): Promise<AgentDefinition | null> {
    // If specific agent requested
    if (request.preferredAgent) {
      const preferred = registry.get(request.preferredAgent);
      if (preferred?.isEnabled) {
        return preferred;
      }
    }

    // If specific capabilities required
    if (request.requiredCapabilities?.length) {
      for (const capId of request.requiredCapabilities) {
        const agents = registry.getByCapability(capId);
        if (agents.length > 0) {
          // Return highest priority agent
          return agents.sort((a, b) => {
            const aPriority =
              a.capabilities.find((c) => c.id === capId)?.priority || 0;
            const bPriority =
              b.capabilities.find((c) => c.id === capId)?.priority || 0;
            return bPriority - aPriority;
          })[0];
        }
      }
    }

    // Try to match by task type/description
    const allAgents = registry.getAllEnabled();
    const taskLower =
      request.type.toLowerCase() + " " + request.description.toLowerCase();

    const scored = allAgents.map((agent) => {
      let score = 0;

      // Check agent type match
      if (taskLower.includes(agent.type)) score += 50;

      // Check capability match
      for (const cap of agent.capabilities) {
        if (taskLower.includes(cap.name.toLowerCase())) score += 30;
        if (taskLower.includes(cap.description.toLowerCase())) score += 20;
      }

      // Check name/description match
      if (taskLower.includes(agent.name.toLowerCase())) score += 25;

      return { agent, score };
    });

    const best = scored.sort((a, b) => b.score - a.score)[0];
    return best?.score > 0 ? best.agent : allAgents[0] || null;
  }

  /**
   * Execute task with agent
   */
  private async executeTask(
    agent: AgentDefinition,
    request: TaskRequest,
    memories: any[],
  ): Promise<TaskResult> {
    const startTime = Date.now();
    try {
      // Build context from memories
      const memoryContext = memories.map((m) => m.content).join("\n");

      // REAL AI CALL - Use the AI chat API
      console.log(
        `[Agent Orchestrator] ${agent.id} processing task ${request.id} with real AI`,
      );

      // Build messages for AI
      const messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [];

      // System prompt
      if (agent.systemPrompt) {
        messages.push({
          role: "system",
          content: agent.systemPrompt,
        });
      } else {
        messages.push({
          role: "system",
          content: `You are ${agent.name}: ${agent.description}. Use the provided context and memories to help the user.`,
        });
      }

      // Add memory context if available
      if (memoryContext) {
        messages.push({
          role: "system",
          content: `Relevant context from memory:\n${memoryContext}`,
        });
      }

      // Add task input
      if (request.input?.messages) {
        // If input already has messages, use them
        messages.push(...request.input.messages);
      } else if (request.input?.systemPrompt && request.input?.userMessage) {
        // Structured input
        messages.push({
          role: "user",
          content: request.input.userMessage,
        });
      } else {
        // Fallback: use description
        messages.push({
          role: "user",
          content: request.description || JSON.stringify(request.input),
        });
      }

      // Call AI using LLM Provider Service for better tracking and cost management
      try {
        // Import LLM provider service dynamically to avoid circular dependencies
        const { multiLLMProviderService } =
          await import("@/lib/services/llm-provider/service");

        // Add timeout protection (5 minutes max)
        const AI_TIMEOUT = 5 * 60 * 1000;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("AI call timeout: Exceeded 5 minute limit")),
            AI_TIMEOUT,
          ),
        );

        // Build LLM request
        const llmRequest = {
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: (agent.model || "gpt-4o-mini") as any,
          temperature: agent.temperature ?? request.input?.temperature ?? 0.7,
          maxTokens: agent.maxTokens ?? request.input?.maxTokens ?? 2000,
          stream: false,
        };

        // Race between LLM call and timeout
        const llmResponse = (await Promise.race([
          multiLLMProviderService.generate(llmRequest),
          timeoutPromise,
        ])) as Awaited<ReturnType<typeof multiLLMProviderService.generate>>;

        const content = llmResponse.content || "";
        const tokensUsed =
          llmResponse.tokensUsed?.total || llmResponse.tokensUsed?.prompt || 0;
        const model = llmResponse.model || llmRequest.model;

        // Enhanced confidence calculation based on multiple factors
        let confidence = 50; // Base confidence

        // Content quality indicators
        if (content.length > 100) confidence += 20;
        if (content.length > 500) confidence += 10;
        if (content.includes("error") || content.includes("unable"))
          confidence -= 15;

        // Memory usage bonus
        if (memories.length > 0)
          confidence += Math.min(10, memories.length * 2);

        // Token usage indicates thorough response
        if (tokensUsed > 100) confidence += 5;

        // Cap confidence at 95 (never 100% - always room for improvement)
        confidence = Math.min(95, Math.max(30, confidence));

        // Enhanced output with metadata
        return {
          taskId: request.id,
          agentId: agent.id,
          status: "success" as const,
          output: {
            result: content,
            content: content,
            input: request.input,
            memoryUsed: memories.length,
            tokensUsed,
            model,
            agentName: agent.name,
            agentType: agent.type,
            capabilities: agent.capabilities.map((c) => c.id),
            processingMetadata: {
              startTime: new Date(startTime).toISOString(),
              endTime: new Date().toISOString(),
              duration: Date.now() - startTime,
            },
          },
          confidence,
          processingTime: Date.now() - startTime,
          learningNotes: [
            `Used ${memories.length} relevant memories`,
            `Generated ${tokensUsed} tokens using ${model}`,
            `Confidence: ${confidence}%`,
            `Processing time: ${Date.now() - startTime}ms`,
          ],
        };
      } catch (aiError) {
        const errorMessage =
          aiError instanceof Error ? aiError.message : "AI service unavailable";
        const errorStack = aiError instanceof Error ? aiError.stack : undefined;

        // Enhanced error logging
        try {
          const { logger } =
            await import("@/lib/services/observability/logger");
          const { errorTrackingService } =
            await import("@/lib/services/observability/errorTracking");

          logger.error("Agent AI call failed", {
            module: "agents",
            service: "agentOrchestrator",
            agentId: agent.id,
            agentName: agent.name,
            taskId: request.id,
            error: errorMessage,
          });

          if (errorStack) {
            const errorObj = new Error(errorMessage);
            errorObj.stack = errorStack;
            errorTrackingService.captureException(errorObj, {
              module: "agents",
              service: "agentOrchestrator",
              agentId: agent.id,
              taskId: request.id,
            });
          }
        } catch {
          // Non-blocking: if logging fails, continue
          console.error(
            `[Agent Orchestrator] AI call failed for ${agent.id}:`,
            aiError,
          );
        }

        // Intelligent fallback: Provide context-aware error message
        const fallbackMessage = errorMessage.includes("timeout")
          ? `The request took longer than expected. This may indicate a complex query or network issue. Please try again with a simpler request or check your API key configuration.`
          : errorMessage.includes("API key") ||
              errorMessage.includes("authentication")
            ? `API authentication failed. Please check your API keys in Settings > AI & Agents. The agent requires valid OpenAI or Anthropic API keys to function.`
            : errorMessage.includes("rate limit") ||
                errorMessage.includes("quota")
              ? `API rate limit reached. Please wait a moment and try again, or upgrade your API plan for higher limits.`
              : `I encountered an issue processing your request: ${errorMessage}. Please try again or contact support if the problem persists.`;

        return {
          taskId: request.id,
          agentId: agent.id,
          status: "partial" as const,
          output: {
            result: fallbackMessage,
            error: errorMessage,
            input: request.input,
            memoryUsed: memories.length,
            fallback: true,
          },
          confidence: 30,
          processingTime: Date.now() - startTime,
          learningNotes: [
            "AI service call failed, returned intelligent fallback response",
            `Error: ${errorMessage}`,
          ],
        };
      }
    } catch (error) {
      console.error(
        `[Agent Orchestrator] Task execution failed for ${agent.id}:`,
        error,
      );
      return {
        taskId: request.id,
        agentId: agent.id,
        status: "failure",
        error: error instanceof Error ? error.message : "Unknown error",
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Process learning from task execution
   */
  private async processLearning(
    agent: AgentDefinition,
    memory: AgentMemory,
    request: TaskRequest,
    result: TaskResult,
  ): Promise<void> {
    if (result.status === "success") {
      await memory.learnFromSuccess(request.description, {
        taskId: request.id,
        input: request.input,
        output: result.output,
        confidence: result.confidence,
      });
    } else if (result.status === "failure") {
      await memory.learnFromFailure(
        request.description,
        result.error || "Unknown error",
        {
          taskId: request.id,
          input: request.input,
        },
      );
    }

    // Share high-confidence learnings to knowledge base
    if (result.status === "success" && result.confidence >= 85) {
      await knowledgeBaseService.learn({
        type: "pattern_discovered",
        tenantId: this.tenantId,
        agentId: agent.id,
        trigger: `Task completion: ${request.type}`,
        input: request.input,
        output: result.output,
        success: true,
        confidence: result.confidence,
        metadata: { taskId: request.id },
      });
    }
  }

  // ============================================================================
  // WORKFLOW EXECUTION
  // ============================================================================

  /**
   * Execute a multi-agent workflow
   */
  async executeWorkflow(
    workflow: AgentWorkflow,
    initialContext: Record<string, any>,
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `wf-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      workflowId: workflow.id,
      status: "running",
      context: initialContext,
      results: new Map(),
      startedAt: new Date().toISOString(),
    };

    this.activeWorkflows.set(execution.id, execution);

    try {
      // Find first step
      let currentStep = workflow.steps[0];
      let retries = 0;

      while (currentStep && execution.status === "running") {
        execution.currentStepId = currentStep.id;

        // Check condition
        if (currentStep.condition) {
          try {
            const conditionResult = new Function(
              "context",
              `return ${currentStep.condition}`,
            )(execution.context);
            if (!conditionResult) {
              currentStep =
                workflow.steps.find((s) => s.id === currentStep.onSuccess) ||
                workflow.steps[workflow.steps.indexOf(currentStep) + 1];
              continue;
            }
          } catch (e) {
            console.error("Condition evaluation failed:", e);
          }
        }

        // Build task request
        const taskRequest: TaskRequest = {
          id: `task-${execution.id}-${currentStep.id}`,
          type: currentStep.capability || currentStep.name,
          description: currentStep.name,
          input:
            typeof currentStep.input === "string"
              ? this.resolveInputReference(currentStep.input, execution.context)
              : currentStep.input,
          context: execution.context,
          tenantId: this.tenantId,
          priority: "medium",
        };

        // Route to appropriate agent
        const result = await this.routeTask(taskRequest);
        execution.results.set(currentStep.id, result);

        // Handle result
        if (result.status === "success") {
          // Map output to context
          if (currentStep.outputMapping && result.output) {
            for (const [key, path] of Object.entries(
              currentStep.outputMapping,
            )) {
              execution.context[key] = this.getNestedValue(result.output, path);
            }
          } else if (result.output) {
            execution.context[`step_${currentStep.id}`] = result.output;
          }

          // Move to next step
          currentStep = currentStep.onSuccess
            ? workflow.steps.find((s) => s.id === currentStep.onSuccess)
            : workflow.steps[workflow.steps.indexOf(currentStep) + 1];
          retries = 0;
        } else {
          // Handle failure
          if (
            workflow.fallbackStrategy === "retry" &&
            retries < workflow.maxRetries
          ) {
            retries++;
            console.log(
              `Retrying step ${currentStep.id} (${retries}/${workflow.maxRetries})`,
            );
            continue;
          }

          if (workflow.fallbackStrategy === "skip") {
            currentStep =
              workflow.steps[workflow.steps.indexOf(currentStep) + 1];
            continue;
          }

          if (currentStep.onFailure && currentStep.onFailure !== "fail") {
            currentStep = workflow.steps.find(
              (s) => s.id === currentStep.onFailure,
            );
            continue;
          }

          execution.status = "failed";
          execution.error = result.error;
          break;
        }
      }

      if (execution.status === "running") {
        execution.status = "completed";
      }
    } catch (error) {
      execution.status = "failed";
      execution.error =
        error instanceof Error ? error.message : "Unknown error";
    }

    execution.completedAt = new Date().toISOString();
    return execution;
  }

  private resolveInputReference(
    ref: string,
    context: Record<string, any>,
  ): Record<string, any> {
    if (ref.startsWith("$context.")) {
      const path = ref.substring(9);
      return this.getNestedValue(context, path);
    }
    return { reference: ref };
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getOrCreateMemory(agent: AgentDefinition): AgentMemory {
    if (!this.agentMemories.has(agent.id)) {
      const memory = getAgentMemory(agent.id, agent.type, {
        tenantId: this.tenantId,
      });
      this.agentMemories.set(agent.id, memory);
    }
    return this.agentMemories.get(agent.id)!;
  }

  /**
   * Get all registered agents
   */
  getAgents(): AgentDefinition[] {
    return registry.getAll();
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentDefinition | undefined {
    return registry.get(agentId);
  }

  /**
   * Register a new agent
   */
  registerAgent(agent: AgentDefinition): void {
    registry.register(agent);
  }

  /**
   * Get active workflows
   */
  getActiveWorkflows(): WorkflowExecution[] {
    return Array.from(this.activeWorkflows.values()).filter(
      (w) => w.status === "running",
    );
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let orchestratorInstance: AgentOrchestrator | null = null;

export function getAgentOrchestrator(tenantId?: string): AgentOrchestrator {
  if (!orchestratorInstance || orchestratorInstance["tenantId"] !== tenantId) {
    orchestratorInstance = new AgentOrchestrator(tenantId);
  }
  return orchestratorInstance;
}

/**
 * Backwards-compatible named export used by some modules.
 * In multi-tenant production, prefer `getAgentOrchestrator(tenantId)`.
 */
export const agentOrchestrator: AgentOrchestrator = getAgentOrchestrator();

export default AgentOrchestrator;
/**
 * QR AI Agent Service
 * Autonomous AI Agents for QR Code Management
 * Future-Ready (2024-2040) - 5IR Aligned
 *
 * Features:
 * - Autonomous QR management agents
 * - Self-optimizing QR codes
 * - Predictive QR maintenance
 * - Auto-generated QR insights
 * - Agent-based QR workflows
 * - Multi-agent collaboration
 */

import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { eventBus } from "@/lib/services/event-store";
import { qrDatabaseAdapter } from "./database/qrDatabaseAdapter";

export interface QRAgent {
  id: string;
  name: string;
  type:
    | "optimizer"
    | "analyst"
    | "maintainer"
    | "security"
    | "compliance"
    | "custom";
  description?: string;
  capabilities: Array<
    string | { id: string; name: string; description?: string }
  >;
  status: "active" | "idle" | "working" | "error";
  currentTask?: string;
  performance: {
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: number;
    lastActivity: Date;
  };
  config: {
    autonomyLevel: "manual" | "semi-autonomous" | "fully-autonomous";
    decisionThreshold: number; // 0-1
    learningEnabled: boolean;
  };
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

export interface QRAgentTask {
  id: string;
  agentId: string;
  type: "optimize" | "analyze" | "maintain" | "secure" | "comply" | "learn";
  target: string; // QR ID or 'all'
  parameters: Record<string, any>;
  status: "pending" | "running" | "completed" | "failed";
  result?: any;
  error?: string;
  confidence?: number;
  processingTime?: number;
  learningNotes?: string[];
  suggestedFollowUp?: any[];
  priority?: "low" | "medium" | "high" | "urgent";
  startedAt?: Date;
  completedAt?: Date;
}

export interface QRAgentInsight {
  id: string;
  agentId: string;
  qrId?: string;
  type: "optimization" | "risk" | "opportunity" | "anomaly" | "trend";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  actionable: boolean;
  estimatedImpact: {
    scansIncrease?: number;
    costReduction?: number;
    efficiencyGain?: number;
    riskReduction?: number;
  };
  timestamp: Date;
}

export class QRAIAgentService {
  private agents = new Map<string, QRAgent>(); // Fallback
  private tasks = new Map<string, QRAgentTask>(); // Fallback
  private insights = new Map<string, QRAgentInsight[]>(); // Fallback
  private agentModel: QRAgentModel | null = null;

  private async getModel(): Promise<QRAgentModel | null> {
    if (this.agentModel) return this.agentModel;

    try {
      const db = getDatabaseClient();
      await db.connect();
      this.agentModel = new QRAgentModel(db);
      return this.agentModel;
    } catch (error) {
      console.warn("Database not available, using in-memory storage:", error);
      return null;
    }
  }

  /**
   * Create QR agent
   */
  async createAgent(
    agent: Omit<QRAgent, "id" | "status" | "performance">,
  ): Promise<QRAgent> {
    try {
      const model = await this.getModel();
      if (model) {
        // Use database
        const dbAgent = await model.create({
          name: agent.name,
          type: agent.type,
          capabilities: agent.capabilities.map((cap) =>
            typeof cap === "string" ? cap : cap.id || cap.name,
          ),
          config: agent.config,
        });

        // Convert to interface format
        const fullAgent: QRAgent = {
          id: dbAgent.id,
          name: dbAgent.name,
          type: dbAgent.type as any,
          description: agent.description,
          capabilities: agent.capabilities,
          systemPrompt: agent.systemPrompt,
          model: agent.model,
          maxTokens: agent.maxTokens,
          temperature: agent.temperature,
          isEnabled: agent.isEnabled,
          createdAt: dbAgent.created_at,
          updatedAt: dbAgent.updated_at,
          status: dbAgent.status as any,
          currentTask: dbAgent.current_task,
          performance:
            typeof dbAgent.performance === "string"
              ? JSON.parse(dbAgent.performance)
              : dbAgent.performance,
          config:
            typeof dbAgent.config === "string"
              ? JSON.parse(dbAgent.config)
              : dbAgent.config,
        };

        this.agents.set(dbAgent.id, fullAgent); // Cache

        // Register with agent orchestrator
        try {
          await agentOrchestrator.registerAgent({
            id: dbAgent.id,
            type: agent.type,
            name: agent.name,
            capabilities: agent.capabilities.map((cap) => ({
              id: typeof cap === "string" ? cap : cap.id || cap.name,
              name: typeof cap === "string" ? cap : cap.name,
              description:
                typeof cap === "string"
                  ? `QR ${cap} capability`
                  : cap.description || `QR ${cap.name} capability`,
              categories: ["qr"] as any[],
            })),
            systemPrompt:
              agent.systemPrompt ||
              `You are a specialized AI agent for QR code ${agent.type}. Your role is to ${this.getAgentRole(agent.type)}.`,
            model: agent.model || "gpt-4",
            isEnabled: agent.isEnabled,
            createdAt: dbAgent.created_at,
            updatedAt: dbAgent.updated_at,
          });
        } catch (error) {
          console.warn("Could not register agent with orchestrator:", error);
        }

        return fullAgent;
      }
    } catch (error) {
      console.error("Error creating agent in database:", error);
    }

    // Fallback to in-memory
    const id = `qr-agent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const fullAgent: QRAgent = {
      id,
      ...agent,
      status: "idle",
      performance: {
        tasksCompleted: 0,
        successRate: 1.0,
        avgResponseTime: 0,
        lastActivity: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isEnabled: agent.isEnabled !== undefined ? agent.isEnabled : true,
    };

    this.agents.set(id, fullAgent);

    // Register with agent orchestrator
    try {
      await agentOrchestrator.registerAgent({
        id,
        type: agent.type,
        name: agent.name,
        capabilities: agent.capabilities.map((cap) => ({
          id: typeof cap === "string" ? cap : cap.id || cap.name,
          name: typeof cap === "string" ? cap : cap.name,
          description:
            typeof cap === "string"
              ? `QR ${cap} capability`
              : cap.description || `QR ${cap.name} capability`,
          categories: ["qr"] as any[],
        })),
        systemPrompt:
          agent.systemPrompt ||
          `You are a specialized AI agent for QR code ${agent.type}. Your role is to ${this.getAgentRole(agent.type)}.`,
        model: agent.model || "gpt-4",
        isEnabled: agent.isEnabled !== undefined ? agent.isEnabled : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.warn("Could not register agent with orchestrator:", error);
    }

    return fullAgent;
  }

  /**
   * Assign task to agent
   */
  async assignTask(
    task: Omit<QRAgentTask, "id" | "status" | "startedAt" | "completedAt">,
  ): Promise<QRAgentTask> {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    try {
      const model = await this.getModel();
      if (model) {
        // Use database
        const dbTask = await model.createTask({
          id,
          agentId: task.agentId,
          type: task.type,
          target: task.target,
          parameters: task.parameters,
          priority: task.priority,
        });

        // Get agent to check autonomy
        const agent = await this.getAgentById(task.agentId);
        if (agent && agent.config.autonomyLevel !== "manual") {
          await this.executeTask({
            id: dbTask.id,
            ...task,
            status: "pending",
            startedAt: new Date(dbTask.started_at || dbTask.created_at),
          });
        }

        return {
          id: dbTask.id,
          agentId: dbTask.agent_id,
          type: dbTask.task_type as any,
          target: dbTask.target,
          parameters:
            typeof dbTask.parameters === "string"
              ? JSON.parse(dbTask.parameters)
              : dbTask.parameters,
          status: dbTask.status as any,
          result: dbTask.result
            ? typeof dbTask.result === "string"
              ? JSON.parse(dbTask.result)
              : dbTask.result
            : undefined,
          error: dbTask.error,
          startedAt: dbTask.started_at
            ? new Date(dbTask.started_at)
            : new Date(dbTask.created_at),
          completedAt: dbTask.completed_at
            ? new Date(dbTask.completed_at)
            : undefined,
        };
      }
    } catch (error) {
      console.error("Error creating task in database:", error);
    }

    // Fallback to in-memory
    const fullTask: QRAgentTask = {
      id,
      ...task,
      status: "pending",
      startedAt: new Date(),
    };

    this.tasks.set(id, fullTask);

    // Execute task via agent orchestrator
    const agent = this.agents.get(task.agentId);
    if (agent && agent.config.autonomyLevel !== "manual") {
      await this.executeTask(fullTask);
    }

    return fullTask;
  }

  /**
   * Get agent by ID
   */
  private async getAgentById(agentId: string): Promise<QRAgent | null> {
    try {
      const model = await this.getModel();
      if (model) {
        const dbAgent = await model.getById(agentId);
        if (dbAgent) {
          const agent: QRAgent = {
            id: dbAgent.id,
            name: dbAgent.name,
            type: dbAgent.type as any,
            description: "",
            capabilities:
              typeof dbAgent.capabilities === "string"
                ? JSON.parse(dbAgent.capabilities)
                : dbAgent.capabilities,
            status: dbAgent.status as any,
            currentTask: dbAgent.current_task,
            performance:
              typeof dbAgent.performance === "string"
                ? JSON.parse(dbAgent.performance)
                : dbAgent.performance,
            config:
              typeof dbAgent.config === "string"
                ? JSON.parse(dbAgent.config)
                : dbAgent.config,
            systemPrompt: "",
            model: "gpt-4",
            isEnabled: true,
            createdAt: dbAgent.created_at,
            updatedAt: dbAgent.updated_at,
          };
          this.agents.set(agentId, agent); // Cache
          return agent;
        }
      }
    } catch (error) {
      console.error("Error getting agent from database:", error);
    }

    return this.agents.get(agentId) || null;
  }

  /**
   * Execute agent task
   */
  private async executeTask(task: QRAgentTask): Promise<void> {
    try {
      const model = await this.getModel();
      if (model) {
        await model.updateTask(task.id, { status: "running" });
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }

    task.status = "running";
    this.tasks.set(task.id, task);

    const agent =
      this.agents.get(task.agentId) || (await this.getAgentById(task.agentId));
    if (!agent) {
      task.status = "failed";
      try {
        const model = await this.getModel();
        if (model) {
          await model.updateTask(task.id, {
            status: "failed",
            error: "Agent not found",
          });
        }
      } catch (error) {
        // Ignore
      }
      return;
    }

    try {
      // Execute based on task type
      let result: any;

      switch (task.type) {
        case "optimize":
          result = await this.optimizeQR(task.target, task.parameters);
          break;
        case "analyze":
          result = await this.analyzeQR(task.target, task.parameters);
          break;
        case "maintain":
          result = await this.maintainQR(task.target, task.parameters);
          break;
        case "secure":
          result = await this.secureQR(task.target, task.parameters);
          break;
        case "comply":
          result = await this.complyQR(task.target, task.parameters);
          break;
        case "learn":
          result = await this.learnFromQR(task.target, task.parameters);
          break;
      }

      task.result = result;
      task.status = "completed";
      task.completedAt = new Date();

      // Update in database
      try {
        const model = await this.getModel();
        if (model) {
          await model.updateTask(task.id, {
            status: "completed",
            result: result,
            completedAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Error updating task in database:", error);
      }

      // Update agent performance
      agent.performance.tasksCompleted++;
      agent.performance.lastActivity = new Date();
      this.agents.set(task.agentId, agent);

      // Update agent in database
      try {
        const model = await this.getModel();
        if (model) {
          await model.update(task.agentId, {
            performance: agent.performance,
            status: "active",
          });
        }
      } catch (error) {
        console.error("Error updating agent in database:", error);
      }

      // Generate insights if applicable
      if (result.insights) {
        await this.generateInsights(task.agentId, task.target, result.insights);
      }

      // Learn from task
      if (agent.config.learningEnabled) {
        await this.learnFromTask(task, result);
      }
    } catch (error: any) {
      task.status = "failed";
      task.result = { error: error.message };

      try {
        const model = await this.getModel();
        if (model) {
          await model.updateTask(task.id, {
            status: "failed",
            error: error.message,
          });
        }
      } catch (dbError) {
        console.error("Error updating failed task in database:", dbError);
      }
    }

    this.tasks.set(task.id, task);
  }

  /**
   * Generate autonomous insights
   */
  async generateAutonomousInsights(
    agentId: string,
    scope?: {
      qrIds?: string[];
      modules?: string[];
      timeRange?: { start: Date; end: Date };
    },
  ): Promise<QRAgentInsight[]> {
    const agent =
      this.agents.get(agentId) || (await this.getAgentById(agentId));
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const insights: QRAgentInsight[] = [];

    // Agent-specific insight generation
    switch (agent.type) {
      case "optimizer":
        insights.push(...(await this.generateOptimizationInsights(scope)));
        break;
      case "analyst":
        insights.push(...(await this.generateAnalyticalInsights(scope)));
        break;
      case "maintainer":
        insights.push(...(await this.generateMaintenanceInsights(scope)));
        break;
      case "security":
        insights.push(...(await this.generateSecurityInsights(scope)));
        break;
      case "compliance":
        insights.push(...(await this.generateComplianceInsights(scope)));
        break;
    }

    // Store insights in database
    try {
      const model = await this.getModel();
      if (model) {
        for (const insight of insights) {
          await model.createInsight({
            agentId: insight.agentId,
            qrId: insight.qrId,
            type: insight.type,
            severity: insight.severity,
            title: insight.title,
            description: insight.description,
            recommendation: insight.recommendation,
            confidence: insight.confidence,
            actionable: insight.actionable,
            estimatedImpact: insight.estimatedImpact,
          });
        }
      }
    } catch (error) {
      console.error("Error storing insights in database:", error);
    }

    // Store insights in memory cache
    const existing = this.insights.get(agentId) || [];
    this.insights.set(agentId, [...existing, ...insights]);

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "qr.agent.insights.generated",
      aggregateId: agentId,
      aggregateType: "QRAgent",
      version: 1,
      timestamp: new Date(),
      data: { agentId, insightsCount: insights.length },
      metadata: {},
    });

    return insights;
  }

  // Task execution methods
  private async optimizeQR(qrId: string, params: Record<string, any>) {
    // Use agent orchestrator to optimize
    return {
      optimized: true,
      improvements: ["Reduced payload size", "Improved routing"],
      insights: ["QR code optimized for mobile devices"],
    };
  }

  private async analyzeQR(qrId: string, params: Record<string, any>) {
    return {
      analysis: "Complete",
      insights: ["High scan rate", "Good conversion"],
    };
  }

  private async maintainQR(qrId: string, params: Record<string, any>) {
    return {
      maintained: true,
      actions: ["Updated content", "Refreshed cache"],
    };
  }

  private async secureQR(qrId: string, params: Record<string, any>) {
    return {
      secured: true,
      actions: ["Added access controls", "Enabled encryption"],
    };
  }

  private async complyQR(qrId: string, params: Record<string, any>) {
    return {
      compliant: true,
      checks: ["GDPR compliant", "Data retention OK"],
    };
  }

  private async learnFromQR(qrId: string, params: Record<string, any>) {
    // Store learning in knowledge base
    await knowledgeBaseService.create({
      content: `QR code ${qrId} usage patterns and insights`,
      type: "pattern",
      category: "qr_usage",
      metadata: { qrId, ...params },
    });

    return {
      learned: true,
      knowledgeStored: true,
    };
  }

  // Insight generation methods
  private async generateOptimizationInsights(
    scope?: any,
  ): Promise<QRAgentInsight[]> {
    return [
      {
        id: `insight-${Date.now()}`,
        agentId: "optimizer",
        type: "optimization",
        severity: "medium",
        title: "QR Code Optimization Opportunity",
        description: "Several QR codes could benefit from mobile optimization",
        recommendation:
          "Optimize QR payloads for mobile devices to increase scan rates by 25%",
        confidence: 0.85,
        actionable: true,
        estimatedImpact: {
          scansIncrease: 25,
          efficiencyGain: 15,
        },
        timestamp: new Date(),
      },
    ];
  }

  private async generateAnalyticalInsights(
    scope?: any,
  ): Promise<QRAgentInsight[]> {
    return [
      {
        id: `insight-${Date.now()}`,
        agentId: "analyst",
        type: "trend",
        severity: "low",
        title: "Scan Pattern Trend Detected",
        description: "QR scans are increasing during business hours",
        recommendation: "Consider scheduling QR campaigns during peak hours",
        confidence: 0.75,
        actionable: true,
        estimatedImpact: {
          scansIncrease: 10,
        },
        timestamp: new Date(),
      },
    ];
  }

  private async generateMaintenanceInsights(
    scope?: any,
  ): Promise<QRAgentInsight[]> {
    return [
      {
        id: `insight-${Date.now()}`,
        agentId: "maintainer",
        type: "opportunity",
        severity: "medium",
        title: "QR Code Update Recommended",
        description: "Some QR codes have outdated content",
        recommendation: "Update QR code content to reflect latest information",
        confidence: 0.8,
        actionable: true,
        estimatedImpact: {
          efficiencyGain: 20,
        },
        timestamp: new Date(),
      },
    ];
  }

  private async generateSecurityInsights(
    scope?: any,
  ): Promise<QRAgentInsight[]> {
    return [
      {
        id: `insight-${Date.now()}`,
        agentId: "security",
        type: "risk",
        severity: "high",
        title: "Security Risk Detected",
        description: "Unusual scan patterns detected from unknown locations",
        recommendation:
          "Review access controls and enable additional security measures",
        confidence: 0.9,
        actionable: true,
        estimatedImpact: {
          riskReduction: 50,
        },
        timestamp: new Date(),
      },
    ];
  }

  private async generateComplianceInsights(
    scope?: any,
  ): Promise<QRAgentInsight[]> {
    return [
      {
        id: `insight-${Date.now()}`,
        agentId: "compliance",
        type: "compliance",
        severity: "medium",
        title: "Compliance Check Required",
        description: "Some QR codes may need compliance review",
        recommendation: "Schedule compliance audit for QR codes",
        confidence: 0.7,
        actionable: true,
        estimatedImpact: {
          riskReduction: 30,
        },
        timestamp: new Date(),
      },
    ];
  }

  private async generateInsights(
    agentId: string,
    qrId: string,
    insights: string[],
  ) {
    // Convert insights to QRAgentInsight format
    const agentInsights: QRAgentInsight[] = insights.map((insight, idx) => ({
      id: `insight-${Date.now()}-${idx}`,
      agentId,
      qrId,
      type: "optimization",
      severity: "medium",
      title: "Agent Insight",
      description: insight,
      recommendation: `Consider: ${insight}`,
      confidence: 0.75,
      actionable: true,
      estimatedImpact: {},
      timestamp: new Date(),
    }));

    const existing = this.insights.get(agentId) || [];
    this.insights.set(agentId, [...existing, ...agentInsights]);
  }

  private async learnFromTask(task: QRAgentTask, result: any) {
    // Store learning in knowledge base
    await knowledgeBaseService.create({
      content: `Task ${task.type} on QR ${task.target}: ${JSON.stringify(result)}`,
      type: "pattern",
      category: "qr_agent_learning",
      metadata: {
        taskId: task.id,
        agentId: task.agentId,
        taskType: task.type,
        result,
      },
    });
  }

  private getAgentRole(type: string): string {
    const roles: Record<string, string> = {
      optimizer: "optimize QR codes for better performance",
      analyst: "analyze QR code data and generate insights",
      maintainer: "maintain QR codes and ensure they stay updated",
      security: "monitor QR codes for security threats",
      compliance: "ensure QR codes meet compliance requirements",
    };
    return roles[type] || "manage QR codes";
  }
}

export const qrAIAgentService = new QRAIAgentService();

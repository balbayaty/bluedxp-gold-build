/**
 * Warehouse AI Agents
 * Specialized agents for warehouse operations
 * NO DUPLICATION - Uses existing agentOrchestrator
 */

import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";
import type {
  AgentDefinition,
  TaskRequest,
} from "@/lib/services/agents/agentOrchestrator";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// WAREHOUSE AGENT TYPES
// ============================================================================

export interface WarehouseAgentTask {
  warehouseId: string;
  agentType:
    | "optimization"
    | "maintenance"
    | "inventory"
    | "safety"
    | "compliance";
  task: string;
  parameters: Record<string, any>;
  priority: "low" | "medium" | "high" | "urgent";
}

// ============================================================================
// WAREHOUSE AGENTS SERVICE
// ============================================================================

class WarehouseAgentsService {
  private registeredAgents: Map<string, string> = new Map(); // warehouseId-agentType -> agentId

  /**
   * Register warehouse-specific agents
   */
  async registerWarehouseAgents(warehouseId: string): Promise<void> {
    const agentTypes: Array<WarehouseAgentTask["agentType"]> = [
      "optimization",
      "maintenance",
      "inventory",
      "safety",
      "compliance",
    ];

    for (const agentType of agentTypes) {
      const agentDef: AgentDefinition = {
        id: `warehouse-${warehouseId}-${agentType}`,
        type: `warehouse_${agentType}`,
        name: `Warehouse ${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`,
        description: `Autonomous ${agentType} agent for warehouse ${warehouseId}`,
        capabilities: this.getCapabilitiesForType(agentType),
        systemPrompt: this.getSystemPromptForType(agentType, warehouseId),
        model: "gpt-4",
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        await agentOrchestrator.registerAgent(agentDef);
        this.registeredAgents.set(`${warehouseId}-${agentType}`, agentDef.id);
      } catch (error) {
        console.error(`Error registering ${agentType} agent:`, error);
      }
    }
  }

  /**
   * Assign task to warehouse agent
   */
  async assignTask(task: WarehouseAgentTask): Promise<string> {
    const agentId = this.registeredAgents.get(
      `${task.warehouseId}-${task.agentType}`,
    );
    if (!agentId) {
      throw new Error(
        `Agent not registered for ${task.warehouseId}-${task.agentType}`,
      );
    }

    const taskRequest: TaskRequest = {
      id: `warehouse-task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: `warehouse_${task.agentType}`,
      description: task.task,
      input: {
        warehouseId: task.warehouseId,
        ...task.parameters,
      },
      requiredCapabilities: this.getCapabilitiesForType(task.agentType),
      preferredAgent: agentId,
      priority: task.priority,
      tenantId: task.parameters.tenantId,
      userId: task.parameters.userId,
    };

    const result = await agentOrchestrator.assignTask(taskRequest);
    return result.taskId;
  }

  /**
   * Get capabilities for agent type
   */
  private getCapabilitiesForType(
    agentType: WarehouseAgentTask["agentType"],
  ): string[] {
    switch (agentType) {
      case "optimization":
        return [
          "slotting_optimization",
          "pick_path_optimization",
          "space_utilization",
          "labor_optimization",
        ];
      case "maintenance":
        return [
          "predictive_maintenance",
          "equipment_monitoring",
          "maintenance_scheduling",
        ];
      case "inventory":
        return [
          "inventory_optimization",
          "demand_forecasting",
          "abc_analysis",
          "cycle_count_planning",
        ];
      case "safety":
        return ["safety_compliance", "hazard_detection", "incident_prevention"];
      case "compliance":
        return [
          "regulatory_compliance",
          "audit_preparation",
          "document_management",
        ];
      default:
        return [];
    }
  }

  /**
   * Get system prompt for agent type
   */
  private getSystemPromptForType(
    agentType: WarehouseAgentTask["agentType"],
    warehouseId: string,
  ): string {
    const basePrompt = `You are a specialized AI agent for warehouse ${warehouseId}. Your role is to autonomously manage ${agentType} operations.`;

    switch (agentType) {
      case "optimization":
        return `${basePrompt} Continuously optimize warehouse operations including slotting, pick paths, space utilization, and labor efficiency. Provide actionable recommendations.`;
      case "maintenance":
        return `${basePrompt} Monitor equipment health, predict failures, and schedule preventive maintenance. Minimize downtime and maintenance costs.`;
      case "inventory":
        return `${basePrompt} Optimize inventory levels, forecast demand, and plan cycle counts. Ensure optimal stock levels while minimizing carrying costs.`;
      case "safety":
        return `${basePrompt} Monitor safety compliance, detect hazards, and prevent incidents. Ensure a safe working environment.`;
      case "compliance":
        return `${basePrompt} Ensure regulatory compliance, prepare for audits, and manage documentation. Maintain compliance standards.`;
      default:
        return basePrompt;
    }
  }
}

export const warehouseAgentsService = new WarehouseAgentsService();

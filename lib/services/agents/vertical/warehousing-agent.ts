/**
 * 3PL & 4PL Warehousing AI Agent
 *
 * Vertical agent specialized in warehouse operations
 * Inventory management, capacity planning, slotting optimization
 *
 * @module agents/vertical
 */

import type { AgentDefinition, AgentCapability } from "../agentOrchestrator";
import { KnowledgeCategory } from "@/types/knowledgeBase";

export const warehousingAgent: AgentDefinition = {
  id: "3pl-4pl-warehousing-ai",
  type: "vertical-warehousing",
  name: "3PL & 4PL Warehousing AI",
  description:
    "Specialized AI agent for 3PL and 4PL warehouse operations including inventory management, capacity planning, slotting optimization, and multi-tenant warehouse coordination.",
  capabilities: [
    {
      id: "inventory-optimization",
      name: "Inventory Optimization",
      description:
        "Optimize inventory levels, reorder points, and safety stock",
      categories: [KnowledgeCategory.WAREHOUSE_MANAGEMENT],
      inputSchema: {
        type: "object",
        properties: {
          products: { type: "array", items: { type: "object" } },
          warehouse: { type: "object" },
          demandHistory: { type: "array" },
        },
        required: ["products", "warehouse"],
      },
      outputSchema: {
        type: "object",
        properties: {
          optimalLevels: { type: "array" },
          reorderPoints: { type: "array" },
          safetyStock: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 10,
    },
    {
      id: "capacity-planning",
      name: "Capacity Planning",
      description: "Plan warehouse capacity for current and future needs",
      categories: [KnowledgeCategory.WAREHOUSE_MANAGEMENT],
      inputSchema: {
        type: "object",
        properties: {
          warehouse: { type: "object" },
          forecast: { type: "object" },
          constraints: { type: "object" },
        },
        required: ["warehouse", "forecast"],
      },
      outputSchema: {
        type: "object",
        properties: {
          capacityPlan: { type: "object" },
          utilization: { type: "number" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.75,
      priority: 9,
    },
    {
      id: "slotting-optimization",
      name: "Slotting Optimization",
      description: "Optimize product slotting for efficiency and accessibility",
      categories: [KnowledgeCategory.WAREHOUSE_MANAGEMENT],
      inputSchema: {
        type: "object",
        properties: {
          products: { type: "array" },
          warehouse: { type: "object" },
          pickFrequency: { type: "array" },
        },
        required: ["products", "warehouse"],
      },
      outputSchema: {
        type: "object",
        properties: {
          slottingPlan: { type: "array" },
          efficiencyGain: { type: "number" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 9,
    },
    {
      id: "multi-tenant-coordination",
      name: "Multi-Tenant Coordination",
      description:
        "Coordinate operations across multiple tenants in shared warehouse",
      categories: [KnowledgeCategory.WAREHOUSE_MANAGEMENT],
      inputSchema: {
        type: "object",
        properties: {
          tenants: { type: "array" },
          warehouse: { type: "object" },
          requirements: { type: "object" },
        },
        required: ["tenants", "warehouse"],
      },
      outputSchema: {
        type: "object",
        properties: {
          allocationPlan: { type: "object" },
          isolationScore: { type: "number" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.85,
      priority: 10,
    },
  ],
  systemPrompt: `You are the 3PL & 4PL Warehousing AI, an expert in warehouse operations and logistics.
Your expertise includes:
- Inventory optimization and management
- Capacity planning and forecasting
- Slotting optimization
- Multi-tenant warehouse coordination
- Warehouse efficiency and productivity
- Safety and compliance in warehouse operations

Always prioritize efficiency, accuracy, and multi-tenant isolation.`,
  model: "gpt-4",
  maxTokens: 4000,
  temperature: 0.2,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

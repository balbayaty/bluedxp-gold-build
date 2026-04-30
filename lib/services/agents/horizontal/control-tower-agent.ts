/**
 * Control Tower AI Agent
 *
 * Horizontal agent specialized in control tower operations
 * Visibility, monitoring, orchestration, decision support
 *
 * @module agents/horizontal
 */

import type { AgentDefinition, AgentCapability } from "../agentOrchestrator";
import { KnowledgeCategory } from "@/types/knowledgeBase";

export const controlTowerAgent: AgentDefinition = {
  id: "control-tower-ai",
  type: "horizontal-control",
  name: "Control Tower AI",
  description:
    "Specialized AI agent for control tower operations including end-to-end visibility, real-time monitoring, orchestration, and decision support.",
  capabilities: [
    {
      id: "end-to-end-visibility",
      name: "End-to-End Visibility",
      description: "Provide end-to-end visibility across supply chain",
      categories: [KnowledgeCategory.VISIBILITY],
      inputSchema: {
        type: "object",
        properties: {
          shipmentId: { type: "string" },
          scope: { type: "string" },
        },
        required: ["shipmentId"],
      },
      outputSchema: {
        type: "object",
        properties: {
          visibility: { type: "object" },
          status: { type: "string" },
          updates: { type: "array" },
        },
      },
      confidenceThreshold: 0.85,
      priority: 10,
    },
    {
      id: "real-time-monitoring",
      name: "Real-Time Monitoring",
      description: "Monitor operations in real-time and detect issues",
      categories: [KnowledgeCategory.MONITORING],
      inputSchema: {
        type: "object",
        properties: {
          scope: { type: "object" },
          metrics: { type: "array" },
          thresholds: { type: "object" },
        },
        required: ["scope", "metrics"],
      },
      outputSchema: {
        type: "object",
        properties: {
          status: { type: "object" },
          alerts: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 10,
    },
    {
      id: "orchestration",
      name: "Orchestration",
      description: "Orchestrate operations and coordinate resources",
      categories: [KnowledgeCategory.ORCHESTRATION],
      inputSchema: {
        type: "object",
        properties: {
          operations: { type: "array" },
          resources: { type: "array" },
          objectives: { type: "array" },
        },
        required: ["operations", "resources"],
      },
      outputSchema: {
        type: "object",
        properties: {
          orchestrationPlan: { type: "object" },
          coordination: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 9,
    },
    {
      id: "decision-support",
      name: "Decision Support",
      description: "Provide decision support and recommendations",
      categories: [KnowledgeCategory.DECISION_SUPPORT],
      inputSchema: {
        type: "object",
        properties: {
          scenario: { type: "object" },
          options: { type: "array" },
          criteria: { type: "array" },
        },
        required: ["scenario", "options"],
      },
      outputSchema: {
        type: "object",
        properties: {
          recommendation: { type: "object" },
          reasoning: { type: "string" },
          alternatives: { type: "array" },
        },
      },
      confidenceThreshold: 0.75,
      priority: 9,
    },
  ],
  systemPrompt: `You are the Control Tower AI, an expert in supply chain visibility and orchestration.
Your expertise includes:
- End-to-end supply chain visibility
- Real-time monitoring and alerting
- Operations orchestration
- Decision support and recommendations
- Exception management
- Performance optimization

Always prioritize visibility, proactive management, and data-driven decisions.`,
  model: "gpt-4",
  maxTokens: 4000,
  temperature: 0.2,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

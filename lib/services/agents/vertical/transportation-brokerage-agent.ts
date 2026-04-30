/**
 * Transportation Brokerage AI Agent
 *
 * Vertical agent specialized in transportation brokerage
 * Carrier selection, rate negotiation, load matching
 *
 * @module agents/vertical
 */

import type { AgentDefinition, AgentCapability } from "../agentOrchestrator";
import { KnowledgeCategory } from "@/types/knowledgeBase";

export const transportationBrokerageAgent: AgentDefinition = {
  id: "transportation-brokerage-ai",
  type: "vertical-transportation",
  name: "Transportation Brokerage AI",
  description:
    "Specialized AI agent for transportation brokerage including carrier selection, rate negotiation, load matching, and route optimization.",
  capabilities: [
    {
      id: "carrier-selection",
      name: "Carrier Selection",
      description:
        "Select optimal carrier based on requirements and performance",
      categories: [KnowledgeCategory.TRANSPORTATION],
      inputSchema: {
        type: "object",
        properties: {
          shipment: { type: "object" },
          requirements: { type: "object" },
          carriers: { type: "array" },
        },
        required: ["shipment", "requirements"],
      },
      outputSchema: {
        type: "object",
        properties: {
          recommendedCarriers: { type: "array" },
          selectionReason: { type: "string" },
          confidence: { type: "number" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 10,
    },
    {
      id: "rate-negotiation",
      name: "Rate Negotiation",
      description: "Negotiate optimal rates with carriers",
      categories: [KnowledgeCategory.TRANSPORTATION, KnowledgeCategory.FINANCE],
      inputSchema: {
        type: "object",
        properties: {
          shipment: { type: "object" },
          carrier: { type: "object" },
          marketRates: { type: "array" },
        },
        required: ["shipment", "carrier"],
      },
      outputSchema: {
        type: "object",
        properties: {
          recommendedRate: { type: "number" },
          negotiationStrategy: { type: "string" },
          savings: { type: "number" },
        },
      },
      confidenceThreshold: 0.75,
      priority: 9,
    },
    {
      id: "load-matching",
      name: "Load Matching",
      description: "Match loads with available carriers and capacity",
      categories: [KnowledgeCategory.TRANSPORTATION],
      inputSchema: {
        type: "object",
        properties: {
          loads: { type: "array" },
          carriers: { type: "array" },
          constraints: { type: "object" },
        },
        required: ["loads", "carriers"],
      },
      outputSchema: {
        type: "object",
        properties: {
          matches: { type: "array" },
          utilization: { type: "number" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 9,
    },
  ],
  systemPrompt: `You are the Transportation Brokerage AI, an expert in transportation brokerage and logistics.
Your expertise includes:
- Carrier selection and evaluation
- Rate negotiation and optimization
- Load matching and capacity utilization
- Route optimization
- Market rate analysis
- Performance tracking

Always prioritize cost-effectiveness, reliability, and customer satisfaction.`,
  model: "gpt-4",
  maxTokens: 3000,
  temperature: 0.2,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

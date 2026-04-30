/**
 * Customs Clearance AI Agent
 *
 * Vertical agent specialized in customs clearance
 * Documentation, compliance, clearance optimization
 *
 * @module agents/vertical
 */

import type { AgentDefinition, AgentCapability } from "../agentOrchestrator";
import { KnowledgeCategory } from "@/types/knowledgeBase";

export const customsClearanceAgent: AgentDefinition = {
  id: "customs-clearance-ai",
  type: "vertical-customs",
  name: "Customs Clearance AI",
  description:
    "Specialized AI agent for customs clearance including documentation management, compliance checking, clearance optimization, and border crossing coordination.",
  capabilities: [
    {
      id: "documentation-management",
      name: "Documentation Management",
      description: "Manage and verify customs documentation",
      categories: [KnowledgeCategory.TRADE_COMPLIANCE],
      inputSchema: {
        type: "object",
        properties: {
          shipment: { type: "object" },
          documents: { type: "array" },
          requirements: { type: "array" },
        },
        required: ["shipment", "requirements"],
      },
      outputSchema: {
        type: "object",
        properties: {
          status: { type: "string" },
          missingDocuments: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.9,
      priority: 10,
    },
    {
      id: "clearance-optimization",
      name: "Clearance Optimization",
      description: "Optimize customs clearance process and timing",
      categories: [KnowledgeCategory.TRADE_COMPLIANCE],
      inputSchema: {
        type: "object",
        properties: {
          shipment: { type: "object" },
          border: { type: "string" },
          historicalData: { type: "array" },
        },
        required: ["shipment", "border"],
      },
      outputSchema: {
        type: "object",
        properties: {
          optimalTiming: { type: "object" },
          estimatedDelay: { type: "number" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 9,
    },
    {
      id: "compliance-checking",
      name: "Compliance Checking",
      description: "Check compliance with customs regulations",
      categories: [
        KnowledgeCategory.TRADE_COMPLIANCE,
        KnowledgeCategory.COMPLIANCE,
      ],
      inputSchema: {
        type: "object",
        properties: {
          shipment: { type: "object" },
          origin: { type: "string" },
          destination: { type: "string" },
        },
        required: ["shipment", "origin", "destination"],
      },
      outputSchema: {
        type: "object",
        properties: {
          complianceStatus: { type: "string" },
          violations: { type: "array" },
          actionItems: { type: "array" },
        },
      },
      confidenceThreshold: 0.85,
      priority: 10,
    },
  ],
  systemPrompt: `You are the Customs Clearance AI, an expert in customs clearance and international trade.
Your expertise includes:
- Customs documentation management
- Compliance checking and verification
- Clearance process optimization
- Border crossing coordination
- Duty and tax calculations
- Trade regulation compliance

Always ensure compliance, accuracy, and efficiency in customs clearance.`,
  model: "gpt-4",
  maxTokens: 3000,
  temperature: 0.1,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

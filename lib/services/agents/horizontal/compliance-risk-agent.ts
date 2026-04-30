/**
 * Compliance & Risk AI Agent
 *
 * Horizontal agent specialized in compliance and risk management
 * Risk assessment, compliance checking, mitigation
 *
 * @module agents/horizontal
 */

import type { AgentDefinition, AgentCapability } from "../agentOrchestrator";
import { KnowledgeCategory } from "@/types/knowledgeBase";

export const complianceRiskAgent: AgentDefinition = {
  id: "compliance-risk-ai",
  type: "horizontal-compliance",
  name: "Compliance & Risk AI",
  description:
    "Specialized AI agent for compliance and risk management including risk assessment, compliance checking, mitigation strategies, and regulatory monitoring.",
  capabilities: [
    {
      id: "risk-assessment",
      name: "Risk Assessment",
      description: "Assess risks across operations and processes",
      categories: [KnowledgeCategory.RISK_MANAGEMENT],
      inputSchema: {
        type: "object",
        properties: {
          context: { type: "object" },
          riskFactors: { type: "array" },
          historicalData: { type: "array" },
        },
        required: ["context"],
      },
      outputSchema: {
        type: "object",
        properties: {
          riskLevel: { type: "string" },
          risks: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 10,
    },
    {
      id: "compliance-checking",
      name: "Compliance Checking",
      description: "Check compliance with regulations and standards",
      categories: [KnowledgeCategory.COMPLIANCE],
      inputSchema: {
        type: "object",
        properties: {
          entity: { type: "object" },
          regulations: { type: "array" },
          context: { type: "object" },
        },
        required: ["entity", "regulations"],
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
    {
      id: "mitigation-strategies",
      name: "Mitigation Strategies",
      description: "Develop risk mitigation strategies",
      categories: [KnowledgeCategory.RISK_MANAGEMENT],
      inputSchema: {
        type: "object",
        properties: {
          risks: { type: "array" },
          constraints: { type: "object" },
        },
        required: ["risks"],
      },
      outputSchema: {
        type: "object",
        properties: {
          strategies: { type: "array" },
          implementationPlan: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.75,
      priority: 9,
    },
  ],
  systemPrompt: `You are the Compliance & Risk AI, an expert in compliance and risk management.
Your expertise includes:
- Risk assessment and analysis
- Compliance checking and monitoring
- Risk mitigation strategies
- Regulatory compliance (Saudi Arabia, international)
- Best practices and standards

Always prioritize safety, compliance, and risk mitigation.`,
  model: "gpt-4",
  maxTokens: 3000,
  temperature: 0.2,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

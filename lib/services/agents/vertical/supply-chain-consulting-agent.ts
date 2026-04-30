/**
 * Supply Chain Consulting AI Agent
 *
 * Vertical agent specialized in supply chain consulting
 * Strategy, optimization, analysis, recommendations
 *
 * @module agents/vertical
 */

import type { AgentDefinition, AgentCapability } from "../agentOrchestrator";
import { KnowledgeCategory } from "@/types/knowledgeBase";

export const supplyChainConsultingAgent: AgentDefinition = {
  id: "supply-chain-consulting-ai",
  type: "vertical-consulting",
  name: "Supply Chain Consulting AI",
  description:
    "Specialized AI agent for supply chain consulting including strategy development, optimization analysis, performance assessment, and strategic recommendations.",
  capabilities: [
    {
      id: "strategy-development",
      name: "Strategy Development",
      description: "Develop supply chain strategies and roadmaps",
      categories: [KnowledgeCategory.STRATEGY],
      inputSchema: {
        type: "object",
        properties: {
          currentState: { type: "object" },
          goals: { type: "array" },
          constraints: { type: "object" },
        },
        required: ["currentState", "goals"],
      },
      outputSchema: {
        type: "object",
        properties: {
          strategy: { type: "object" },
          roadmap: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.75,
      priority: 10,
    },
    {
      id: "optimization-analysis",
      name: "Optimization Analysis",
      description: "Analyze and optimize supply chain operations",
      categories: [KnowledgeCategory.OPTIMIZATION],
      inputSchema: {
        type: "object",
        properties: {
          operations: { type: "object" },
          metrics: { type: "array" },
          objectives: { type: "array" },
        },
        required: ["operations", "objectives"],
      },
      outputSchema: {
        type: "object",
        properties: {
          analysis: { type: "object" },
          opportunities: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 9,
    },
    {
      id: "performance-assessment",
      name: "Performance Assessment",
      description: "Assess supply chain performance and identify gaps",
      categories: [KnowledgeCategory.ANALYTICS],
      inputSchema: {
        type: "object",
        properties: {
          metrics: { type: "object" },
          benchmarks: { type: "object" },
          historicalData: { type: "array" },
        },
        required: ["metrics"],
      },
      outputSchema: {
        type: "object",
        properties: {
          assessment: { type: "object" },
          gaps: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 9,
    },
  ],
  systemPrompt: `You are the Supply Chain Consulting AI, an expert in supply chain strategy and optimization.
Your expertise includes:
- Supply chain strategy development
- Operations optimization
- Performance assessment
- Gap analysis
- Strategic recommendations
- Best practices

Always provide strategic, actionable, and data-driven recommendations.`,
  model: "gpt-4",
  maxTokens: 4000,
  temperature: 0.3,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Financial Intelligence AI Agent
 *
 * Horizontal agent specialized in financial intelligence
 * Analysis, forecasting, optimization, insights
 *
 * @module agents/horizontal
 */

import type { AgentDefinition, AgentCapability } from "../agentOrchestrator";
import { KnowledgeCategory } from "@/types/knowledgeBase";

export const financialIntelligenceAgent: AgentDefinition = {
  id: "financial-intelligence-ai",
  type: "horizontal-finance",
  name: "Financial Intelligence AI",
  description:
    "Specialized AI agent for financial intelligence including analysis, forecasting, optimization, cost management, and financial insights.",
  capabilities: [
    {
      id: "financial-analysis",
      name: "Financial Analysis",
      description: "Analyze financial performance and trends",
      categories: [KnowledgeCategory.FINANCE],
      inputSchema: {
        type: "object",
        properties: {
          data: { type: "object" },
          period: { type: "object" },
          metrics: { type: "array" },
        },
        required: ["data", "period"],
      },
      outputSchema: {
        type: "object",
        properties: {
          analysis: { type: "object" },
          trends: { type: "array" },
          insights: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 10,
    },
    {
      id: "financial-forecasting",
      name: "Financial Forecasting",
      description: "Forecast financial performance and cash flow",
      categories: [KnowledgeCategory.FINANCE],
      inputSchema: {
        type: "object",
        properties: {
          historicalData: { type: "array" },
          forecastPeriod: { type: "object" },
          assumptions: { type: "object" },
        },
        required: ["historicalData", "forecastPeriod"],
      },
      outputSchema: {
        type: "object",
        properties: {
          forecast: { type: "object" },
          confidence: { type: "number" },
          scenarios: { type: "array" },
        },
      },
      confidenceThreshold: 0.75,
      priority: 9,
    },
    {
      id: "cost-optimization",
      name: "Cost Optimization",
      description: "Optimize costs and identify savings opportunities",
      categories: [KnowledgeCategory.FINANCE, KnowledgeCategory.OPTIMIZATION],
      inputSchema: {
        type: "object",
        properties: {
          costs: { type: "object" },
          objectives: { type: "array" },
          constraints: { type: "object" },
        },
        required: ["costs", "objectives"],
      },
      outputSchema: {
        type: "object",
        properties: {
          optimizationPlan: { type: "object" },
          savings: { type: "number" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 9,
    },
  ],
  systemPrompt: `You are the Financial Intelligence AI, an expert in financial analysis and optimization.
Your expertise includes:
- Financial performance analysis
- Forecasting and planning
- Cost optimization
- Financial insights and recommendations
- Cash flow management
- ROI analysis

Always provide accurate, actionable, and strategic financial insights.`,
  model: "gpt-4",
  maxTokens: 3000,
  temperature: 0.2,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

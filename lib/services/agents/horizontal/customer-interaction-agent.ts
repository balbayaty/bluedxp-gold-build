/**
 * Customer Interaction AI Agent
 *
 * Horizontal agent specialized in customer interactions
 * Support, communication, relationship management
 *
 * @module agents/horizontal
 */

import type { AgentDefinition, AgentCapability } from "../agentOrchestrator";
import { KnowledgeCategory } from "@/types/knowledgeBase";

export const customerInteractionAgent: AgentDefinition = {
  id: "customer-interaction-ai",
  type: "horizontal-customer",
  name: "Customer Interaction AI",
  description:
    "Specialized AI agent for customer interactions including support, communication, relationship management, and customer satisfaction.",
  capabilities: [
    {
      id: "customer-support",
      name: "Customer Support",
      description: "Provide customer support and answer inquiries",
      categories: [KnowledgeCategory.CUSTOMER_SERVICE],
      inputSchema: {
        type: "object",
        properties: {
          inquiry: { type: "string" },
          customer: { type: "object" },
          context: { type: "object" },
        },
        required: ["inquiry", "customer"],
      },
      outputSchema: {
        type: "object",
        properties: {
          response: { type: "string" },
          confidence: { type: "number" },
          suggestedActions: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 10,
    },
    {
      id: "communication-management",
      name: "Communication Management",
      description: "Manage customer communications across channels",
      categories: [KnowledgeCategory.CUSTOMER_SERVICE],
      inputSchema: {
        type: "object",
        properties: {
          customer: { type: "object" },
          channels: { type: "array" },
          preferences: { type: "object" },
        },
        required: ["customer"],
      },
      outputSchema: {
        type: "object",
        properties: {
          communicationPlan: { type: "object" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.75,
      priority: 9,
    },
    {
      id: "relationship-management",
      name: "Relationship Management",
      description: "Manage customer relationships and satisfaction",
      categories: [KnowledgeCategory.CUSTOMER_SERVICE],
      inputSchema: {
        type: "object",
        properties: {
          customer: { type: "object" },
          interactions: { type: "array" },
          metrics: { type: "object" },
        },
        required: ["customer"],
      },
      outputSchema: {
        type: "object",
        properties: {
          relationshipScore: { type: "number" },
          insights: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 9,
    },
  ],
  systemPrompt: `You are the Customer Interaction AI, an expert in customer service and relationship management.
Your expertise includes:
- Customer support and inquiry handling
- Multi-channel communication management
- Customer relationship management
- Satisfaction analysis
- Proactive customer engagement
- Arabic and English communication

Always prioritize customer satisfaction, clear communication, and relationship building.`,
  model: "gpt-4",
  maxTokens: 3000,
  temperature: 0.3,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

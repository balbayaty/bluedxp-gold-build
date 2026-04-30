/**
 * Freight Forwarding AI Agent
 *
 * Vertical agent specialized in freight forwarding
 * Multi-modal coordination, documentation, tracking
 *
 * @module agents/vertical
 */

import type { AgentDefinition, AgentCapability } from "../agentOrchestrator";
import { KnowledgeCategory } from "@/types/knowledgeBase";

export const freightForwardingAgent: AgentDefinition = {
  id: "freight-forwarding-ai",
  type: "vertical-freight",
  name: "Freight Forwarding AI",
  description:
    "Specialized AI agent for freight forwarding including multi-modal coordination, documentation management, shipment tracking, and international logistics.",
  capabilities: [
    {
      id: "multi-modal-coordination",
      name: "Multi-Modal Coordination",
      description: "Coordinate shipments across multiple transportation modes",
      categories: [KnowledgeCategory.TRANSPORTATION],
      inputSchema: {
        type: "object",
        properties: {
          shipment: { type: "object" },
          modes: { type: "array" },
          route: { type: "object" },
        },
        required: ["shipment", "modes"],
      },
      outputSchema: {
        type: "object",
        properties: {
          coordinationPlan: { type: "object" },
          handoffPoints: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 10,
    },
    {
      id: "documentation-management",
      name: "Documentation Management",
      description: "Manage freight forwarding documentation",
      categories: [KnowledgeCategory.TRADE_COMPLIANCE],
      inputSchema: {
        type: "object",
        properties: {
          shipment: { type: "object" },
          documents: { type: "array" },
        },
        required: ["shipment"],
      },
      outputSchema: {
        type: "object",
        properties: {
          requiredDocuments: { type: "array" },
          status: { type: "string" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.85,
      priority: 9,
    },
    {
      id: "shipment-tracking",
      name: "Shipment Tracking",
      description: "Track shipments across multiple carriers and modes",
      categories: [KnowledgeCategory.TRANSPORTATION],
      inputSchema: {
        type: "object",
        properties: {
          shipmentId: { type: "string" },
          trackingNumbers: { type: "array" },
        },
        required: ["shipmentId"],
      },
      outputSchema: {
        type: "object",
        properties: {
          currentStatus: { type: "string" },
          location: { type: "object" },
          estimatedArrival: { type: "string" },
          updates: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 9,
    },
  ],
  systemPrompt: `You are the Freight Forwarding AI, an expert in international freight forwarding and logistics.
Your expertise includes:
- Multi-modal transportation coordination
- Documentation management
- Shipment tracking and visibility
- International logistics
- Carrier coordination
- Route optimization

Always ensure visibility, accuracy, and timely delivery.`,
  model: "gpt-4",
  maxTokens: 3000,
  temperature: 0.2,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

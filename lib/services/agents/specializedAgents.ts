/**
 * 🧠 SPECIALIZED AGENT DEFINITIONS
 * Domain-specific AI agents for BlueDXP platform
 *
 * Agents:
 * - Hazalyze Chemical Intelligence Agent
 * - CustomsCheck HS Code Compliance Agent
 * - TrainingComplianceBot (SABIC/Aramco)
 * - StorageZoneRecommender
 * - IncidentPreventionAI
 *
 * Source: Adapted from chemcheck-analysis/lib/ai/AgentOrchestrator.ts
 * Architecture: Deep layer integration with Agent Orchestrator and Event Bus
 */

import type { AgentDefinition, AgentCapability } from "./agentOrchestrator";
import { KnowledgeCategory } from "@/types/knowledgeBase";

// ============================================================================
// SPECIALIZED AGENT DEFINITIONS
// ============================================================================

/**
 * Hazalyze Chemical Intelligence Agent
 * Specialized in chemical analysis, compatibility, safety, and compliance
 */
export const hazalyzeChemicalAgent: AgentDefinition = {
  id: "hazalyze-chemical-intelligence",
  type: "chemical-intelligence",
  name: "Hazalyze Chemical Intelligence Agent",
  description:
    "Advanced AI agent specialized in chemical analysis, compatibility assessment, safety evaluation, and regulatory compliance. Provides comprehensive chemical intelligence for hazardous materials management.",
  capabilities: [
    {
      id: "chemical-analysis",
      name: "Chemical Analysis",
      description:
        "Comprehensive chemical analysis including NFPA, GHS, and UN classifications",
      categories: [
        KnowledgeCategory.CHEMICAL_SAFETY,
        KnowledgeCategory.COMPLIANCE,
      ],
      inputSchema: {
        type: "object",
        properties: {
          chemicalName: { type: "string" },
          casNumber: { type: "string" },
          unNumber: { type: "string" },
          molecularFormula: { type: "string" },
        },
        required: ["chemicalName"],
      },
      outputSchema: {
        type: "object",
        properties: {
          classification: { type: "object" },
          hazards: { type: "array" },
          compatibility: { type: "object" },
          storageRecommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 10,
    },
    {
      id: "compatibility-assessment",
      name: "Compatibility Assessment",
      description: "Assess chemical compatibility between multiple substances",
      categories: [KnowledgeCategory.CHEMICAL_SAFETY],
      inputSchema: {
        type: "object",
        properties: {
          chemicals: { type: "array", items: { type: "object" } },
        },
        required: ["chemicals"],
      },
      outputSchema: {
        type: "object",
        properties: {
          compatibilityMatrix: { type: "array" },
          riskLevel: { type: "string" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.85,
      priority: 9,
    },
    {
      id: "safety-evaluation",
      name: "Safety Evaluation",
      description: "Evaluate safety risks and provide mitigation strategies",
      categories: [KnowledgeCategory.SAFETY, KnowledgeCategory.RISK_MANAGEMENT],
      inputSchema: {
        type: "object",
        properties: {
          chemical: { type: "object" },
          context: { type: "object" },
        },
        required: ["chemical"],
      },
      outputSchema: {
        type: "object",
        properties: {
          riskAssessment: { type: "object" },
          safetyMeasures: { type: "array" },
          emergencyProcedures: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 8,
    },
    {
      id: "regulatory-compliance",
      name: "Regulatory Compliance",
      description: "Check compliance with Saudi and international regulations",
      categories: [KnowledgeCategory.COMPLIANCE],
      inputSchema: {
        type: "object",
        properties: {
          chemical: { type: "object" },
          region: { type: "string" },
        },
        required: ["chemical"],
      },
      outputSchema: {
        type: "object",
        properties: {
          complianceStatus: { type: "object" },
          requirements: { type: "array" },
          actionItems: { type: "array" },
        },
      },
      confidenceThreshold: 0.75,
      priority: 7,
    },
  ],
  systemPrompt: `You are the Hazalyze Chemical Intelligence Agent, an expert in chemical analysis, safety, and compliance. 
Your expertise includes:
- Chemical classification (NFPA, GHS, UN)
- Compatibility assessment
- Safety risk evaluation
- Regulatory compliance (Saudi Arabia, international)
- Storage and handling recommendations
- Emergency response procedures

Always provide accurate, safety-focused, and compliance-oriented recommendations.`,
  model: "gpt-4",
  maxTokens: 4000,
  temperature: 0.2,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * CustomsCheck HS Code Compliance Agent
 * Specialized in HS code classification, customs compliance, and trade regulations
 */
export const customsCheckAgent: AgentDefinition = {
  id: "customscheck-hs-code-compliance",
  type: "customs-compliance",
  name: "CustomsCheck HS Code Compliance Agent",
  description:
    "Expert AI agent for HS code classification, customs compliance, import/export regulations, and trade compliance. Ensures accurate classification and regulatory adherence.",
  capabilities: [
    {
      id: "hs-code-classification",
      name: "HS Code Classification",
      description: "Classify products using Harmonized System (HS) codes",
      categories: [
        KnowledgeCategory.TRADE_COMPLIANCE,
        KnowledgeCategory.COMPLIANCE,
      ],
      inputSchema: {
        type: "object",
        properties: {
          productName: { type: "string" },
          description: { type: "string" },
          material: { type: "string" },
          purpose: { type: "string" },
        },
        required: ["productName", "description"],
      },
      outputSchema: {
        type: "object",
        properties: {
          hsCode: { type: "string" },
          description: { type: "string" },
          confidence: { type: "number" },
          alternatives: { type: "array" },
        },
      },
      confidenceThreshold: 0.9,
      priority: 10,
    },
    {
      id: "customs-compliance",
      name: "Customs Compliance",
      description: "Check customs compliance requirements for import/export",
      categories: [KnowledgeCategory.TRADE_COMPLIANCE],
      inputSchema: {
        type: "object",
        properties: {
          hsCode: { type: "string" },
          origin: { type: "string" },
          destination: { type: "string" },
        },
        required: ["hsCode", "origin", "destination"],
      },
      outputSchema: {
        type: "object",
        properties: {
          complianceStatus: { type: "string" },
          requirements: { type: "array" },
          documents: { type: "array" },
          duties: { type: "object" },
        },
      },
      confidenceThreshold: 0.85,
      priority: 9,
    },
    {
      id: "trade-regulations",
      name: "Trade Regulations",
      description: "Provide trade regulation information and restrictions",
      categories: [KnowledgeCategory.TRADE_COMPLIANCE],
      inputSchema: {
        type: "object",
        properties: {
          product: { type: "object" },
          route: { type: "object" },
        },
        required: ["product"],
      },
      outputSchema: {
        type: "object",
        properties: {
          regulations: { type: "array" },
          restrictions: { type: "array" },
          permits: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 8,
    },
  ],
  systemPrompt: `You are the CustomsCheck HS Code Compliance Agent, an expert in international trade, customs regulations, and HS code classification.
Your expertise includes:
- HS code classification (6-digit and 10-digit)
- Customs compliance requirements
- Import/export regulations
- Trade restrictions and permits
- Duty calculations
- Documentation requirements

Always provide accurate classifications and ensure compliance with international trade regulations.`,
  model: "gpt-4",
  maxTokens: 3000,
  temperature: 0.1,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * TrainingComplianceBot (SABIC/Aramco)
 * Specialized in training compliance for major Saudi companies
 */
export const trainingComplianceBot: AgentDefinition = {
  id: "training-compliance-bot",
  type: "training-compliance",
  name: "Training Compliance Bot (SABIC/Aramco)",
  description:
    "Specialized AI agent for training compliance management, certification tracking, and regulatory training requirements for SABIC, Aramco, and other major Saudi companies.",
  capabilities: [
    {
      id: "training-requirements",
      name: "Training Requirements",
      description:
        "Identify required training based on role, industry, and regulations",
      categories: [KnowledgeCategory.TRAINING, KnowledgeCategory.COMPLIANCE],
      inputSchema: {
        type: "object",
        properties: {
          role: { type: "string" },
          industry: { type: "string" },
          company: { type: "string" },
          certifications: { type: "array" },
        },
        required: ["role", "industry"],
      },
      outputSchema: {
        type: "object",
        properties: {
          requiredTrainings: { type: "array" },
          certifications: { type: "array" },
          deadlines: { type: "array" },
          priority: { type: "string" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 10,
    },
    {
      id: "certification-tracking",
      name: "Certification Tracking",
      description:
        "Track certifications, expiry dates, and renewal requirements",
      categories: [KnowledgeCategory.TRAINING],
      inputSchema: {
        type: "object",
        properties: {
          employeeId: { type: "string" },
          certifications: { type: "array" },
        },
        required: ["employeeId"],
      },
      outputSchema: {
        type: "object",
        properties: {
          activeCertifications: { type: "array" },
          expiringSoon: { type: "array" },
          expired: { type: "array" },
          renewalRequirements: { type: "array" },
        },
      },
      confidenceThreshold: 0.85,
      priority: 9,
    },
    {
      id: "sabic-aramco-compliance",
      name: "SABIC/Aramco Compliance",
      description:
        "Check compliance with SABIC and Aramco specific training requirements",
      categories: [KnowledgeCategory.COMPLIANCE],
      inputSchema: {
        type: "object",
        properties: {
          company: { type: "string" },
          role: { type: "string" },
          department: { type: "string" },
        },
        required: ["company", "role"],
      },
      outputSchema: {
        type: "object",
        properties: {
          complianceStatus: { type: "string" },
          requiredTrainings: { type: "array" },
          gaps: { type: "array" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 8,
    },
  ],
  systemPrompt: `You are the Training Compliance Bot, specialized in training compliance for major Saudi companies including SABIC and Aramco.
Your expertise includes:
- Training requirement identification
- Certification tracking and renewal
- SABIC-specific training requirements
- Aramco-specific training requirements
- Regulatory training compliance
- Training gap analysis

Always ensure compliance with company-specific and regulatory training requirements.`,
  model: "gpt-4",
  maxTokens: 3000,
  temperature: 0.2,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * StorageZoneRecommender
 * Specialized in warehouse storage zone recommendations and optimization
 */
export const storageZoneRecommender: AgentDefinition = {
  id: "storage-zone-recommender",
  type: "warehouse-optimization",
  name: "Storage Zone Recommender",
  description:
    "AI agent specialized in warehouse storage optimization, zone recommendations, and space utilization. Provides intelligent storage strategies based on product characteristics and warehouse layout.",
  capabilities: [
    {
      id: "zone-recommendation",
      name: "Zone Recommendation",
      description: "Recommend optimal storage zones for products",
      categories: [KnowledgeCategory.WAREHOUSE_MANAGEMENT],
      inputSchema: {
        type: "object",
        properties: {
          product: { type: "object" },
          warehouse: { type: "object" },
          constraints: { type: "object" },
        },
        required: ["product", "warehouse"],
      },
      outputSchema: {
        type: "object",
        properties: {
          recommendedZones: { type: "array" },
          reasoning: { type: "string" },
          optimizationScore: { type: "number" },
        },
      },
      confidenceThreshold: 0.75,
      priority: 9,
    },
    {
      id: "space-optimization",
      name: "Space Optimization",
      description: "Optimize warehouse space utilization",
      categories: [KnowledgeCategory.WAREHOUSE_MANAGEMENT],
      inputSchema: {
        type: "object",
        properties: {
          warehouse: { type: "object" },
          products: { type: "array" },
        },
        required: ["warehouse", "products"],
      },
      outputSchema: {
        type: "object",
        properties: {
          optimizationPlan: { type: "object" },
          spaceUtilization: { type: "number" },
          recommendations: { type: "array" },
        },
      },
      confidenceThreshold: 0.7,
      priority: 8,
    },
    {
      id: "compatibility-zoning",
      name: "Compatibility Zoning",
      description: "Ensure compatible products are stored together",
      categories: [
        KnowledgeCategory.WAREHOUSE_MANAGEMENT,
        KnowledgeCategory.CHEMICAL_SAFETY,
      ],
      inputSchema: {
        type: "object",
        properties: {
          products: { type: "array" },
          zones: { type: "array" },
        },
        required: ["products", "zones"],
      },
      outputSchema: {
        type: "object",
        properties: {
          zoneAssignments: { type: "array" },
          compatibilityMatrix: { type: "array" },
          safetyScore: { type: "number" },
        },
      },
      confidenceThreshold: 0.8,
      priority: 10,
    },
  ],
  systemPrompt: `You are the Storage Zone Recommender, an expert in warehouse optimization and storage management.
Your expertise includes:
- Storage zone optimization
- Space utilization analysis
- Product compatibility zoning
- Warehouse layout optimization
- Safety and compliance in storage

Always prioritize safety, efficiency, and compliance in storage recommendations.`,
  model: "gpt-4",
  maxTokens: 3000,
  temperature: 0.2,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * IncidentPreventionAI
 * Specialized in incident prevention, risk prediction, and safety recommendations
 */
export const incidentPreventionAI: AgentDefinition = {
  id: "incident-prevention-ai",
  type: "safety-prevention",
  name: "Incident Prevention AI",
  description:
    "Advanced AI agent for incident prevention, risk prediction, and proactive safety management. Analyzes patterns, predicts potential incidents, and provides preventive recommendations.",
  capabilities: [
    {
      id: "risk-prediction",
      name: "Risk Prediction",
      description: "Predict potential incidents based on patterns and data",
      categories: [KnowledgeCategory.RISK_MANAGEMENT, KnowledgeCategory.SAFETY],
      inputSchema: {
        type: "object",
        properties: {
          context: { type: "object" },
          historicalData: { type: "array" },
          currentConditions: { type: "object" },
        },
        required: ["context"],
      },
      outputSchema: {
        type: "object",
        properties: {
          riskLevel: { type: "string" },
          predictedIncidents: { type: "array" },
          probability: { type: "number" },
          timeframe: { type: "string" },
        },
      },
      confidenceThreshold: 0.7,
      priority: 10,
    },
    {
      id: "preventive-recommendations",
      name: "Preventive Recommendations",
      description: "Provide recommendations to prevent incidents",
      categories: [KnowledgeCategory.SAFETY],
      inputSchema: {
        type: "object",
        properties: {
          riskAssessment: { type: "object" },
          context: { type: "object" },
        },
        required: ["riskAssessment"],
      },
      outputSchema: {
        type: "object",
        properties: {
          recommendations: { type: "array" },
          priority: { type: "string" },
          implementationPlan: { type: "array" },
        },
      },
      confidenceThreshold: 0.75,
      priority: 9,
    },
    {
      id: "pattern-analysis",
      name: "Pattern Analysis",
      description:
        "Analyze patterns in historical incidents to identify trends",
      categories: [KnowledgeCategory.RISK_MANAGEMENT],
      inputSchema: {
        type: "object",
        properties: {
          incidents: { type: "array" },
          timeframe: { type: "object" },
        },
        required: ["incidents"],
      },
      outputSchema: {
        type: "object",
        properties: {
          patterns: { type: "array" },
          trends: { type: "array" },
          insights: { type: "array" },
        },
      },
      confidenceThreshold: 0.7,
      priority: 8,
    },
  ],
  systemPrompt: `You are the Incident Prevention AI, an expert in safety management and incident prevention.
Your expertise includes:
- Risk prediction and assessment
- Pattern analysis in incidents
- Preventive recommendation generation
- Safety protocol optimization
- Proactive safety management

Always prioritize prevention over reaction and provide actionable, safety-focused recommendations.`,
  model: "gpt-4",
  maxTokens: 3000,
  temperature: 0.2,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================================================
// ALL SPECIALIZED AGENTS
// ============================================================================

// Import vertical and horizontal agents
import { allVerticalAgents } from "./vertical";
import { allHorizontalAgents } from "./horizontal";

export const allSpecializedAgents: AgentDefinition[] = [
  // Existing specialized agents
  hazalyzeChemicalAgent,
  customsCheckAgent,
  trainingComplianceBot,
  storageZoneRecommender,
  incidentPreventionAI,
  // Vertical agents
  ...allVerticalAgents,
  // Horizontal agents
  ...allHorizontalAgents,
];

/**
 * Get specialized agent by ID
 */
export function getSpecializedAgent(
  agentId: string,
): AgentDefinition | undefined {
  return allSpecializedAgents.find((agent) => agent.id === agentId);
}

/**
 * Get specialized agents by type
 */
export function getSpecializedAgentsByType(type: string): AgentDefinition[] {
  return allSpecializedAgents.filter(
    (agent) => agent.type === type && agent.isEnabled,
  );
}

/**
 * Get specialized agents by capability
 */
export function getSpecializedAgentsByCapability(
  capabilityId: string,
): AgentDefinition[] {
  return allSpecializedAgents.filter((agent) =>
    agent.capabilities.some((cap) => cap.id === capabilityId),
  );
}

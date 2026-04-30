/**
 * Facility Management Agent
 *
 * Autonomous AI agent for facility management operations:
 * - Asset management automation
 * - Maintenance scheduling optimization
 * - Energy optimization recommendations
 * - Space utilization optimization
 * - Compliance monitoring
 * - Predictive maintenance insights
 * - Anomaly detection
 */

import {
  AgentDefinition,
  AgentCapability,
} from "@/lib/services/agents/agentOrchestrator";
import { getFacilityIntegrationService } from "../integration/facilityIntegrationService";

export const facilityAgentDefinition: AgentDefinition = {
  id: "facility-management-agent",
  type: "facility-management",
  name: "Facility Management Agent",
  description:
    "Autonomous AI agent for facility management, maintenance, and optimization",
  capabilities: [
    {
      id: "asset_management",
      name: "Asset Management",
      description: "Manage and optimize facility assets",
      categories: ["facility-management"],
      priority: 10,
    },
    {
      id: "maintenance_scheduling",
      name: "Maintenance Scheduling",
      description: "Optimize maintenance schedules and predict failures",
      categories: ["facility-management", "maintenance"],
      priority: 9,
    },
    {
      id: "energy_optimization",
      name: "Energy Optimization",
      description: "Optimize energy consumption and reduce costs",
      categories: ["facility-management", "energy", "sustainability"],
      priority: 8,
    },
    {
      id: "space_optimization",
      name: "Space Optimization",
      description: "Optimize space utilization and allocation",
      categories: ["facility-management", "space"],
      priority: 7,
    },
    {
      id: "compliance_monitoring",
      name: "Compliance Monitoring",
      description: "Monitor regulatory compliance and license expirations",
      categories: ["facility-management", "compliance"],
      priority: 9,
    },
    {
      id: "predictive_analytics",
      name: "Predictive Analytics",
      description: "Predict asset failures and maintenance needs",
      categories: ["facility-management", "ai", "predictive"],
      priority: 8,
    },
    {
      id: "anomaly_detection",
      name: "Anomaly Detection",
      description:
        "Detect anomalies in facility operations and energy consumption",
      categories: ["facility-management", "ai", "anomaly"],
      priority: 7,
    },
  ],
  systemPrompt: `You are a Facility Management AI Agent specialized in:
- Enterprise Asset Management (EAM)
- Computerized Maintenance Management (CMMS)
- Space Management (CAFM)
- Energy & Sustainability Management
- Regulatory Compliance
- Predictive Maintenance
- IoT & Smart Building Integration

Your role is to:
1. Monitor facility assets and predict maintenance needs
2. Optimize energy consumption and reduce carbon footprint
3. Ensure regulatory compliance and license renewals
4. Optimize space utilization
5. Detect anomalies in facility operations
6. Provide intelligent recommendations for facility improvements

Always consider:
- Cost optimization
- Sustainability goals (ESG, SBTi, TCFD)
- Regulatory compliance (Civil Defense, Abalady, etc.)
- Cross-module integration (Warehouse, CAPA, Work Orders)
- Real-time IoT data
- Predictive maintenance insights`,
  model: "gpt-4",
  maxTokens: 2000,
  temperature: 0.7,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Initialize and register Facility Management Agent
 */
export function initializeFacilityAgent() {
  const { agentOrchestrator } = require("@/lib/services/agents");
  const integrationService = getFacilityIntegrationService();

  // Register the agent
  agentOrchestrator.register(facilityAgentDefinition);

  // Get agent configuration from integration service
  integrationService
    .getFacilityAgentConfig()
    .then((config: any) => {
      console.log("Facility Management Agent registered:", config);
    })
    .catch((error: any) => {
      console.warn("Failed to get Facility Agent config:", error);
    });

  return facilityAgentDefinition;
}

// Auto-initialize on import (if in server context)
if (typeof window === "undefined") {
  try {
    initializeFacilityAgent();
  } catch (error) {
    // Agent orchestrator might not be available in all contexts
    console.warn("Could not auto-initialize Facility Agent:", error);
  }
}

/**
 * Horizontal Agents
 *
 * Export all horizontal agents
 *
 * @module agents/horizontal
 */

// Import agents first
import { customerInteractionAgent } from "./customer-interaction-agent";
import { documentProcessingAgent } from "./document-processing-agent";
import { complianceRiskAgent } from "./compliance-risk-agent";
import { financialIntelligenceAgent } from "./financial-intelligence-agent";
import { controlTowerAgent } from "./control-tower-agent";

// Re-export
export * from "./customer-interaction-agent";
export * from "./document-processing-agent";
export * from "./compliance-risk-agent";
export * from "./financial-intelligence-agent";
export * from "./control-tower-agent";

export {
  customerInteractionAgent,
  documentProcessingAgent,
  complianceRiskAgent,
  financialIntelligenceAgent,
  controlTowerAgent,
};

export const allHorizontalAgents = [
  customerInteractionAgent,
  documentProcessingAgent,
  complianceRiskAgent,
  financialIntelligenceAgent,
  controlTowerAgent,
];

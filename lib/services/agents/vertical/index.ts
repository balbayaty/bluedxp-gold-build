/**
 * Vertical Agents
 *
 * Export all vertical agents
 *
 * @module agents/vertical
 */

// Import agents first
import { warehousingAgent } from "./warehousing-agent";
import { transportationBrokerageAgent } from "./transportation-brokerage-agent";
import { customsClearanceAgent } from "./customs-clearance-agent";
import { freightForwardingAgent } from "./freight-forwarding-agent";
import { supplyChainConsultingAgent } from "./supply-chain-consulting-agent";

// Re-export
export * from "./warehousing-agent";
export * from "./transportation-brokerage-agent";
export * from "./customs-clearance-agent";
export * from "./freight-forwarding-agent";
export * from "./supply-chain-consulting-agent";

export {
  warehousingAgent,
  transportationBrokerageAgent,
  customsClearanceAgent,
  freightForwardingAgent,
  supplyChainConsultingAgent,
};

export const allVerticalAgents = [
  warehousingAgent,
  transportationBrokerageAgent,
  customsClearanceAgent,
  freightForwardingAgent,
  supplyChainConsultingAgent,
];

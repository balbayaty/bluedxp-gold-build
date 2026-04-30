/**
 * Agent Services Index
 * Export all agent-related services
 */

export * from "./agentMemory";
export * from "./agentOrchestrator";
export * from "./specializedAgents";

// Convenience re-exports
export { default as AgentMemory } from "./agentMemory";
export { default as AgentOrchestrator } from "./agentOrchestrator";

// Export singleton instance
import { getAgentOrchestrator } from "./agentOrchestrator";
export const agentOrchestrator = getAgentOrchestrator();

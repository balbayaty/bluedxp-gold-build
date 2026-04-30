/**
 * ISO IMS Agents - Autonomous Agent System
 *
 * All ISO IMS autonomous agents exported from here
 */

export { isoComplianceAgent } from "./isoComplianceAgent";
export { autoNCRAgent } from "./autoNCRAgent";
export { capaOptimizationAgent } from "./capaOptimizationAgent";
export { auditSchedulingAgent } from "./auditSchedulingAgent";
export { riskAssessmentAgent } from "./riskAssessmentAgent";
export { documentIntelligenceAgent } from "./documentIntelligenceAgent";

/**
 * Initialize all ISO IMS agents
 */
export async function initializeISOIMSAgents(): Promise<void> {
  try {
    // Safely initialize each agent with individual error handling
    const agents = [
      { name: 'isoComplianceAgent', agent: isoComplianceAgent },
      { name: 'autoNCRAgent', agent: autoNCRAgent },
      { name: 'capaOptimizationAgent', agent: capaOptimizationAgent },
      { name: 'auditSchedulingAgent', agent: auditSchedulingAgent },
      { name: 'riskAssessmentAgent', agent: riskAssessmentAgent },
      { name: 'documentIntelligenceAgent', agent: documentIntelligenceAgent },
    ];
    
    for (const { name, agent } of agents) {
      try {
        if (agent?.initialize) {
          await agent.initialize();
        }
      } catch (err) {
        console.warn(`⚠️ Failed to initialize ${name}:`, err);
      }
    }
    console.log("✅ ISO IMS agents initialization complete");
  } catch (error) {
    console.error("Error initializing ISO IMS agents:", error);
    // Don't throw - allow app to continue
  }
}

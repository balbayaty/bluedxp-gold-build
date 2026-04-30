/**
 * ISO IMS Services - Main Export
 *
 * Comprehensive ISO Integrated Management System services
 * with deep architecture and full platform integration
 */

export {
  capaService,
  type ICAPAService,
  type CreateCAPAInput,
  type UpdateCAPAInput,
  type CAPAAnalytics,
} from "./capaService";
export {
  ncrService,
  type INCRService,
  type CreateNCRInput,
  type UpdateNCRInput,
  type NCRAnalytics,
  type NCRPredictiveAnalytics,
  type NCRPattern,
} from "./ncrService";
export { intelligenceService } from "./intelligenceService";
export { complianceEngine } from "./complianceEngine";
export { isoImsIntegrationService } from "./integrationService";
export * from "./types";

// Export audit service
export {
  auditService,
  type IAuditService,
  type CreateAuditInput,
  type UpdateAuditInput,
} from "./auditService";

// Document, Risk, and Training Services
export {
  documentService,
  type IDocumentService,
  type CreateDocumentInput,
  type UpdateDocumentInput,
} from "./documentService";
export {
  riskService,
  type IRiskService,
  type CreateRiskInput,
  type UpdateRiskInput,
} from "./riskService";
export {
  trainingService,
  type ITrainingService,
  type CreateTrainingInput,
  type UpdateTrainingInput,
} from "./trainingService";

// New Intelligent Services
export { documentIntelligenceService } from "./documentIntelligenceService";
export { documentDisplayService } from "./documentDisplayService";
export { isoIMSFacilityIntegrationService } from "./facilityIntegrationService";

// Autonomous Agents
export { initializeISOIMSAgents } from "./agents";
export { isoComplianceAgent } from "./agents/isoComplianceAgent";
export { autoNCRAgent } from "./agents/autoNCRAgent";
export { capaOptimizationAgent } from "./agents/capaOptimizationAgent";
export { auditSchedulingAgent } from "./agents/auditSchedulingAgent";
export { riskAssessmentAgent } from "./agents/riskAssessmentAgent";
export { documentIntelligenceAgent } from "./agents/documentIntelligenceAgent";
// Drill-Down
export { drillDownService } from "./drilldown/drillDownService";
// Edge Computing
export { isoIMSEdgeService } from "./edge/isoIMSEdgeService";
// Quantum
export { isoIMSQuantumService } from "./quantum/isoIMSQuantumService";
// Resilience
export { isoIMSResilienceService } from "./resilience/isoIMSResilienceService";
// Blockchain
export { isoIMSBlockchainService } from "./blockchain/isoIMSBlockchainService";
// AR/VR
export { isoIMSARVRService } from "./ar-vr/isoIMSARVRService";
// Initialization
export { initializeISOIMSModule, cleanupISOIMSModule } from "./initialize";

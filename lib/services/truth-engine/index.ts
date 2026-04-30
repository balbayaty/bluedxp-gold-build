/**
 * Truth Engine - Main Export
 * Evidence-based, audit-ready, adversarially reviewed platform layer
 */

export { truthEngineService } from "./truthEngineService";
export {
  truthSDK,
  createModuleIntegration,
  TruthEngineIntegration,
} from "./sdk";
export { initializeWMSIntegration } from "./integrations/wmsIntegration";
export { initializeTMSIntegration } from "./integrations/tmsIntegration";
export { initializeMSDSIntegration } from "./integrations/msdsIntegration";
export { initializeFinanceIntegration } from "./integrations/financeIntegration";
export { initializeComplianceIntegration } from "./integrations/complianceIntegration";
export { initializeEcosystemIntegration } from "./integrations/ecosystemIntegrationService";

// Multimodal Verification
export { multimodalVerificationService } from "./verification/multimodalVerificationService";
export { imageVerificationService } from "./verification/imageVerificationService";
export { videoVerificationService } from "./verification/videoVerificationService";
export { audioVerificationService } from "./verification/audioVerificationService";

// Knowledge Graph
export { truthKnowledgeGraphService } from "./knowledge-graph/truthKnowledgeGraphService";

// Claim Extraction
export { claimExtractionService } from "./claims/claimExtractionService";

// Re-export types
export type {
  TruthEvent,
  TruthEventType,
  TruthEvidenceItem,
  AdversarialReview,
  TruthKPI,
  TruthTimeline,
  BoardBrief,
  TruthEngineService,
} from "@/types/truth-engine";

export type { MultimodalVerificationResult } from "./verification/multimodalVerificationService";

export type {
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  KnowledgeGraphQuery,
  KnowledgeGraphResult,
} from "./knowledge-graph/truthKnowledgeGraphService";

export type {
  ExtractedClaim,
  ClaimValidationResult,
} from "./claims/claimExtractionService";

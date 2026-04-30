/**
 * Customs Services - Main Export
 *
 * All customs and regulatory integration services
 */

export {
  CustomsOrchestrator,
  customsOrchestrator,
} from "./customsOrchestrator";
export { TIRService, tirService } from "./tirService";
export { TouchpointService, touchpointService } from "./touchpointService";
export { DocumentService, documentService } from "./documentService";
export { ComplianceService, complianceService } from "./complianceService";

// Export types
export type {
  OrchestratorConfig,
  Workflow,
  WorkflowStep,
  OrchestrationResult,
  StepResult,
  OrchestrationError,
} from "./customsOrchestrator";

export type {
  TIRServiceConfig,
  IssueCarnetRequest,
  BorderCrossingRequest,
} from "./tirService";

export type {
  TouchpointServiceConfig,
  RouteOptimizationRequest,
  RouteOptimizationResult,
  RouteSegment,
} from "./touchpointService";

export type {
  DocumentServiceConfig,
  DocumentUploadRequest,
  DocumentTemplate,
  TemplateField,
  DocumentVersion,
} from "./documentService";

export type {
  ComplianceCheckResult,
  RequirementCheckResult,
} from "./complianceService";

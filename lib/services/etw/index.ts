/**
 * ETW Services Index
 *
 * Central export point for all ETW services
 */

export { etwService, type ETWService, type ETWListFilters } from "./etwService";
export {
  etwRulesEngine,
  type ETWRule,
  type RuleEvaluationResult,
} from "./rulesEngine";
export { etwEventService, type ETWEventService } from "./eventService";
export {
  etwQRVerificationService,
  type ETWQRVerificationService,
  type VerificationResult,
  type ProofBundle,
} from "./qrVerificationService";

// Lazy load other services to avoid circular dependencies
export const getETWIntelligenceService = async () => {
  const { etwIntelligenceService } =
    await import("./intelligence/intelligenceOrchestrator");
  return etwIntelligenceService;
};

export const getETWPDFService = async () => {
  const { etwPDFService } = await import("./pdfService");
  return etwPDFService;
};

export const getETWIntegrationService = async () => {
  const { etwIntegrationService } = await import("./integrationService");
  return etwIntegrationService;
};

export const getETWPermitService = async () => {
  const { etwPermitService } = await import("./permitService");
  return etwPermitService;
};

export { etwPermitService } from "./permitService";
export { etwPDFService } from "./pdfService";
export { etwIntegrationService } from "./integrationService";

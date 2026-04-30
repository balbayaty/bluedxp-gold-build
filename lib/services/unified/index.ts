/**
 * Unified Centers Services
 * Consolidates scattered modules into intelligent unified experiences
 */

export {
  UnifiedCustomerCenterService,
  unifiedCustomerCenterService,
} from "./unifiedCustomerCenterService";
export {
  UnifiedDocumentCenterService,
  unifiedDocumentCenterService,
} from "./unifiedDocumentCenterService";
export {
  UnifiedQHSECenterService,
  unifiedQHSECenterService,
} from "./unifiedQHSECenterService";

// Type exports
export type {
  UnifiedCustomerModule,
  CustomerCapability,
  CustomerJourney,
  CustomerJourneyStage,
  CustomerInsight,
} from "./unifiedCustomerCenterService";

export type {
  UnifiedDocumentModule,
  DocumentFeature,
  DocumentJourney,
  DocumentJourneyStep,
  DocumentIntegration,
} from "./unifiedDocumentCenterService";

export type {
  UnifiedQHSEModule,
  QHSEFeature,
  CustomerJourneyStep as QHSECustomerJourneyStep,
  ModuleIntegration,
} from "./unifiedQHSECenterService";

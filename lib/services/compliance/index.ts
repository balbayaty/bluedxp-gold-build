/**
 * Compliance Module - Main Export
 * Comprehensive compliance management system
 */

export { complianceService } from "./complianceService";
export { mlMonitoringService } from "./mlMonitoringService";
export { governanceService } from "./governanceService";
export { SaudiComplianceEngine, saudiComplianceEngine } from "./saudiEngine";
export {
  EnhancedComplianceReportingService,
  enhancedComplianceReporting,
} from "./enhancedReporting";
export {
  GlobalStandardsEngine,
  globalStandardsEngine,
} from "./globalStandardsEngine";
export {
  ComprehensiveRequirementsMatrix,
  comprehensiveRequirementsMatrix,
} from "./requirementsMatrix";

// Regulatory frameworks
export * from "./regulatory-frameworks/saudi-arabia";

// Types
export type * from "@/types/compliance";
export type {
  ZATCACompliance,
  SFDACompliance,
  ProductRegistration,
  CivilDefenseCompliance,
  Vision2030Alignment,
  SaudiComplianceCheck,
  ComplianceActionItem,
  ComplianceReport,
} from "./saudiEngine";
export type {
  EnhancedComplianceReport,
  ComplianceReportRequest,
} from "./enhancedReporting";
export type {
  ISOStandard,
  ISORequirement,
  FDAStandard,
  FDARequirement,
  EURegulation,
  EURegulationRequirement,
  GlobalStandardsCompliance,
  ISOStandardCompliance,
  FDAStandardCompliance,
  EURegulationCompliance,
} from "./globalStandardsEngine";
export type {
  Requirement,
  CrossReference,
  RequirementsMatrix,
  GapAnalysis,
  CoverageAnalysis,
  RequirementMapping,
} from "./requirementsMatrix";

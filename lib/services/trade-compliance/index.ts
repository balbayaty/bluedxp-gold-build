/**
 * Trade Compliance Services Index
 * Exports all trade compliance services
 * Enhanced with Customs Intelligence capabilities
 */

// Core Services
export {
  tradeComplianceService,
  default as tradeComplianceServiceDefault,
} from "./tradeComplianceService";
export {
  landedCostService,
  default as landedCostServiceDefault,
} from "./landedCostService";
export {
  civilDefenseService,
  default as civilDefenseServiceDefault,
} from "./civilDefenseService";
export { sfdaService, default as sfdaServiceDefault } from "./sfdaService";
export {
  regulatoryFrameworksService,
  default as regulatoryFrameworksServiceDefault,
} from "./regulatoryFrameworks";

// AI-Powered Intelligence Services
export { decisionSupportService } from "./decisionSupportService";
export { predictiveAnalyticsService } from "./predictiveAnalyticsService";

// Customs Intelligence Services (NEW)
export { tradeProgramAdvisorService } from "./tradeProgramAdvisorService";
export { tradeComplianceRootCauseAnalysisEngine } from "./rootCauseAnalysisEngine";
export { regulatoryKnowledgeBase } from "./regulatoryKnowledgeBase";

// Re-export types for convenience
export type {
  TradeComplianceRecord,
  TradeProduct,
  ProcessFlow,
  ProcessStep,
  LandedCostBreakdown,
  CivilDefenseLicense,
  SFDALicense,
  RegulatoryFramework,
} from "@/types/trade-compliance";

// Re-export Customs Intelligence types
export type {
  TradeProgram,
  TradeProgramType,
  TradeProgramRecommendation,
  RootCauseAnalysis,
  Certificate,
  CertificateRecommendation,
  Solution,
  TariffUpdate,
  SanctionsUpdate,
  RegulatoryChange,
  ROIAnalysis,
  ProgramComparison,
  JourneyIntelligence,
  BottleneckIntelligence,
} from "@/types/customs-intelligence";

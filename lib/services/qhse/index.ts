/**
 * QHSE Services Index
 * Centralized export for all QHSE services
 * Comprehensive coverage: ISO, FDA, API, Food Safety, Business Continuity
 */

export { qhseIncidentService } from "./incidentService";
export { qhseInspectionService } from "./inspectionService";
export { qhseTrainingService } from "./trainingService";
export { qhseEnvironmentalService } from "./environmentalService";
export { qhseSafetyMetricsService } from "./safetyMetricsService";
export { qhseRegulatoryComplianceService } from "./regulatoryComplianceService";
export { intelligentQHSEService } from "./intelligentQHSEService";

// Comprehensive Standards Services
export { foodSafetyService } from "./foodSafetyService";
export { pharmaceuticalService } from "./pharmaceuticalService";
export { oilGasService } from "./oilGasService";
export { businessContinuityService } from "./businessContinuityService";
export { comprehensiveStandardsService } from "./standards/comprehensiveStandardsFramework";

// AI/ML Predictive Analytics
export { predictiveAnalyticsService } from "./ai/predictiveAnalyticsService";
export type {
  PredictionModel,
  PredictionResult,
  AnomalyDetection,
  RiskPrediction,
  FailurePrediction,
  QualityPrediction,
} from "./ai/predictiveAnalyticsService";

// Digital Twin Integration
export { digitalTwinService } from "./digitalTwinService";
export type {
  DigitalTwin,
  SimulationResult,
  RealTimeSync,
} from "./digitalTwinService";

// Ecosystem Integration
export { qhseEcosystemIntegrationService } from "./integration/qhseEcosystemIntegrationService";
export type {
  QHSEToISOIMSIntegration,
  QHSEToWMSIntegration,
  QHSEToTMSIntegration,
  QHSEToComplianceIntegration,
  QHSEToHRIntegration,
  QHSEToFacilityIntegration,
  QHSEToChemicalIntegration,
} from "./integration/qhseEcosystemIntegrationService";

// Approval Workflows
export { qhseApprovalWorkflowService } from "./workflows/qhseApprovalWorkflowService";
export type {
  ApprovalWorkflow,
  ApprovalStep,
  PendingApproval,
  ApprovalStatus,
  ApprovalAction,
} from "./workflows/qhseApprovalWorkflowService";

// Notifications
export { qhseNotificationService } from "./notifications/qhseNotificationService";
export type {
  QHSENotificationType,
  QHSENotificationRule,
} from "./notifications/qhseNotificationService";

// Checklists
export { checklistBuilderService } from "./checklists/checklistBuilderService";
export type {
  ChecklistTemplate,
  ChecklistItemTemplate,
  BuiltChecklist,
} from "./checklists/checklistBuilderService";

// Bulk Operations
export { bulkOperationService } from "./bulk/bulkOperationService";
export type {
  BulkOperation,
  BulkOperationResult,
  BulkOperationType,
} from "./bulk/bulkOperationService";

// Import/Export
export { qhseImportService } from "./import-export/qhseImportService";
export type {
  ImportResult,
  ImportMapping,
} from "./import-export/qhseImportService";

// Search
export { qhseSearchService } from "./search/qhseSearchService";
export type {
  SearchQuery,
  SearchResult,
  SearchResultItem,
  SavedSearch,
} from "./search/qhseSearchService";

// Custom Fields
export { customFieldService } from "./custom-fields/customFieldService";
export type {
  CustomField,
  CustomFieldType,
  CustomFieldValue,
  ValidationRule,
  VisibilityRule,
} from "./custom-fields/customFieldService";

// Webhooks
export { qhseWebhookService } from "./webhooks/qhseWebhookService";
export type {
  QHSEWebhookConfig,
  QHSEWebhookEvent,
} from "./webhooks/qhseWebhookService";

// Document Templates
export { qhseDocumentTemplateService } from "./templates/qhseDocumentTemplateService";
export type {
  QHSEDocumentTemplate,
  TemplateField,
  TemplateSection,
} from "./templates/qhseDocumentTemplateService";

// Collaboration
export { collaborationService } from "./collaboration/collaborationService";
export type {
  CollaborationSession,
  CollaborationComment,
  CollaborationFile,
  CollaborationParticipant,
} from "./collaboration/collaborationService";

// Re-export types for convenience
export type {
  Incident,
  Investigation,
  RootCauseAnalysis,
  Inspection,
  InspectionFinding,
  TrainingProgram,
  TrainingRecord,
  EnvironmentalMetric,
  SafetyMetric,
  RegulatoryAudit,
  ESGReport,
} from "@/types/qhse";

// Re-export intelligent QHSE types
export type {
  IntelligentQHSEInsight,
  QHSESafetyRisk,
  QHSEComplianceRecommendation,
} from "./intelligentQHSEService";

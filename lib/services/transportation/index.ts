/**
 * Transportation Services Index
 *
 * Exports all transportation services for easy importing
 * Complete ecosystem integration - no duplication
 *
 * NEW ADDITIONS:
 * - Mode-specific services (Air, Sea, Land, Rail, Multimodal)
 * - Cross-border orchestration (Customs, FTA, Sanctions, etc.)
 * - State machine (Formal shipment lifecycle)
 * - Mind-blowing UI components
 */

// Core Services
export { routeComparisonService } from "./routeComparisonService";
export { pricingIntelligenceService } from "./pricingIntelligenceService";

// NEW: Mode-Specific Services
export * from "./modes";

// NEW: Cross-Border Services
export * from "./cross-border";

// NEW: State Machine
export * from "./stateMachine";
export { co2EmissionsService } from "./co2EmissionsService";
export { transitTimePredictionService } from "./transitTimePredictionService";
export { transportationAIInsightsService } from "./aiInsightsService";
export { comprehensiveShipmentService } from "./comprehensiveShipmentService";
export { transportationAnalyticsService } from "./analyticsService";
export { journeyIntegrationService } from "./journeyIntegrationService";
export { rootCauseIntegrationService } from "./rootCauseIntegrationService";

// Enhancement Services (Phase 1-3)
export { loadMatchingService } from "./loadMatchingService";
export { transportationIoTIntegrationService } from "./iotIntegrationService";
export { freightAuditService } from "./freightAuditService";
export { financialManagementService } from "./financialManagementService";
export { carrierNetworkService } from "./carrierNetworkService";
export { transportationComplianceService } from "./complianceService";
export { transportationPredictiveAnalyticsService } from "./predictiveAnalyticsService";
export { transportationBlockchainService } from "./blockchainService";
export { fleetManagementService } from "./fleetManagementService";
export { erpWmsIntegrationService } from "./erpWmsIntegrationService";
export { transportationWebhookService } from "./webhookService";
export { transportationRealtimeService } from "./realtimeService";
export { scenarioSimulationService } from "./scenarioSimulationService";
export { networkModelingService } from "./networkModelingService";
export { advancedLoadBuildingService } from "./advancedLoadBuildingService";
export { carrierCollaborationService } from "./carrierCollaborationService";
export { lastMileOptimizationService } from "./lastMileOptimizationService";
export { digitalTwinsService } from "./digitalTwinsService";
export { edgeComputingService } from "./edgeComputingService";
export { multiEnterpriseNetworkService } from "./multiEnterpriseNetworkService";
export { journeyAnalysisService } from "./journeyAnalysisService";
export { intelligentRoutePlanningService } from "./intelligentRoutePlanningService";
export { enhancedTransitTimeCalculator } from "./enhancedTransitTimeCalculator";
export { intelligentTouchpointAnalysisService } from "./intelligentTouchpointAnalysisService";
export { enhancedGeofencingService } from "./enhancedGeofencingService";
export { enhancedJourneyAnalysisService } from "./enhancedJourneyAnalysisService";
export { benchmarkingService } from "./benchmarkingService";
export { moduleIntegrationService } from "./moduleIntegrationService";
export { etwIntegrationService } from "./etwIntegrationService";
export { accidentInvestigationService } from "./accidentInvestigationService";
export { insuranceService } from "./insuranceService";
export { portsService } from "./portsService";

// Insurance Types
export type {
  InsurancePolicy,
  InsuranceClaim,
  CreatePolicyRequest,
  CreateClaimRequest,
  InsuranceStatistics,
} from "./insuranceService";

// Ports Types
export type { Port, CreatePortRequest, PortStatistics } from "./portsService";

// Journey Analysis Types
export type {
  Touchpoint,
  TouchpointType,
  TransportLeg,
  TransportLegMode,
  JourneyAnalysis,
  JourneyBottleneck,
  JourneyInsight,
  JourneyAnalysisRequest,
  TouchpointDocument,
  TouchpointException,
} from "./journeyAnalysisService";

// Export & Reporting Types
export type {
  ExportFormat,
  ReportType,
  ExportRequest,
  ExportResult,
  ScheduledReport,
  CustomReportTemplate,
  ReportSection,
  ReportHeader,
  ReportFooter,
  ReportStyling,
} from "./exportReportingService";

// Real-Time Updates Types
export type {
  UpdateType,
  RealtimeUpdate,
  RealtimeSubscription,
  RealtimeNotification,
} from "./realtimeUpdatesService";

// Customization Types
export type {
  UserPreferences,
  DashboardPreferences,
  DashboardWidget,
  NotificationPreferences,
  ViewPreferences,
  CustomView,
  ShortcutPreferences,
  QuickAction,
  ThemeCustomization,
} from "./customizationService";

// Collaboration Types
export type {
  SharedView,
  SharedViewAccess,
  Comment,
  CommentAttachment,
  CommentReaction,
  UserPresence,
  ChangeTracking,
  CollaborationSession,
} from "./collaborationService";

// Type Exports
export type { RouteComparisonRequest } from "./routeComparisonService";
export type { PricingIntelligenceRequest } from "./pricingIntelligenceService";
export type { EmissionsCalculationRequest } from "./co2EmissionsService";
export type { TransitTimePredictionRequest } from "./transitTimePredictionService";
export type { AIInsightsRequest } from "./aiInsightsService";
export type {
  CreateShipmentRequest,
  ComprehensiveShipmentData,
} from "./comprehensiveShipmentService";
export type { AnalyticsRequest } from "./analyticsService";
export type { JourneyIntegration } from "./journeyIntegrationService";
export type { RootCauseIntegration } from "./rootCauseIntegrationService";
export type {
  LoadMatchingRequest,
  LoadMatchingResult,
} from "./loadMatchingService";
export type {
  TransportationIoTConfig,
  TransportationSensorData,
  TransportationIoTAlert,
} from "./iotIntegrationService";
export type {
  FreightInvoice,
  FreightAuditResult,
  BillingAnomaly,
} from "./freightAuditService";
export type {
  PaymentRequest,
  Payment,
  FinancialAnalytics,
} from "./financialManagementService";
export type {
  CarrierSegment,
  CarrierRating,
  CarrierCapacity,
} from "./carrierNetworkService";
export type {
  HoursOfService,
  ELDData,
  RegulatoryCompliance,
} from "./complianceService";
export type {
  DemandForecast,
  DisruptionPrediction,
  CarrierPerformancePrediction,
} from "./predictiveAnalyticsService";
export type {
  BlockchainTransaction,
  SmartContract,
  SupplyChainTraceability,
} from "./blockchainService";
export type {
  FleetVehicle,
  MaintenanceRecord,
  FleetOptimization,
} from "./fleetManagementService";
export type {
  ERPIntegrationConfig,
  WMSIntegrationConfig,
  IntegrationSync,
} from "./erpWmsIntegrationService";
export type {
  TransportationWebhookEvent,
  WebhookSubscription,
} from "./webhookService";
export type {
  Scenario,
  ScenarioVariable,
  ScenarioAssumption,
  ScenarioResult,
  ScenarioMetrics,
  ScenarioComparison,
  RiskAssessment,
  RiskFactor,
  ScenarioSimulationRequest,
  ScenarioSimulationResult,
} from "./scenarioSimulationService";
export type {
  NetworkNode,
  NetworkLink,
  NetworkModel,
  NetworkScenario,
  NetworkModification,
  NetworkAssumption,
  NetworkOptimizationResult,
  NetworkMetrics,
  FacilityLocationOptimization,
  FacilityLocationResult,
} from "./networkModelingService";
export type {
  AccidentIncident,
  IncidentDetectionRequest,
  IncidentAnalysisRequest,
  RiskPredictionRequest,
  IncidentStatistics,
} from "./accidentInvestigationService";
export type {
  LoadItem,
  Vehicle,
  TemperatureZone,
  Compartment,
  LoadPosition,
  LoadPlan,
  LoadMetrics,
  LoadConstraints,
  LoadOptimization,
  LoadBuildingRequest,
  LoadBuildingResult,
  WagonBalancingRequest,
  WagonBalancingResult,
} from "./advancedLoadBuildingService";
export {
  TransportationError,
  ShipmentNotFoundError,
  CarrierNotFoundError,
  InvalidRouteError,
  ComplianceViolationError,
  IoTConnectionError,
  ELMIntegrationError,
  PaymentProcessingError,
  FreightAuditError,
  handleTransportationError,
  asyncHandler,
} from "./errorHandling";

// Utilities
export {
  initializeTransportationIntegrations,
  syncShipmentWithJourney,
  syncShipmentWithRootCause,
  validateShipmentData,
  calculateShipmentMetrics,
  formatShipmentForDisplay,
} from "./integrationUtilities";

// Database Schemas
export {
  TransportationDatabaseSchemas,
  type ShipmentSchema,
  type CarrierSchema,
  type LoadMatchSchema,
  type FreightInvoiceSchema,
  type PaymentSchema,
  type IoTDeviceSchema,
  type SensorDataSchema,
  type ComplianceRecordSchema,
  type HoursOfServiceSchema,
  type BlockchainTransactionSchema,
  type FleetVehicleSchema,
} from "./databaseSchemas";

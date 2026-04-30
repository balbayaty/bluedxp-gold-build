/**
 * WMS Services Index
 * Exports all WMS-related services and utilities
 * Comprehensive Warehouse Management - BlueDXP Platform
 */

// Feature Registry
export {
  WMS_FEATURES,
  WMS_FEATURE_CATEGORIES,
  getFeatureById,
  getFeaturesByCategory,
  getFeaturesByStatus,
  getFeaturesByReadiness,
  getFeaturesByImportance,
} from "./featureRegistry";

// Route Calculation
export {
  WarehouseRouteCalculator,
  createMockWarehouseLayout,
  optimizePickingRoute,
} from "./routeCalculationService";

// Location Management
export {
  warehouseLocationService,
  type WarehouseLocationService,
} from "./locationService";

// Area/Zone Management
export {
  warehouseAreaService,
  type WarehouseAreaService,
  type AreaStatistics,
} from "./areaService";

// Fire Safety
export {
  fireSafetyService,
  type FireSafetyService,
  type FireSuppressionSystemSpec,
  type FireSafetyCompliance,
  type FireSystemStatus,
  type FireSystemAlert,
} from "./fireSafetyService";

// Regulatory Compliance
export {
  regulatoryComplianceService,
  type RegulatoryComplianceService,
  type RegulatoryAuthority,
  type ComplianceCheckResult,
  type AIComplianceVerification,
} from "./regulatoryComplianceService";

// SKU Management
export { skuService, type SKUService } from "./skuService";

// Real-Time Inventory
export {
  inventoryService,
  type InventoryService,
  type InventoryStock,
  type InventoryMovement,
  type InventoryAccuracy,
  type IoTInventoryData,
} from "./inventoryService";

// AI Analytics
export {
  aiAnalyticsService,
  type AIAnalyticsService,
  type DemandForecast,
  type InventoryOptimization,
  type SafetyStockOptimization,
  type ReorderPointOptimization,
  type ABCXYZClassification,
} from "./aiAnalyticsService";

// Warehouse Optimization
export {
  warehouseOptimizationService,
  type WarehouseOptimizationService,
  type SlottingRecommendation,
  type PickPathOptimization,
  type PutawayOptimization,
  type SpaceUtilization,
  type LaborOptimization,
} from "./warehouseOptimizationService";

// IoT Service
export {
  iotService,
  type IoTService,
  type IoTDevice,
  type SensorReading,
  type EnvironmentalMonitoring,
  type EdgeComputingTask,
} from "./iotService";

// Automation Service
export {
  automationService,
  type AutomationService,
  type Robot,
  type AutomatedTask,
  type ConveyorSystem,
  type AGV,
  type RPATask,
} from "./automationService";

// Multi-Warehouse Service
export {
  multiWarehouseService,
  type MultiWarehouseService,
  type WarehouseNetwork,
  type CrossWarehouseInventory,
  type CrossWarehouseTransfer,
  type NetworkOptimization,
  type NetworkFulfillment,
} from "./multiWarehouseService";

// Sustainability Service
export {
  sustainabilityService,
  type SustainabilityService,
  type CarbonFootprint,
  type EnergyConsumption,
  type WasteTracking,
  type SustainabilityMetrics,
  type GreenLogistics,
} from "./sustainabilityService";

// New exports for enhanced warehouse services
export {
  warehouseVisionService,
  type WarehouseVisionAnalysis,
} from "./warehouseVisionService";

export {
  warehouseProcessMiningService,
  type WarehouseProcessMetrics,
  type WarehouseProcessOptimization,
} from "./warehouseProcessMiningService";

export {
  warehouseDigitalTwinService,
  type WarehouseDigitalTwin,
  type WarehouseSimulation,
} from "./warehouseDigitalTwinService";

export {
  warehouseAgentsService,
  type WarehouseAgentTask,
} from "./agents/warehouseAgents";

// Robotic Hub Service
export {
  roboticHubService,
  type RoboticVendor,
  type RoboticFleet,
  type HumanRobotCollaboration,
  type RoboticTaskOrchestration,
} from "./roboticHubService";

// Order Streaming Service
export {
  orderStreamingService,
  type StreamingOrder,
  type OrderStream,
  type ContinuousOptimization,
} from "./orderStreamingService";

// Voice Picking Service
export {
  voicePickingService,
  type VoicePickingSession,
  type VoiceCommand,
  type VoicePickingDevice,
  type VoicePickingWorkflow,
} from "./voicePickingService";

// Dynamic Resource Rebalancing Service
export {
  dynamicResourceRebalancingService,
  type ResourcePool,
  type ResourceDemand,
  type RebalancingAction,
  type RebalancingPlan,
} from "./dynamicResourceRebalancingService";

// Network Simulation Service
export {
  networkSimulationService,
  type NetworkSimulation,
  type NetworkSimulationResults,
} from "./networkSimulationService";

// Continuous Learning Service
export {
  continuousLearningService,
  type LearningModel,
  type ModelFeedback,
  type LearningMetrics,
} from "./continuousLearningService";

// Industry Benchmarking Service
export {
  industryBenchmarkingService,
  type IndustryBenchmark,
  type WarehouseBenchmark,
  type BenchmarkComparison,
} from "./industryBenchmarkingService";

// Knowledge Base Integration
export {
  warehouseKnowledgeBaseIntegration,
  type WarehouseKnowledge,
  type WarehouseKnowledgeQuery,
} from "./knowledgeBaseIntegration";

// Copilot Integration
export {
  warehouseCopilotIntegration,
  type WarehouseCopilotQuery,
  type WarehouseCopilotResponse,
} from "./copilotIntegration";

// Graph Integration
export {
  warehouseGraphIntegration,
  type WarehouseEntityGraph,
  type WarehouseImpactAnalysis,
} from "./graphIntegration";

// Decision Integration
export {
  warehouseDecisionIntegration,
  type WarehouseDecision,
  type WarehouseDecisionRequest,
} from "./decisionIntegration";

// Load Design Integration
export {
  warehouseLoadDesignIntegration,
  type WarehouseLoadDesign,
} from "./loadDesignIntegration";

// Finance Integration
export {
  warehouseFinanceIntegration,
  type WarehouseFinancialSummary,
  type WarehouseCostAllocation,
} from "./financeIntegration";

// HR Integration
export {
  warehouseHRIntegration,
  type WarehouseWorkforce,
  type WarehouseTaskAssignment,
} from "./hrIntegration";

// QHSE Integration
export {
  warehouseQHSEIntegration,
  type WarehouseSafetyMetrics,
} from "./qhseIntegration";

// Cross-Module Analytics Integration
export {
  warehouseCrossModuleAnalyticsIntegration,
  type WarehouseCrossModuleAnalytics,
} from "./crossModuleAnalyticsIntegration";

// Image Verification Integration
export {
  warehouseImageVerificationIntegration,
  type WarehouseImageEvidence,
  type WarehouseImageVerificationRequest,
} from "./imageVerificationIntegration";

// WhatsApp Integration
export {
  warehouseWhatsAppIntegration,
  type WarehouseWhatsAppNotification,
  type WarehouseWhatsAppStats,
} from "./whatsappIntegration";

// Brand Messaging Integration
export {
  warehouseBrandMessagingIntegration,
  type WarehouseBrandMessage,
  type WarehouseBrandMessagingStats,
} from "./brandMessagingIntegration";

// QR Services Integration
export {
  warehouseQRServicesIntegration,
  type WarehouseQRCode,
  type WarehouseQRAnalytics,
} from "./qrServicesIntegration";

// Workflow Integration
export {
  warehouseWorkflowIntegration,
  type WarehouseWorkflow,
  type WarehouseWorkflowExecution,
  type WarehouseWorkflowStats,
} from "./workflowIntegration";

// Facility Management Integration
export {
  warehouseFacilityManagementIntegration,
  type WarehouseFacilityData,
  type WarehouseFacilityAsset,
  type WarehouseMaintenanceRecord,
  type WarehouseEnergyData,
  type WarehouseSpaceData,
  type WarehouseFacilityStats,
} from "./facilityManagementIntegration";

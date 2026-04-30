/**
 * Load Design Service - Main Export
 *
 * Centralized exports for all load design services
 */

export { advancedLoadDesignService } from "./advancedLoadDesignService";
export { loadAnalyticsService } from "./analytics/loadAnalyticsService";
export { costOptimizationService } from "./cost/costOptimizationService";
export { realtimeService } from "./realtime/realtimeService";
export { loadPlanDatabaseAdapter } from "./database/loadPlanDatabaseAdapter";
export { exportService } from "./export/exportService";
export { binPacking3D } from "./algorithms/binPacking3D";
export {
  getAllVehicleSpecifications,
  getVehicleSpec,
  getVehicleSpecsByCategory,
} from "./vehicleSpecifications";
export { loadComplianceValidator } from "./compliance/loadComplianceValidator";
export { multimodalPlanner } from "./multimodal/multimodalPlanner";
export { carrierIntegrationService } from "./integrations/carrierIntegrations";
export { routeOptimizationService } from "./integrations/routeOptimization";
export { predictiveOptimizationService } from "./ml/predictiveOptimization";

export type {
  LoadItem,
  LoadPlan,
  MultimodalLoadPlan,
  VehicleSpecification,
  LoadOptimizationRequest,
  LoadOptimizationResult,
} from "@/types/load-design";

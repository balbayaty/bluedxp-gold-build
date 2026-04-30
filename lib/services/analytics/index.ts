/**
 * Analytics Services Index
 *
 * Exports all analytics services including:
 * - Monte Carlo Simulation
 * - Bottleneck Analysis
 * - Optimization Center
 * - Sustainability Command Center
 * - Touchpoint Explorer
 */

export { monteCarloSimulationService } from "./monteCarloSimulationService";
export { bottleneckAnalysisService } from "./bottleneckAnalysisService";
export { optimizationCenterService } from "./optimizationCenterService";
export { sustainabilityCommandCenterService } from "./sustainabilityCommandCenterService";
export { touchpointExplorerService } from "./touchpointExplorerService";

export type {
  MonteCarloConfig,
  MonteCarloResults,
  JourneyTimeDistribution,
  SuccessProbability,
  ConfidenceInterval,
  SensitivityAnalysis,
  CumulativeProbability,
  TouchpointAnalysis,
  BottleneckAnalysis,
  VulnerabilityScore,
  OptimizationLevels,
  OptimizationResults,
  ROIAnalysis,
  CommercialModel,
  OptimizationPreset,
  JourneyByPhase,
  TouchpointOptimization,
  TouchpointEfficiency,
  ShipmentComparison,
} from "@/types/analytics";

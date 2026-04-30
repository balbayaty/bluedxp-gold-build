/**
 * Analytics Types
 * Types for Monte Carlo Simulation, Bottleneck Analysis, and Sustainability Analytics
 * Migrated from: flex-logistics-dashboard, sustainability-dashboard
 */

// ============================================================================
// MONTE CARLO SIMULATION TYPES
// ============================================================================

export type DistributionType = 'NORMAL' | 'LOGNORMAL' | 'TRIANGULAR' | 'UNIFORM'

export interface MonteCarloConfig {
  iterations: number // Default: 10000
  confidenceLevel: number // Default: 0.9 (90%)
  distributionType: DistributionType
  correlationMatrix?: number[][] // For Cholesky decomposition
}

export interface JourneyTimeDistribution {
  range: string // e.g., "70-75"
  current: number
  phase1: number
  phase2: number
  phase3: number
}

export interface SuccessProbability {
  metric: string
  probability: number // 0-100
}

export interface ConfidenceInterval {
  phase: string
  mean: number
  median: number
  p10: number // 10th percentile
  p90: number // 90th percentile
}

export interface SensitivityAnalysis {
  name: string
  baseline: number
  worst: number
  best: number
  target: number
}

export interface CumulativeProbability {
  hours: number
  probability: number // 0-100
}

export interface MonteCarloResults {
  journeyTimeDistribution: JourneyTimeDistribution[]
  successProbabilities: SuccessProbability[]
  confidenceIntervals: ConfidenceInterval[]
  sensitivityAnalysis: SensitivityAnalysis[]
  cumulativeProbability: CumulativeProbability[]
  metadata: {
    iterations: number
    executionTime: number
    timestamp: Date
  }
}

// ============================================================================
// BOTTLENECK ANALYSIS TYPES
// ============================================================================

export type JourneyPhase = 'Origin' | 'Transport' | 'Customs' | 'Destination'

export interface TouchpointAnalysis {
  id: number
  name: string
  hours: number
  percentOfJourney: number
  phase: JourneyPhase
  bestObserved: number
  potentialSaving: number
}

export interface OffloadingProcess {
  component: string
  hours: number
  percentOfOffloading: number
  bestObserved: number
  potentialSaving: number
}

export interface ShipmentTouchpoints {
  tp1: number // Plant Arrival to Entry
  tp2: number // Entry to Doc Receipt
  tp3: number // Doc Receipt to Departure
  tp4: number // Transit to SA Customs
  tp5: number // SA Customs
  tp6: number // Kuwait Customs
  tp7: number // Transit to Warehouse
  tp8_9: number // Offloading Process
  tp10: number // Transit to KW Customs
  tp11: number // KW Customs Return
  tp12: number // SA Customs Return
}

export interface ShipmentData {
  waybill: string
  touchpoints: ShipmentTouchpoints
  arrivalTime: string
}

export interface ShipmentOffloading {
  waybill: string
  arrivalTime: string
  totalOffloading: number
  outsideHoursWaiting: number
  actualOffloading: number
  percentOutsideHours: number
  arrivalWindow: 'Early Morning' | 'Morning' | 'Afternoon' | 'Night'
}

export interface VulnerabilityScore {
  name: string
  vulnerabilityScore: number // 0-10
  timeImpact: number
  phase: JourneyPhase
}

export interface BottleneckAnalysis {
  primaryBottlenecks: TouchpointAnalysis[]
  vulnerabilityScores: VulnerabilityScore[]
  arrivalTimingImpact: {
    window: string
    count: number
    avgWaiting: number
    avgTotal: number
    waitingPercentage: number
    efficiency: number
  }[]
  operatingHoursConstraints: {
    facility: string
    weekdays: string
    weekend: string
  }[]
}

// ============================================================================
// SUSTAINABILITY ANALYTICS TYPES
// ============================================================================

export interface SustainabilityMetrics {
  metric: string
  current: number
  optimized: number
  potentialReduction: number
  unit: string
}

export interface AssetUtilization {
  metric: string
  currentPerformance: number | string
  optimalPerformance: number | string
  improvementPotential: number | string
  unit?: string
}

export interface OperatingHours {
  facility: string
  weekdays: string
  weekend: string
  notes?: string
}

export interface JourneySummary {
  totalHours: number
  bestPossibleHours: number
  potentialSavingHours: number
  potentialSavingPercentage: number
}

// ============================================================================
// OPTIMIZATION CENTER TYPES
// ============================================================================

export type OptimizationPreset = 'custom' | 'minimal' | 'balanced' | 'aggressive'

export interface OptimizationLevels {
  [touchpointId: number]: number // 0-100
}

export interface OptimizationPresetConfig {
  name: string
  levels: OptimizationLevels
}

export interface OptimizationResults {
  touchpointSavings: {
    id: number
    name: string
    originalHours: number
    potentialSaving: number
    appliedSaving: number
    optimizedHours: number
    optimizationLevel: number
  }[]
  journey: {
    originalHours: number
    optimizedHours: number
    savingHours: number
    savingPercentage: number
  }
  sustainability: {
    co2Reduction: number
    fuelReduction: number
    costReduction: number
    originalCO2: number
    optimizedCO2: number
  }
  fleet: {
    originalSize: number
    optimizedSize: number
    reduction: number
  }
}

export interface ROIAnalysis {
  implementationCost: number
  monthlySavings: number
  annualSavings: number
  paybackPeriod: number // months
  oneYearROI: number // percentage
  fleetSavings: number
  tripSavings: number
}

export interface CommercialModel {
  name: string
  currentCost: number
  optimizedCost: number
  savingsPercentage: number
  details: string
}

// ============================================================================
// COMMAND CENTER TYPES
// ============================================================================

export interface JourneyByPhase {
  name: JourneyPhase
  value: number // percentage
  color?: string
}

export interface TouchpointOptimization {
  name: string
  hours: number
  potentialSaving: number
  phase: JourneyPhase
}

// ============================================================================
// TOUCHPOINT EXPLORER TYPES
// ============================================================================

export interface TouchpointEfficiency {
  currentDuration: number
  bestObserved: number
  potentialSaving: number
  efficiency: number // percentage
  improvementPotential: number // percentage
}

export interface ShipmentComparison {
  name: string // waybill
  hours: number
  arrivalTime: string
}






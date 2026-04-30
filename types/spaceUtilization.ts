// Space Utilization Types
// Comprehensive space tracking and capacity planning for 3PL/4PL warehouses

// ============================================================================
// SPACE UTILIZATION TYPES
// ============================================================================

export interface SpaceUtilization {
  warehouseId: string
  warehouseName: string
  tenantId: string
  
  // Capacity Information
  totalCapacity: CapacityMetrics
  currentUtilization: UtilizationMetrics
  availableCapacity: CapacityMetrics
  
  // Customer Breakdown
  customerBreakdown: CustomerSpaceAllocation[]
  
  // Trends
  trends: UtilizationTrend[]
  forecasts: UtilizationForecast[]
  
  // Efficiency Metrics
  efficiency: SpaceEfficiency
  
  // Timestamp
  calculatedAt: Date | string
  period: {
    start: Date | string
    end: Date | string
  }
}

export interface CapacityMetrics {
  totalArea: number // sqm
  totalPalletPositions: number
  totalVolume: number // cubic meters
  totalWeight: number // kg
  dockDoors: number
  loadingBays: number
  temperatureZones: TemperatureZoneCapacity[]
}

export interface TemperatureZoneCapacity {
  zoneId: string
  zoneName: string
  temperatureRange: {
    min: number
    max: number
  }
  totalArea: number
  totalPalletPositions: number
  totalVolume: number
  usedArea: number
  usedPalletPositions: number
  utilization: number
}

export interface UtilizationMetrics {
  usedArea: number
  usedPalletPositions: number
  usedVolume: number
  usedWeight: number
  utilizationPercentage: number
  palletUtilizationPercentage: number
  volumeUtilizationPercentage: number
  weightUtilizationPercentage: number
  peakUtilization: number
  averageUtilization: number
  minimumUtilization: number
}

export interface CustomerSpaceAllocation {
  customerId: string
  customerName: string
  customerNumber: string
  serviceTier: string
  
  // Allocated Space
  allocatedArea: number
  allocatedPalletPositions: number
  allocatedVolume: number
  
  // Used Space
  usedArea: number
  usedPalletPositions: number
  usedVolume: number
  
  // Utilization
  areaUtilization: number // percentage
  palletUtilization: number // percentage
  volumeUtilization: number // percentage
  
  // Allocation Type
  allocationType: 'DEDICATED' | 'SHARED' | 'DYNAMIC'
  
  // Trends
  utilizationTrend: 'INCREASING' | 'STABLE' | 'DECREASING'
  growthRate?: number // percentage per month
  
  // Forecast
  forecastedUtilization?: number
  forecastedDate?: Date | string
}

export interface UtilizationTrend {
  date: Date | string
  utilization: number
  palletUtilization: number
  volumeUtilization: number
  customerBreakdown: {
    customerId: string
    customerName: string
    utilization: number
    palletUtilization: number
  }[]
  factors: {
    incomingOrders: number
    outgoingOrders: number
    netChange: number
  }
}

export interface UtilizationForecast {
  date: Date | string
  predictedUtilization: number
  predictedPalletUtilization: number
  confidence: number // 0-100
  factors: {
    historicalTrend: number
    seasonalFactor: number
    growthFactor: number
    customerForecasts: number
  }
  scenarios: {
    optimistic: number
    realistic: number
    pessimistic: number
  }
}

export interface SpaceEfficiency {
  overallEfficiency: number // 0-100
  areaEfficiency: number
  palletEfficiency: number
  volumeEfficiency: number
  weightEfficiency: number
  locationUtilization: number
  aisleEfficiency: number
  dockUtilization: number
  recommendations: EfficiencyRecommendation[]
}

export interface EfficiencyRecommendation {
  id: string
  type: 'OPTIMIZATION' | 'EXPANSION' | 'REALLOCATION' | 'CONSOLIDATION'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  description: string
  impact: {
    currentUtilization: number
    projectedUtilization: number
    improvement: number
  }
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
  cost?: number
  estimatedSavings?: number
  implementationTime?: string
}

// ============================================================================
// CAPACITY PLANNING TYPES
// ============================================================================

export interface CapacityPlan {
  id: string
  warehouseId: string
  planName: string
  planType: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'
  period: {
    start: Date | string
    end: Date | string
  }
  
  // Current State
  currentCapacity: CapacityMetrics
  currentUtilization: UtilizationMetrics
  
  // Projected State
  projectedCapacity: CapacityMetrics
  projectedUtilization: UtilizationMetrics
  
  // Customer Projections
  customerProjections: CustomerCapacityProjection[]
  
  // Actions Required
  actions: CapacityAction[]
  
  // Risks
  risks: CapacityRisk[]
  
  // Status
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdBy: string
  approvedBy?: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CustomerCapacityProjection {
  customerId: string
  customerName: string
  currentAllocation: CustomerSpaceAllocation
  projectedAllocation: {
    area: number
    palletPositions: number
    volume: number
    growthRate: number
  }
  projectedUtilization: number
  confidence: number
  assumptions: string[]
}

export interface CapacityAction {
  id: string
  type: 'EXPAND' | 'REDUCE' | 'REALLOCATE' | 'OPTIMIZE' | 'CONSOLIDATE'
  description: string
  target: {
    area?: number
    palletPositions?: number
    volume?: number
  }
  timeline: {
    start: Date | string
    end: Date | string
  }
  cost: number
  expectedImpact: {
    utilizationChange: number
    efficiencyImprovement: number
  }
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  dependencies?: string[]
}

export interface CapacityRisk {
  id: string
  type: 'OVER_CAPACITY' | 'UNDER_UTILIZATION' | 'CUSTOMER_CHURN' | 'GROWTH_CONSTRAINT'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
  probability: number // 0-100
  impact: {
    utilization: number
    revenue: number
    customers: number
  }
  mitigation: string[]
  timeline: {
    expectedDate: Date | string
    urgency: 'IMMEDIATE' | 'SOON' | 'MONITOR'
  }
}

// ============================================================================
// SPACE ALLOCATION TYPES
// ============================================================================

export interface SpaceAllocation {
  id: string
  warehouseId: string
  customerId: string
  customerName: string
  
  // Allocation Details
  allocationType: 'DEDICATED' | 'SHARED' | 'DYNAMIC'
  allocatedArea: number
  allocatedPalletPositions: number
  allocatedVolume: number
  
  // Location Details
  locations: AllocatedLocation[]
  zones: AllocatedZone[]
  
  // Terms
  startDate: Date | string
  endDate?: Date | string
  autoRenew: boolean
  minimumCommitment: number
  
  // Pricing
  pricing: {
    perSqm: number
    perPalletPosition: number
    perVolume: number
    monthlyFee: number
    currency: string
  }
  
  // Status
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TERMINATED'
  
  // Utilization
  currentUtilization: {
    area: number
    palletPositions: number
    volume: number
    percentage: number
  }
  
  createdAt: Date | string
  updatedAt: Date | string
}

export interface AllocatedLocation {
  locationId: string
  locationCode: string
  area: number
  palletPositions: number
  volume: number
  zone: string
  aisle: string
  rack: string
  level: string
}

export interface AllocatedZone {
  zoneId: string
  zoneName: string
  zoneType: string
  area: number
  palletPositions: number
  volume: number
  temperatureRange?: {
    min: number
    max: number
  }
}

// ============================================================================
// EXPORTS
// ============================================================================
// All types are already exported above, no need to re-export


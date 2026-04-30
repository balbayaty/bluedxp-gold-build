// World-Class Picking Module Types
// Industry-leading picking system types and interfaces

export type PickingStrategy = 
  | 'DISCRETE'      // Single order picking
  | 'BATCH'         // Multiple orders, single picker
  | 'WAVE'          // Grouped orders by criteria
  | 'ZONE'          // Zone-based picking
  | 'CLUSTER'       // Multi-order, multi-zone
  | 'PICK_TO_CART'  // Cart-based picking
  | 'PICK_TO_LIGHT' // Light-directed picking
  | 'VOICE'         // Voice-directed picking
  | 'VISION'        // AR/Computer vision picking
  | 'AUTO'          // AI-optimized strategy selection

export type PickingStatus = 
  | 'PENDING'           // Not yet started
  | 'ASSIGNED'          // Assigned to picker
  | 'IN_PROGRESS'       // Currently being picked
  | 'PAUSED'            // Temporarily paused
  | 'QUALITY_CHECK'     // Under quality verification
  | 'COMPLETED'         // Successfully completed
  | 'PARTIAL'           // Partially completed
  | 'CANCELLED'         // Cancelled
  | 'ERROR'             // Error occurred
  | 'REJECTED'          // Quality rejected

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'

export type QualityStatus = 
  | 'PENDING'
  | 'PASSED'
  | 'FAILED'
  | 'REQUIRES_REVIEW'

export interface PickLocation {
  id: string
  locationCode: string
  zone: string
  aisle: string
  rack: string
  shelf: string
  bin: string
  coordinates: {
    x: number
    y: number
    z: number
  }
  distanceFromStart: number
  estimatedTravelTime: number // seconds
  accessibility: 'EASY' | 'MEDIUM' | 'DIFFICULT'
  requiresEquipment: boolean
  equipmentType?: 'FORKLIFT' | 'REACH_TRUCK' | 'LADDER' | 'NONE'
}

export interface PickItem {
  id: string
  materialNumber: string
  materialDescription: string
  batchNumber?: string
  serialNumber?: string
  requiredQuantity: number
  pickedQuantity: number
  unit: string
  fromLocation: PickLocation
  toLocation?: PickLocation
  status: 'PENDING' | 'PICKED' | 'VERIFIED' | 'REJECTED'
  priority: Priority
  weight: number // kg
  volume: number // m³
  dimensions?: {
    length: number
    width: number
    height: number
  }
  hazardous: boolean
  temperatureControlled: boolean
  requiresSpecialHandling: boolean
  qualityCheckRequired: boolean
  qualityStatus?: QualityStatus
  pickedAt?: Date
  pickedBy?: string
  verifiedAt?: Date
  verifiedBy?: string
  imageUrl?: string // For verification
  barcode?: string
  qrCode?: string
}

export interface PickingTask {
  id: string
  taskNumber: string
  orderNumber: string
  orderNumbers?: string[] // For batch/wave picking
  strategy: PickingStrategy
  status: PickingStatus
  priority: Priority
  
  // Assignment
  assignedTo?: string
  assignedToName?: string
  assignedAt?: Date
  startedAt?: Date
  completedAt?: Date
  pausedAt?: Date
  
  // Items
  items: PickItem[]
  totalItems: number
  pickedItems: number
  completionPercentage: number
  
  // Route optimization
  optimizedRoute: PickLocation[]
  estimatedDuration: number // seconds
  actualDuration?: number
  estimatedDistance: number // meters
  actualDistance?: number
  
  // Performance metrics
  picksPerHour?: number
  accuracyRate?: number
  errorCount?: number
  qualityScore?: number
  
  // Sustainability
  carbonFootprint?: number // kg CO2
  energyConsumed?: number // kWh
  stepsTaken?: number
  
  // Quality
  qualityChecks: QualityCheck[]
  overallQualityStatus: QualityStatus
  
  // Equipment
  equipmentRequired?: string[]
  equipmentUsed?: string[]
  
  // Notes and issues
  notes?: string[]
  issues?: string[]
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface QualityCheck {
  id: string
  itemId: string
  checkType: 'WEIGHT' | 'QUANTITY' | 'BARCODE' | 'IMAGE' | 'MANUAL' | 'AUTO'
  status: QualityStatus
  expectedValue?: any
  actualValue?: any
  tolerance?: number
  checkedAt?: Date
  checkedBy?: string
  notes?: string
  imageUrl?: string
}

export interface Picker {
  id: string
  name: string
  employeeId: string
  zone?: string
  currentTask?: string
  status: 'AVAILABLE' | 'BUSY' | 'ON_BREAK' | 'OFFLINE'
  performance: {
    averagePicksPerHour: number
    accuracyRate: number
    totalPicks: number
    totalDistance: number
    averageQualityScore: number
  }
  location?: {
    x: number
    y: number
    zone: string
  }
  equipment?: string[]
  lastUpdate: Date
}

export interface RouteOptimization {
  algorithm: 'NEAREST_NEIGHBOR' | 'GENETIC' | 'ANT_COLONY' | 'AI_ML' | 'HYBRID'
  optimizedRoute: PickLocation[]
  totalDistance: number // meters
  totalTime: number // seconds
  efficiency: number // percentage
  energySavings: number // percentage
  carbonReduction: number // kg CO2
  confidence: number // 0-1
}

export interface PickingAnalytics {
  // Performance metrics
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  averagePickTime: number // seconds
  averagePicksPerHour: number
  averageAccuracy: number // percentage
  
  // Efficiency metrics
  averageDistancePerPick: number // meters
  averageTimePerPick: number // seconds
  routeEfficiency: number // percentage
  utilizationRate: number // percentage
  
  // Quality metrics
  qualityPassRate: number // percentage
  errorRate: number // percentage
  reworkRate: number // percentage
  
  // Sustainability metrics
  totalCarbonFootprint: number // kg CO2
  totalEnergyConsumed: number // kWh
  carbonPerPick: number // kg CO2
  energyPerPick: number // kWh
  
  // Strategy performance
  strategyPerformance: Record<PickingStrategy, {
    averageTime: number
    averageAccuracy: number
    averageEfficiency: number
    taskCount: number
  }>
  
  // Time-based analytics
  hourlyPerformance: Array<{
    hour: number
    picks: number
    accuracy: number
    efficiency: number
  }>
  
  // Picker performance
  topPerformers: Array<{
    pickerId: string
    pickerName: string
    picksPerHour: number
    accuracy: number
    qualityScore: number
  }>
}

export interface PickingConfiguration {
  // Strategy settings
  defaultStrategy: PickingStrategy
  enableAutoStrategy: boolean
  enableMultiStrategy: boolean
  
  // Optimization settings
  routeOptimizationEnabled: boolean
  optimizationAlgorithm: RouteOptimization['algorithm']
  considerEnergyEfficiency: boolean
  considerSustainability: boolean
  
  // Quality settings
  qualityCheckRequired: boolean
  qualityCheckPercentage: number // 0-100
  autoQualityCheck: boolean
  imageVerification: boolean
  
  // Performance settings
  targetPicksPerHour: number
  targetAccuracy: number // percentage
  maxErrorRate: number // percentage
  
  // Sustainability settings
  trackCarbonFootprint: boolean
  trackEnergyConsumption: boolean
  optimizeForSustainability: boolean
  
  // Equipment settings
  equipmentRequired: boolean
  equipmentTypes: string[]
  
  // Notification settings
  realTimeNotifications: boolean
  alertOnErrors: boolean
  alertOnDelays: boolean
}





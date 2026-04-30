// World-Class Cycle Counting Module Types
// Industry-leading cycle counting system types and interfaces
// Beats SAP, Oracle, Manhattan, and all top-tier WMS systems

export type CountingMethod = 
  | 'ABC_ANALYSIS'        // ABC classification based
  | 'RANDOM'              // Random selection
  | 'LOCATION_BASED'      // Location-based counting
  | 'FREQUENCY_BASED'     // Frequency-based counting
  | 'VALUE_BASED'         // High-value items first
  | 'CONTROL_GROUP'       // Control group method
  | 'BLIND_COUNT'         // Blind counting (no book qty shown)
  | 'OPEN_COUNT'          // Open counting (book qty shown)
  | 'SPOT_CHECK'          // Spot check method
  | 'FULL_PHYSICAL'       // Full physical inventory
  | 'CONTINUOUS'          // Continuous cycle counting
  | 'AI_OPTIMIZED'         // AI-powered optimization

export type CycleCountStatus = 
  | 'PLANNED'             // Count planned but not started
  | 'SCHEDULED'           // Count scheduled
  | 'ASSIGNED'            // Assigned to counter
  | 'IN_PROGRESS'         // Currently being counted
  | 'COMPLETED'           // Count completed
  | 'REVIEW_REQUIRED'     // Requires review
  | 'ADJUSTED'            // Inventory adjusted
  | 'REJECTED'            // Count rejected
  | 'CANCELLED'           // Count cancelled
  | 'ON_HOLD'             // Count on hold

export type VarianceSeverity = 
  | 'NONE'                // No variance
  | 'MINOR'               // Minor variance (< 1%)
  | 'MODERATE'            // Moderate variance (1-5%)
  | 'MAJOR'               // Major variance (5-10%)
  | 'CRITICAL'            // Critical variance (> 10%)

export type RootCauseCategory = 
  | 'COUNTING_ERROR'      // Human counting error
  | 'DATA_ENTRY_ERROR'    // Data entry mistake
  | 'THEFT'               // Theft or pilferage
  | 'DAMAGE'              // Damaged goods
  | 'EXPIRY'              // Expired items
  | 'LOCATION_ERROR'      // Wrong location
  | 'SYSTEM_ERROR'        // System data error
  | 'RECEIVING_ERROR'     // Receiving discrepancy
  | 'SHIPPING_ERROR'      // Shipping discrepancy
  | 'PUTAWAY_ERROR'       // Putaway mistake
  | 'PICKING_ERROR'       // Picking error
  | 'UNKNOWN'             // Unknown cause

export interface CountLocation {
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
  accessibility: 'EASY' | 'MEDIUM' | 'DIFFICULT'
  requiresEquipment: boolean
  equipmentType?: 'FORKLIFT' | 'REACH_TRUCK' | 'LADDER' | 'NONE'
}

export interface CountItem {
  id: string
  materialNumber: string
  materialDescription: string
  batchNumber?: string
  serialNumber?: string
  location: CountLocation
  bookQuantity: number
  countedQuantity?: number
  unit: string
  unitPrice: number
  totalValue: number
  variance?: number
  variancePercentage?: number
  varianceValue?: number
  varianceSeverity?: VarianceSeverity
  status: 'PENDING' | 'COUNTING' | 'COUNTED' | 'VERIFIED' | 'REJECTED'
  countedAt?: Date
  countedBy?: string
  verifiedAt?: Date
  verifiedBy?: string
  notes?: string
  images?: string[] // For verification
  barcode?: string
  qrCode?: string
  requiresRecount?: boolean
  recountReason?: string
}

export interface CycleCount {
  id: string
  countNumber: string
  countType: CountingMethod
  status: CycleCountStatus
  
  // Scheduling
  scheduledDate?: Date
  scheduledTime?: string
  assignedTo?: string
  assignedToName?: string
  assignedAt?: Date
  startedAt?: Date
  completedAt?: Date
  
  // Items
  items: CountItem[]
  totalItems: number
  countedItems: number
  completionPercentage: number
  
  // Location scope
  locationScope: {
    type: 'SINGLE' | 'ZONE' | 'AISLE' | 'WAREHOUSE' | 'CUSTOM'
    locations: string[]
    zones?: string[]
  }
  
  // Counting parameters
  parameters: {
    blindCount: boolean
    allowPartialCount: boolean
    requireVerification: boolean
    tolerancePercentage: number
    autoAdjust: boolean
    requireApproval: boolean
  }
  
  // Results
  results: {
    totalVariance: number
    totalVarianceValue: number
    averageVariance: number
    accuracyRate: number
    itemsWithVariance: number
    itemsWithinTolerance: number
    itemsOutsideTolerance: number
  }
  
  // Adjustments
  adjustments: Adjustment[]
  adjustmentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'POSTED'
  adjustedAt?: Date
  adjustedBy?: string
  
  // Root cause analysis
  rootCauseAnalysis?: RootCauseAnalysis[]
  
  // Quality
  qualityScore?: number
  requiresReview: boolean
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: Date
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface Adjustment {
  id: string
  itemId: string
  materialNumber: string
  location: string
  bookQuantity: number
  countedQuantity: number
  adjustmentQuantity: number
  adjustmentValue: number
  reason: string
  rootCause?: RootCauseCategory
  approvedBy?: string
  approvedAt?: Date
  postedAt?: Date
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'POSTED'
}

export interface RootCauseAnalysis {
  id: string
  itemId: string
  category: RootCauseCategory
  description: string
  probability: number // 0-1
  evidence?: string[]
  recommendedAction?: string
  analyzedAt: Date
  analyzedBy: string
}

export interface CountSchedule {
  id: string
  name: string
  description: string
  method: CountingMethod
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'CUSTOM'
  frequencyValue: number
  startDate: Date
  endDate?: Date
  locations: string[]
  criteria: {
    abcClass?: 'A' | 'B' | 'C'
    minValue?: number
    maxValue?: number
    materialGroups?: string[]
    excludeLocations?: string[]
  }
  isActive: boolean
  lastRun?: Date
  nextRun?: Date
  totalRuns: number
  createdAt: Date
  updatedAt: Date
}

export interface CountAnalytics {
  // Performance metrics
  totalCounts: number
  completedCounts: number
  inProgressCounts: number
  averageAccuracy: number
  averageVariance: number
  
  // Efficiency metrics
  averageCountTime: number // minutes
  averageItemsPerHour: number
  averageCountDuration: number // minutes
  
  // Accuracy metrics
  accuracyRate: number // percentage
  itemsWithinTolerance: number
  itemsOutsideTolerance: number
  toleranceRate: number // percentage
  
  // Variance metrics
  totalVarianceValue: number
  averageVarianceValue: number
  varianceBySeverity: Record<VarianceSeverity, number>
  
  // Root cause distribution
  rootCauseDistribution: Record<RootCauseCategory, number>
  
  // Method performance
  methodPerformance: Record<CountingMethod, {
    averageAccuracy: number
    averageVariance: number
    countTime: number
    countCount: number
  }>
  
  // Time-based analytics
  dailyPerformance: Array<{
    date: string
    counts: number
    accuracy: number
    variance: number
  }>
  
  // Top performers
  topCounters: Array<{
    counterId: string
    counterName: string
    countsCompleted: number
    averageAccuracy: number
    averageSpeed: number
  }>
  
  // Problem areas
  problemLocations: Array<{
    location: string
    varianceCount: number
    averageVariance: number
    lastCountDate: Date
  }>
}

export interface CountConfiguration {
  // Method settings
  defaultMethod: CountingMethod
  enableAutoMethod: boolean
  enableMultiMethod: boolean
  
  // Tolerance settings
  defaultTolerance: number // percentage
  toleranceByABC: {
    classA: number
    classB: number
    classC: number
  }
  
  // Counting settings
  defaultBlindCount: boolean
  requireVerification: boolean
  requireApproval: boolean
  autoAdjust: boolean
  allowPartialCount: boolean
  
  // Scheduling settings
  enableAutoScheduling: boolean
  defaultFrequency: CountSchedule['frequency']
  defaultFrequencyValue: number
  
  // Quality settings
  minQualityScore: number
  requireReviewThreshold: number // variance percentage
  
  // Notification settings
  notifyOnVariance: boolean
  notifyOnCompletion: boolean
  notifyOnAdjustment: boolean
  
  // Integration settings
  autoPostAdjustments: boolean
  requireApprovalForAdjustments: boolean
  integrationWithInventory: boolean
}

export interface Counter {
  id: string
  name: string
  employeeId: string
  currentCount?: string
  status: 'AVAILABLE' | 'COUNTING' | 'ON_BREAK' | 'OFFLINE'
  performance: {
    totalCounts: number
    averageAccuracy: number
    averageSpeed: number // items per hour
    totalItemsCounted: number
    qualityScore: number
  }
  location?: {
    x: number
    y: number
    zone: string
  }
  equipment?: string[]
  lastUpdate: Date
}





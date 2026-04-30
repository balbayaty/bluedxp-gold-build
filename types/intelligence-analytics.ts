/**
 * Intelligence & Analytics Unified Module - Type Definitions
 * 
 * Comprehensive types for unified intelligence, root cause analysis,
 * data mining, process mining, and analytics
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export interface IntelligenceEvent {
  id: string
  type: 'ROOT_CAUSE' | 'ANOMALY' | 'PATTERN' | 'PREDICTION' | 'INSIGHT' | 'RECOMMENDATION'
  source: {
    module: string
    entityType: string
    entityId: string
    eventType?: string
  }
  data: Record<string, any>
  timestamp: Date | string
  tenantId: string
  correlationId?: string
  metadata?: Record<string, any>
}

export interface UnifiedRootCauseAnalysis {
  id: string
  issueId: string
  issueType: string
  issueDescription: string
  sourceModules: string[]  // Can span multiple modules
  detectedAt: Date | string
  
  // Analysis method
  analysisMethod: '5_WHYS' | 'FISHBONE' | 'FMEA' | 'PARETO' | 'AUTOMATED_ML' | 'HYBRID'
  
  // Root causes
  rootCauses: RootCause[]
  contributingFactors: ContributingFactor[]
  
  // Evidence from all modules
  evidence: Evidence[]
  
  // Correlation and relationships
  correlations: Correlation[]
  causalChain: CausalLink[]
  relatedIssues: string[]
  
  // Confidence and validation
  confidence: number  // 0-100
  validated: boolean
  validatedBy?: string
  validatedAt?: Date | string
  
  // Recommendations and actions
  recommendations: Recommendation[]
  actions: Action[]
  
  // Effectiveness tracking
  effectiveness?: number  // 0-100
  recurrenceRate?: number  // 0-100
  
  // Metadata
  tenantId: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface RootCause {
  id: string
  type: 'primary' | 'secondary' | 'contributing'
  title: string
  description: string
  category: 'HUMAN' | 'PROCESS' | 'TECHNOLOGY' | 'ENVIRONMENT' | 'MATERIAL' | 'METHOD' | 'MACHINE' | 'MEASUREMENT'
  confidence: number  // 0-1
  impact: {
    severity: 'low' | 'medium' | 'high' | 'critical'
    affectedStages: string[]
    affectedCases: number
    costImpact?: number
  }
  evidence: Evidence[]
  recommendations: Recommendation[]
  relatedCauses?: string[]
}

export interface ContributingFactor {
  id: string
  factor: string
  category: string
  contribution: number  // percentage
  controllable: boolean
  impact: number  // 0-100
  probability: number  // 0-100
  riskScore: number  // 0-100
  evidence: Evidence[]
}

export interface Evidence {
  id: string
  type: 'deviation' | 'event' | 'metric' | 'correlation' | 'pattern' | 'document' | 'test' | 'observation'
  source: {
    module: string
    entityType: string
    entityId: string
  }
  data: any
  relevance: number  // 0-1
  quality: number  // 0-1
  timestamp: Date | string
  lineage?: EvidenceLineage[]
  integrity?: {
    hash: string
    verified: boolean
  }
}

export interface EvidenceLineage {
  source: string
  timestamp: Date | string
  transformation?: string
}

export interface Correlation {
  id: string
  factor1: string
  factor2: string
  correlation: number  // -1 to 1
  significance: number  // 0-1
  evidence: string[]
  modules: string[]
  timestamp: Date | string
}

export interface CausalLink {
  id: string
  from: string
  to: string
  strength: number  // 0-1
  evidence: string[]
  type: 'direct' | 'indirect' | 'contributing'
}

export interface Recommendation {
  id: string
  type: 'immediate' | 'short-term' | 'long-term'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  actionItems: string[]
  expectedImpact: string
  implementationEffort: 'low' | 'medium' | 'high'
  estimatedCost?: number
  estimatedTime?: number
  relatedRecommendations?: string[]
}

export interface Action {
  id: string
  recommendationId: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assignedTo?: string
  dueDate?: Date | string
  completedAt?: Date | string
  effectiveness?: number  // 0-100
  notes?: string
}

// ============================================================================
// DATA MINING TYPES
// ============================================================================

export interface DataMiningResult {
  id: string
  analysisType: 'PATTERN' | 'ANOMALY' | 'PREDICTION' | 'CLUSTERING' | 'ASSOCIATION' | 'TREND'
  title: string
  description: string
  confidence: number  // 0-100
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  category: 'INVENTORY' | 'ORDERS' | 'SUPPLY_CHAIN' | 'CUSTOMER' | 'FINANCIAL' | 'OPERATIONAL' | 'CROSS_MODULE'
  
  // Source modules
  sourceModules: string[]
  
  // Findings
  findings: Finding[]
  recommendations: string[]
  
  // Data source
  dataSource: string[]
  timeRange: {
    start: Date | string
    end: Date | string
  }
  
  // Status
  status: 'NEW' | 'REVIEWED' | 'ACTED_UPON' | 'ARCHIVED'
  generatedAt: Date | string
  
  // Metadata
  tenantId: string
  metadata?: Record<string, any>
}

export interface Finding {
  metric: string
  value: number
  trend: 'UP' | 'DOWN' | 'STABLE'
  significance: number  // 0-100
  context?: Record<string, any>
}

export interface Pattern {
  id: string
  patternType: 'RECURRING' | 'TREND' | 'CLUSTER' | 'CORRELATION' | 'ANOMALY'
  title: string
  description: string
  affectedModules: string[]
  frequency: number
  confidence: number  // 0-1
  examples: PatternExample[]
  recommendations: Recommendation[]
  discoveredAt: Date | string
  lastSeenAt: Date | string
  metadata?: Record<string, any>
}

export interface PatternExample {
  id: string
  module: string
  entityId: string
  timestamp: Date | string
  data: Record<string, any>
}

// ============================================================================
// PROCESS MINING TYPES
// ============================================================================

export interface ProcessMiningResult {
  id: string
  processType: string
  processName: string
  sourceModules: string[]
  
  // Variants
  variants: ProcessVariant[]
  
  // Performance
  performance: {
    averageDuration: number
    medianDuration: number
    minDuration: number
    maxDuration: number
    efficiency: number  // 0-100
    complianceRate: number  // 0-100
  }
  
  // Deviations
  deviations: ProcessDeviation[]
  deviationRate: number  // 0-100
  
  // Cost
  costAnalysis?: {
    averageCost: number
    costPerVariant: Record<string, number>
    optimizationOpportunities: string[]
  }
  
  // Discovery metadata
  discoveredAt: Date | string
  caseCount: number
  eventCount: number
  timeRange: {
    start: Date | string
    end: Date | string
  }
  
  tenantId: string
}

export interface ProcessVariant {
  id: string
  variantId: string
  frequency: number
  percentage: number  // 0-100
  averageDuration: number
  medianDuration: number
  complianceRate: number  // 0-100
  optimizationScore: number  // 0-100
  isOptimal: boolean
  activities: ProcessActivity[]
  transitions: ProcessTransition[]
  cases: string[]
}

export interface ProcessActivity {
  id: string
  name: string
  frequency: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  resourceUtilization?: number  // 0-100
  cost?: number
}

export interface ProcessTransition {
  from: string
  to: string
  frequency: number
  probability: number  // 0-1
  averageTime: number
}

export interface ProcessDeviation {
  id: string
  type: 'SKIP' | 'EXTRA' | 'REPEAT' | 'DELAY' | 'REORDER' | 'OTHER'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedCases: number
  impact: {
    duration: number
    cost?: number
    compliance?: number
  }
  recommendations: string[]
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface UnifiedAnalytics {
  id: string
  timeRange: {
    start: Date | string
    end: Date | string
  }
  
  // Module analytics
  moduleAnalytics: Record<string, ModuleAnalytics>
  
  // Cross-module analytics
  crossModuleAnalytics: CrossModuleAnalytics
  
  // Aggregated metrics
  aggregatedMetrics: AggregatedMetrics
  
  // Insights
  insights: AnalyticsInsight[]
  
  // Trends
  trends: Trend[]
  
  tenantId: string
  generatedAt: Date | string
}

export interface ModuleAnalytics {
  moduleId: string
  metrics: Record<string, number>
  trends: Trend[]
  insights: AnalyticsInsight[]
  anomalies: Anomaly[]
  performance: {
    score: number  // 0-100
    trend: 'UP' | 'DOWN' | 'STABLE'
  }
}

export interface CrossModuleAnalytics {
  correlations: Correlation[]
  patterns: Pattern[]
  bottlenecks: Bottleneck[]
  optimizationOpportunities: OptimizationOpportunity[]
}

export interface AggregatedMetrics {
  totalEvents: number
  totalIssues: number
  averageResolutionTime: number
  complianceRate: number  // 0-100
  efficiency: number  // 0-100
  cost: number
  savings: number
}

export interface AnalyticsInsight {
  id: string
  type: 'OPPORTUNITY' | 'RISK' | 'TREND' | 'ANOMALY' | 'RECOMMENDATION'
  title: string
  description: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence: number  // 0-100
  affectedModules: string[]
  recommendations: string[]
  metadata?: Record<string, any>
}

export interface Trend {
  id: string
  metric: string
  direction: 'UP' | 'DOWN' | 'STABLE'
  rate: number  // percentage change
  significance: number  // 0-100
  timeRange: {
    start: Date | string
    end: Date | string
  }
  dataPoints: DataPoint[]
}

export interface DataPoint {
  timestamp: Date | string
  value: number
}

export interface Anomaly {
  id: string
  type: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  detectedAt: Date | string
  module: string
  entityId?: string
  data: Record<string, any>
}

export interface Bottleneck {
  id: string
  module: string
  process: string
  stage: string
  impact: {
    duration: number
    cost: number
    affectedCases: number
  }
  recommendations: string[]
}

export interface OptimizationOpportunity {
  id: string
  type: 'COST' | 'TIME' | 'QUALITY' | 'COMPLIANCE'
  description: string
  potentialSavings: number
  implementationEffort: 'low' | 'medium' | 'high'
  affectedModules: string[]
  recommendations: string[]
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface IntelligenceAnalysisRequest {
  tenantId: string
  type: 'root-cause' | 'data-mining' | 'process-mining' | 'analytics'
  source?: {
    module: string
    entityType: string
    entityId: string
  }
  context?: Record<string, any>
  options?: Record<string, any>
}

export interface IntelligenceAnalysisResponse {
  id: string
  type: string
  result: UnifiedRootCauseAnalysis | DataMiningResult | ProcessMiningResult | UnifiedAnalytics
  status: 'completed' | 'in-progress' | 'failed'
  timestamp: Date | string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface IntelligenceAnalyticsConfig {
  autoTriggerRCA: {
    enabled: boolean
    triggers: ('anomaly' | 'deviation' | 'incident' | 'ncr' | 'exception')[]
    minConfidence: number
  }
  dataMining: {
    enabled: boolean
    schedule: string  // cron expression
    algorithms: string[]
    modules: string[]
  }
  processMining: {
    enabled: boolean
    realTime: boolean
    modules: string[]
  }
  analytics: {
    enabled: boolean
    realTime: boolean
    aggregationInterval: number  // seconds
  }
}















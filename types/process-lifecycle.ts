/**
 * Unified Process & Lifecycle Management Types
 * Comprehensive types for the unified Process & Lifecycle Management module
 * Consolidates lifecycle, workflow, process mining, and analytics
 */

// Re-export lifecycle types
export * from '@/types/lifecycle'

// Re-export workflow types (from workflow service)
export interface WorkflowStep {
  id: string
  name: string
  type: 'action' | 'condition' | 'approval' | 'notification' | 'integration'
  config: Record<string, any>
  position: { x: number; y: number }
  connections: string[]
}

export interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  triggers: {
    event: string
    conditions?: Record<string, any>
  }[]
  status: 'draft' | 'active' | 'paused' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  recordId: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  currentStep: string
  startedAt: string
  completedAt?: string
  steps: {
    stepId: string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
    startedAt?: string
    completedAt?: string
    result?: any
  }[]
}

/**
 * Process Event
 *
 * Generic event envelope used by the Process Lifecycle module (workflows/webhooks/process mining).
 * This intentionally supports cross-module events (e.g., Transportation incidents).
 */
export interface ProcessEvent {
  type: string
  tenantId?: string
  userId?: string
  entityType?: string
  entityId?: string
  payload?: Record<string, any>
  timestamp?: string
  metadata?: Record<string, any>
}

// Re-export process mining types
export interface ProcessMiningCase {
  id: string
  caseId: string
  caseType: string
  startTime: Date | string
  endTime?: Date | string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXCEPTION'
  events: ProcessMiningEvent[]
  attributes: Record<string, any>
  performance: {
    duration: number
    waitingTime: number
    processingTime: number
    cycleTime: number
    throughput: number
    efficiency: number
  }
  variants: string[]
  deviations: ProcessDeviation[]
}

export interface ProcessMiningEvent {
  id: string
  caseId: string
  activity: string
  timestamp: Date | string
  resource: string
  compliance?: {
    slaCompliance: number
    qualityScore: number
  }
}

export interface ProcessDeviation {
  id: string
  type: 'DELAY' | 'SKIP' | 'REPEAT' | 'EXCEPTION'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  impact: number
}

// ============================================================================
// PROCESS ORCHESTRATOR TYPES
// ============================================================================

export interface ProcessOrchestrationContext {
  entityId: string
  entityType: string
  module: string
  tenantId?: string
  userId?: string
  metadata?: Record<string, any>
}

export interface ProcessOrchestrationResult {
  lifecycleUpdated: boolean
  workflowTriggered?: string
  processMiningCaptured: boolean
  analyticsUpdated: boolean
  crossModuleActions?: string[]
}

export interface ProcessCoordination {
  sourceEntityId: string
  sourceEntityType: string
  targetEntityId: string
  targetEntityType: string
  coordinationType: 'TRIGGER' | 'UPDATE' | 'SYNC' | 'LINK'
  metadata?: Record<string, any>
}

// ============================================================================
// UNIFIED ANALYTICS TYPES
// ============================================================================

export interface ProcessAnalytics {
  entityType: string
  totalInstances: number
  activeInstances: number
  completedInstances: number
  averageDuration: number
  averageEfficiency: number
  slaComplianceRate: number
  bottleneckStages: Array<{
    stageId: string
    stageName: string
    bottleneckScore: number
    averageWaitTime: number
  }>
  topVariants: Array<{
    variantId: string
    frequency: number
    averageDuration: number
    efficiency: number
  }>
  trends: Array<{
    date: string
    instances: number
    averageDuration: number
    efficiency: number
  }>
}

export interface CrossModuleAnalytics {
  modules: string[]
  totalProcesses: number
  activeProcesses: number
  crossModuleFlows: number
  averageCrossModuleTime: number
  integrationPoints: Array<{
    fromModule: string
    toModule: string
    flowCount: number
    averageTime: number
  }>
}

export interface PredictiveInsight {
  id: string
  type: 'risk' | 'optimization' | 'bottleneck' | 'sla_breach' | 'resource' | 'cost' | 'quality'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  entityType?: string
  entityId?: string
  stageId?: string
  predictedValue?: number
  confidence: number
  recommendations: string[]
  actionable: boolean
  expiresAt?: Date | string
  relatedInsights?: string[]
}

// ============================================================================
// UNIFIED PROCESS VIEW TYPES
// ============================================================================

export interface UnifiedProcessViewProps {
  entityId: string
  entityType: string
  showLifecycle?: boolean
  showWorkflow?: boolean
  showProcessMining?: boolean
  showAnalytics?: boolean
  showCrossModule?: boolean
  defaultView?: 'lifecycle' | 'workflow' | 'mining' | 'analytics' | 'unified'
  height?: number
  enableRealTime?: boolean
  enablePredictive?: boolean
}

export interface ProcessDashboardData {
  overview: {
    totalProcesses: number
    activeProcesses: number
    completedToday: number
    averageEfficiency: number
    slaCompliance: number
  }
  lifecycles: Array<{
    entityType: string
    active: number
    completed: number
    averageDuration: number
  }>
  workflows: {
    active: number
    completed: number
    failed: number
    averageExecutionTime: number
  }
  processMining: {
    totalCases: number
    variants: number
    deviations: number
    averageEfficiency: number
  }
  analytics: {
    insights: number
    predictions: number
    recommendations: number
  }
  recentActivity: Array<{
    id: string
    type: 'lifecycle' | 'workflow' | 'mining' | 'analytics'
    entityType: string
    entityId: string
    action: string
    timestamp: Date | string
  }>
}

// ============================================================================
// PROCESS REGISTRY TYPES
// ============================================================================

export interface ProcessDefinition {
  id: string
  name: string
  entityType: string
  module: string
  lifecycleConfig?: string // Path to lifecycle config
  workflowTemplates?: string[] // Workflow template IDs
  processMiningEnabled: boolean
  analyticsEnabled: boolean
  crossModuleLinks?: Array<{
    targetEntityType: string
    targetModule: string
    linkType: 'triggers' | 'updates' | 'syncs'
  }>
  metadata?: Record<string, any>
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface ProcessOrchestratorService {
  // Orchestration
  orchestrateProcess(context: ProcessOrchestrationContext, action: string, data?: Record<string, any>): Promise<ProcessOrchestrationResult>
  coordinateCrossModule(coordination: ProcessCoordination): Promise<void>
  
  // Lifecycle + Workflow integration
  triggerWorkflowOnStageTransition(entityId: string, entityType: string, stageId: string, workflowId: string): Promise<void>
  updateLifecycleFromWorkflow(workflowExecutionId: string, stageId: string): Promise<void>
  
  // Lifecycle + Process Mining integration
  captureLifecycleEventForMining(entityId: string, entityType: string, event: any): Promise<void>
  getProcessMiningFromLifecycle(entityId: string, entityType: string): Promise<ProcessMiningCase | null>
  
  // Unified analytics
  getUnifiedAnalytics(entityType?: string, filters?: Record<string, any>): Promise<ProcessAnalytics | CrossModuleAnalytics>
  getPredictiveInsights(entityId: string, entityType: string): Promise<PredictiveInsight[]>
  
  // Process registry
  registerProcess(definition: ProcessDefinition): void
  getProcessDefinition(entityType: string): ProcessDefinition | null
  getAllProcessDefinitions(): ProcessDefinition[]
}

export interface ProcessAnalyticsService {
  // Analytics
  getProcessAnalytics(entityType: string, filters?: Record<string, any>): Promise<ProcessAnalytics>
  getCrossModuleAnalytics(modules: string[]): Promise<CrossModuleAnalytics>
  getDashboardData(filters?: Record<string, any>): Promise<ProcessDashboardData>
  
  // Insights
  generateInsights(entityType: string, entityId?: string): Promise<PredictiveInsight[]>
  getInsight(insightId: string): Promise<PredictiveInsight | null>
  markInsightActioned(insightId: string, action: string): Promise<void>
  
  // Trends
  getTrends(entityType: string, timeRange: { start: Date | string; end: Date | string }): Promise<any[]>
  getPerformanceMetrics(entityType: string, stageId?: string): Promise<any>
}


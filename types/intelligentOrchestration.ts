/**
 * Intelligent Orchestration & Process Mining Framework
 * 
 * A futuristic, AI-powered system that:
 * - Captures data from ALL sources (WMS, ERP, IoT, APIs, Manual Inputs)
 * - Performs real-time process mining and discovery
 * - Automatically detects root causes of issues
 * - Predicts future events and optimizes operations
 * - Monitors compliance autonomously
 * - Orchestrates intelligent communications
 * - Generates automated insights and reports
 * 
 * Based on industry best practices:
 * - Process Mining (Celonis, UiPath Process Mining)
 * - Root Cause Analysis (5 Whys, Fishbone, FMEA)
 * - Predictive Analytics (ML, Time Series, Anomaly Detection)
 * - Autonomous Systems (Self-Healing, Self-Optimizing)
 * - Intelligent Automation (RPA, AI Agents)
 */

// ============================================================================
// DATA CAPTURE & INTEGRATION
// ============================================================================

export type DataSourceType =
  | 'WMS_TRANSACTION'        // Warehouse Management System events
  | 'ERP_TRANSACTION'        // ERP system transactions
  | 'IOT_SENSOR'             // IoT sensors (temperature, humidity, etc.)
  | 'API_WEBHOOK'            // External API calls/webhooks
  | 'MANUAL_INPUT'           // Manual data entry
  | 'EDI_MESSAGE'            // EDI transactions
  | 'EMAIL_COMMUNICATION'    // Email interactions
  | 'WHATSAPP_MESSAGE'       // WhatsApp messages
  | 'SMS_MESSAGE'            // SMS notifications
  | 'VOICE_CALL'             // Voice call logs
  | 'DOCUMENT_SCAN'          // Scanned documents
  | 'BARCODE_SCAN'           // Barcode scans
  | 'RFID_READ'              // RFID reads
  | 'GPS_TRACKING'           // GPS location data
  | 'CAMERA_FEED'            // Camera/video feeds
  | 'SYSTEM_LOG'             // System logs
  | 'USER_ACTION'            // User interface actions
  | 'SCHEDULED_JOB'          // Scheduled/cron jobs
  | 'ALERT_NOTIFICATION'     // Alert notifications
  | 'CUSTOM_INTEGRATION'     // Custom integrations

export interface DataCaptureEvent {
  id: string
  sourceType: DataSourceType
  sourceId: string                    // ID of the source system/device
  sourceName: string                  // Human-readable source name
  eventType: string                   // Type of event (e.g., 'ASN_RECEIVED', 'ORDER_PICKED', 'TEMPERATURE_ALERT')
  eventCategory: string               // Category (e.g., 'INBOUND', 'OUTBOUND', 'QUALITY', 'COMPLIANCE')
  timestamp: Date | string
  data: Record<string, any>           // Raw event data
  metadata: {
    tenantId?: string
    customerId?: string
    warehouseId?: string
    userId?: string
    sessionId?: string
    correlationId?: string            // For linking related events
    traceId?: string                  // For distributed tracing
    [key: string]: any
  }
  processed: boolean                   // Whether this event has been processed
  processedAt?: Date | string
  version: string                     // Data schema version
}

// ============================================================================
// PROCESS MINING
// ============================================================================

export interface ProcessMiningCase {
  id: string
  caseId: string                      // Business case ID (e.g., Order ID, ASN ID)
  caseType: string                    // Type of case (e.g., 'ORDER', 'ASN', 'SHIPMENT')
  startTime: Date | string
  endTime?: Date | string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXCEPTION'
  events: ProcessMiningEvent[]
  attributes: Record<string, any>      // Case-level attributes
  performance: {
    duration: number                   // Total duration in seconds
    waitingTime: number                // Total waiting time
    processingTime: number             // Total processing time
    cycleTime: number                  // End-to-end cycle time
    throughput: number                 // Throughput rate
    efficiency: number                 // Process efficiency %
  }
  variants: string[]                   // Process variant IDs
  deviations: ProcessDeviation[]       // Detected deviations
  rootCauses?: string[]                // Root cause IDs
  predictions?: ProcessPrediction[]    // Predictions for this case
}

export interface ProcessMiningEvent {
  id: string
  caseId: string
  activity: string                     // Activity name (e.g., 'Receive ASN', 'Pick Order')
  resource: string                     // Resource that performed the activity
  timestamp: Date | string
  lifecycle: 'START' | 'COMPLETE' | 'SUSPEND' | 'RESUME' | 'ABORT'
  data: Record<string, any>
  duration?: number                    // Duration in seconds (if lifecycle is COMPLETE)
  cost?: number                        // Cost associated with this event
  quality?: number                     // Quality score (0-100)
  compliance?: {
    slaCompliance: number              // SLA compliance %
    regulatoryCompliance: number       // Regulatory compliance %
    qualityCompliance: number           // Quality compliance %
  }
}

export interface ProcessVariant {
  id: string
  variantId: string                   // Unique variant identifier
  frequency: number                    // How often this variant occurs
  activities: string[]                 // Sequence of activities
  averageDuration: number              // Average duration
  averageCost: number                  // Average cost
  averageQuality: number               // Average quality score
  complianceRate: number               // Compliance rate %
  cases: string[]                      // Case IDs following this variant
  isOptimal: boolean                   // Whether this is the optimal variant
  optimizationScore: number            // Optimization score (0-100)
}

export interface ProcessDeviation {
  id: string
  caseId: string
  deviationType: 'DELAY' | 'SKIP' | 'REPEAT' | 'EXCEPTION' | 'DEVIATION' | 'BOTTLENECK'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  activity?: string                    // Activity where deviation occurred
  expectedValue?: any                  // Expected value/behavior
  actualValue?: any                    // Actual value/behavior
  impact: {
    duration: number                   // Impact on duration (seconds)
    cost: number                       // Impact on cost
    quality: number                    // Impact on quality
    compliance: number                 // Impact on compliance
  }
  detectedAt: Date | string
  rootCauseId?: string                // Linked root cause
  resolved: boolean
  resolvedAt?: Date | string
}

// ============================================================================
// ROOT CAUSE ANALYSIS
// ============================================================================

export interface RootCause {
  id: string
  issueId: string                     // ID of the issue/problem
  issueType: string                   // Type of issue (e.g., 'SLA_BREACH', 'QUALITY_ISSUE', 'DELAY')
  issueDescription: string
  detectedAt: Date | string
  analysisMethod: '5_WHYS' | 'FISHBONE' | 'FMEA' | 'PARETO' | 'AUTOMATED_ML' | 'HYBRID'
  rootCauses: RootCauseFactor[]
  contributingFactors: RootCauseFactor[]
  confidence: number                   // Confidence level (0-100)
  validated: boolean
  validatedBy?: string
  validatedAt?: Date | string
  actions: RootCauseAction[]
  effectiveness: number                // Effectiveness of actions taken (0-100)
  recurrenceRate: number               // Recurrence rate after actions (0-100)
}

export interface RootCauseFactor {
  id: string
  category: 'HUMAN' | 'PROCESS' | 'TECHNOLOGY' | 'ENVIRONMENT' | 'MATERIAL' | 'METHOD' | 'MACHINE' | 'MEASUREMENT'
  factor: string                      // Specific factor (e.g., 'Lack of training', 'System downtime')
  impact: number                      // Impact score (0-100)
  probability: number                 // Probability of occurrence (0-100)
  riskScore: number                   // Risk score (impact × probability)
  evidence: string[]                  // Evidence IDs supporting this factor
  isRootCause: boolean                // Whether this is a root cause or contributing factor
}

export interface RootCauseAction {
  id: string
  action: string                       // Action description
  responsibleParty: string             // Who is responsible
  dueDate: Date | string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED'
  completedAt?: Date | string
  verifiedAt?: Date | string
  effectiveness: number               // Effectiveness of this action (0-100)
}

// ============================================================================
// PREDICTIVE ANALYTICS
// ============================================================================

export interface ProcessPrediction {
  id: string
  caseId: string
  predictionType: 'DURATION' | 'COST' | 'QUALITY' | 'COMPLIANCE' | 'RISK' | 'BOTTLENECK' | 'EXCEPTION'
  predictedValue: number
  confidence: number                   // Confidence level (0-100)
  predictionHorizon: number            // How far ahead (in seconds/hours/days)
  model: string                        // ML model used
  features: Record<string, any>        // Features used for prediction
  actualValue?: number                 // Actual value (for validation)
  accuracy?: number                    // Prediction accuracy (0-100)
  predictedAt: Date | string
  validatedAt?: Date | string
}

export interface PredictiveInsight {
  id: string
  insightType: 'BOTTLENECK' | 'RISK' | 'OPTIMIZATION' | 'ANOMALY' | 'TREND' | 'PATTERN'
  title: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidence: number
  impact: {
    duration?: number
    cost?: number
    quality?: number
    compliance?: number
    revenue?: number
  }
  recommendation: string
  actions: string[]                    // Recommended actions
  predictedAt: Date | string
  timeframe: {
    start: Date | string
    end: Date | string
  }
  affectedEntities: string[]           // IDs of affected cases/processes
}

// ============================================================================
// AUTONOMOUS COMPLIANCE
// ============================================================================

export interface EscalationRule {
  id: string
  level: 'WARNING' | 'CRITICAL' | 'URGENT'
  threshold: number                    // Threshold percentage (0-100)
  actions: string[]                    // Actions to take
  timeframe: string                     // Timeframe for escalation
  stakeholders: string[]               // Who to notify
  autoTrigger: boolean                 // Whether to auto-trigger
}

export interface ComplianceRule {
  id: string
  name: string
  description: string
  ruleType: 'SLA' | 'REGULATORY' | 'QUALITY' | 'SAFETY' | 'ENVIRONMENTAL' | 'CUSTOM'
  ruleCategory: string
  conditions: ComplianceCondition[]
  actions: ComplianceAction[]
  isActive: boolean
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  autoEnforce: boolean                 // Whether to auto-enforce
  escalationRules?: EscalationRule[]
}

export interface ComplianceCondition {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface ComplianceAction {
  id: string
  actionType: 'ALERT' | 'BLOCK' | 'AUTO_CORRECT' | 'ESCALATE' | 'NOTIFY' | 'LOG' | 'REPORT'
  target: string                       // Who/what to target
  parameters: Record<string, any>
  delay?: number                       // Delay in seconds before action
}

export interface ComplianceViolation {
  id: string
  ruleId: string
  ruleName: string
  caseId?: string
  entityId: string                    // ID of entity violating compliance
  entityType: string                  // Type of entity
  violationType: 'BREACH' | 'AT_RISK' | 'WARNING' | 'EXCEPTION'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  detectedAt: Date | string
  resolved: boolean
  resolvedAt?: Date | string
  resolvedBy?: string
  actions: ComplianceAction[]
  impact: {
    duration?: number
    cost?: number
    quality?: number
    reputation?: number
  }
}

// ============================================================================
// INTELLIGENT COMMUNICATION ORCHESTRATION
// ============================================================================

export type CommunicationChannel =
  | 'EMAIL'
  | 'WHATSAPP'
  | 'SMS'
  | 'VOICE_CALL'
  | 'PUSH_NOTIFICATION'
  | 'IN_APP_NOTIFICATION'
  | 'SLACK'
  | 'TEAMS'
  | 'WEBHOOK'
  | 'API'
  | 'DASHBOARD'
  | 'REPORT'

export interface CommunicationTemplate {
  id: string
  name: string
  description: string
  channel: CommunicationChannel
  template: string                    // Message template with variables
  variables: string[]                  // Available variables
  conditions: CommunicationCondition[] // When to use this template
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  isActive: boolean
}

export interface CommunicationCondition {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface CommunicationOrchestration {
  id: string
  trigger: CommunicationTrigger
  recipients: CommunicationRecipient[]
  channels: CommunicationChannel[]
  templates: string[]                 // Template IDs
  schedule?: CommunicationSchedule
  conditions: CommunicationCondition[]
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  isActive: boolean
  effectiveness: number                // Effectiveness tracking (0-100)
}

export interface CommunicationTrigger {
  type: 'EVENT' | 'SCHEDULE' | 'THRESHOLD' | 'PREDICTION' | 'MANUAL'
  eventType?: string
  schedule?: string
  threshold?: {
    field: string
    operator: string
    value: any
  }
  prediction?: {
    model: string
    threshold: number
  }
}

export interface CommunicationRecipient {
  id: string
  type: 'USER' | 'ROLE' | 'CUSTOMER' | 'WAREHOUSE' | 'EXTERNAL' | 'GROUP'
  identifier: string                  // User ID, role name, email, etc.
  channel: CommunicationChannel
  preferences?: {
    preferredChannel?: CommunicationChannel
    quietHours?: { start: string; end: string }
    language?: string
  }
}

export interface CommunicationSchedule {
  frequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  time?: string                       // Specific time (e.g., '09:00')
  dayOfWeek?: number                  // 0-6 (Sunday-Saturday)
  dayOfMonth?: number                 // 1-31
  timezone?: string
}

export interface CommunicationLog {
  id: string
  orchestrationId: string
  recipient: CommunicationRecipient
  channel: CommunicationChannel
  templateId: string
  message: string
  sentAt: Date | string
  deliveredAt?: Date | string
  readAt?: Date | string
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'BOUNCED'
  response?: string
  metadata: Record<string, any>
}

// ============================================================================
// AUTOMATED REPORTING & INSIGHTS
// ============================================================================

export interface AutomatedReport {
  id: string
  name: string
  description: string
  reportType: 'PERFORMANCE' | 'COMPLIANCE' | 'QUALITY' | 'FINANCIAL' | 'OPERATIONAL' | 'PREDICTIVE' | 'ROOT_CAUSE' | 'CUSTOM'
  schedule: CommunicationSchedule
  recipients: CommunicationRecipient[]
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON' | 'HTML' | 'DASHBOARD'
  sections: ReportSection[]
  filters: ReportFilter[]
  isActive: boolean
  lastGenerated?: Date | string
  nextGeneration?: Date | string
}

export interface ReportSection {
  id: string
  title: string
  type: 'CHART' | 'TABLE' | 'METRIC' | 'INSIGHT' | 'PREDICTION' | 'ROOT_CAUSE'
  dataSource: string                  // Query or data source
  visualization?: {
    chartType: 'BAR' | 'LINE' | 'PIE' | 'AREA' | 'SCATTER' | 'HEATMAP' | 'GANTT'
    config: Record<string, any>
  }
  order: number
}

export interface ReportFilter {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'in'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface AutomatedInsight {
  id: string
  insightType: 'PERFORMANCE' | 'OPTIMIZATION' | 'RISK' | 'OPPORTUNITY' | 'ANOMALY' | 'TREND'
  title: string
  description: string
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidence: number
  data: Record<string, any>
  recommendations: string[]
  actions: string[]
  generatedAt: Date | string
  expiresAt?: Date | string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date | string
  impact: {
    duration?: number
    cost?: number
    quality?: number
    compliance?: number
    revenue?: number
  }
}

// ============================================================================
// INTELLIGENT ORCHESTRATION ENGINE
// ============================================================================

export interface OrchestrationEngine {
  // Data Capture
  captureEvent: (event: DataCaptureEvent) => Promise<void>
  captureBatch: (events: DataCaptureEvent[]) => Promise<void>
  
  // Process Mining
  discoverProcess: (caseType: string, timeRange?: { start: Date; end: Date }) => Promise<ProcessVariant[]>
  analyzeCase: (caseId: string) => Promise<ProcessMiningCase>
  detectDeviations: (caseId: string) => Promise<ProcessDeviation[]>
  
  // Root Cause Analysis
  analyzeRootCause: (issueId: string, issueType: string, data: Record<string, any>) => Promise<RootCause>
  findSimilarIssues: (rootCauseId: string) => Promise<string[]>
  validateRootCause: (rootCauseId: string, validated: boolean) => Promise<void>
  
  // Predictive Analytics
  predict: (caseId: string, predictionType: ProcessPrediction['predictionType']) => Promise<ProcessPrediction>
  generateInsights: (timeRange: { start: Date; end: Date }) => Promise<PredictiveInsight[]>
  optimize: (caseId: string, optimizationGoal: 'DURATION' | 'COST' | 'QUALITY' | 'COMPLIANCE') => Promise<Record<string, any>>
  
  // Autonomous Compliance
  checkCompliance: (entityId: string, entityType: string, data: Record<string, any>) => Promise<ComplianceViolation[]>
  enforceCompliance: (violationId: string) => Promise<void>
  monitorCompliance: (ruleId: string, timeRange: { start: Date; end: Date }) => Promise<ComplianceViolation[]>
  
  // Communication Orchestration
  orchestrateCommunication: (orchestrationId: string, context: Record<string, any>) => Promise<CommunicationLog[]>
  sendNotification: (recipient: CommunicationRecipient, templateId: string, data: Record<string, any>) => Promise<CommunicationLog>
  
  // Automated Reporting
  generateReport: (reportId: string, timeRange: { start: Date; end: Date }) => Promise<any>
  generateInsight: (insightType: AutomatedInsight['insightType'], context: Record<string, any>) => Promise<AutomatedInsight>
}


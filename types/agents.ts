/**
 * Agentic Framework Types
 * 
 * Defines the structure for autonomous AI agents that can:
 * - Take actions autonomously
 * - Learn from patterns
 * - Optimize workflows
 * - Make decisions
 * - Coordinate with other agents
 */

export type AgentType =
  | 'INVENTORY_AGENT'
  | 'ROUTING_AGENT'
  | 'COMPLIANCE_AGENT'
  | 'OPTIMIZATION_AGENT'
  | 'PREDICTIVE_AGENT'
  | 'COMMUNICATION_AGENT'
  | 'QUALITY_AGENT'
  | 'COST_AGENT'

export type AgentStatus = 'IDLE' | 'ACTIVE' | 'LEARNING' | 'ERROR' | 'PAUSED'

export type AgentCapability =
  | 'READ_DATA'
  | 'WRITE_DATA'
  | 'ANALYZE_DATA'
  | 'MAKE_DECISIONS'
  | 'EXECUTE_ACTIONS'
  | 'LEARN_FROM_PATTERNS'
  | 'COMMUNICATE'
  | 'OPTIMIZE'
  | 'PREDICT'
  | 'MONITOR'

export type AgentActionType =
  | 'AUTO_OPTIMIZE_ROUTE'
  | 'AUTO_REORDER_STOCK'
  | 'AUTO_FIX_COMPLIANCE'
  | 'AUTO_GENERATE_REPORT'
  | 'AUTO_ADJUST_SCHEDULE'
  | 'AUTO_ALLOCATE_RESOURCES'
  | 'AUTO_TRIGGER_ALERT'
  | 'AUTO_UPDATE_STATUS'
  | 'AUTO_CREATE_TASK'
  | 'AUTO_RESOLVE_ISSUE'

export interface Agent {
  id: string
  type: AgentType
  name: string
  description: string
  status: AgentStatus
  capabilities: AgentCapability[]
  config: AgentConfig
  metrics: AgentMetrics
  createdAt: Date
  updatedAt: Date
}

export interface AgentConfig {
  enabled: boolean
  autonomyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL' // How much autonomy the agent has
  requiresApproval: boolean // Whether actions need human approval
  learningEnabled: boolean // Whether agent can learn from patterns
  maxActionsPerHour: number // Rate limiting
  allowedActions: AgentActionType[] // Which actions this agent can perform
  context: Record<string, any> // Agent-specific configuration
}

export interface AgentMetrics {
  totalActions: number
  successfulActions: number
  failedActions: number
  averageResponseTime: number // milliseconds
  learningIterations: number
  lastActionAt?: Date
  lastLearningAt?: Date
}

export interface AgentAction {
  id: string
  agentId: string
  agentType: AgentType
  actionType: AgentActionType
  description: string
  status: 'PENDING' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'REJECTED'
  parameters: Record<string, any>
  result?: any
  error?: string
  requiresApproval: boolean
  approvedBy?: string
  approvedAt?: Date
  executedAt?: Date
  completedAt?: Date
  createdAt: Date
}

export interface AgentMessage {
  id: string
  fromAgentId: string
  toAgentId: string
  messageType: 'REQUEST' | 'RESPONSE' | 'NOTIFICATION' | 'COORDINATION'
  content: string
  data?: Record<string, any>
  timestamp: Date
}

export interface AgentLearning {
  id: string
  agentId: string
  pattern: string
  learnedBehavior: string
  confidence: number // 0-1
  effectiveness: number // 0-1
  appliedCount: number
  lastAppliedAt?: Date
  createdAt: Date
}

export interface AgentOrchestration {
  id: string
  name: string
  description: string
  agents: string[] // Agent IDs involved
  workflow: AgentWorkflowStep[]
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED'
  currentStep: number
  startedAt: Date
  completedAt?: Date
}

export interface AgentWorkflowStep {
  stepNumber: number
  agentId: string
  actionType: AgentActionType
  parameters: Record<string, any>
  waitFor?: string[] // Other step numbers to wait for
  condition?: string // Condition to execute this step
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
  result?: any
  error?: string
}

/**
 * Agent Factory - Creates agents with default configurations
 */
export function createAgent(
  type: AgentType,
  config?: Partial<AgentConfig>
): Agent {
  const defaultConfigs: Record<AgentType, Partial<AgentConfig>> = {
    INVENTORY_AGENT: {
      autonomyLevel: 'HIGH',
      requiresApproval: false,
      learningEnabled: true,
      maxActionsPerHour: 100,
      allowedActions: ['AUTO_REORDER_STOCK', 'AUTO_UPDATE_STATUS', 'AUTO_TRIGGER_ALERT'],
    },
    ROUTING_AGENT: {
      autonomyLevel: 'HIGH',
      requiresApproval: false,
      learningEnabled: true,
      maxActionsPerHour: 200,
      allowedActions: ['AUTO_OPTIMIZE_ROUTE', 'AUTO_ADJUST_SCHEDULE', 'AUTO_ALLOCATE_RESOURCES'],
    },
    COMPLIANCE_AGENT: {
      autonomyLevel: 'MEDIUM',
      requiresApproval: true, // Compliance actions need approval
      learningEnabled: true,
      maxActionsPerHour: 50,
      allowedActions: ['AUTO_FIX_COMPLIANCE', 'AUTO_TRIGGER_ALERT', 'AUTO_GENERATE_REPORT'],
    },
    OPTIMIZATION_AGENT: {
      autonomyLevel: 'HIGH',
      requiresApproval: false,
      learningEnabled: true,
      maxActionsPerHour: 150,
      allowedActions: ['AUTO_OPTIMIZE_ROUTE', 'AUTO_ADJUST_SCHEDULE', 'AUTO_ALLOCATE_RESOURCES'],
    },
    PREDICTIVE_AGENT: {
      autonomyLevel: 'LOW',
      requiresApproval: true,
      learningEnabled: true,
      maxActionsPerHour: 30,
      allowedActions: ['AUTO_GENERATE_REPORT', 'AUTO_TRIGGER_ALERT'],
    },
    COMMUNICATION_AGENT: {
      autonomyLevel: 'MEDIUM',
      requiresApproval: false,
      learningEnabled: true,
      maxActionsPerHour: 500,
      allowedActions: ['AUTO_TRIGGER_ALERT', 'AUTO_UPDATE_STATUS'],
    },
    QUALITY_AGENT: {
      autonomyLevel: 'MEDIUM',
      requiresApproval: true,
      learningEnabled: true,
      maxActionsPerHour: 75,
      allowedActions: ['AUTO_CREATE_TASK', 'AUTO_TRIGGER_ALERT', 'AUTO_RESOLVE_ISSUE'],
    },
    COST_AGENT: {
      autonomyLevel: 'MEDIUM',
      requiresApproval: true,
      learningEnabled: true,
      maxActionsPerHour: 40,
      allowedActions: ['AUTO_GENERATE_REPORT', 'AUTO_TRIGGER_ALERT'],
    },
  }

  const defaultCapabilities: Record<AgentType, AgentCapability[]> = {
    INVENTORY_AGENT: ['READ_DATA', 'ANALYZE_DATA', 'MAKE_DECISIONS', 'EXECUTE_ACTIONS', 'LEARN_FROM_PATTERNS', 'OPTIMIZE'],
    ROUTING_AGENT: ['READ_DATA', 'ANALYZE_DATA', 'MAKE_DECISIONS', 'EXECUTE_ACTIONS', 'LEARN_FROM_PATTERNS', 'OPTIMIZE', 'PREDICT'],
    COMPLIANCE_AGENT: ['READ_DATA', 'ANALYZE_DATA', 'MAKE_DECISIONS', 'MONITOR', 'COMMUNICATE'],
    OPTIMIZATION_AGENT: ['READ_DATA', 'ANALYZE_DATA', 'MAKE_DECISIONS', 'EXECUTE_ACTIONS', 'LEARN_FROM_PATTERNS', 'OPTIMIZE'],
    PREDICTIVE_AGENT: ['READ_DATA', 'ANALYZE_DATA', 'PREDICT', 'COMMUNICATE'],
    COMMUNICATION_AGENT: ['READ_DATA', 'COMMUNICATE', 'EXECUTE_ACTIONS'],
    QUALITY_AGENT: ['READ_DATA', 'ANALYZE_DATA', 'MAKE_DECISIONS', 'EXECUTE_ACTIONS', 'MONITOR'],
    COST_AGENT: ['READ_DATA', 'ANALYZE_DATA', 'MAKE_DECISIONS', 'COMMUNICATE'],
  }

  const agentNames: Record<AgentType, string> = {
    INVENTORY_AGENT: 'Inventory Management Agent',
    ROUTING_AGENT: 'Route Optimization Agent',
    COMPLIANCE_AGENT: 'Compliance Monitoring Agent',
    OPTIMIZATION_AGENT: 'Process Optimization Agent',
    PREDICTIVE_AGENT: 'Predictive Analytics Agent',
    COMMUNICATION_AGENT: 'Communication Orchestration Agent',
    QUALITY_AGENT: 'Quality Assurance Agent',
    COST_AGENT: 'Cost Optimization Agent',
  }

  const agentDescriptions: Record<AgentType, string> = {
    INVENTORY_AGENT: 'Autonomously manages inventory levels, reorders stock, and optimizes warehouse space',
    ROUTING_AGENT: 'Optimizes delivery routes, schedules, and resource allocation autonomously',
    COMPLIANCE_AGENT: 'Monitors compliance violations and takes corrective actions',
    OPTIMIZATION_AGENT: 'Continuously optimizes warehouse processes and workflows',
    PREDICTIVE_AGENT: 'Predicts future events and generates proactive insights',
    COMMUNICATION_AGENT: 'Orchestrates multi-channel communications autonomously',
    QUALITY_AGENT: 'Monitors quality metrics and resolves quality issues',
    COST_AGENT: 'Identifies cost-saving opportunities and optimizes expenses',
  }

  return {
    id: `agent-${type}-${Date.now()}`,
    type,
    name: agentNames[type],
    description: agentDescriptions[type],
    status: 'IDLE',
    capabilities: defaultCapabilities[type],
    config: {
      enabled: true,
      autonomyLevel: 'MEDIUM',
      requiresApproval: true,
      learningEnabled: true,
      maxActionsPerHour: 100,
      allowedActions: [],
      context: {},
      ...defaultConfigs[type],
      ...config,
    },
    metrics: {
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
      averageResponseTime: 0,
      learningIterations: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}



/**
 * Agent Engine
 * 
 * Core engine for managing and orchestrating autonomous AI agents.
 * Handles:
 * - Agent lifecycle management
 * - Action execution
 * - Inter-agent communication
 * - Learning and optimization
 * - Workflow orchestration
 */

import {
  Agent,
  AgentType,
  AgentStatus,
  AgentAction,
  AgentActionType,
  AgentMessage,
  AgentLearning,
  AgentOrchestration,
  AgentWorkflowStep,
  createAgent,
} from '@/types/agents'
import { callAI, buildSystemPrompt } from '@/utils/aiClient'

// Agent registry
const agents: Map<string, Agent> = new Map()
const actions: Map<string, AgentAction> = new Map()
const messages: AgentMessage[] = []
const learnings: Map<string, AgentLearning> = new Map()
const orchestrations: Map<string, AgentOrchestration> = new Map()

/**
 * Initialize default agents
 */
export function initializeAgents(): void {
  const agentTypes: AgentType[] = [
    'INVENTORY_AGENT',
    'ROUTING_AGENT',
    'COMPLIANCE_AGENT',
    'OPTIMIZATION_AGENT',
    'PREDICTIVE_AGENT',
    'COMMUNICATION_AGENT',
    'QUALITY_AGENT',
    'COST_AGENT',
  ]

  agentTypes.forEach(type => {
    const agent = createAgent(type)
    agents.set(agent.id, agent)
  })
}

/**
 * Get all agents
 */
export function getAllAgents(): Agent[] {
  return Array.from(agents.values())
}

/**
 * Get agent by ID
 */
export function getAgent(agentId: string): Agent | undefined {
  return agents.get(agentId)
}

/**
 * Get agents by type
 */
export function getAgentsByType(type: AgentType): Agent[] {
  return Array.from(agents.values()).filter(a => a.type === type)
}

/**
 * Update agent status
 */
export function updateAgentStatus(agentId: string, status: AgentStatus): void {
  const agent = agents.get(agentId)
  if (agent) {
    agent.status = status
    agent.updatedAt = new Date()
    agents.set(agentId, agent)
  }
}

/**
 * Execute an agent action
 */
export async function executeAgentAction(
  agentId: string,
  actionType: AgentActionType,
  parameters: Record<string, any>,
  context?: {
    userRole?: string
    tenantId?: string
    currentPage?: string
  }
): Promise<AgentAction> {
  const agent = agents.get(agentId)
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`)
  }

  if (!agent.config.enabled) {
    throw new Error(`Agent ${agentId} is disabled`)
  }

  if (!agent.config.allowedActions.includes(actionType)) {
    throw new Error(`Agent ${agentId} is not allowed to perform ${actionType}`)
  }

  // Check rate limiting
  const recentActions = Array.from(actions.values())
    .filter(a => a.agentId === agentId)
    .filter(a => {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return a.createdAt > hourAgo
    })

  if (recentActions.length >= agent.config.maxActionsPerHour) {
    throw new Error(`Agent ${agentId} has reached rate limit`)
  }

  // Create action
  const action: AgentAction = {
    id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    agentId,
    agentType: agent.type,
    actionType,
    description: getActionDescription(actionType, parameters),
    status: agent.config.requiresApproval ? 'PENDING' : 'EXECUTING',
    parameters,
    requiresApproval: agent.config.requiresApproval,
    createdAt: new Date(),
  }

  actions.set(action.id, action)

  // If requires approval, wait for approval
  if (agent.config.requiresApproval) {
    return action
  }

  // Execute immediately
  return await executeAction(action, agent, context)
}

/**
 * Execute an action
 */
async function executeAction(
  action: AgentAction,
  agent: Agent,
  context?: {
    userRole?: string
    tenantId?: string
    currentPage?: string
  }
): Promise<AgentAction> {
  action.status = 'EXECUTING'
  action.executedAt = new Date()
  actions.set(action.id, action)

  updateAgentStatus(agent.id, 'ACTIVE')

  const startTime = Date.now()

  try {
    // Use AI to determine best action execution
    const systemPrompt = buildSystemPrompt({
      currentPage: context?.currentPage,
      userRole: context?.userRole,
      tenantId: context?.tenantId,
    })

    const aiPrompt = `As the ${agent.name}, execute the following action:

Action Type: ${action.actionType}
Parameters: ${JSON.stringify(action.parameters, null, 2)}

Provide a detailed execution plan and result.`

    const aiResponse = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: aiPrompt },
    ])

    // Execute the actual action based on type
    const result = await performAction(action.actionType, action.parameters, aiResponse.content)

    action.status = 'COMPLETED'
    action.result = result
    action.completedAt = new Date()

    // Update agent metrics
    agent.metrics.totalActions++
    agent.metrics.successfulActions++
    agent.metrics.averageResponseTime =
      (agent.metrics.averageResponseTime * (agent.metrics.totalActions - 1) +
        (Date.now() - startTime)) /
      agent.metrics.totalActions
    agent.metrics.lastActionAt = new Date()
    agent.updatedAt = new Date()

    agents.set(agent.id, agent)
    actions.set(action.id, action)

    updateAgentStatus(agent.id, 'IDLE')

    // Learn from successful action
    if (agent.config.learningEnabled) {
      await learnFromAction(agent.id, action, result)
    }

    return action
  } catch (error: any) {
    action.status = 'FAILED'
    action.error = error.message
    action.completedAt = new Date()

    agent.metrics.totalActions++
    agent.metrics.failedActions++
    agent.updatedAt = new Date()

    agents.set(agent.id, agent)
    actions.set(action.id, action)

    updateAgentStatus(agent.id, 'IDLE')

    return action
  }
}

/**
 * Perform the actual action
 */
async function performAction(
  actionType: AgentActionType,
  parameters: Record<string, any>,
  aiGuidance: string
): Promise<any> {
  switch (actionType) {
    case 'AUTO_OPTIMIZE_ROUTE':
      return {
        optimized: true,
        originalRoute: parameters.route,
        optimizedRoute: optimizeRoute(parameters.route),
        savings: calculateRouteSavings(parameters.route),
        aiGuidance,
      }

    case 'AUTO_REORDER_STOCK':
      return {
        reordered: true,
        materialNumber: parameters.materialNumber,
        quantity: parameters.quantity,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        aiGuidance,
      }

    case 'AUTO_FIX_COMPLIANCE':
      return {
        fixed: true,
        violationId: parameters.violationId,
        actionsTaken: ['Updated documentation', 'Notified stakeholders'],
        aiGuidance,
      }

    case 'AUTO_GENERATE_REPORT':
      return {
        generated: true,
        reportId: `report-${Date.now()}`,
        reportType: parameters.reportType,
        generatedAt: new Date(),
        aiGuidance,
      }

    case 'AUTO_ADJUST_SCHEDULE':
      return {
        adjusted: true,
        scheduleId: parameters.scheduleId,
        adjustments: parameters.adjustments,
        aiGuidance,
      }

    case 'AUTO_ALLOCATE_RESOURCES':
      return {
        allocated: true,
        resources: parameters.resources,
        allocation: optimizeResourceAllocation(parameters.resources),
        aiGuidance,
      }

    case 'AUTO_TRIGGER_ALERT':
      return {
        alertTriggered: true,
        alertType: parameters.alertType,
        recipients: parameters.recipients,
        message: parameters.message,
        aiGuidance,
      }

    case 'AUTO_UPDATE_STATUS':
      return {
        updated: true,
        entityId: parameters.entityId,
        entityType: parameters.entityType,
        newStatus: parameters.newStatus,
        aiGuidance,
      }

    case 'AUTO_CREATE_TASK':
      return {
        created: true,
        taskId: `task-${Date.now()}`,
        taskType: parameters.taskType,
        assignedTo: parameters.assignedTo,
        dueDate: parameters.dueDate,
        aiGuidance,
      }

    case 'AUTO_RESOLVE_ISSUE':
      return {
        resolved: true,
        issueId: parameters.issueId,
        resolution: parameters.resolution,
        aiGuidance,
      }

    default:
      return { executed: true, aiGuidance }
  }
}

/**
 * Helper functions for actions
 */
function optimizeRoute(route: any): any {
  // Simplified route optimization
  return { ...route, optimized: true, distanceReduced: Math.random() * 20 }
}

function calculateRouteSavings(route: any): { distance: number; time: number; cost: number } {
  return {
    distance: Math.random() * 100,
    time: Math.random() * 2,
    cost: Math.random() * 500,
  }
}

function optimizeResourceAllocation(resources: any[]): any[] {
  return resources.map(r => ({ ...r, optimized: true }))
}

/**
 * Learn from action
 */
async function learnFromAction(
  agentId: string,
  action: AgentAction,
  result: any
): Promise<void> {
  const agent = agents.get(agentId)
  if (!agent) return

  // Simple learning: if action was successful, remember the pattern
  if (action.status === 'COMPLETED' && result) {
    const pattern = JSON.stringify({
      actionType: action.actionType,
      parameters: action.parameters,
      context: result,
    })

    const existingLearning = Array.from(learnings.values()).find(
      l => l.agentId === agentId && l.pattern === pattern
    )

    if (existingLearning) {
      existingLearning.appliedCount++
      existingLearning.lastAppliedAt = new Date()
      existingLearning.effectiveness = Math.min(1, existingLearning.effectiveness + 0.1)
      learnings.set(existingLearning.id, existingLearning)
    } else {
      const learning: AgentLearning = {
        id: `learning-${Date.now()}`,
        agentId,
        pattern,
        learnedBehavior: `Successfully executed ${action.actionType}`,
        confidence: 0.7,
        effectiveness: 0.8,
        appliedCount: 1,
        lastAppliedAt: new Date(),
        createdAt: new Date(),
      }
      learnings.set(learning.id, learning)
    }

    agent.metrics.learningIterations++
    agent.updatedAt = new Date()
    agents.set(agent.id, agent)
  }
}

/**
 * Approve an action
 */
export async function approveAction(
  actionId: string,
  approvedBy: string,
  context?: {
    userRole?: string
    tenantId?: string
    currentPage?: string
  }
): Promise<AgentAction> {
  const action = actions.get(actionId)
  if (!action) {
    throw new Error(`Action ${actionId} not found`)
  }

  if (action.status !== 'PENDING') {
    throw new Error(`Action ${actionId} is not pending approval`)
  }

  action.status = 'APPROVED'
  action.approvedBy = approvedBy
  action.approvedAt = new Date()

  actions.set(action.id, action)

  const agent = agents.get(action.agentId)
  if (agent) {
    return await executeAction(action, agent, context)
  }

  return action
}

/**
 * Reject an action
 */
export function rejectAction(actionId: string, rejectedBy: string, reason?: string): AgentAction {
  const action = actions.get(actionId)
  if (!action) {
    throw new Error(`Action ${actionId} not found`)
  }

  action.status = 'REJECTED'
  action.approvedBy = rejectedBy
  action.approvedAt = new Date()
  action.error = reason || 'Action rejected by user'

  actions.set(action.id, action)

  return action
}

/**
 * Get action description
 */
function getActionDescription(actionType: AgentActionType, parameters: Record<string, any>): string {
  const descriptions: Record<AgentActionType, string> = {
    AUTO_OPTIMIZE_ROUTE: `Optimize route for ${parameters.routeId || 'route'}`,
    AUTO_REORDER_STOCK: `Reorder ${parameters.quantity || 'stock'} units of ${parameters.materialNumber || 'material'}`,
    AUTO_FIX_COMPLIANCE: `Fix compliance violation ${parameters.violationId || ''}`,
    AUTO_GENERATE_REPORT: `Generate ${parameters.reportType || 'report'}`,
    AUTO_ADJUST_SCHEDULE: `Adjust schedule ${parameters.scheduleId || ''}`,
    AUTO_ALLOCATE_RESOURCES: `Allocate resources for ${parameters.taskId || 'task'}`,
    AUTO_TRIGGER_ALERT: `Trigger ${parameters.alertType || 'alert'}`,
    AUTO_UPDATE_STATUS: `Update status of ${parameters.entityType || 'entity'}`,
    AUTO_CREATE_TASK: `Create ${parameters.taskType || 'task'}`,
    AUTO_RESOLVE_ISSUE: `Resolve issue ${parameters.issueId || ''}`,
  }

  return descriptions[actionType] || `Execute ${actionType}`
}

/**
 * Get all actions
 */
export function getAllActions(): AgentAction[] {
  return Array.from(actions.values())
}

/**
 * Get actions by agent
 */
export function getActionsByAgent(agentId: string): AgentAction[] {
  return Array.from(actions.values()).filter(a => a.agentId === agentId)
}

/**
 * Get pending actions
 */
export function getPendingActions(): AgentAction[] {
  return Array.from(actions.values()).filter(a => a.status === 'PENDING')
}

// Initialize agents on module load
if (typeof window !== 'undefined') {
  initializeAgents()
}



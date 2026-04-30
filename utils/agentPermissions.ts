/**
 * Agent Permission Utilities
 * Check permissions for agent actions
 */

import { User, ModuleId, FeatureId } from '@/types/user'
import { AgentAccess } from '@/types/userManagement'
import { canPerformAction } from './permissions'

/**
 * Check if user can access an agent
 */
export function canAccessAgent(
  user: User,
  agentId: string,
  agentType: string
): boolean {
  // Check agent access records
  const agentAccess = user.agentAccess?.find(
    a => a.agentId === agentId && a.agentType === agentType && a.enabled
  )

  if (!agentAccess) return false
  if (agentAccess.status !== 'ACTIVE') return false

  return true
}

/**
 * Check if user can execute agent action
 */
export function canExecuteAgentAction(
  user: User,
  agentId: string,
  agentType: string,
  actionType: string
): { allowed: boolean; reason?: string } {
  const agentAccess = user.agentAccess?.find(
    a => a.agentId === agentId && a.agentType === agentType
  )

  if (!agentAccess) {
    return { allowed: false, reason: 'Agent access not granted' }
  }

  if (!agentAccess.enabled) {
    return { allowed: false, reason: 'Agent is disabled for this user' }
  }

  if (agentAccess.status !== 'ACTIVE') {
    return { allowed: false, reason: 'Agent access is not active' }
  }

  if (!agentAccess.permissions.canExecute) {
    return { allowed: false, reason: 'User cannot execute agent actions' }
  }

  if (agentAccess.restrictedActions.includes(actionType)) {
    return { allowed: false, reason: 'Action is restricted for this user' }
  }

  if (agentAccess.allowedActions.length > 0 && !agentAccess.allowedActions.includes(actionType)) {
    return { allowed: false, reason: 'Action not in allowed list' }
  }

  // Check usage limits
  if (agentAccess.usageCount >= agentAccess.maxActionsPerDay) {
    return { allowed: false, reason: 'Daily action limit reached' }
  }

  return { allowed: true }
}

/**
 * Check if agent action requires approval
 */
export function requiresApproval(
  user: User,
  agentId: string,
  agentType: string
): boolean {
  const agentAccess = user.agentAccess?.find(
    a => a.agentId === agentId && a.agentType === agentType
  )

  return agentAccess?.permissions.requiresApproval || false
}

/**
 * Check module-level permission for agent
 */
export function canAccessAgentModule(
  user: User,
  moduleId: ModuleId,
  featureId?: FeatureId
): boolean {
  // Check if user has access to the module/feature the agent operates on
  if (featureId) {
    return require('@/utils/permissions').hasFeatureAccess(user, featureId, 'read_only')
  }
  return require('@/utils/permissions').hasModuleAccess(user, moduleId, 'read_only')
}


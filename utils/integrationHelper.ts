/**
 * Integration Helper
 * Seamlessly integrate permissions across the entire platform
 */

import React from 'react'
import { User, ModuleId, FeatureId, TabId, Action } from '@/types/user'
import { EnhancedUser } from '@/types/userManagement'
import { 
  hasModuleAccess, 
  hasFeatureAccess, 
  hasTabAccess,
  canPerformAction,
  canEditField 
} from './permissions'
import { canAccessAgent, canExecuteAgentAction } from './agentPermissions'
import { checkAPIPermission } from '../middleware/apiPermissions'
import { isAPIKeyValid } from './apiKeyManager'

/**
 * Comprehensive permission check - checks all levels
 */
export function checkComprehensivePermission(
  user: User | EnhancedUser | null,
  options: {
    moduleId?: ModuleId
    featureId?: FeatureId
    tabId?: TabId
    action?: Action
    fieldName?: string
    agentId?: string
    agentType?: string
    agentAction?: string
    apiKeyId?: string
    context?: { customerId?: string; warehouseId?: string }
  }
): { allowed: boolean; reason?: string; level?: 'module' | 'feature' | 'tab' | 'action' | 'field' | 'agent' | 'api' } {
  if (!user) {
    return { allowed: false, reason: 'User not authenticated', level: 'module' }
  }

  // Check module access
  if (options.moduleId) {
    const hasAccess = hasModuleAccess(user, options.moduleId, 'read_only', options.context)
    if (!hasAccess) {
      return { allowed: false, reason: 'No module access', level: 'module' }
    }
  }

  // Check feature access
  if (options.featureId) {
    const hasAccess = hasFeatureAccess(user, options.featureId, 'read_only', options.context)
    if (!hasAccess) {
      return { allowed: false, reason: 'No feature access', level: 'feature' }
    }
  }

  // Check tab access
  if (options.tabId) {
    const hasAccess = hasTabAccess(user, options.tabId, 'read_only', options.context)
    if (!hasAccess) {
      return { allowed: false, reason: 'No tab access', level: 'tab' }
    }
  }

  // Check action permission
  if (options.action && options.moduleId) {
    const canPerform = canPerformAction(
      user,
      options.moduleId,
      options.featureId,
      options.tabId,
      options.action,
      options.context
    )
    if (!canPerform) {
      return { allowed: false, reason: 'Cannot perform action', level: 'action' }
    }
  }

  // Check field-level permission
  if (options.fieldName && options.moduleId) {
    const canEdit = canEditField(
      user,
      options.moduleId,
      options.featureId,
      options.tabId,
      options.fieldName,
      options.context
    )
    if (!canEdit) {
      return { allowed: false, reason: 'Cannot edit field', level: 'field' }
    }
  }

  // Check agent access
  if (options.agentId && options.agentType) {
    const canAccess = canAccessAgent(user as EnhancedUser, options.agentId, options.agentType)
    if (!canAccess) {
      return { allowed: false, reason: 'Cannot access agent', level: 'agent' }
    }

    if (options.agentAction) {
      const canExecute = canExecuteAgentAction(
        user as EnhancedUser,
        options.agentId,
        options.agentType,
        options.agentAction
      )
      if (!canExecute.allowed) {
        return { allowed: false, reason: canExecute.reason, level: 'agent' }
      }
    }
  }

  // Check API key if provided
  if (options.apiKeyId && 'apiKeys' in user) {
    const apiKey = (user as EnhancedUser).apiKeys?.find(k => k.id === options.apiKeyId)
    if (!apiKey || !isAPIKeyValid(apiKey)) {
      return { allowed: false, reason: 'Invalid API key', level: 'api' }
    }
  }

  return { allowed: true, level: 'module' }
}

/**
 * Hook for easy permission checking in components
 */
export function useComprehensivePermissions() {
  const { user } = require('@/contexts/AuthContext').useAuth()

  return {
    check: (options: Parameters<typeof checkComprehensivePermission>[1]) => 
      checkComprehensivePermission(user, options),
    hasModule: (moduleId: ModuleId) => 
      user ? hasModuleAccess(user, moduleId, 'read_only') : false,
    hasFeature: (featureId: FeatureId) => 
      user ? hasFeatureAccess(user, featureId, 'read_only') : false,
    canAction: (moduleId: ModuleId, featureId: FeatureId | undefined, action: Action) =>
      user ? canPerformAction(user, moduleId, featureId, undefined, action) : false,
    canAgent: (agentId: string, agentType: string) =>
      user ? canAccessAgent(user as EnhancedUser, agentId, agentType) : false,
  }
}

/**
 * Page-level permission wrapper
 */
export function withPagePermissions(
  Component: React.ComponentType<any>,
  requiredPermissions: {
    moduleId?: ModuleId
    featureId?: FeatureId
    tabId?: TabId
    requiredAccess?: 'full' | 'partial' | 'read_only'
  }
) {
  return function ProtectedPage(props: any) {
    const { user } = require('@/contexts/AuthContext').useAuth()
    const { useRouter } = require('next/navigation')
    const router = useRouter()

    const check = checkComprehensivePermission(user, {
      moduleId: requiredPermissions.moduleId,
      featureId: requiredPermissions.featureId,
      tabId: requiredPermissions.tabId,
    })

    if (!check.allowed) {
      // Redirect to unauthorized page or show error
      if (typeof window !== 'undefined') {
        router.push('/unauthorized')
      }
      return null
    }

    return React.createElement(Component, props)
  }
}


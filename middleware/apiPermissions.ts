/**
 * API Permission Middleware
 * Check permissions for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { User, ModuleId, FeatureId, Action } from '@/types/user'
import { canPerformAction, hasModuleAccess, hasFeatureAccess } from '@/utils/permissions'
import { isAPIKeyValid } from '@/utils/apiKeyManager'
import { APIKey } from '@/types/userManagement'

export interface APIRequestContext {
  userId?: string
  tenantId?: string
  apiKey?: APIKey
  customerId?: string
  warehouseId?: string
}

/**
 * Check API permission
 */
export function checkAPIPermission(
  user: User | null,
  apiKey: APIKey | null,
  moduleId: ModuleId,
  featureId: FeatureId | undefined,
  action: Action,
  context?: { customerId?: string; warehouseId?: string }
): { allowed: boolean; reason?: string } {
  // Check API key if provided
  if (apiKey) {
    if (!isAPIKeyValid(apiKey)) {
      return { allowed: false, reason: 'API key is not valid or expired' }
    }

    // Check API key permissions
    const hasPermission = apiKey.permissions.some(perm => {
      if (perm.moduleId === moduleId && (!featureId || perm.featureId === featureId)) {
        return perm.actions.includes(action)
      }
      return false
    })

    if (!hasPermission) {
      return { allowed: false, reason: 'API key does not have required permission' }
    }

    // Check IP whitelist
    if (apiKey.allowedIPs && apiKey.allowedIPs.length > 0) {
      // IP check would be done at request level
      // This is a placeholder
    }
  }

  // Check user permissions
  if (user) {
    if (featureId) {
      if (!hasFeatureAccess(user, featureId, 'read_only', context)) {
        return { allowed: false, reason: 'User does not have feature access' }
      }
    } else {
      if (!hasModuleAccess(user, moduleId, 'read_only', context)) {
        return { allowed: false, reason: 'User does not have module access' }
      }
    }

    if (!canPerformAction(user, moduleId, featureId, undefined, action, context)) {
      return { allowed: false, reason: 'User cannot perform this action' }
    }
  }

  if (!user && !apiKey) {
    return { allowed: false, reason: 'Authentication required' }
  }

  return { allowed: true }
}

/**
 * API Permission Middleware
 */
export function withAPIPermissions(
  handler: (req: NextRequest, context: APIRequestContext) => Promise<NextResponse>,
  options: {
    moduleId: ModuleId
    featureId?: FeatureId
    action: Action
    requireAuth?: boolean
  }
) {
  return async (req: NextRequest, context: any) => {
    // Extract API key from headers
    const apiKeyHeader = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')
    
    // Extract user from session/token (would be implemented based on auth system)
    const user = null // TODO: Extract from session/JWT

    // Verify API key if provided
    let apiKey: APIKey | null = null
    if (apiKeyHeader) {
      // TODO: Lookup API key from database
      // const apiKey = await getAPIKeyByKey(apiKeyHeader)
    }

    // Check permission
    const permissionCheck = checkAPIPermission(
      user,
      apiKey,
      options.moduleId,
      options.featureId,
      options.action
    )

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: 'Permission denied', reason: permissionCheck.reason },
        { status: 403 }
      )
    }

    // Check rate limit if API key
    if (apiKey) {
      // TODO: Check rate limits
      // const rateLimitCheck = checkRateLimit(apiKey, ...)
    }

    // Create context
    const apiContext: APIRequestContext = {
      userId: user?.id,
      tenantId: user?.tenantId,
      apiKey: apiKey || undefined,
    }

    return handler(req, apiContext)
  }
}


/**
 * Context Helper Utilities
 * Provides tenant and user context extraction from various sources
 */

/**
 * Get tenant ID from context
 * Tries multiple sources in order of priority
 */
export function getTenantFromContext(context?: {
  tenantId?: string
  user?: { tenantId?: string }
  request?: { headers?: Headers }
}): string | null {
  // 1. Direct tenantId in context
  if (context?.tenantId) {
    return context.tenantId
  }

  // 2. From user object
  if (context?.user?.tenantId) {
    return context.user.tenantId
  }

  // 3. From request headers (if available)
  if (context?.request?.headers) {
    const headerTenant = context.request.headers.get('x-tenant-id') || 
                        context.request.headers.get('tenant-id')
    if (headerTenant && headerTenant !== 'default' && headerTenant !== 'default-tenant') {
      return headerTenant
    }
  }

  // 4. From environment (development only)
  if (process.env.NODE_ENV !== 'production') {
    const bootstrap = process.env.BOOTSTRAP_TENANT_ID
    if (bootstrap && bootstrap !== 'default' && bootstrap !== 'default-tenant') {
      return bootstrap
    }
    return 'tenant-1' // Development fallback
  }

  return null
}

/**
 * Get user ID from context
 */
export function getUserIdFromContext(context?: {
  userId?: string
  user?: { id?: string; email?: string }
  request?: { headers?: Headers }
}): string | null {
  // 1. Direct userId in context
  if (context?.userId) {
    return context.userId
  }

  // 2. From user object
  if (context?.user?.id) {
    return context.user.id
  }

  if (context?.user?.email) {
    return context.user.email
  }

  // 3. From request headers
  if (context?.request?.headers) {
    const headerUserId = context.request.headers.get('x-user-id')
    if (headerUserId) {
      return headerUserId
    }
  }

  // 4. From browser (client-side only)
  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('current-user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        if (userData?.id) return userData.id
        if (userData?.email) return userData.email
      }
    } catch (e) {
      // Ignore errors
    }
  }

  return 'system' // Fallback
}

/**
 * Get full context (tenant + user)
 */
export function getContext(context?: {
  tenantId?: string
  userId?: string
  user?: { id?: string; tenantId?: string; email?: string }
  request?: { headers?: Headers }
}): { tenantId: string; userId: string } {
  const tenantId = getTenantFromContext(context) || 'default-tenant'
  const userId = getUserIdFromContext(context) || 'system'
  
  return { tenantId, userId }
}



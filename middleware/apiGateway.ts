/**
 * API Gateway Middleware
 * Centralized API request handling with authentication, rate limiting, and versioning
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAuthContext } from '@/lib/services/api'
import { checkAllRateLimits, checkUserRateLimits, getRateLimitHeaders } from '@/lib/services/api/rateLimiter'
import { parseAPIVersion, isVersionSupported } from '@/lib/services/api/versioning'
import { checkAPIPermission, APIRequestContext } from './apiPermissions'
import { ModuleId, FeatureId, Action, HierarchicalPermission } from '@/types/user'
import { apiAuthMiddleware } from './apiAuth'
import { getDefaultPermissions, type User, type UserRole } from '@/types/user'
import { zeroTrustMiddleware } from './zeroTrustMiddleware'
import { observabilityMiddleware } from './observabilityMiddleware'

export interface APIGatewayOptions {
  moduleId: ModuleId
  featureId?: FeatureId
  action: Action
  requireAuth?: boolean
  rateLimit?: boolean
  version?: string
}

/**
 * API Gateway Middleware
 */
export function withAPIGateway(
  handler: (req: NextRequest, context: APIRequestContext, nextContext?: any) => Promise<NextResponse>,
  options: APIGatewayOptions
) {
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    try {
      // 0. Zero-Trust Security Check (Phase 1 Enhancement)
      if (process.env.ZERO_TRUST_ENABLED !== 'false') {
        const zeroTrustResult = await zeroTrustMiddleware(req)
        if (zeroTrustResult) {
          return zeroTrustResult // Request blocked by zero-trust
        }
      }

      // 1. Check API version
      const apiVersion = parseAPIVersion(req)
      if (!isVersionSupported(apiVersion)) {
        return NextResponse.json(
          { error: 'Unsupported API version', supportedVersions: ['v1'] },
          { status: 400 }
        )
      }

      // 2. Authenticate request
      let authContext:
        | { userId?: string; tenantId?: string; apiKey?: any; user?: User | null }
        | null = null

      if (options.requireAuth !== false) {
        // Prefer the hardened middleware (tenant enforcement + dev header support)
        const auth = await apiAuthMiddleware(req)
        if (!auth.authorized || !auth.context) {
          return auth.response || NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // Map AuthContext -> User for RBAC checks (uses default role permissions)
        const rawRole = (auth.context.roles?.[0] || 'SYSTEM_ADMIN').toString().toUpperCase()
        const role = (rawRole === 'ADMIN' ? 'SYSTEM_ADMIN' : rawRole) as UserRole
        const safeRole: UserRole = (() => {
          try {
            // Will throw if role isn't defined in ROLE_DEFINITIONS
            getDefaultPermissions(role)
            return role
          } catch {
            return 'SYSTEM_ADMIN'
          }
        })()

        const user: User = {
          id: auth.context.userId,
          tenantId: auth.context.tenantId,
          email: 'api-user@local',
          name: 'API User',
          role: safeRole,
          status: 'ACTIVE',
          assignedCustomers: [],
          assignedWarehouses: [],
          permissions: getDefaultPermissions(safeRole),
          // Provide hierarchical permissions for modern feature/tab RBAC checks.
          // Without this, new feature IDs (e.g. `tms.documents`) can fail legacy mapping checks.
          hierarchicalPermissions: (() => {
            const allActions: Action[] = [
              'read',
              'read_only',
              'read_write',
              'partial_edit',
              'write',
              'delete',
              'approve',
              'export',
              'import',
              'manage',
              'configure',
              'assign',
              'execute',
            ]

            const tmsReadOnly: HierarchicalPermission = {
              moduleId: 'tms',
              moduleAccess: 'read_only',
              actions: ['read', 'read_only', 'export'],
              scope: 'TENANT',
            }
            const tmsReadWrite: HierarchicalPermission = {
              moduleId: 'tms',
              moduleAccess: 'partial',
              actions: ['read', 'read_only', 'read_write', 'write', 'approve', 'export', 'import', 'execute'],
              scope: 'TENANT',
            }

            // AI Copilot access (tenant-scoped). This enables chat + tool routing via the API gateway.
            // Sensitive domain operations are still protected by their own module/feature permissions.
            const aiCopilot: HierarchicalPermission = {
              moduleId: 'ai',
              moduleAccess: 'partial',
              actions: ['read', 'read_only', 'execute'],
              scope: 'TENANT',
            }

            // Keep platform-sensitive modules restricted unless SYSTEM_ADMIN.
            const adminFull: HierarchicalPermission[] = [
              { moduleId: 'tms', moduleAccess: 'full', actions: allActions, scope: 'ALL' },
              { moduleId: 'wms', moduleAccess: 'full', actions: allActions, scope: 'ALL' },
              { moduleId: 'integration', moduleAccess: 'full', actions: allActions, scope: 'ALL' },
              { moduleId: 'settings', moduleAccess: 'full', actions: allActions, scope: 'ALL' },
              { moduleId: 'reports', moduleAccess: 'full', actions: allActions, scope: 'ALL' },
              { moduleId: 'analytics', moduleAccess: 'full', actions: allActions, scope: 'ALL' },
              { moduleId: 'ai', moduleAccess: 'full', actions: allActions, scope: 'ALL' },
            ]

            if (safeRole === 'SYSTEM_ADMIN') return adminFull

            // Conservative defaults for production safety:
            // - operations roles can operate TMS (read/write)
            // - customer roles can view TMS (read-only)
            // - everyone else gets TMS read-only unless explicitly elevated in a real IAM system
            const opsRoles: Set<UserRole> = new Set([
              'OPERATIONS_MANAGER',
              'WAREHOUSE_HEAD',
              'LOGISTICS_COORDINATOR',
            ])
            const customerRoles: Set<UserRole> = new Set(['CUSTOMER_ADMIN', 'CUSTOMER_USER'])

            if (opsRoles.has(safeRole)) return [tmsReadWrite, aiCopilot]
            if (customerRoles.has(safeRole)) return [tmsReadOnly, aiCopilot]
            return [tmsReadOnly, aiCopilot]
          })(),
          preferences: {
            theme: 'dark',
            language: 'en',
            timezone: 'UTC',
            dateFormat: 'MM/dd/yyyy',
            timeFormat: 'HH:mm',
            defaultView: 'table',
            notifications: { email: true, sms: false, push: true, desktop: true },
            dashboard: { widgets: [], layout: 'grid' },
          },
          loginCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        authContext = {
          userId: auth.context.userId,
          tenantId: auth.context.tenantId,
          user,
        }
      } else {
        // Legacy path: allow key-based auth for endpoints that explicitly opt out of requireAuth
        authContext = await createAuthContext(req)
      }

      // 3. Rate limiting
      if (options.rateLimit !== false) {
        // Apply user-based rate limiting for normal authenticated users (JWT/session)
        if (authContext?.tenantId && authContext?.userId && !authContext?.apiKey) {
          const identifier = `tenant:${authContext.tenantId}:user:${authContext.userId}`
          const rateLimitResult = await checkUserRateLimits(identifier)
          if (!rateLimitResult.allowed) {
            const headers = getRateLimitHeaders(rateLimitResult)
            return NextResponse.json(
              {
                error: 'Rate limit exceeded',
                reason: rateLimitResult.reason,
                resetAt: rateLimitResult.resetAt?.toISOString(),
              },
              {
                status: 429,
                headers,
              }
            )
          }
        }

        // Apply API-key based rate limiting (existing behavior)
        if (authContext?.apiKey) {
          const identifier = authContext.apiKey.id
          const rateLimitResult = checkAllRateLimits(identifier, authContext.apiKey)

          if (!rateLimitResult.allowed) {
            const headers = getRateLimitHeaders(rateLimitResult)
            return NextResponse.json(
              {
                error: 'Rate limit exceeded',
                reason: rateLimitResult.reason,
                resetAt: rateLimitResult.resetAt?.toISOString(),
              },
              {
                status: 429,
                headers,
              }
            )
          }
        }
      }

      // 4. Check permissions
      const permissionCheck = checkAPIPermission(
        (authContext?.user as User) || null,
        authContext?.apiKey || null,
        options.moduleId,
        options.featureId,
        options.action,
        {
          customerId: authContext?.userId,
          warehouseId: undefined // Extract from request if needed
        }
      )

      if (!permissionCheck.allowed) {
        return NextResponse.json(
          { error: 'Permission denied', reason: permissionCheck.reason },
          { status: 403 }
        )
      }

      // 5. Create API context
      const apiContext: APIRequestContext = {
        userId: authContext?.userId,
        tenantId: authContext?.tenantId,
        apiKey: authContext?.apiKey,
        customerId: authContext?.userId, // Adjust based on your logic
        warehouseId: undefined // Extract from request if needed
      }

      // 6. Call handler (also pass Next.js route context so dynamic routes can access params)
      const startTime = Date.now()
      const response = await handler(req, apiContext, context)

      // 6.5. Observability tracking (Phase 1 Enhancement)
      if (process.env.OBSERVABILITY_ENABLED !== 'false') {
        const responseTime = Date.now() - startTime
        const endpoint = new URL(req.url).pathname

        // Track performance metrics
        const { apmService } = await import('@/lib/services/observability')
        if (apmService) {
          apmService.trackRequest(endpoint, responseTime, 0) // Query count would be tracked separately
        }

        // Wrap response with observability middleware
        const observabilityResponse = await observabilityMiddleware(req, response)
        Object.entries(observabilityResponse.headers.entries()).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      }

      // 7. Add rate limit headers to response
      if (options.rateLimit !== false) {
        let headers: Record<string, string> = {}

        if (authContext?.tenantId && authContext?.userId && !authContext?.apiKey) {
          const identifier = `tenant:${authContext.tenantId}:user:${authContext.userId}`
          const rateLimitResult = await checkUserRateLimits(identifier)
          headers = { ...headers, ...getRateLimitHeaders(rateLimitResult) }
        }

        if (authContext?.apiKey) {
          const identifier = authContext.apiKey.id
          const rateLimitResult = checkAllRateLimits(identifier, authContext.apiKey)
          headers = { ...headers, ...getRateLimitHeaders(rateLimitResult) }
        }

        // Merge headers
        headers['X-API-Version'] = apiVersion
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      }

      return response
    } catch (error) {
      console.error('API Gateway error:', error)
      return NextResponse.json(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }
}

/**
 * CORS headers for API requests
 */
export function getCORSHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
  const requestOrigin = origin || '*'

  const corsOrigin = allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-API-Key, X-API-Version, X-Tenant-Id, X-User-Id, X-User-Roles, X-User-Permissions',
    'Access-Control-Max-Age': '86400'
  }
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleCORS(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    return new NextResponse(null, {
      status: 204,
      headers: getCORSHeaders(origin)
    })
  }
  return null
}


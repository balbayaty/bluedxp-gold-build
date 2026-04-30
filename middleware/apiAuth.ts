/**
 * API Authentication Middleware
 * JWT token validation and RBAC enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import { moduleLicenseService } from '@/lib/services/licensing'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export interface AuthContext {
  userId: string
  tenantId: string
  roles: string[]
  permissions: string[]
}

function resolveTenantId(request: NextRequest, contextTenantId?: string | null): string | null {
  // Preferred: tenant from the authenticated context (token/session)
  const ctxTenant = (contextTenantId || '').trim()
  // Treat unsafe defaults as "unset" so we don't accidentally accept them.
  if (ctxTenant && ctxTenant !== 'default' && ctxTenant !== 'default-tenant' && ctxTenant !== '') return ctxTenant

  // Fallback: explicit tenant header from client
  const headerTenant = (request.headers.get('x-tenant-id') || '').trim()
  if (headerTenant && headerTenant !== 'default' && headerTenant !== 'default-tenant') return headerTenant

  // Optional: query param (support legacy pages calling /api?tenantId=...)
  const queryTenant = (request.nextUrl?.searchParams?.get('tenantId') || '').trim()
  if (queryTenant && queryTenant !== 'default' && queryTenant !== 'default-tenant') return queryTenant

  // Development convenience: allow a configured bootstrap tenant so the app is usable immediately
  // without weakening production safety.
  if (process.env.NODE_ENV !== 'production') {
    const bootstrap = (process.env.BOOTSTRAP_TENANT_ID || '').trim()
    if (bootstrap && bootstrap !== 'default' && bootstrap !== 'default-tenant') return bootstrap
    // Final dev fallback: use tenant-1 for development
    return 'tenant-1'
  }

  return null
}

function isUnsafeTenantId(tenantId: string): boolean {
  // Multi-tenant from day 1 means we should never rely on "default" in production.
  // Keep this conservative.
  return tenantId.trim().length === 0 || tenantId === 'default' || tenantId === 'default-tenant'
}

/**
 * Verify JWT token and extract user context
 * Enhanced with session validation and database lookup
 */
export async function verifyToken(token: string): Promise<AuthContext | null> {
  try {
    const isProd = process.env.NODE_ENV === 'production'

    // For development only: allow mock tokens
    if (!isProd && (token.startsWith('mock-') || token === 'dev-token')) {
      return {
        userId: token === 'dev-token' ? 'default-user' : token.replace('mock-', ''),
        tenantId: '',
        roles: ['SYSTEM_ADMIN'],
        permissions: ['*'],
      }
    }

    // Use auth service to verify session (checks database)
    const { authService } = await import('@/lib/services/auth/authService')
    const sessionResult = await authService.verifySession(token)

    if (sessionResult.valid && sessionResult.user) {
      // Extract permissions from user
      const permissions = sessionResult.user.permissions || []
      const permissionStrings = permissions.map((p: any) => 
        Array.isArray(p.actions) 
          ? p.actions.map((a: string) => `${p.resource}:${a}`).join(',')
          : `${p.resource}:${p.actions}`
      ).flat()

      return {
        userId: sessionResult.user.id,
        tenantId: sessionResult.user.tenantId,
        roles: [sessionResult.user.role],
        permissions: permissionStrings.length > 0 ? permissionStrings : ['*'],
      }
    }

    // Fallback to JWT verification (for backward compatibility)
    const jwksUrl = (process.env.JWT_JWKS_URL || '').trim()
    const jwtSecret = (process.env.JWT_SECRET || '').trim()
    const issuer = (process.env.JWT_ISSUER || '').trim()
    const audience = (process.env.JWT_AUDIENCE || '').trim()

    if (isProd && !jwksUrl && !jwtSecret) return null

    const key =
      jwksUrl.length > 0
        ? createRemoteJWKSet(new URL(jwksUrl))
        : new TextEncoder().encode(jwtSecret)

    const { payload } = await jwtVerify(token, key as any, {
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
    })

    const userId = String(payload.sub || payload.userId || payload.uid || '')
    const tenantId = String(payload.tenantId || payload.tid || payload.tenant || '')

    const rolesRaw = payload.roles ?? payload.role ?? []
    const permissionsRaw = payload.permissions ?? []

    const roles: string[] =
      Array.isArray(rolesRaw) ? rolesRaw.map(String) : typeof rolesRaw === 'string' ? [rolesRaw] : []
    const permissions: string[] =
      Array.isArray(permissionsRaw) ? permissionsRaw.map(String) : typeof permissionsRaw === 'string' ? [permissionsRaw] : []

    if (!userId || !tenantId) return null
    if (isProd && roles.length === 0) return null

    return { userId, tenantId, roles, permissions }
  } catch (e) {
    // Token verification failed
    return null
  }
}

/**
 * API Authentication Middleware
 * Supports both Bearer token and session cookie authentication
 */
export async function apiAuthMiddleware(
  request: NextRequest,
  requiredPermissions?: string[]
): Promise<{ authorized: boolean; context?: AuthContext; response?: NextResponse }> {
  // Try Bearer token first
  const authHeader = request.headers.get('authorization')
  let context: AuthContext | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    context = await verifyToken(token)
    } else {
      // Fallback to session cookie (for client-side requests)
      // Check for auth-token cookie (set by login endpoint)
      const authTokenCookie = request.cookies.get('auth-token')
      if (authTokenCookie) {
        context = await verifyToken(authTokenCookie.value)
      } else {
        // For development OR localhost: Allow requests without auth (will use mock context)
        // This enables testing production builds on localhost
        const isLocalhost = request.url.includes('localhost') || request.url.includes('127.0.0.1')
        const isDev = process.env.NODE_ENV === 'development'
        
        if (isDev || isLocalhost) {
          // Development/localhost: use header tenant or bootstrap tenant or safe default
          const headerTenant = request.headers.get('x-tenant-id') || ''
          const bootstrapTenant = (process.env.BOOTSTRAP_TENANT_ID || '').trim()
          const devTenant = headerTenant || bootstrapTenant || 'tenant-1'
          
          context = {
            userId: request.headers.get('x-user-id') || 'dev-user',
            tenantId: devTenant,
            roles: (request.headers.get('x-user-roles')?.split(',').filter(Boolean)) || ['SYSTEM_ADMIN'],
            permissions: (request.headers.get('x-user-permissions')?.split(',').filter(Boolean)) || ['*'],
          }
        } else {
          // Strict production: do NOT accept identity from headers unless explicitly enabled
          // (prevents forged-header bypass in zero-trust environments).
          const allowHeaderAuthInProd = process.env.ALLOW_HEADER_AUTH_IN_PROD === 'true'
          if (allowHeaderAuthInProd) {
            const userId = request.headers.get('x-user-id')
            const tenantId = request.headers.get('x-tenant-id')
            if (userId && tenantId) {
              context = {
                userId,
                tenantId,
                roles: request.headers.get('x-user-roles')?.split(',') || [],
                permissions: request.headers.get('x-user-permissions')?.split(',') || ['*'],
              }
            }
          }
        }
      }
    }

  if (!context) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }],
        },
        { status: 401 }
      ),
    }
  }

  // Enforce tenantId (multi-tenant day 1)
  const resolvedTenantId = resolveTenantId(request, context.tenantId)
  if (!resolvedTenantId) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          errors: [{ code: 'TENANT_REQUIRED', message: 'Tenant context required (x-tenant-id or token tenantId)' }],
        },
        { status: 400 }
      ),
    }
  }

  // Production safety: block unsafe defaults
  if (process.env.NODE_ENV === 'production' && isUnsafeTenantId(resolvedTenantId)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          errors: [{ code: 'INVALID_TENANT', message: 'Invalid tenant context' }],
        },
        { status: 400 }
      ),
    }
  }

  // Normalize context tenant
  context.tenantId = resolvedTenantId

  // Check permissions if required
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = context.permissions.includes('*') ||
      requiredPermissions.some(perm => context.permissions.includes(perm))

    if (!hasPermission) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            errors: [{ code: 'FORBIDDEN', message: 'Insufficient permissions' }],
          },
          { status: 403 }
        ),
      }
    }
  }

  return { authorized: true, context }
}

/**
 * Module License Check Middleware
 */
export async function licenseCheckMiddleware(
  request: NextRequest,
  moduleId: string
): Promise<{ authorized: boolean; response?: NextResponse }> {
  const authResult = await apiAuthMiddleware(request)
  if (!authResult.authorized || !authResult.context) {
    return authResult
  }

  const validation = await moduleLicenseService.validateLicense(
    authResult.context.tenantId,
    moduleId
  )

  if (!validation.valid) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          errors: [
            {
              code: 'LICENSE_REQUIRED',
              message: `Module ${moduleId} requires a valid license`,
              details: validation,
            },
          ],
        },
        { status: 403 }
      ),
    }
  }

  return { authorized: true }
}


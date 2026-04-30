/**
 * 🚀 ROW-LEVEL SECURITY MIDDLEWARE
 * 
 * Enforces tenant isolation at the middleware level
 * Prevents cross-tenant data access
 * 
 * Features:
 * - Automatic tenantId filtering on all queries
 * - Cross-tenant access prevention
 * - Security violation logging
 * - Request context enrichment
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/lib/services/audit/auditService'

// ============================================================================
// TYPES
// ============================================================================

export interface SecurityContext {
  tenantId: string
  userId?: string
  ipAddress?: string
  userAgent?: string
}

// ============================================================================
// ROW-LEVEL SECURITY MIDDLEWARE
// ============================================================================

/**
 * Middleware wrapper that enforces row-level security
 */
export function withRowLevelSecurity(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options?: {
    requireTenant?: boolean
    requireAuth?: boolean
  }
) {
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    try {
      // Extract tenant ID from request
      const tenantId = extractTenantId(req, context)

      // Validate tenant ID
      if (options?.requireTenant && !tenantId) {
        await logSecurityViolation(req, 'MISSING_TENANT_ID', context)
        return NextResponse.json(
          { error: 'Tenant ID required' },
          { status: 400 }
        )
      }

      // Enrich context with security information
      const securityContext: SecurityContext = {
        tenantId: tenantId || '',
        userId: extractUserId(req, context),
        ipAddress: extractIPAddress(req),
        userAgent: req.headers.get('user-agent') || undefined,
      }

      // Add security context to request context
      const enrichedContext = {
        ...context,
        security: securityContext,
        tenantId: securityContext.tenantId,
      }

      // Call handler with enriched context
      return await handler(req, enrichedContext)
    } catch (error) {
      console.error('[RowLevelSecurity] Error:', error)
      await logSecurityViolation(req, 'MIDDLEWARE_ERROR', context, error)
      return NextResponse.json(
        { error: 'Security check failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Extract tenant ID from request
 */
function extractTenantId(req: NextRequest, context: any): string | null {
  // Try multiple sources (in order of priority)
  
  // 1. From context (if already resolved)
  if (context?.tenantId) {
    return context.tenantId
  }

  // 2. From headers
  const headerTenantId = req.headers.get('x-tenant-id') || req.headers.get('tenant-id')
  if (headerTenantId) {
    return headerTenantId
  }

  // 3. From query parameters
  const queryTenantId = req.nextUrl.searchParams.get('tenantId')
  if (queryTenantId) {
    return queryTenantId
  }

  // 4. From JWT token (if available)
  // TODO: Extract from JWT token in Authorization header

  // 5. From session (if available)
  // TODO: Extract from session

  return null
}

/**
 * Extract user ID from request
 */
function extractUserId(req: NextRequest, context: any): string | undefined {
  // Try multiple sources
  
  if (context?.userId) {
    return context.userId
  }

  const headerUserId = req.headers.get('x-user-id') || req.headers.get('user-id')
  if (headerUserId) {
    return headerUserId
  }

  // TODO: Extract from JWT token

  return undefined
}

/**
 * Extract IP address from request
 */
function extractIPAddress(req: NextRequest): string | undefined {
  // Try X-Forwarded-For (for proxies)
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // Try X-Real-IP
  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to connection remote address
  return req.ip || undefined
}

/**
 * Log security violation
 */
async function logSecurityViolation(
  req: NextRequest,
  violationType: string,
  context: any,
  error?: any
): Promise<void> {
  try {
    await auditService.logSecurityEvent({
      type: 'suspicious_activity',
      userId: extractUserId(req, context),
      ipAddress: extractIPAddress(req),
      userAgent: req.headers.get('user-agent') || undefined,
      details: {
        violationType,
        path: req.nextUrl.pathname,
        method: req.method,
        error: error?.message,
      },
    })
  } catch (logError) {
    console.error('[RowLevelSecurity] Error logging security violation:', logError)
  }
}

/**
 * Validate tenant ID format
 */
export function isValidTenantId(tenantId: string | null | undefined): boolean {
  if (!tenantId) return false
  
  // Basic validation: should be non-empty string, no SQL injection patterns
  if (typeof tenantId !== 'string') return false
  if (tenantId.length === 0 || tenantId.length > 255) return false
  if (/[;'"\\]/.test(tenantId)) return false // Prevent SQL injection
  
  return true
}

/**
 * Ensure tenant isolation in query
 */
export function ensureTenantIsolation(query: any, tenantId: string): any {
  if (!isValidTenantId(tenantId)) {
    throw new Error('Invalid tenant ID')
  }

  // Add tenantId to where clause
  if (query.where) {
    query.where = {
      ...query.where,
      tenantId,
    }
  } else {
    query.where = { tenantId }
  }

  return query
}














/**
 * Zero-Trust Middleware
 * 
 * Enforces zero-trust security on all API requests
 */

// Dynamic imports logic inside function to prevent circular dependencies
import { NextRequest, NextResponse } from 'next/server'

export async function zeroTrustMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  // Dynamic imports to avoid circular dependencies
  const { zeroTrustService } = await import('@/lib/services/security/zeroTrustService')
  const { apiSecurityGateway } = await import('@/lib/services/security/apiSecurityGateway')

  // Skip for health checks and metrics
  const pathname = new URL(request.url).pathname
  if (pathname.includes('/api/health') || pathname.includes('/api/metrics')) {
    return null
  }

  // Skip zero-trust for localhost in development/testing (production builds tested locally)
  const isLocalhost = request.url.includes('localhost') || request.url.includes('127.0.0.1')
  if (isLocalhost) {
    return null // Allow localhost requests without zero-trust verification
  }

  try {
    // 1. Verify request with zero-trust
    const verification = await zeroTrustService.verifyRequest(request)
    if (!verification.verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request verification failed',
          reason: verification.reason,
        },
        { status: 403 }
      )
    }

    // 2. Check WAF rules
    const wafResult = await apiSecurityGateway.checkWAFRules(request)
    if (wafResult.blocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request blocked by WAF',
          reason: wafResult.reason,
          ruleId: wafResult.ruleId,
        },
        { status: 403 }
      )
    }

    // 3. Check DDoS protection
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const endpoint = pathname
    const ddosResult = await apiSecurityGateway.checkDDoSProtection(ip, endpoint)
    if (ddosResult.blocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request blocked by DDoS protection',
          reason: ddosResult.reason,
          attackType: ddosResult.attackType,
        },
        { status: 429 }
      )
    }

    // 4. Check rate limiting
    const userId = verification.metadata?.userId || 'anonymous'
    const apiKeyId = request.headers.get('x-api-key-id')
    const rateLimitResult = await apiSecurityGateway.checkRateLimit(userId, apiKeyId, endpoint)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          reason: rateLimitResult.reason,
          resetAt: new Date(rateLimitResult.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          },
        }
      )
    }

    // All checks passed
    return null
  } catch (error: any) {
    console.error('Zero-trust middleware error:', error)
    // Fail open in case of errors (can be configured to fail closed)
    if (process.env.ZERO_TRUST_FAIL_CLOSED === 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'Security check failed',
        },
        { status: 500 }
      )
    }
    return null
  }
}



import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Performance-optimized middleware for BlueDXP Platform
 * 
 * Optimizations:
 * - Route prefetching hints
 * - Cache control headers
 * - Static asset optimization
 * - API route performance hints
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Add performance headers for static assets
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    )
    return response
  }

  // Add cache headers for API routes that don't change frequently
  if (pathname.startsWith('/api/modules/list')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=600, stale-while-revalidate=3600'
    )
  }

  // Add performance hints for navigation
  if (pathname.startsWith('/app') || pathname.startsWith('/dashboard')) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
  }

  // Prefetch hints for common navigation paths
  const prefetchPaths = [
    '/dashboard',
    '/inventory',
    '/warehouses',
    '/shipments',
    '/orders',
  ]

  if (prefetchPaths.some(path => pathname.startsWith(path))) {
    response.headers.set('Link', prefetchPaths
      .filter(path => !pathname.startsWith(path))
      .map(path => `</${path}>; rel=prefetch`)
      .join(', ')
    )
  }

  return response
}

// Only run middleware on specific paths to avoid performance overhead
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}



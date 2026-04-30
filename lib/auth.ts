/**
 * Authentication Helper
 * Provides authenticate function for API routes
 */

import { NextRequest } from 'next/server'

export interface AuthUser {
  id: string
  email: string
  name: string
  tenantId: string
  roles: string[]
}

export async function authenticate(req: NextRequest): Promise<AuthUser> {
  // Extract user from headers (would be from JWT/session in production)
  const userId = req.headers.get('x-user-id') || 'default-user'
  const tenantId = req.headers.get('x-tenant-id') || process.env.BOOTSTRAP_TENANT_ID || 'default-tenant'
  const userEmail = req.headers.get('x-user-email') || 'user@example.com'
  const userName = req.headers.get('x-user-name') || 'Default User'
  const userRoles = req.headers.get('x-user-roles')?.split(',') || ['SYSTEM_ADMIN']

  return {
    id: userId,
    email: userEmail,
    name: userName,
    tenantId,
    roles: userRoles,
  }
}

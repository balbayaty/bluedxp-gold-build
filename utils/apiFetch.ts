/**
 * apiFetch
 * Client-side helper to ensure multi-tenant headers are always attached.
 *
 * This makes "multi-tenant from day 1" practical: pages stop forgetting tenant context.
 */

export type ApiFetchInit = RequestInit & {
  tenantId?: string
  userId?: string
}

function getLocalStorageJson<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function apiFetch(input: RequestInfo | URL, init: ApiFetchInit = {}) {
  const headers = new Headers(init.headers || {})

  // Resolve tenant/user from init override first
  let tenantId = init.tenantId
  let userId = init.userId

  // Fallback to saved session in localStorage (current app behavior)
  if (!tenantId) {
    const tenant = getLocalStorageJson<{ id: string }>('current-tenant')
    tenantId = tenant?.id
  }
  if (!userId) {
    const user = getLocalStorageJson<{ id: string }>('current-user')
    userId = user?.id
  }

  // Dev-friendly fallback (keeps pages usable without a full auth flow).
  // In production, `middleware/apiAuth.ts` will reject unsafe or missing tenant IDs.
  if (!tenantId && process.env.NODE_ENV !== 'production') {
    tenantId = 'tenant-1'
  }
  if (!userId && process.env.NODE_ENV !== 'production') {
    userId = 'dev-user'
  }

  if (tenantId) headers.set('x-tenant-id', tenantId)
  if (userId) headers.set('x-user-id', userId)

  // If you later add a real auth token, attach it here (Bearer ...)
  // const token = window.localStorage.getItem('auth-token')
  // if (token) headers.set('authorization', `Bearer ${token}`)

  return fetch(input, { ...init, headers })
}



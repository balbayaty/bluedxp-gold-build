/**
 * Pulse API Client
 * Handles authenticated API requests for Pulse module
 */

import { useAuth } from '@/contexts/AuthContext'

/**
 * Get auth headers for API requests
 * Uses session cookies for client-side, Bearer token for server-side
 */
export function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // For client-side, we rely on cookies/session
  // The API routes will check cookies if Bearer token is not present
  if (typeof window !== 'undefined') {
    // Try to get token from localStorage if available
    const token = localStorage.getItem('auth-token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  return headers
}

/**
 * Authenticated fetch for Pulse API
 */
export async function pulseApiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session auth
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `Request failed with status ${response.status}`,
      }
    }

    return {
      success: true,
      data: data.data || data,
    }
  } catch (error) {
    console.error('Pulse API fetch error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}














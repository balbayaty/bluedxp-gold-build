'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, UserRole, getDefaultPermissions, ModuleId, FeatureId, TabId, Action } from '@/types/user'
import { Tenant } from '@/types/tenant'
import {
  hasModuleAccess,
  hasFeatureAccess,
  hasTabAccess,
  canPerformAction,
  canEditField,
} from '@/utils/permissions'

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  isAuthenticated: boolean
  isLoading: boolean
  /**
   * Hydration flag:
   * - false on server and on the very first client render
   * - true after the client mounts and we load cached auth state (if any)
   *
   * This prevents server/client markup mismatches (e.g., rendering a <nav> only on the client).
   */
  isHydrated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  hasPermission: (resource: string, action: string, context?: { customerId?: string; warehouseId?: string }) => boolean
  // New hierarchical permission methods
  hasModuleAccess: (moduleId: ModuleId, requiredAccess?: 'full' | 'partial' | 'read_only', context?: { customerId?: string; warehouseId?: string }) => boolean
  hasFeatureAccess: (featureId: FeatureId, requiredAccess?: 'full' | 'partial' | 'read_only', context?: { customerId?: string; warehouseId?: string }) => boolean
  hasTabAccess: (tabId: TabId, requiredAccess?: 'full' | 'partial' | 'read_only', context?: { customerId?: string; warehouseId?: string }) => boolean
  canPerformAction: (moduleId: ModuleId, featureId: FeatureId | undefined, tabId: TabId | undefined, action: Action, context?: { customerId?: string; warehouseId?: string }) => boolean
  canEditField: (moduleId: ModuleId, featureId: FeatureId | undefined, tabId: TabId | undefined, fieldName: string, context?: { customerId?: string; warehouseId?: string }) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function readJsonFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
    return null
  }
}

function readCachedUser(): User | null {
  const userData = readJsonFromStorage<unknown>('current-user')
  if (!userData || typeof userData !== 'object') return null
  const u = userData as { id?: unknown; email?: unknown }
  if (typeof u.id === 'string' && typeof u.email === 'string') {
    return userData as User
  }
  try {
    localStorage.removeItem('current-user')
  } catch {
    // ignore
  }
  return null
}

function readCachedTenant(): Tenant | null {
  const tenantData = readJsonFromStorage<unknown>('current-tenant')
  if (!tenantData || typeof tenantData !== 'object') return null
  const t = tenantData as { id?: unknown }
  if (typeof t.id === 'string') {
    return tenantData as Tenant
  }
  try {
    localStorage.removeItem('current-tenant')
  } catch {
    // ignore
  }
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  /**
   * Hydration-safe auth boot:
   * - Server render MUST match the first client render to avoid hydration errors.
   * - Therefore we do NOT read localStorage during initial render.
   * - After mount, we load cached auth state and optionally verify with server.
   */
  
  // HYDRATION-SAFE: Server and client must have matching initial state
  // Read from localStorage ONLY on client, but start with null on server
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  // CRITICAL: Start as false on both server and client to match initial render
  const [isHydrated, setIsHydrated] = useState(false)
  // Start with false - no blocking loader needed
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Use a ref to track if hydration has completed (avoids closure issues)
    let hydrationCompleted = false

    // SAFETY TIMEOUT: Force hydration after 300ms for faster loading (reduced from 1s)
    const safetyTimeout = setTimeout(() => {
      if (!hydrationCompleted) {
        console.warn('[AuthContext] Safety timeout - forcing hydration')
        hydrationCompleted = true
        setIsHydrated(true)
      }
    }, 300)

    let cachedUser: User | null = null
    let cachedTenant: Tenant | null = null

    try {
      // PRODUCTION MODE DETECTION: Use multiple signals since NODE_ENV is baked at build time
      // Check URL for production indicators (not localhost with dev ports)
      const isDevPort = window.location.port === '3001' || window.location.port === '3002'
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const hasDemoMode = localStorage.getItem('demo-mode') === 'true'
      
      // Production mode: port 3000 OR non-localhost OR explicit production flag
      const isProductionMode = 
        window.location.port === '3000' || 
        !isLocalhost || 
        localStorage.getItem('force-production-mode') === 'true'
      
      const wasDevSession = localStorage.getItem('session-mode') === 'development'
      
      // In production mode, if coming from dev session, force fresh login
      if (isProductionMode && wasDevSession && !hasDemoMode) {
        console.log('[AuthContext] Clearing development session for production mode')
        localStorage.removeItem('current-user')
        localStorage.removeItem('current-tenant')
        localStorage.removeItem('session-mode')
        localStorage.setItem('session-mode', 'production')
        setIsHydrated(true)
        return // Exit early - user must log in
      }
      
      // Mark current session mode based on runtime detection
      const currentMode = (isDevPort && isLocalhost && !localStorage.getItem('force-production-mode')) ? 'development' : 'production'
      localStorage.setItem('session-mode', currentMode)
      
      // HYDRATION-SAFE: Read from localStorage AFTER mount (ensures server/client match)
      cachedUser = readCachedUser()
      cachedTenant = readCachedTenant()
      
      // Set user and tenant immediately from cache (fast, no API call needed)
      if (cachedUser) {
        setUser(cachedUser)
        
        // If tenant is missing but user has tenantId, create a default tenant
        if (!cachedTenant && cachedUser.tenantId) {
          const defaultTenant: Tenant = {
            id: cachedUser.tenantId,
            name: 'BlueDXP Platform',
            type: '3PL',
            status: 'ACTIVE',
            subscriptionTier: 'ENTERPRISE',
            subscriptionStartDate: new Date(),
            maxCustomers: 1000,
            maxWarehouses: 50,
            maxUsers: 500,
            features: [],
            settings: {
              timezone: cachedUser.preferences?.timezone || 'UTC',
              currency: 'SAR',
              dateFormat: cachedUser.preferences?.dateFormat || 'MM/dd/yyyy',
              timeFormat: cachedUser.preferences?.timeFormat || 'HH:mm',
              language: cachedUser.preferences?.language || 'en',
              allowCustomerPortal: true,
              allowApiAccess: true,
              dataRetentionDays: 365,
              backupFrequency: 'DAILY',
            },
            billing: {
              monthlyFee: 10000,
              currency: 'SAR',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          setTenant(defaultTenant)
          // Save to localStorage for next time
          try {
            localStorage.setItem('current-tenant', JSON.stringify(defaultTenant))
          } catch (e) {
            console.warn('Failed to save default tenant to localStorage:', e)
          }
        } else if (cachedTenant) {
          setTenant(cachedTenant)
        }
      }
    } catch (error) {
      console.error('[AuthContext] Error during hydration:', error)
    } finally {
      // CRITICAL: Always mark as hydrated, even if there's an error
      // This ensures the app doesn't get stuck on loading screen
      if (!hydrationCompleted) {
        hydrationCompleted = true
        console.log('[AuthContext] Marking as hydrated')
        setIsHydrated(true)
        clearTimeout(safetyTimeout) // Clear safety timeout since we've hydrated
      }
    }

    // If we have a cached user, verify session in background (non-blocking)
    if (cachedUser) {
      // In development mode, skip verification entirely (instant loading)
      if (process.env.NODE_ENV !== 'development' && localStorage.getItem('demo-mode') !== 'true') {
        // In production, verify session in background (non-blocking, delayed)
        const verifySession = async () => {
          const latestCachedUser = readCachedUser()
          if (!latestCachedUser) return

          // Check if verification is disabled
          if (localStorage.getItem('skip-session-verification') === 'true' || process.env.SKIP_SESSION_VERIFICATION === 'true') {
            return
          }

          // Background verification (non-blocking, delayed by 3 seconds)
          try {
            const controller = new AbortController()
            const fetchTimeout = setTimeout(() => controller.abort(), 2500)
            
            const response = await fetch('/api/auth/me', {
              method: 'GET',
              credentials: 'include',
              signal: controller.signal,
            }).finally(() => clearTimeout(fetchTimeout))

            if (response.ok) {
              const data = await response.json()
              if (data.success && data.user) {
                setUser(data.user as User)
                localStorage.setItem('current-user', JSON.stringify(data.user))
              }
            }
          } catch (error) {
            // Silently fail - keep cached user
            console.debug('Background session verification failed:', error)
          }
        }

        // Verify in background after 3 seconds (non-blocking, doesn't affect UI)
        setTimeout(verifySession, 3000)
      }
      // In development mode, we skip verification but continue to set up cleanup
    }
    
    
    // Keep state in sync with localStorage updates (e.g., other tabs / manual clears).
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'current-user') setUser(readCachedUser())
      if (e.key === 'current-tenant') setTenant(readCachedTenant())
    }
    window.addEventListener('storage', onStorage)
    return () => {
      clearTimeout(safetyTimeout)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    
    try {
      // DEMO MODE: Bypass database if enabled
      const isDemoMode = localStorage.getItem('demo-mode') === 'true' || 
                         process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
      
      if (isDemoMode) {
        console.log('[AuthContext] Demo mode enabled - bypassing database authentication')
        
        // Create demo user
        const demoUser: User = {
          id: 'demo-user-1',
          email: email.trim(),
          name: email.split('@')[0] || 'Demo User',
          role: 'SYSTEM_ADMIN' as UserRole,
          status: 'ACTIVE',
          tenantId: 'demo-tenant-1',
          permissions: getDefaultPermissions('SYSTEM_ADMIN'),
          hierarchicalPermissions: {},
          moduleAccess: {},
          featureAccess: {},
          tabAccess: {},
          preferences: {
            theme: 'dark',
            language: 'en',
            timezone: 'Asia/Riyadh',
            dateFormat: 'MM/dd/yyyy',
            timeFormat: 'HH:mm',
            defaultView: 'table',
            notifications: { email: true, sms: false, push: true, desktop: true },
            dashboard: { widgets: [], layout: 'grid' },
          },
          loginCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const demoTenant: Tenant = {
          id: 'demo-tenant-1',
          name: 'BlueDXP Platform (Demo)',
          type: '3PL',
          status: 'ACTIVE',
          subscriptionTier: 'ENTERPRISE',
          subscriptionStartDate: new Date(),
          maxCustomers: 1000,
          maxWarehouses: 50,
          maxUsers: 500,
          features: [],
          settings: {
            timezone: 'Asia/Riyadh',
            currency: 'SAR',
            dateFormat: 'MM/dd/yyyy',
            timeFormat: 'HH:mm',
            language: 'en',
            allowCustomerPortal: true,
            allowApiAccess: true,
            dataRetentionDays: 365,
            backupFrequency: 'DAILY',
          },
          billing: {
            monthlyFee: 10000,
            currency: 'SAR',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Save to localStorage
        localStorage.setItem('current-user', JSON.stringify(demoUser))
        localStorage.setItem('current-tenant', JSON.stringify(demoTenant))
        
        // Set state immediately
        setUser(demoUser)
        setTenant(demoTenant)
        setIsHydrated(true)
        setIsLoading(false)
        
        console.log('[AuthContext] Demo login successful')
        return
      }
      
      // OPTIMIZED: Add timeout to login API call
      const controller = new AbortController()
      const loginTimeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      // Call REAL authentication API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        signal: controller.signal,
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe: true, // Optionally make this configurable
        }),
      }).finally(() => clearTimeout(loginTimeout))

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed')
      }

      // OPTIMIZED: Skip /api/auth/me call in dev mode - use data from login response
      // In dev mode, create user from login response to avoid blocking
      let authenticatedUser: User
      
      if (process.env.NODE_ENV === 'development' || localStorage.getItem('demo-mode') === 'true') {
        // In dev mode, create user from login response (faster)
        if (data.user) {
          authenticatedUser = data.user as User
        } else {
          // Fallback: create minimal user object
          authenticatedUser = {
            id: data.userId || 'dev-user-1',
            email: email.trim(),
            name: email.split('@')[0],
            role: 'SYSTEM_ADMIN' as UserRole,
            status: 'ACTIVE',
            tenantId: 'tenant-1',
            permissions: getDefaultPermissions('SYSTEM_ADMIN'),
            hierarchicalPermissions: {},
            moduleAccess: {},
            featureAccess: {},
            tabAccess: {},
            preferences: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as User
        }
      } else {
        // In production, fetch full user details from /api/auth/me
        const meController = new AbortController()
        const meTimeout = setTimeout(() => meController.abort(), 5000) // 5 second timeout
        
        const meResponse = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          signal: meController.signal,
        }).finally(() => clearTimeout(meTimeout))

        if (!meResponse.ok) {
          // If /api/auth/me fails, use login response data as fallback
          if (data.user) {
            authenticatedUser = data.user as User
          } else {
            throw new Error('Failed to get user information')
          }
        } else {
          const meData = await meResponse.json()
          
          if (!meData.success || !meData.user) {
            // Fallback to login response
            if (data.user) {
              authenticatedUser = data.user as User
            } else {
              throw new Error('Invalid user data received')
            }
          } else {
            authenticatedUser = meData.user
          }
        }
      }

      // Get tenant information (you may need to create a tenant API endpoint)
      // For now, create a default tenant or fetch from user's tenantId
      const defaultTenant: Tenant = {
        id: authenticatedUser.tenantId,
        name: 'BlueDXP Platform',
        type: '3PL',
        status: 'ACTIVE',
        subscriptionTier: 'ENTERPRISE',
        subscriptionStartDate: new Date(),
        maxCustomers: 1000,
        maxWarehouses: 50,
        maxUsers: 500,
        features: [],
        settings: {
          timezone: authenticatedUser.preferences?.timezone || 'UTC',
          currency: 'SAR',
          dateFormat: authenticatedUser.preferences?.dateFormat || 'MM/dd/yyyy',
          timeFormat: authenticatedUser.preferences?.timeFormat || 'HH:mm',
          language: authenticatedUser.preferences?.language || 'en',
          allowCustomerPortal: true,
          allowApiAccess: true,
          dataRetentionDays: 365,
          backupFrequency: 'DAILY',
        },
        billing: {
          monthlyFee: 10000,
          currency: 'SAR',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('current-user', JSON.stringify(authenticatedUser))
          localStorage.setItem('current-tenant', JSON.stringify(defaultTenant))
        } catch (e) {
          console.error('Error saving to localStorage:', e)
        }
      }
      
      // OPTIMIZED: Set state IMMEDIATELY before any other operations
      // This triggers the redirect in login page immediately
      setUser(authenticatedUser)
      setTenant(defaultTenant)
      
      // Mark as hydrated immediately so UI doesn't block
      setIsHydrated(true)
      
      // Clear loading state immediately
      setIsLoading(false)
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      throw error // Re-throw so caller can handle it
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Call logout API to revoke session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Ignore errors - still clear local state
      })
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Always clear local state
      setUser(null)
      setTenant(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('current-user')
        localStorage.removeItem('current-tenant')
      }
    }
  }, [])

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates, updatedAt: new Date() }
      setUser(updatedUser)
      if (typeof window !== 'undefined') {
        localStorage.setItem('current-user', JSON.stringify(updatedUser))
      }
    }
  }

  const hasPermission = (
    resource: string,
    action: string,
    context?: { customerId?: string; warehouseId?: string }
  ): boolean => {
    if (!user) return false
    
    const permission = user.permissions.find(p => p.resource === resource)
    if (!permission) return false
    
    if (!permission.actions.includes(action as any)) return false
    
    // Check scope
    switch (permission.scope) {
      case 'ALL':
        return true
      case 'OWN':
        if (user.role === 'CUSTOMER_USER' || user.role === 'CUSTOMER_ADMIN') {
          return context?.customerId === user.assignedCustomers?.[0]
        }
        return false
      case 'ASSIGNED_CUSTOMERS':
        if (!context?.customerId) return false
        return user.assignedCustomers?.includes(context.customerId) ?? false
      case 'ASSIGNED_WAREHOUSES':
        if (!context?.warehouseId) return false
        return user.assignedWarehouses?.includes(context.warehouseId) ?? false
      case 'TENANT':
        return true
      default:
        return false
    }
  }

  // Hierarchical permission methods
  const checkModuleAccess = useCallback((
    moduleId: ModuleId,
    requiredAccess: 'full' | 'partial' | 'read_only' = 'read_only',
    context?: { customerId?: string; warehouseId?: string }
  ): boolean => {
    if (!user) return false
    return hasModuleAccess(user, moduleId, requiredAccess, context)
  }, [user])

  const checkFeatureAccess = useCallback((
    featureId: FeatureId,
    requiredAccess: 'full' | 'partial' | 'read_only' = 'read_only',
    context?: { customerId?: string; warehouseId?: string }
  ): boolean => {
    if (!user) return false
    return hasFeatureAccess(user, featureId, requiredAccess, context)
  }, [user])

  const checkTabAccess = useCallback((
    tabId: TabId,
    requiredAccess: 'full' | 'partial' | 'read_only' = 'read_only',
    context?: { customerId?: string; warehouseId?: string }
  ): boolean => {
    if (!user) return false
    return hasTabAccess(user, tabId, requiredAccess, context)
  }, [user])

  const checkCanPerformAction = useCallback((
    moduleId: ModuleId,
    featureId: FeatureId | undefined,
    tabId: TabId | undefined,
    action: Action,
    context?: { customerId?: string; warehouseId?: string }
  ): boolean => {
    if (!user) return false
    return canPerformAction(user, moduleId, featureId, tabId, action, context)
  }, [user])

  const checkCanEditField = useCallback((
    moduleId: ModuleId,
    featureId: FeatureId | undefined,
    tabId: TabId | undefined,
    fieldName: string,
    context?: { customerId?: string; warehouseId?: string }
  ): boolean => {
    if (!user) return false
    return canEditField(user, moduleId, featureId, tabId, fieldName, context)
  }, [user])

  const value: AuthContextType = {
    user,
    tenant,
    isAuthenticated: !!user,
    isLoading,
    isHydrated,
    login,
    logout,
    updateUser,
    hasPermission,
    hasModuleAccess: checkModuleAccess,
    hasFeatureAccess: checkFeatureAccess,
    hasTabAccess: checkTabAccess,
    canPerformAction: checkCanPerformAction,
    canEditField: checkCanEditField,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


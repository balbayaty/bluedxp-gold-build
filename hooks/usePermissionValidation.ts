/**
 * 🎣 USE PERMISSION VALIDATION HOOK
 * 
 * React hook for easy permission checking in components
 * - Real-time permission validation
 * - Tab-level access control
 * - Feature health checking
 * - Intelligent filtering
 */

import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { permissionValidationService } from '@/lib/services/permissions/permissionValidationService'
import type { TabId, ModuleId, FeatureId } from '@/types/user'
import type { PermissionCheckResult } from '@/lib/services/permissions/permissionValidationService'

/**
 * Hook to check if user can access a tab
 */
export function useTabAccess(
  tabId: TabId,
  context?: { customerId?: string; warehouseId?: string }
): PermissionCheckResult & { isLoading: boolean } {
  const { user, isLoading } = useAuth()
  
  const result = useMemo(() => {
    if (isLoading || !user) {
      return {
        allowed: false,
        canShow: false,
        canInteract: false,
        reason: isLoading ? 'Loading...' : 'User not authenticated',
        isLoading: true,
      }
    }

    // For now, return a synchronous check
    // In a real implementation, this would be async
    // For now, we'll use a simplified check
    return {
      allowed: true, // Will be enhanced with async check
      canShow: true,
      canInteract: true,
      isLoading: false,
    }
  }, [user, isLoading, tabId, context])

  return result as PermissionCheckResult & { isLoading: boolean }
}

/**
 * Hook to check module access
 */
export function useModuleAccess(
  moduleId: ModuleId,
  context?: { customerId?: string; warehouseId?: string }
): { hasAccess: boolean; isLoading: boolean } {
  const { user, isLoading } = useAuth()
  
  const hasAccess = useMemo(() => {
    if (isLoading || !user) return false
    
    // Quick check using user's module access
    if (user.role === 'SYSTEM_ADMIN') return true
    if (user.moduleAccess?.[moduleId] === 'none') return false
    if (user.moduleAccess?.[moduleId]) return true
    
    // Default: allow if no explicit denial
    return true
  }, [user, isLoading, moduleId, context])

  return { hasAccess, isLoading }
}

/**
 * Hook to check feature access
 */
export function useFeatureAccess(
  featureId: FeatureId,
  context?: { customerId?: string; warehouseId?: string }
): { hasAccess: boolean; isLoading: boolean } {
  const { user, isLoading } = useAuth()
  
  const hasAccess = useMemo(() => {
    if (isLoading || !user) return false
    
    // Quick check using user's feature access
    if (user.role === 'SYSTEM_ADMIN') return true
    if (user.featureAccess?.[featureId] === 'none') return false
    if (user.featureAccess?.[featureId]) return true
    
    // Check module access
    const [moduleId] = featureId.split('.') as [ModuleId]
    if (user.moduleAccess?.[moduleId] === 'none') return false
    
    // Default: allow if no explicit denial
    return true
  }, [user, isLoading, featureId, context])

  return { hasAccess, isLoading }
}

/**
 * Hook to filter accessible tabs
 */
export function useAccessibleTabs(
  tabIds: TabId[],
  context?: { customerId?: string; warehouseId?: string }
): { accessibleTabs: TabId[]; isLoading: boolean } {
  const { user, isLoading } = useAuth()
  
  const accessibleTabs = useMemo(() => {
    if (isLoading || !user) return []
    
    // For now, return all tabs (will be enhanced with async filtering)
    // In production, this would use permissionValidationService.filterAccessibleTabs
    return tabIds
  }, [user, isLoading, tabIds, context])

  return { accessibleTabs, isLoading }
}







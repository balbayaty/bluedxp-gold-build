/**
 * Navigation Permission Utilities
 * Filter navigation items based on user permissions
 */

import { User, ModuleId, FeatureId } from '@/types/user'
import { hasModuleAccess, hasFeatureAccess } from './permissions'

export interface NavItem {
  name: string
  href?: string
  icon: string
  description?: string
  badge?: string | number
  children?: NavItem[]
  // Permission requirements
  moduleId?: ModuleId
  featureId?: FeatureId
  requiredAccess?: 'full' | 'partial' | 'read_only'
}

/**
 * Filter navigation items based on user permissions
 */
export function filterNavigationByPermissions(
  navItems: NavItem[],
  user: User | null,
  context?: { customerId?: string; warehouseId?: string }
): NavItem[] {
  // If no user, show all navigation (for public access or demo mode)
  if (!user) return navItems

  return navItems
    .map(item => {
      // Super admins and system admins always have access to everything
      if (user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN') {
        // Still filter children recursively
        if (item.children) {
          const filteredChildren = filterNavigationByPermissions(
            item.children,
            user,
            context
          )
          return { ...item, children: filteredChildren }
        }
        return item
      }

      // Check if item requires permission
      if (item.moduleId) {
        const hasAccess = hasModuleAccess(
          user,
          item.moduleId,
          item.requiredAccess || 'read_only',
          context
        )
        if (!hasAccess) return null
      }

      if (item.featureId) {
        const hasAccess = hasFeatureAccess(
          user,
          item.featureId,
          item.requiredAccess || 'read_only',
          context
        )
        if (!hasAccess) return null
      }

      // Filter children recursively
      if (item.children) {
        const filteredChildren = filterNavigationByPermissions(
          item.children,
          user,
          context
        )
        // Don't hide parent if it has a direct href (like Configuration -> All Settings)
        if (filteredChildren.length === 0 && !item.href) {
          // If no children and no direct href, hide parent
          return null
        }
        return { ...item, children: filteredChildren }
      }

      return item
    })
    .filter((item): item is NavItem => item !== null)
}

/**
 * Check if a route is accessible
 */
export function isRouteAccessible(
  user: User | null,
  path: string,
  context?: { customerId?: string; warehouseId?: string }
): boolean {
  if (!user) return false

  // Map routes to modules/features
  const routeMap: Record<string, { moduleId?: ModuleId; featureId?: FeatureId }> = {
    '/inbound': { moduleId: 'wms', featureId: 'wms.inbound' },
    '/outbound': { moduleId: 'wms', featureId: 'wms.outbound' },
    '/inventory': { moduleId: 'wms', featureId: 'wms.inventory' },
    '/orders': { moduleId: 'wms', featureId: 'wms.orders' },
    '/warehouses': { moduleId: 'wms', featureId: 'wms.warehouses' },
    '/transportation': { moduleId: 'tms', featureId: 'tms.transportation' },
    '/shipments': { moduleId: 'tms', featureId: 'tms.shipments' },
    '/settings/users': { moduleId: 'settings', featureId: 'settings.users' },
    '/settings': { moduleId: 'settings' },
    '/reports': { moduleId: 'reports' },
    '/analytics': { moduleId: 'analytics' },
    '/intelligent-orchestration': { moduleId: 'ai', featureId: 'ai.intelligent_orchestration' },
    '/proposals': { moduleId: 'proposals-rfq', featureId: 'proposals-rfq.proposals' },
    '/manufacturing': { moduleId: 'maas', featureId: 'maas.manufacturing' },
  }

  const routeConfig = routeMap[path]
  if (!routeConfig) return true // Allow unknown routes (default access)

  if (routeConfig.featureId) {
    return hasFeatureAccess(user, routeConfig.featureId, 'read_only', context)
  }

  if (routeConfig.moduleId) {
    return hasModuleAccess(user, routeConfig.moduleId, 'read_only', context)
  }

  return true
}


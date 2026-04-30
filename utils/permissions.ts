/**
 * Advanced Hierarchical Permission System
 * 
 * Supports:
 * - Module-level permissions (full, partial, read-only, none)
 * - Feature-level permissions (within modules)
 * - Tab-level permissions (within features)
 * - Granular actions (read, write, delete, approve, etc.)
 * - Field-level restrictions (partial edit)
 * - Time-based restrictions
 * - Scope-based access (ALL, ASSIGNED_CUSTOMERS, etc.)
 */

import { 
  User, 
  ModuleId, 
  FeatureId, 
  TabId, 
  Action, 
  HierarchicalPermission,
  PermissionScope 
} from '@/types/user'

// ============================================================================
// PERMISSION CHECKING UTILITIES
// ============================================================================

/**
 * Check if user has access to a module
 */
export function hasModuleAccess(
  user: User,
  moduleId: ModuleId,
  requiredAccess: 'full' | 'partial' | 'read_only' = 'read_only',
  context?: { customerId?: string; warehouseId?: string }
): boolean {
  if (!user) return false
  
  // Core modules (WMS, TMS) are always visible - they're the foundation of the system
  if (moduleId === 'wms' || moduleId === 'tms') {
    return true
  }
  
  // Super admins and system admins always have full access
  if (user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN') {
    return true
  }
  
  // Check hierarchical permissions first
  if (user.hierarchicalPermissions) {
    const modulePerm = user.hierarchicalPermissions.find(
      p => p.moduleId === moduleId && !p.featureId && !p.tabId
    )
    
    if (modulePerm) {
      if (modulePerm.moduleAccess === 'none') return false
      if (modulePerm.moduleAccess === 'full') return checkScope(modulePerm.scope, user, context)
      if (modulePerm.moduleAccess === requiredAccess) return checkScope(modulePerm.scope, user, context)
      if (requiredAccess === 'read_only' && modulePerm.moduleAccess === 'partial') return checkScope(modulePerm.scope, user, context)
    }
  }
  
  // Check quick reference
  if (user.moduleAccess?.[moduleId]) {
    const access = user.moduleAccess[moduleId]
    if (access === 'none') return false
    if (access === 'full') return true
    if (access === requiredAccess) return true
    if (requiredAccess === 'read_only' && access === 'partial') return true
  }
  
  // Fallback to legacy permissions (map module to legacy resources)
  // Only use legacy permissions if they explicitly exist, otherwise default to allowing access
  const legacyResource = mapModuleToLegacyResource(moduleId)
  if (legacyResource) {
    const legacyPerm = user.permissions.find(p => p.resource === legacyResource)
    // Only check legacy permission if it exists
    if (legacyPerm) {
      return hasLegacyPermission(user, legacyResource, 'read', context)
    }
    // No legacy permission found, continue to default allow
  }
  
  // Default: if no explicit permission is set, allow access (for backward compatibility)
  // This ensures modules are visible unless explicitly denied
  return true
}

/**
 * Check if user has access to a feature
 */
export function hasFeatureAccess(
  user: User,
  featureId: FeatureId,
  requiredAccess: 'full' | 'partial' | 'read_only' = 'read_only',
  context?: { customerId?: string; warehouseId?: string }
): boolean {
  if (!user) return false
  
  // Super admins and system admins always have full access
  if (user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN') {
    return true
  }
  
  // Extract module from featureId (format: 'module.feature')
  const [moduleId] = featureId.split('.') as [ModuleId]
  
  // First check module access
  if (!hasModuleAccess(user, moduleId, 'read_only', context)) {
    return false
  }
  
  // Check hierarchical permissions
  if (user.hierarchicalPermissions) {
    const featurePerm = user.hierarchicalPermissions.find(
      p => p.featureId === featureId && !p.tabId
    )
    
    if (featurePerm) {
      if (featurePerm.featureAccess === 'none') return false
      if (featurePerm.featureAccess === 'full') return checkScope(featurePerm.scope, user, context)
      if (featurePerm.featureAccess === requiredAccess) return checkScope(featurePerm.scope, user, context)
      if (requiredAccess === 'read_only' && featurePerm.featureAccess === 'partial') {
        return checkScope(featurePerm.scope, user, context)
      }
    }
  }
  
  // Check quick reference
  if (user.featureAccess?.[featureId]) {
    const access = user.featureAccess[featureId]
    if (access === 'none') return false
    if (access === 'full') return true
    if (access === requiredAccess) return true
    if (requiredAccess === 'read_only' && access === 'partial') return true
  }
  
  // Fallback: if module has access, feature inherits (unless explicitly denied)
  return hasModuleAccess(user, moduleId, requiredAccess, context)
}

/**
 * Check if user has access to a specific tab
 */
export function hasTabAccess(
  user: User,
  tabId: TabId,
  requiredAccess: 'full' | 'partial' | 'read_only' = 'read_only',
  context?: { customerId?: string; warehouseId?: string }
): boolean {
  if (!user) return false
  
  // Super admins and system admins always have full access
  if (user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN') {
    return true
  }
  
  // Extract module and feature from tabId (format: 'module.feature.tab' or 'feature.tab')
  const parts = tabId.split('.')
  let moduleId: ModuleId | undefined
  let featureId: FeatureId | undefined
  
  if (parts.length >= 3) {
    moduleId = parts[0] as ModuleId
    featureId = `${parts[0]}.${parts[1]}` as FeatureId
  } else if (parts.length === 2) {
    featureId = parts[0] as FeatureId
    const [mod] = featureId.split('.') as [ModuleId]
    moduleId = mod
  }
  
  // Check parent access first
  if (featureId && !hasFeatureAccess(user, featureId, 'read_only', context)) {
    return false
  }
  if (moduleId && !hasModuleAccess(user, moduleId, 'read_only', context)) {
    return false
  }
  
  // Check hierarchical permissions
  if (user.hierarchicalPermissions) {
    const tabPerm = user.hierarchicalPermissions.find(
      p => p.tabId === tabId
    )
    
    if (tabPerm) {
      if (tabPerm.tabAccess === 'none') return false
      if (tabPerm.tabAccess === 'full') return checkScope(tabPerm.scope, user, context)
      if (tabPerm.tabAccess === requiredAccess) return checkScope(tabPerm.scope, user, context)
      if (requiredAccess === 'read_only' && tabPerm.tabAccess === 'partial') {
        return checkScope(tabPerm.scope, user, context)
      }
    }
  }
  
  // Check quick reference
  if (user.tabAccess?.[tabId]) {
    const access = user.tabAccess[tabId]
    if (access === 'none') return false
    if (access === 'full') return true
    if (access === requiredAccess) return true
    if (requiredAccess === 'read_only' && access === 'partial') return true
  }
  
  // Fallback: inherit from feature
  if (featureId) {
    return hasFeatureAccess(user, featureId, requiredAccess, context)
  }
  
  return false
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(
  user: User,
  moduleId: ModuleId,
  featureId: FeatureId | undefined,
  tabId: TabId | undefined,
  action: Action,
  context?: { customerId?: string; warehouseId?: string }
): boolean {
  if (!user) return false
  
  // Super admins and system admins always have full access to all actions
  if (user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN') {
    return true
  }
  
  // Check at the most specific level first
  if (tabId) {
    const tabPerm = user.hierarchicalPermissions?.find(p => p.tabId === tabId)
    if (tabPerm && tabPerm.actions.includes(action)) {
      return checkScope(tabPerm.scope, user, context)
    }
  }
  
  if (featureId) {
    const featurePerm = user.hierarchicalPermissions?.find(
      p => p.featureId === featureId && !p.tabId
    )
    if (featurePerm && featurePerm.actions.includes(action)) {
      return checkScope(featurePerm.scope, user, context)
    }
  }
  
  // Check module level
  const modulePerm = user.hierarchicalPermissions?.find(
    p => p.moduleId === moduleId && !p.featureId && !p.tabId
  )
  if (modulePerm && modulePerm.actions.includes(action)) {
    return checkScope(modulePerm.scope, user, context)
  }
  
  // Check legacy permissions
  const legacyResource = featureId 
    ? mapFeatureToLegacyResource(featureId)
    : mapModuleToLegacyResource(moduleId)
  
  if (legacyResource) {
    return hasLegacyPermission(user, legacyResource, action, context)
  }
  
  return false
}

/**
 * Check if user can edit a specific field
 */
export function canEditField(
  user: User,
  moduleId: ModuleId,
  featureId: FeatureId | undefined,
  tabId: TabId | undefined,
  fieldName: string,
  context?: { customerId?: string; warehouseId?: string }
): boolean {
  if (!user) return false
  
  // Super admins and system admins always have full access
  if (user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN') {
    return true
  }
  
  // Check at the most specific level first
  if (tabId) {
    const tabPerm = user.hierarchicalPermissions?.find(p => p.tabId === tabId)
    if (tabPerm) {
      if (tabPerm.restrictedFields?.includes(fieldName)) return false
      if (tabPerm.allowedFields && !tabPerm.allowedFields.includes(fieldName)) return false
      if (tabPerm.actions.includes('read_only')) return false
      if (tabPerm.actions.includes('read_write') || tabPerm.actions.includes('write')) {
        return checkScope(tabPerm.scope, user, context)
      }
    }
  }
  
  if (featureId) {
    const featurePerm = user.hierarchicalPermissions?.find(
      p => p.featureId === featureId && !p.tabId
    )
    if (featurePerm) {
      if (featurePerm.restrictedFields?.includes(fieldName)) return false
      if (featurePerm.allowedFields && !featurePerm.allowedFields.includes(fieldName)) return false
      if (featurePerm.actions.includes('read_only')) return false
      if (featurePerm.actions.includes('read_write') || featurePerm.actions.includes('write')) {
        return checkScope(featurePerm.scope, user, context)
      }
    }
  }
  
  // Check module level
  const modulePerm = user.hierarchicalPermissions?.find(
    p => p.moduleId === moduleId && !p.featureId && !p.tabId
  )
  if (modulePerm) {
    if (modulePerm.restrictedFields?.includes(fieldName)) return false
    if (modulePerm.allowedFields && !modulePerm.allowedFields.includes(fieldName)) return false
    if (modulePerm.actions.includes('read_only')) return false
    if (modulePerm.actions.includes('read_write') || modulePerm.actions.includes('write')) {
      return checkScope(modulePerm.scope, user, context)
    }
  }
  
  return false
}

/**
 * Check if action is allowed based on time restrictions
 */
export function isActionAllowedByTime(
  user: User,
  moduleId: ModuleId,
  featureId: FeatureId | undefined,
  tabId: TabId | undefined
): boolean {
  if (!user) return false
  
  // Check at the most specific level first
  const perm = tabId
    ? user.hierarchicalPermissions?.find(p => p.tabId === tabId)
    : featureId
    ? user.hierarchicalPermissions?.find(p => p.featureId === featureId && !p.tabId)
    : user.hierarchicalPermissions?.find(p => p.moduleId === moduleId && !p.featureId && !p.tabId)
  
  if (!perm?.timeRestrictions) return true // No restrictions
  
  const now = new Date()
  const dayOfWeek = now.getDay()
  const hour = now.getHours()
  
  if (perm.timeRestrictions.daysOfWeek && !perm.timeRestrictions.daysOfWeek.includes(dayOfWeek)) {
    return false
  }
  
  if (perm.timeRestrictions.hours) {
    const { start, end } = perm.timeRestrictions.hours
    if (hour < start || hour >= end) {
      return false
    }
  }
  
  return true
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function checkScope(
  scope: PermissionScope,
  user: User,
  context?: { customerId?: string; warehouseId?: string }
): boolean {
  switch (scope) {
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

function hasLegacyPermission(
  user: User,
  resource: string,
  action: Action,
  context?: { customerId?: string; warehouseId?: string }
): boolean {
  const permission = user.permissions.find(p => p.resource === resource)
  if (!permission) return false
  
  if (!permission.actions.includes(action)) return false
  
  return checkScope(permission.scope, user, context)
}

function mapModuleToLegacyResource(moduleId: ModuleId): string | null {
  const mapping: Record<ModuleId, string> = {
    'wms': 'inventory',
    'tms': 'orders',
    'iso-ims': 'quality',
    'msds': 'quality',
    'qhse': 'quality',
    'ai': 'analytics',
    'integration': 'settings',
    'maas': 'inventory',
    'proposals-rfq': 'orders',
    'settings': 'settings',
    'reports': 'reports',
    'analytics': 'analytics',
    'business_intelligence': 'business_intelligence',
  }
  return mapping[moduleId] || null
}

function mapFeatureToLegacyResource(featureId: FeatureId): string | null {
  // Extract the feature name (last part after last dot)
  const parts = featureId.split('.')
  const featureName = parts[parts.length - 1]
  
  // Map common features to legacy resources
  const mapping: Record<string, string> = {
    'inbound': 'inbound',
    'outbound': 'outbound',
    'inventory': 'inventory',
    'orders': 'orders',
    'picking': 'picking',
    'putaway': 'putaway',
    'cycle_counting': 'cycle_counting',
    'customers': 'customers',
    'warehouses': 'warehouses',
    'materials': 'inventory',
    'quality': 'quality',
    'reports': 'reports',
    'analytics': 'analytics',
    'users': 'users',
    'settings': 'settings',
  }
  
  return mapping[featureName] || null
}

/**
 * Get all accessible modules for a user
 */
export function getAccessibleModules(
  user: User,
  context?: { customerId?: string; warehouseId?: string }
): ModuleId[] {
  if (!user) return []
  
  const modules: ModuleId[] = [
    'wms', 'tms', 'iso-ims', 'msds', 'qhse', 'ai', 'integration', 
    'maas', 'proposals-rfq', 'settings', 'reports', 'analytics', 'business_intelligence'
  ]
  
  return modules.filter(moduleId => 
    hasModuleAccess(user, moduleId, 'read_only', context)
  )
}

/**
 * Get all accessible features for a user within a module
 */
export function getAccessibleFeatures(
  user: User,
  moduleId: ModuleId,
  context?: { customerId?: string; warehouseId?: string }
): FeatureId[] {
  if (!user) return []
  
  // This would need to be populated with all features
  // For now, return based on hierarchical permissions
  if (user.hierarchicalPermissions) {
    return user.hierarchicalPermissions
      .filter(p => p.moduleId === moduleId && p.featureId && !p.tabId)
      .map(p => p.featureId!)
      .filter((id): id is FeatureId => !!id)
  }
  
  return []
}

/**
 * Get all accessible tabs for a user within a feature
 */
export function getAccessibleTabs(
  user: User,
  featureId: FeatureId,
  context?: { customerId?: string; warehouseId?: string }
): TabId[] {
  if (!user) return []
  
  if (user.hierarchicalPermissions) {
    return user.hierarchicalPermissions
      .filter(p => p.featureId === featureId && p.tabId)
      .map(p => p.tabId!)
      .filter((id): id is TabId => !!id)
  }
  
  return []
}


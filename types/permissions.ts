/**
 * 🚀 WORLD'S MOST FLEXIBLE PERMISSION SYSTEM
 * 
 * 5-Level Hierarchical Permission System:
 * Level 1: Module (wms, tms, iso-ims, etc.)
 * Level 2: Feature (wms.inbound, tms.shipments, etc.)
 * Level 3: Tab (wms.inbound.asn, tms.shipments.tracking, etc.)
 * Level 4: Action (read, write, delete, approve, export, manage, etc.)
 * Level 5: Field (field-level permissions, partial edit)
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

import type { ModuleId, FeatureId, TabId } from './user'

// ============================================================================
// PERMISSION LEVELS
// ============================================================================

// Level 1: Module
export type PermissionModule = ModuleId

// Level 2: Feature
export type PermissionFeature = FeatureId

// Level 3: Tab
export type PermissionTab = TabId

// Level 4: Action
export type PermissionAction = 
  | 'read'           // View data
  | 'write'           // Create/update data
  | 'delete'         // Delete data
  | 'approve'        // Approve requests/actions
  | 'export'         // Export data
  | 'manage'         // Full management (includes all actions)
  | 'execute'        // Execute actions/scripts
  | 'create'         // Create new records
  | 'update'         // Update existing records
  | 'view'           // View-only access
  | 'import'         // Import data
  | 'publish'        // Publish content
  | 'archive'        // Archive records
  | 'restore'        // Restore archived records
  | 'assign'         // Assign resources
  | 'delegate'       // Delegate permissions
  | 'audit'          // View audit logs
  | 'configure'      // Configure settings

// Level 5: Field
export type PermissionField = string // Dynamic field names (e.g., 'customer.name', 'order.total')

// ============================================================================
// PERMISSION SCOPE (6 Scopes)
// ============================================================================

export type PermissionScope = 
  | 'ALL'                    // All resources across all tenants (super admin)
  | 'TENANT'                 // All resources within tenant
  | 'ASSIGNED_CUSTOMERS'     // Only assigned customers (and their sub-customers)
  | 'ASSIGNED_WAREHOUSES'    // Only assigned warehouses
  | 'ASSIGNED_REGIONS'       // Only assigned regions
  | 'OWN'                    // Only own resources (user's own data)
  | 'CUSTOM'                 // Custom scope with conditions

// ============================================================================
// HIERARCHICAL PERMISSION (5-Level)
// ============================================================================

export interface HierarchicalPermission {
  // Level 1: Module (required)
  module: PermissionModule
  
  // Level 2: Feature (optional - if not specified, applies to all features in module)
  feature?: PermissionFeature
  
  // Level 3: Tab (optional - if not specified, applies to all tabs in feature)
  tab?: PermissionTab
  
  // Level 4: Action (required)
  action: PermissionAction
  
  // Level 5: Field (optional - if specified, only this field is accessible)
  field?: PermissionField
  
  // Scope (required)
  scope: PermissionScope
  
  // Advanced Features
  conditions?: PermissionCondition[]      // If/then logic
  overrides?: PermissionOverride[]        // Allow/deny overrides
  timeRestrictions?: TimeRestriction[]    // Time-based restrictions
  locationRestrictions?: LocationRestriction[] // Location-based restrictions
  deviceRestrictions?: DeviceRestriction[] // Device-based restrictions
  
  // Metadata
  description?: string
  grantedAt?: Date | string
  grantedBy?: string
  expiresAt?: Date | string
  metadata?: Record<string, any>
}

// ============================================================================
// PERMISSION CONDITIONS (If/Then Logic)
// ============================================================================

export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'in'
  | 'not_in'
  | 'starts_with'
  | 'ends_with'
  | 'matches_regex'
  | 'is_null'
  | 'is_not_null'

export type ConditionType = 
  | 'if'           // Simple if condition
  | 'and'          // All conditions must be true
  | 'or'           // At least one condition must be true
  | 'not'          // Negate condition
  | 'nested'       // Nested condition group

export interface PermissionCondition {
  type: ConditionType
  field: string                    // Field to check (e.g., 'customer.status', 'order.total')
  operator?: ConditionOperator     // Operator (for 'if' type)
  value?: any                      // Value to compare against
  children?: PermissionCondition[] // Child conditions (for 'and', 'or', 'nested')
  
  // Context
  description?: string
  metadata?: Record<string, any>
}

// ============================================================================
// PERMISSION OVERRIDES (Allow/Deny)
// ============================================================================

export type OverrideType = 'allow' | 'deny'

export interface PermissionOverride {
  type: OverrideType
  permission: HierarchicalPermission  // Permission to override
  reason?: string                     // Why this override exists
  priority?: number                   // Higher priority overrides take precedence
  expiresAt?: Date | string           // When override expires
  metadata?: Record<string, any>
}

// ============================================================================
// TIME RESTRICTIONS
// ============================================================================

export interface TimeRestriction {
  // Day of week (0 = Sunday, 6 = Saturday)
  days?: number[]                    // [0, 1, 2, 3, 4, 5, 6]
  
  // Time range (24-hour format)
  hours?: {
    start: string                    // 'HH:mm' format (e.g., '09:00')
    end: string                      // 'HH:mm' format (e.g., '17:00')
  }
  
  // Timezone
  timezone?: string                   // IANA timezone (e.g., 'Asia/Riyadh')
  
  // Date range
  dateRange?: {
    start: Date | string
    end: Date | string
  }
  
  // Recurring schedule
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval?: number                 // Every N days/weeks/months/years
    daysOfMonth?: number[]            // For monthly: [1, 15, 30]
    months?: number[]                 // For yearly: [0-11]
  }
  
  // Metadata
  description?: string
  metadata?: Record<string, any>
}

// ============================================================================
// LOCATION RESTRICTIONS
// ============================================================================

export type LocationRestrictionType = 
  | 'ip'           // IP address
  | 'geo'          // Geographic location (lat/lng)
  | 'country'      // Country code (ISO 3166-1 alpha-2)
  | 'region'       // Region/state
  | 'city'         // City
  | 'network'      // Network/CIDR block

export interface LocationRestriction {
  type: LocationRestrictionType
  values: string[]                   // List of allowed/blocked values
  allow?: boolean                    // true = whitelist, false = blacklist (default: true)
  
  // Geographic bounds (for 'geo' type)
  bounds?: {
    north: number                    // Latitude
    south: number
    east: number                     // Longitude
    west: number
  }
  
  // Metadata
  description?: string
  metadata?: Record<string, any>
}

// ============================================================================
// DEVICE RESTRICTIONS
// ============================================================================

export type DeviceType = 
  | 'mobile'       // Mobile devices
  | 'desktop'      // Desktop computers
  | 'tablet'       // Tablets
  | 'api'          // API access
  | 'iot'          // IoT devices
  | 'embedded'     // Embedded systems

export interface DeviceRestriction {
  type: DeviceType
  allowed: boolean                   // true = allowed, false = blocked
  
  // Specific device restrictions
  os?: string[]                      // Operating systems (e.g., ['iOS', 'Android', 'Windows'])
  browser?: string[]                 // Browsers (e.g., ['Chrome', 'Firefox', 'Safari'])
  userAgent?: string[]               // Specific user agent strings
  
  // Metadata
  description?: string
  metadata?: Record<string, any>
}

// ============================================================================
// PERMISSION CONTEXT (for permission checking)
// ============================================================================

export interface PermissionContext {
  // User context
  userId?: string
  tenantId?: string
  role?: string
  
  // Resource context
  customerId?: string
  subCustomerId?: string
  warehouseId?: string
  regionId?: string
  
  // Request context
  ipAddress?: string
  userAgent?: string
  location?: {
    country?: string
    region?: string
    city?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  
  // Time context
  timestamp?: Date | string
  timezone?: string
  
  // Device context
  deviceType?: DeviceType
  os?: string
  browser?: string
  
  // Additional context
  metadata?: Record<string, any>
}

// ============================================================================
// PERMISSION RESULT
// ============================================================================

export interface PermissionResult {
  allowed: boolean
  reason?: string
  restrictions?: {
    time?: string
    location?: string
    device?: string
    condition?: string
  }
  metadata?: Record<string, any>
}

// ============================================================================
// PERMISSION CONFLICT
// ============================================================================

export interface PermissionConflict {
  type: 'overlapping' | 'contradictory' | 'redundant' | 'missing_required'
  permissions: HierarchicalPermission[]
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestion?: string
}

// ============================================================================
// PERMISSION OPTIMIZATION
// ============================================================================

export interface PermissionOptimization {
  type: 'unused' | 'redundant' | 'too_broad' | 'too_restrictive'
  permission: HierarchicalPermission
  description: string
  suggestion: string
  impact: 'low' | 'medium' | 'high'
}

// ============================================================================
// PERMISSION USAGE
// ============================================================================

export interface PermissionUsage {
  permission: HierarchicalPermission
  usageCount: number
  lastUsedAt?: Date | string
  averageUsagePerDay: number
  trend: 'increasing' | 'stable' | 'decreasing'
}

// ============================================================================
// PERMISSION TEMPLATE
// ============================================================================

export interface PermissionTemplate {
  id: string
  name: string
  description?: string
  permissions: HierarchicalPermission[]
  isSystemTemplate: boolean
  usageCount: number
  metadata?: Record<string, any>
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if permission matches context
 */
export function matchesPermission(
  permission: HierarchicalPermission,
  context: PermissionContext
): boolean {
  // Check module
  if (context.module && permission.module !== context.module) {
    return false
  }
  
  // Check feature
  if (permission.feature && context.feature && permission.feature !== context.feature) {
    return false
  }
  
  // Check tab
  if (permission.tab && context.tab && permission.tab !== context.tab) {
    return false
  }
  
  // Check action
  if (permission.action && context.action && permission.action !== context.action) {
    return false
  }
  
  // Check field
  if (permission.field && context.field && permission.field !== context.field) {
    return false
  }
  
  return true
}

/**
 * Get permission string representation
 */
export function getPermissionString(permission: HierarchicalPermission): string {
  const parts: string[] = [permission.module]
  
  if (permission.feature) parts.push(permission.feature)
  if (permission.tab) parts.push(permission.tab)
  parts.push(permission.action)
  if (permission.field) parts.push(permission.field)
  
  return parts.join('.')
}

/**
 * Parse permission string
 */
export function parsePermissionString(permissionString: string): Partial<HierarchicalPermission> {
  const parts = permissionString.split('.')
  
  if (parts.length < 2) {
    throw new Error('Invalid permission string format')
  }
  
  return {
    module: parts[0] as PermissionModule,
    feature: parts.length > 2 ? parts[1] as PermissionFeature : undefined,
    tab: parts.length > 3 ? parts[2] as PermissionTab : undefined,
    action: parts[parts.length - 2] as PermissionAction,
    field: parts.length > 4 ? parts[parts.length - 1] : undefined,
  }
}














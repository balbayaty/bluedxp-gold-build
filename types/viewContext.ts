// View Context System
// Centralized context for data filtering by customer/warehouse/role

import { UserRole } from './user'

// ============================================================================
// VIEW CONTEXT TYPES
// ============================================================================

export type ViewLevel = 'SYSTEM' | 'TENANT' | 'CUSTOMER' | 'WAREHOUSE' | 'COMBINED'
export type ViewScope = 'ALL' | 'SINGLE' | 'MULTIPLE' | 'COMBINED'

export interface ViewContext {
  // User Information
  userId: string
  userRole: UserRole
  tenantId: string
  
  // Filters
  customerFilter: CustomerFilter
  warehouseFilter: WarehouseFilter
  dateRange?: DateRangeFilter
  
  // NEW: User-specific data visibility
  userDataVisibility?: {
    showOnlyAssignedData?: boolean
    customFields?: string[]
    hiddenFields?: string[]
    dateRange?: { start?: Date; end?: Date }
  }
  
  // View Level
  level: ViewLevel
  scope: ViewScope
  
  // Additional Context
  includeInactive?: boolean
  includeHistorical?: boolean
  groupBy?: GroupByOption[]
  sortBy?: SortOption
  
  // Metadata
  lastUpdated: Date | string
  saved?: boolean
  savedName?: string
}

export interface CustomerFilter {
  type: 'ALL' | 'SINGLE' | 'MULTIPLE' | 'ASSIGNED' | 'EXCLUDED'
  customerIds?: string[]
  customerNumbers?: string[]
  serviceTiers?: string[]
  statuses?: string[]
  excludeCustomerIds?: string[]
  // NEW: Hierarchical support
  subCustomerIds?: string[] // Specific sub-customers
  includeSubCustomers?: boolean // Include sub-customers of selected customers
}

export interface WarehouseFilter {
  type: 'ALL' | 'SINGLE' | 'MULTIPLE' | 'ASSIGNED' | 'EXCLUDED'
  warehouseIds?: string[]
  warehouseCodes?: string[]
  types?: string[]
  statuses?: string[]
  excludeWarehouseIds?: string[]
}

export interface DateRangeFilter {
  type: 'CUSTOM' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'LAST_QUARTER' | 'THIS_YEAR' | 'LAST_YEAR' | 'ALL_TIME'
  startDate?: Date | string
  endDate?: Date | string
  compareWithPrevious?: boolean
}

export type GroupByOption = 
  | 'customer'
  | 'warehouse'
  | 'date'
  | 'status'
  | 'type'
  | 'service_tier'
  | 'material'
  | 'location'

export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
  secondary?: {
    field: string
    direction: 'asc' | 'desc'
  }
}

// ============================================================================
// VIEW CONTEXT PRESETS
// ============================================================================

export interface ViewContextPreset {
  id: string
  name: string
  description: string
  context: Partial<ViewContext>
  isDefault?: boolean
  role?: UserRole
}

export const DEFAULT_VIEW_CONTEXTS: Record<UserRole, Partial<ViewContext>> = {
  SYSTEM_ADMIN: {
    level: 'TENANT',
    scope: 'ALL',
    customerFilter: { type: 'ALL' },
    warehouseFilter: { type: 'ALL' },
    includeInactive: true,
    includeHistorical: true,
  },
  
  BUSINESS_DEVELOPMENT_MANAGER: {
    level: 'TENANT',
    scope: 'ALL',
    customerFilter: { type: 'ALL' },
    warehouseFilter: { type: 'ALL' },
    includeInactive: false,
    includeHistorical: true,
    groupBy: ['customer', 'service_tier'],
  },
  
  TRANSPORT_GENERAL_MANAGER: {
    level: 'TENANT',
    scope: 'ALL',
    customerFilter: { type: 'ALL' },
    warehouseFilter: { type: 'ALL' },
    includeInactive: false,
    includeHistorical: true,
    groupBy: ['transport_mode', 'carrier', 'route'],
  },
  
  WAREHOUSE_HEAD: {
    level: 'WAREHOUSE',
    scope: 'MULTIPLE',
    customerFilter: { type: 'ALL' },
    warehouseFilter: { type: 'ASSIGNED' },
    includeInactive: false,
    includeHistorical: false,
    groupBy: ['warehouse', 'customer'],
  },
  
  OPERATIONS_MANAGER: {
    level: 'WAREHOUSE',
    scope: 'MULTIPLE',
    customerFilter: { type: 'ALL' },
    warehouseFilter: { type: 'ASSIGNED' },
    includeInactive: false,
    includeHistorical: false,
  },
  
  CUSTOMER_ACCOUNT_MANAGER: {
    level: 'CUSTOMER',
    scope: 'MULTIPLE',
    customerFilter: { type: 'ASSIGNED' },
    warehouseFilter: { type: 'ALL' },
    includeInactive: false,
    includeHistorical: true,
    groupBy: ['customer'],
  },
  
  WAREHOUSE_SUPERVISOR: {
    level: 'WAREHOUSE',
    scope: 'SINGLE',
    customerFilter: { type: 'ALL' },
    warehouseFilter: { type: 'ASSIGNED' },
    includeInactive: false,
    includeHistorical: false,
  },
  
  WAREHOUSE_OPERATOR: {
    level: 'WAREHOUSE',
    scope: 'SINGLE',
    customerFilter: { type: 'ALL' },
    warehouseFilter: { type: 'ASSIGNED' },
    includeInactive: false,
    includeHistorical: false,
  },
  
  QUALITY_MANAGER: {
    level: 'WAREHOUSE',
    scope: 'MULTIPLE',
    customerFilter: { type: 'ALL' },
    warehouseFilter: { type: 'ASSIGNED' },
    includeInactive: false,
    includeHistorical: true,
  },
  
  INVENTORY_SPECIALIST: {
    level: 'WAREHOUSE',
    scope: 'MULTIPLE',
    customerFilter: { type: 'ALL' },
    warehouseFilter: { type: 'ASSIGNED' },
    includeInactive: false,
    includeHistorical: false,
  },
  
  CUSTOMER_USER: {
    level: 'CUSTOMER',
    scope: 'SINGLE',
    customerFilter: { type: 'SINGLE' },
    warehouseFilter: { type: 'ALL' },
    includeInactive: false,
    includeHistorical: true,
  },
  
  CUSTOMER_ADMIN: {
    level: 'CUSTOMER',
    scope: 'SINGLE',
    customerFilter: { type: 'SINGLE' },
    warehouseFilter: { type: 'ALL' },
    includeInactive: false,
    includeHistorical: true,
  },
}

// ============================================================================
// VIEW CONTEXT UTILITIES
// ============================================================================

export function createViewContext(
  userId: string,
  userRole: UserRole,
  tenantId: string,
  overrides?: Partial<ViewContext>
): ViewContext {
  const defaultContext = DEFAULT_VIEW_CONTEXTS[userRole]
  
  return {
    userId,
    userRole,
    tenantId,
    level: overrides?.level ?? defaultContext.level ?? 'TENANT',
    scope: overrides?.scope ?? defaultContext.scope ?? 'ALL',
    customerFilter: overrides?.customerFilter ?? defaultContext.customerFilter ?? { type: 'ALL' },
    warehouseFilter: overrides?.warehouseFilter ?? defaultContext.warehouseFilter ?? { type: 'ALL' },
    dateRange: overrides?.dateRange ?? defaultContext.dateRange,
    includeInactive: overrides?.includeInactive ?? defaultContext.includeInactive ?? false,
    includeHistorical: overrides?.includeHistorical ?? defaultContext.includeHistorical ?? false,
    groupBy: overrides?.groupBy ?? defaultContext.groupBy,
    sortBy: overrides?.sortBy ?? defaultContext.sortBy,
    lastUpdated: new Date(),
    ...overrides,
  }
}

export function matchesViewContext<T extends { customerId?: string; warehouseId?: string; tenantId?: string }>(
  item: T,
  context: ViewContext
): boolean {
  // Check tenant
  if (item.tenantId && item.tenantId !== context.tenantId) {
    return false
  }
  
  // Check customer filter
  if (item.customerId) {
    switch (context.customerFilter.type) {
      case 'ALL':
        // Check if excluded
        if (context.customerFilter.excludeCustomerIds?.includes(item.customerId)) {
          return false
        }
        break
      case 'SINGLE':
        if (context.customerFilter.customerIds?.[0] !== item.customerId) {
          return false
        }
        break
      case 'MULTIPLE':
        if (!context.customerFilter.customerIds?.includes(item.customerId)) {
          return false
        }
        break
      case 'ASSIGNED':
        // This should be handled at the data fetching level
        break
      case 'EXCLUDED':
        if (context.customerFilter.excludeCustomerIds?.includes(item.customerId)) {
          return false
        }
        break
    }
  }
  
  // Check warehouse filter
  if (item.warehouseId) {
    switch (context.warehouseFilter.type) {
      case 'ALL':
        // Check if excluded
        if (context.warehouseFilter.excludeWarehouseIds?.includes(item.warehouseId)) {
          return false
        }
        break
      case 'SINGLE':
        if (context.warehouseFilter.warehouseIds?.[0] !== item.warehouseId) {
          return false
        }
        break
      case 'MULTIPLE':
        if (!context.warehouseFilter.warehouseIds?.includes(item.warehouseId)) {
          return false
        }
        break
      case 'ASSIGNED':
        // This should be handled at the data fetching level
        break
      case 'EXCLUDED':
        if (context.warehouseFilter.excludeWarehouseIds?.includes(item.warehouseId)) {
          return false
        }
        break
    }
  }
  
  return true
}

export function getViewContextDescription(context: ViewContext): string {
  const parts: string[] = []
  
  // Customer filter
  switch (context.customerFilter.type) {
    case 'ALL':
      parts.push('All Customers')
      break
    case 'SINGLE':
      parts.push(`Customer: ${context.customerFilter.customerIds?.[0] || 'N/A'}`)
      break
    case 'MULTIPLE':
      parts.push(`${context.customerFilter.customerIds?.length || 0} Customers`)
      break
    case 'ASSIGNED':
      parts.push('Assigned Customers')
      break
  }
  
  // Warehouse filter
  switch (context.warehouseFilter.type) {
    case 'ALL':
      parts.push('All Warehouses')
      break
    case 'SINGLE':
      parts.push(`Warehouse: ${context.warehouseFilter.warehouseIds?.[0] || 'N/A'}`)
      break
    case 'MULTIPLE':
      parts.push(`${context.warehouseFilter.warehouseIds?.length || 0} Warehouses`)
      break
    case 'ASSIGNED':
      parts.push('Assigned Warehouses')
      break
  }
  
  // Date range
  if (context.dateRange) {
    parts.push(`Date: ${context.dateRange.type}`)
  }
  
  return parts.join(' • ')
}

// ============================================================================
// EXPORTS
// ============================================================================
// All types are already exported above, no need to re-export


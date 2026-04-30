/**
 * Comprehensive Warehouse Area/Zone Types
 * Migrated from chemcheck-ai with full feature preservation
 * BlueDXP Platform - 4IR & 5IR Aligned
 */

/**
 * Warehouse Area
 * Represents a physical area/zone within a warehouse
 */
export interface WarehouseArea {
  id: string
  areaCode: string // e.g., A-01, B-12
  areaName: string
  zone: string // e.g., Zone A, Zone B
  warehouseId?: string // Optional - allows standalone areas
  warehouseName?: string
  
  // Cross-Module Integration
  linkedModuleId?: string // e.g., 'tms', 'qhse', 'iso-ims', 'facility-management'
  linkedEntityId?: string // ID of entity in linked module
  linkedEntityType?: string // Type of entity (e.g., 'facility', 'site', 'zone')
  
  // Capacity Management
  capacity: number // Total capacity in units
  currentStock: number // Current stock in units
  utilizationPercentage?: number // Calculated: (currentStock / capacity) * 100
  
  // Restrictions
  allowedHazards: string[] // Hazard classes allowed in this area
  restrictions: string // Special requirements, safety protocols
  
  // Status
  active: boolean
  
  // Metadata
  tenantId?: string
  customerId?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

/**
 * Warehouse Area Create/Update Request
 */
export interface WarehouseAreaRequest {
  areaCode: string
  areaName: string
  zone: string
  warehouseId?: string // Optional - allows standalone areas
  capacity: number
  currentStock?: number
  allowedHazards: string[]
  restrictions?: string
  active?: boolean
  
  // Cross-Module Integration
  linkedModuleId?: string // e.g., 'tms', 'qhse', 'iso-ims', 'facility-management'
  linkedEntityId?: string // ID of entity in linked module
  linkedEntityType?: string // Type of entity
}

/**
 * Warehouse Area Filters
 */
export interface WarehouseAreaFilters {
  warehouseId?: string
  zone?: string
  active?: boolean
  searchQuery?: string
  tenantId?: string
  customerId?: string
  linkedModuleId?: string // Filter by linked module
  linkedEntityId?: string // Filter by linked entity
  standalone?: boolean // Filter standalone areas (no warehouse)
}

/**
 * Warehouse Area Import Data
 */
export interface WarehouseAreaImportData {
  areaCode: string
  areaName: string
  zone: string
  capacity: number
  currentStock?: number
  allowedHazards: string | string[] // Can be comma-separated string or array
  restrictions?: string
}

/**
 * Warehouse Area Export Format
 */
export interface WarehouseAreaExport {
  areaCode: string
  areaName: string
  zone: string
  capacity: number
  currentStock: number
  usagePercentage: number
  allowedHazards: string
  restrictions: string
}


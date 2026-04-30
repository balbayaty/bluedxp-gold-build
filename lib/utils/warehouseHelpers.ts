/**
 * Warehouse Helper Utilities
 * Common utility functions for warehouse operations
 * BlueDXP Platform
 */

import type { StorageLocation } from '@/types/warehouseLocation'
import type { WarehouseArea } from '@/types/warehouseArea'
import { generateLocationCode } from './globalLocations'

/**
 * Calculate utilization rate
 */
export function calculateUtilizationRate(current: number, capacity: number): number {
  if (capacity === 0) return 0
  return Math.min(100, Math.round((current / capacity) * 100))
}

/**
 * Get utilization status
 */
export function getUtilizationStatus(utilization: number): {
  status: 'LOW' | 'NORMAL' | 'HIGH' | 'FULL'
  color: string
  label: string
} {
  if (utilization >= 95) {
    return { status: 'FULL', color: 'red', label: 'Full' }
  } else if (utilization >= 80) {
    return { status: 'HIGH', color: 'yellow', label: 'High' }
  } else if (utilization >= 50) {
    return { status: 'NORMAL', color: 'green', label: 'Normal' }
  } else {
    return { status: 'LOW', color: 'blue', label: 'Low' }
  }
}

/**
 * Validate location code format
 */
export function validateLocationCode(code: string): boolean {
  // Format: COUNTRY-CITY-####
  const pattern = /^[A-Z]{3}-[A-Z]{3}-\d{4}$/
  return pattern.test(code)
}

/**
 * Generate unique location code
 */
export function generateUniqueLocationCode(
  countryCode: string,
  cityCode: string,
  existingCodes: string[]
): string {
  let sequence = 1
  let code = generateLocationCode(countryCode, cityCode, sequence)
  
  while (existingCodes.includes(code)) {
    sequence++
    code = generateLocationCode(countryCode, cityCode, sequence)
  }
  
  return code
}

/**
 * Check if location can store hazard class
 */
export function canStoreHazardClass(
  location: StorageLocation,
  hazardClass: string
): { canStore: boolean; reason?: string } {
  // Check if hazard class is allowed
  if (!location.storageRestrictions.hazardClassesAllowed.includes(hazardClass)) {
    return {
      canStore: false,
      reason: `Hazard class ${hazardClass} is not allowed in this location`
    }
  }

  // Check if there's a volume limit
  const limit = location.storageRestrictions.hazardClassLimits[hazardClass]
  if (limit !== undefined) {
    // Would need current volume to check, but for now just check if limit exists
    return { canStore: true }
  }

  return { canStore: true }
}

/**
 * Check if location is compliant
 */
export function isLocationCompliant(location: StorageLocation): boolean {
  return location.complianceStatus === 'Compliant'
}

/**
 * Get compliance color
 */
export function getComplianceColor(status: string): string {
  switch (status) {
    case 'Compliant':
      return 'green'
    case 'Compliant with exceptions':
      return 'yellow'
    case 'Non-Compliant':
      return 'red'
    case 'Pending Inspection':
      return 'gray'
    default:
      return 'gray'
  }
}

/**
 * Format capacity display
 */
export function formatCapacity(current: number, total: number, unit: string = 'units'): string {
  return `${current.toLocaleString()} / ${total.toLocaleString()} ${unit}`
}

/**
 * Calculate area statistics
 */
export function calculateAreaStatistics(areas: WarehouseArea[]): {
  totalAreas: number
  activeAreas: number
  totalCapacity: number
  totalStock: number
  averageUtilization: number
  zones: string[]
} {
  const activeAreas = areas.filter(a => a.active)
  const totalCapacity = areas.reduce((sum, a) => sum + a.capacity, 0)
  const totalStock = areas.reduce((sum, a) => sum + a.currentStock, 0)
  const averageUtilization = areas.length > 0
    ? areas.reduce((sum, a) => sum + (a.utilizationPercentage || 0), 0) / areas.length
    : 0
  const zones = Array.from(new Set(areas.map(a => a.zone)))

  return {
    totalAreas: areas.length,
    activeAreas: activeAreas.length,
    totalCapacity,
    totalStock,
    averageUtilization: Math.round(averageUtilization * 10) / 10,
    zones: zones.sort()
  }
}

/**
 * Filter locations by criteria
 */
export function filterLocations(
  locations: StorageLocation[],
  filters: {
    countryCode?: string
    cityCode?: string
    complianceStatus?: string
    fireSystem?: string
    searchQuery?: string
    active?: boolean
  }
): StorageLocation[] {
  return locations.filter(location => {
    if (filters.countryCode && location.location.countryCode !== filters.countryCode) {
      return false
    }
    if (filters.cityCode && location.location.cityCode !== filters.cityCode) {
      return false
    }
    if (filters.complianceStatus && location.complianceStatus !== filters.complianceStatus) {
      return false
    }
    if (filters.fireSystem && location.fireSuppressionType !== filters.fireSystem) {
      return false
    }
    if (filters.active !== undefined && location.active !== filters.active) {
      return false
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      const matchesName = location.name.toLowerCase().includes(query)
      const matchesCode = location.code.toLowerCase().includes(query)
      const matchesCity = location.location.city.toLowerCase().includes(query)
      if (!matchesName && !matchesCode && !matchesCity) {
        return false
      }
    }
    return true
  })
}

/**
 * Sort locations
 */
export function sortLocations(
  locations: StorageLocation[],
  sortBy: 'name' | 'code' | 'utilization' | 'compliance' | 'city',
  order: 'asc' | 'desc' = 'asc'
): StorageLocation[] {
  const sorted = [...locations].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'code':
        comparison = a.code.localeCompare(b.code)
        break
      case 'utilization':
        const utilA = a.utilizationRate || 0
        const utilB = b.utilizationRate || 0
        comparison = utilA - utilB
        break
      case 'compliance':
        comparison = a.complianceStatus.localeCompare(b.complianceStatus)
        break
      case 'city':
        comparison = a.location.city.localeCompare(b.location.city)
        break
    }

    return order === 'asc' ? comparison : -comparison
  })

  return sorted
}

/**
 * Get location summary
 */
export function getLocationSummary(location: StorageLocation): {
  id: string
  name: string
  code: string
  location: string
  compliance: string
  utilization: number
  fireSystem: string
  hazardClasses: number
} {
  return {
    id: location.id,
    name: location.name,
    code: location.code,
    location: `${location.location.city}, ${location.location.country}`,
    compliance: location.complianceStatus,
    utilization: location.utilizationRate || 0,
    fireSystem: location.fireSuppressionType,
    hazardClasses: location.storageRestrictions.hazardClassesAllowed.length
  }
}

/**
 * Validate hazard class compatibility
 */
export function validateHazardCompatibility(
  hazardClasses: string[],
  fireSystem: string
): { compatible: boolean; incompatible: string[] } {
  // This would typically check against fire system specs
  // For now, return a basic check
  const incompatible: string[] = []
  
  // Basic validation - would be enhanced with actual fire system specs
  if (fireSystem === 'None' && hazardClasses.length > 0) {
    incompatible.push(...hazardClasses)
  }

  return {
    compatible: incompatible.length === 0,
    incompatible
  }
}

/**
 * Calculate distance between locations (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Format date for display
 */
export function formatInspectionDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return date
  }
}

/**
 * Get next inspection date
 */
export function getNextInspectionDate(lastInspection: string, frequency: 'Monthly' | 'Quarterly' | 'Semi-Annually' | 'Annually'): string {
  const lastDate = new Date(lastInspection)
  const nextDate = new Date(lastDate)

  switch (frequency) {
    case 'Monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'Quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case 'Semi-Annually':
      nextDate.setMonth(nextDate.getMonth() + 6)
      break
    case 'Annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
  }

  return nextDate.toISOString().split('T')[0]
}

/**
 * Check if inspection is due
 */
export function isInspectionDue(lastInspection: string, frequency: 'Monthly' | 'Quarterly' | 'Semi-Annually' | 'Annually'): boolean {
  const nextDate = new Date(getNextInspectionDate(lastInspection, frequency))
  const today = new Date()
  return today >= nextDate
}












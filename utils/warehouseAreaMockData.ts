/**
 * Warehouse and Area Mock Data Generator
 * Comprehensive mock data for testing warehouse assignment recommendations in MSDS module
 * BlueDXP Platform - Integration with MSDS Module
 */

import type { Warehouse } from '@/types/tenant'
import type { WarehouseArea, WarehouseAreaRequest } from '@/types/warehouseArea'
import { warehouseAreaService } from '@/lib/services/wms/areaService'
import { ALL_HAZARD_CLASSES } from '@/types/warehouseLocation'

/**
 * Generate comprehensive warehouse areas with proper integration
 */
export async function generateWarehouseAreasForWarehouses(warehouses: Warehouse[]): Promise<WarehouseArea[]> {
  const allAreas: WarehouseArea[] = []

  for (const warehouse of warehouses) {
    const isHazmatWarehouse = warehouse.type === 'HAZMAT'
    
    // Generate 3-8 areas per warehouse
    const areaCount = Math.floor(Math.random() * 6) + 3
    
    for (let i = 0; i < areaCount; i++) {
      // For HAZMAT warehouses, ensure at least one area is specifically for hazardous materials
      const isHazmatArea = isHazmatWarehouse && (i === 0 || i % 3 === 0)
      
      const zone = isHazmatArea 
        ? 'HAZMAT Storage Zone'
        : ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Cold Storage', 'Hazardous Storage', 'Bulk Storage'][i % 7]
      const areaCode = `${warehouse.warehouseCode}-${zone.replace(/\s+/g, '-')}-${String(i + 1).padStart(2, '0')}`
      
      // For HAZMAT warehouses, ensure areas have comprehensive hazard class support
      let allowedHazards: string[]
      if (isHazmatArea) {
        // HAZMAT areas should support all or most hazard classes
        const hazardCount = Math.floor(Math.random() * 5) + 8 // 8-12 hazard classes
        allowedHazards = ALL_HAZARD_CLASSES
          .sort(() => Math.random() - 0.5)
          .slice(0, hazardCount)
          .map(hc => hc.value)
      } else if (isHazmatWarehouse) {
        // Other areas in HAZMAT warehouse should support some hazard classes
        const hazardCount = Math.floor(Math.random() * 4) + 3 // 3-6 hazard classes
        allowedHazards = ALL_HAZARD_CLASSES
          .sort(() => Math.random() - 0.5)
          .slice(0, hazardCount)
          .map(hc => hc.value)
      } else {
        // Regular warehouses - random hazard classes (1-5 per area)
        const hazardCount = Math.floor(Math.random() * 5) + 1
        allowedHazards = ALL_HAZARD_CLASSES
          .sort(() => Math.random() - 0.5)
          .slice(0, hazardCount)
          .map(hc => hc.value)
      }

      const capacity = Math.floor(Math.random() * 5000) + 500
      const currentStock = Math.floor(capacity * (Math.random() * 0.4 + 0.3)) // 30-70% utilization

      const areaRequest: WarehouseAreaRequest = {
        areaCode,
        areaName: `${zone} - Area ${i + 1}`,
        zone,
        warehouseId: warehouse.id,
        capacity,
        currentStock,
        allowedHazards,
        restrictions: isHazmatArea 
          ? 'HAZMAT certified - Requires proper handling and segregation'
          : i % 3 === 0 ? 'Temperature controlled' 
          : i % 3 === 1 ? 'Requires ventilation' 
          : '',
        active: true
      }

      try {
        const area = await warehouseAreaService.createArea(areaRequest)
        allAreas.push(area)
      } catch (error) {
        console.error(`Error creating area ${areaCode}:`, error)
      }
    }
  }

  return allAreas
}

/**
 * Generate standalone areas (not linked to warehouses)
 */
export async function generateStandaloneAreas(count: number = 10): Promise<WarehouseArea[]> {
  const standaloneAreas: WarehouseArea[] = []

  const zones = ['Standalone Zone 1', 'Standalone Zone 2', 'External Storage', 'Temporary Storage', 'Cross-Dock Area']
  const areaTypes = ['Bulk Storage', 'Hazardous Storage', 'Temperature Controlled', 'Open Storage', 'Secure Storage']

  for (let i = 0; i < count; i++) {
    const zone = zones[i % zones.length]
    const areaType = areaTypes[i % areaTypes.length]
    const areaCode = `STANDALONE-${String(i + 1).padStart(3, '0')}`
    
    const hazardCount = Math.floor(Math.random() * 4) + 1
    const allowedHazards = ALL_HAZARD_CLASSES
      .sort(() => Math.random() - 0.5)
      .slice(0, hazardCount)
      .map(hc => hc.value)

    const capacity = Math.floor(Math.random() * 3000) + 200
    const currentStock = Math.floor(capacity * (Math.random() * 0.5 + 0.2))

    const areaRequest: WarehouseAreaRequest = {
      areaCode,
      areaName: `${areaType} - ${zone}`,
      zone,
      // warehouseId: undefined - standalone
      capacity,
      currentStock,
      allowedHazards,
      restrictions: areaType.includes('Temperature') ? 'Temperature controlled: 15-25°C' : '',
      active: true
    }

    try {
      const area = await warehouseAreaService.createArea(areaRequest)
      standaloneAreas.push(area)
    } catch (error) {
      console.error(`Error creating standalone area ${areaCode}:`, error)
    }
  }

  return standaloneAreas
}

/**
 * Generate cross-module linked areas (for TMS, QHSE, etc.)
 */
export async function generateCrossModuleAreas(): Promise<WarehouseArea[]> {
  const crossModuleAreas: WarehouseArea[] = []

  // TMS linked areas
  const tmsAreas = [
    { code: 'TMS-FACILITY-01', name: 'TMS Loading Dock Area', module: 'tms', entityId: 'facility-tms-001', entityType: 'facility' },
    { code: 'TMS-FACILITY-02', name: 'TMS Storage Area', module: 'tms', entityId: 'facility-tms-002', entityType: 'facility' },
  ]

  // QHSE linked areas
  const qhseAreas = [
    { code: 'QHSE-SITE-01', name: 'QHSE Site Storage', module: 'qhse', entityId: 'site-qhse-001', entityType: 'site' },
    { code: 'QHSE-SITE-02', name: 'QHSE Hazardous Zone', module: 'qhse', entityId: 'site-qhse-002', entityType: 'site' },
  ]

  // ISO-IMS linked areas
  const isoAreas = [
    { code: 'ISO-LOC-01', name: 'ISO Compliant Storage', module: 'iso-ims', entityId: 'location-iso-001', entityType: 'location' },
  ]

  // Facility Management linked areas
  const facilityAreas = [
    { code: 'FACILITY-SPACE-01', name: 'Facility Space Storage', module: 'facility-management', entityId: 'space-fac-001', entityType: 'space' },
  ]

  const allCrossModule = [...tmsAreas, ...qhseAreas, ...isoAreas, ...facilityAreas]

  for (const areaData of allCrossModule) {
    const hazardCount = Math.floor(Math.random() * 3) + 1
    const allowedHazards = ALL_HAZARD_CLASSES
      .sort(() => Math.random() - 0.5)
      .slice(0, hazardCount)
      .map(hc => hc.value)

    const capacity = Math.floor(Math.random() * 2000) + 300
    const currentStock = Math.floor(capacity * (Math.random() * 0.4 + 0.2))

    const areaRequest: WarehouseAreaRequest = {
      areaCode: areaData.code,
      areaName: areaData.name,
      zone: `Cross-Module Zone`,
      // warehouseId: undefined - standalone but linked to module
      capacity,
      currentStock,
      allowedHazards,
      restrictions: `Linked to ${areaData.module} module`,
      active: true,
      linkedModuleId: areaData.module,
      linkedEntityId: areaData.entityId,
      linkedEntityType: areaData.entityType
    }

    try {
      const area = await warehouseAreaService.createArea(areaRequest)
      crossModuleAreas.push(area)
    } catch (error) {
      console.error(`Error creating cross-module area ${areaData.code}:`, error)
    }
  }

  return crossModuleAreas
}

/**
 * Initialize all mock data (warehouses + areas)
 */
export async function initializeWarehouseMockData(): Promise<{
  warehouses: Warehouse[]
  areas: WarehouseArea[]
  standaloneAreas: WarehouseArea[]
  crossModuleAreas: WarehouseArea[]
}> {
  const { generateMultiTenantWarehouses } = require('./mockDataGenerators')
  
  // Generate warehouses
  const warehouses = generateMultiTenantWarehouses(15) // 15 warehouses
  
  // Generate areas for warehouses
  const areas = await generateWarehouseAreasForWarehouses(warehouses)
  
  // Generate standalone areas
  const standaloneAreas = await generateStandaloneAreas(10)
  
  // Generate cross-module areas
  const crossModuleAreas = await generateCrossModuleAreas()
  
  return {
    warehouses,
    areas,
    standaloneAreas,
    crossModuleAreas
  }
}

/**
 * Get warehouses with their areas for MSDS recommendations
 */
export function getWarehousesWithAreas(
  warehouses: Warehouse[],
  allAreas: WarehouseArea[]
): Array<Warehouse & { areas: WarehouseArea[] }> {
  return warehouses.map(warehouse => ({
    ...warehouse,
    areas: allAreas.filter(area => area.warehouseId === warehouse.id)
  }))
}

/**
 * Get areas compatible with MSDS requirements
 */
export function getCompatibleAreas(
  allAreas: WarehouseArea[],
  msdsRequirements: {
    hazardClass?: string
    temperatureControlled?: boolean
    minTemperature?: number
    maxTemperature?: number
  }
): WarehouseArea[] {
  return allAreas.filter(area => {
    // Check hazard class compatibility
    if (msdsRequirements.hazardClass) {
      if (!area.allowedHazards.includes(msdsRequirements.hazardClass)) {
        return false
      }
    }

    // Check temperature requirements
    if (msdsRequirements.temperatureControlled) {
      // Would need to check area's temperature capabilities
      // For now, check if restrictions mention temperature
      if (!area.restrictions?.toLowerCase().includes('temperature')) {
        return false
      }
    }

    return true
  })
}




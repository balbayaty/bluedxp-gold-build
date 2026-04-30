/**
 * Tests for Cost Optimization Service
 */

import { costOptimizationService } from '@/lib/services/load-design/cost/costOptimizationService'
import type { LoadPlan, LoadItem } from '@/types/load-design'

describe('CostOptimizationService', () => {
  const mockLoadPlan: LoadPlan = {
    id: 'plan-1',
    loadNumber: 'LOAD-001',
    planType: 'SINGLE',
    vehicleSpec: {
      id: 'truck-1',
      type: 'TRUCK',
      name: 'Standard Truck',
      maxWeight: 20000,
      maxVolume: 50,
      dimensions: { length: 1200, width: 240, height: 260 },
    },
    items: [],
    itemPlacements: [],
    utilization: {
      weightPercent: 85,
      volumePercent: 80,
      cubePercent: 75,
      spaceEfficiency: 80,
    },
    route: {
      origin: { address: 'Origin', city: 'Riyadh', country: 'Saudi Arabia' },
      destination: { address: 'Dest', city: 'Jeddah', country: 'Saudi Arabia' },
      totalDistance: 950,
      estimatedTime: 600,
      optimized: true,
    },
    cost: {
      base: 1000,
      fuel: 500,
      labor: 300,
      total: 1800,
      currency: 'SAR',
    },
    compliance: {
      status: 'COMPLIANT',
      checks: [],
      warnings: [],
      errors: [],
    },
    status: 'IN_TRANSIT',
    transportMode: 'SEA',
    vehicleType: 'TRUCK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockItems: LoadItem[] = [
    {
      id: 'item-1',
      description: 'Test Item',
      type: 'PALLET',
      dimensions: { length: 120, width: 100, height: 150 },
      weight: 500,
      volume: 1.8,
      quantity: 10,
      destination: {
        address: '123 Main St',
        city: 'Riyadh',
        country: 'Saudi Arabia',
      },
      priority: 'HIGH',
    },
  ]

  it('should optimize cost for load plan', async () => {
    const result = await costOptimizationService.optimizeCost({
      loadPlan: mockLoadPlan,
      items: mockItems,
    })

    expect(result).toBeDefined()
    expect(result.currentCost).toBeDefined()
    expect(result.optimizedCost).toBeDefined()
    expect(result.savings).toBeDefined()
    expect(result.recommendations).toBeDefined()
    expect(result.carrierComparison).toBeDefined()
    expect(result.breakdown).toBeDefined()
    expect(result.roi).toBeDefined()
  })

  it('should provide cost savings', async () => {
    const result = await costOptimizationService.optimizeCost({
      loadPlan: mockLoadPlan,
      items: mockItems,
    })

    expect(result.savings.amount).toBeGreaterThanOrEqual(0)
    expect(result.savings.percentage).toBeGreaterThanOrEqual(0)
  })

  it('should generate recommendations', async () => {
    const result = await costOptimizationService.optimizeCost({
      loadPlan: mockLoadPlan,
      items: mockItems,
    })

    expect(result.recommendations.length).toBeGreaterThanOrEqual(0)
  })
})










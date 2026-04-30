/**
 * Tests for Load Analytics Service
 */

import { loadAnalyticsService } from '@/lib/services/load-design/analytics/loadAnalyticsService'
import type { LoadPlan } from '@/types/load-design'

describe('LoadAnalyticsService', () => {
  const mockLoadPlans: LoadPlan[] = [
    {
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
      transportMode: 'LAND',
      vehicleType: 'TRUCK',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it('should calculate analytics from load plans', async () => {
    const analytics = await loadAnalyticsService.calculateAnalytics(mockLoadPlans)

    expect(analytics).toBeDefined()
    expect(analytics.utilization).toBeDefined()
    expect(analytics.cost).toBeDefined()
    expect(analytics.compliance).toBeDefined()
    expect(analytics.carriers).toBeDefined()
    expect(analytics.routes).toBeDefined()
    expect(analytics.trends).toBeDefined()
    expect(analytics.predictions).toBeDefined()
  })

  it('should calculate utilization metrics correctly', async () => {
    const analytics = await loadAnalyticsService.calculateAnalytics(mockLoadPlans)

    expect(analytics.utilization.average).toBeGreaterThan(0)
    expect(analytics.utilization.best).toBeGreaterThanOrEqual(analytics.utilization.average)
    expect(analytics.utilization.worst).toBeLessThanOrEqual(analytics.utilization.average)
  })

  it('should calculate cost metrics correctly', async () => {
    const analytics = await loadAnalyticsService.calculateAnalytics(mockLoadPlans)

    expect(analytics.cost.total).toBeGreaterThan(0)
    expect(analytics.cost.average).toBeGreaterThan(0)
    expect(analytics.cost.breakdown).toBeDefined()
  })
})










/**
 * Tests for Export Service
 */

import { exportService } from '@/lib/services/load-design/export/exportService'
import type { LoadPlan, LoadAnalytics } from '@/types/load-design'

describe('ExportService', () => {
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
  }

  it('should export load plan to PDF', async () => {
    const blob = await exportService.exportLoadPlanToPDF(mockLoadPlan, {
      format: 'PDF',
      includeDetails: true,
    })

    expect(blob).toBeDefined()
    expect(blob instanceof Blob).toBe(true)
    expect(blob.type).toContain('pdf')
  })

  it('should export load plans to CSV', async () => {
    const blob = await exportService.exportLoadPlansToCSV([mockLoadPlan])

    expect(blob).toBeDefined()
    expect(blob instanceof Blob).toBe(true)
    expect(blob.type).toContain('csv')
  })

  it('should export analytics to Excel', async () => {
    const mockAnalytics: LoadAnalytics = {
      utilization: {
        average: 85,
        trend: 'increasing',
        best: 95,
        worst: 70,
        distribution: [],
      },
      cost: {
        total: 10000,
        average: 2000,
        trend: 'stable',
        breakdown: {
          freight: 5000,
          fuel: 2000,
          labor: 1500,
          handling: 1000,
          customs: 300,
          insurance: 100,
          other: 100,
        },
        savings: {
          potential: 2000,
          achieved: 1000,
          percentage: 10,
        },
      },
      compliance: {
        score: 95,
        trend: 'improving',
        violations: { total: 0, critical: 0, warnings: 0 },
        byCategory: {
          weight: 0,
          dimensions: 0,
          hazmat: 0,
          temperature: 0,
          customs: 0,
          route: 0,
        },
      },
      carriers: [],
      routes: {
        total: 10,
        optimized: 8,
        averageDistance: 500,
        averageTime: 360,
        savings: {
          distance: 50,
          time: 30,
          cost: 200,
        },
      },
      trends: {
        daily: [],
        weekly: [],
        monthly: [],
      },
      predictions: {
        nextWeekUtilization: 85,
        nextWeekCost: 2000,
        nextWeekCompliance: 95,
        recommendations: [],
      },
    }

    const blob = await exportService.exportAnalyticsToExcel(mockAnalytics)

    expect(blob).toBeDefined()
    expect(blob instanceof Blob).toBe(true)
    expect(blob.type).toContain('spreadsheet')
  })
})










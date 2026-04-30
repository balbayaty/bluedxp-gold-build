/**
 * Tests for Advanced Load Design Service
 * 
 * Comprehensive tests for load optimization, compliance, and multimodal planning
 */

import { advancedLoadDesignService } from '@/lib/services/load-design/advancedLoadDesignService'
import type { LoadItem, LoadOptimizationRequest } from '@/types/load-design'

describe('AdvancedLoadDesignService', () => {
  const mockItems: LoadItem[] = [
    {
      id: 'item-1',
      description: 'Test Pallet',
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

  describe('optimizeLoad', () => {
    it('should optimize load with basic request', async () => {
      const request: LoadOptimizationRequest = {
        items: mockItems,
        strategy: 'BALANCED',
        complianceRequired: true,
      }

      const result = await advancedLoadDesignService.optimizeLoad(request)

      expect(result).toBeDefined()
      expect(result.loadPlans).toBeDefined()
      expect(result.loadPlans.length).toBeGreaterThan(0)
      expect(result.loadPlans[0].utilization).toBeDefined()
      expect(result.loadPlans[0].cost).toBeDefined()
      expect(result.loadPlans[0].compliance).toBeDefined()
    })

    it('should optimize with MAXIMIZE_UTILIZATION strategy', async () => {
      const request: LoadOptimizationRequest = {
        items: mockItems,
        strategy: 'MAXIMIZE_UTILIZATION',
        complianceRequired: true,
      }

      const result = await advancedLoadDesignService.optimizeLoad(request)

      expect(result.loadPlans[0].utilization.overall).toBeGreaterThan(70)
    })

    it('should validate compliance when required', async () => {
      const request: LoadOptimizationRequest = {
        items: mockItems,
        strategy: 'BALANCED',
        complianceRequired: true,
      }

      const result = await advancedLoadDesignService.optimizeLoad(request)

      expect(result.loadPlans[0].compliance).toBeDefined()
      expect(result.loadPlans[0].compliance.status).toBeDefined()
    })
  })

  describe('planMultimodalJourney', () => {
    it('should plan multimodal journey', async () => {
      const items: LoadItem[] = [
        {
          id: 'item-1',
          description: 'Test Item',
          type: 'PALLET',
          dimensions: { length: 120, width: 100, height: 150 },
          weight: 500,
          volume: 1.8,
          quantity: 5,
          destination: {
            address: '456 Test St',
            city: 'Jeddah',
            country: 'Saudi Arabia',
          },
          priority: 'HIGH',
        },
      ]

      const result = await advancedLoadDesignService.planMultimodalJourney(
        items,
        {
          origin: {
            address: '123 Origin St',
            city: 'Riyadh',
            country: 'Saudi Arabia',
          },
          destination: {
            address: '456 Dest St',
            city: 'Jeddah',
            country: 'Saudi Arabia',
          },
        }
      )

      expect(result).toBeDefined()
      expect(result.legs).toBeDefined()
      expect(result.legs.length).toBeGreaterThan(0)
    })
  })
})










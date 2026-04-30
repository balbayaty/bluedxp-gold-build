/**
 * Warehouse Network AI Optimization Service - Integration Tests
 */

import { aiOptimizationService } from '@/lib/services/warehouse-network/aiOptimizationService'

describe('Warehouse Network AI Optimization Service', () => {
  describe('Service Initialization', () => {
    it('should initialize service successfully', () => {
      expect(aiOptimizationService).toBeDefined()
    })
  })

  describe('optimizeRoutes', () => {
    it('should optimize routes', async () => {
      const result = await aiOptimizationService.optimizeRoutes({
        routes: [
          {
            origin: { lat: 24.7136, lng: 46.6753 },
            destination: { lat: 21.4858, lng: 39.1925 },
          },
        ],
      })

      expect(result).toBeDefined()
      expect(result.optimizedRoutes).toBeDefined()
      expect(Array.isArray(result.optimizedRoutes)).toBe(true)
    })
  })

  describe('optimizeInventory', () => {
    it('should optimize inventory distribution', async () => {
      const result = await aiOptimizationService.optimizeInventory({
        warehouses: [
          { id: 'wh-1', location: { lat: 24.7136, lng: 46.6753 }, capacity: 1000 },
        ],
        demand: [{ location: { lat: 21.4858, lng: 39.1925 }, quantity: 500 }],
      })

      expect(result).toBeDefined()
      expect(result.recommendations).toBeDefined()
    })
  })
})






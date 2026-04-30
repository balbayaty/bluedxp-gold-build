/**
 * Marketplace Predictive Pricing Service - Integration Tests
 */

import { predictivePricingService } from '@/lib/services/marketplace/predictivePricingService'

describe('Marketplace Predictive Pricing Service', () => {
  describe('Service Initialization', () => {
    it('should initialize service successfully', () => {
      expect(predictivePricingService).toBeDefined()
    })
  })

  describe('estimatePrice', () => {
    it('should estimate price for storage service', async () => {
      const result = await predictivePricingService.estimatePrice({
        category: 'STORAGE',
        requirement: {
          capacity: { value: 1000, unit: 'CUBIC_METERS' },
          timeline: { duration: 30 },
        } as any,
      })

      expect(result).toBeDefined()
      expect(result.priceRange).toBeDefined()
      expect(result.priceRange.min).toBeGreaterThan(0)
      expect(result.priceRange.max).toBeGreaterThanOrEqual(result.priceRange.min)
      expect(result.priceRange.currency).toBeDefined()
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(100)
    })

    it('should return factors affecting price', async () => {
      const result = await predictivePricingService.estimatePrice({
        category: 'TRANSPORTATION',
        requirement: {
          route: {
            origin: { city: 'Riyadh' },
            destination: { city: 'Jeddah' },
          },
        } as any,
      })

      expect(result.factors).toBeDefined()
      expect(Array.isArray(result.factors)).toBe(true)
    })
  })

  describe('getPriceRecommendations', () => {
    it('should provide price recommendations', async () => {
      const result = await predictivePricingService.getPriceRecommendations({
        listingId: 'test-listing',
        currentPrice: 1000,
        category: 'STORAGE',
      })

      expect(result).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(Array.isArray(result.recommendations)).toBe(true)
    })
  })
})







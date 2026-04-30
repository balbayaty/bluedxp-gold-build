/**
 * Marketplace Demand Forecasting Service - Integration Tests
 */

import { demandForecastingService } from '@/lib/services/marketplace/demandForecastingService'

describe('Marketplace Demand Forecasting Service', () => {
  describe('Service Initialization', () => {
    it('should initialize service successfully', () => {
      expect(demandForecastingService).toBeDefined()
    })
  })

  describe('forecastDemand', () => {
    it('should forecast demand for category', async () => {
      const result = await demandForecastingService.forecastDemand({
        category: 'STORAGE',
        timeframe: '30_DAYS',
        location: { city: 'Riyadh', country: 'Saudi Arabia' },
      })

      expect(result).toBeDefined()
      expect(result.forecast).toBeDefined()
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(100)
    })

    it('should include trend analysis', async () => {
      const result = await demandForecastingService.forecastDemand({
        category: 'TRANSPORTATION',
        timeframe: '90_DAYS',
      })

      expect(result.trend).toBeDefined()
      expect(['INCREASING', 'DECREASING', 'STABLE']).toContain(result.trend)
    })
  })

  describe('getCapacityRecommendations', () => {
    it('should provide capacity recommendations', async () => {
      const result = await demandForecastingService.getCapacityRecommendations({
        category: 'STORAGE',
        location: { city: 'Riyadh' },
      })

      expect(result).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(Array.isArray(result.recommendations)).toBe(true)
    })
  })
})







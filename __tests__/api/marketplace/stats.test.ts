/**
 * Marketplace Stats API Route - Integration Tests
 */

describe('Marketplace Stats API', () => {
  const baseUrl = 'http://localhost:3002/api/marketplace/stats'

  describe('GET /api/marketplace/stats', () => {
    it('should return marketplace statistics', async () => {
      const response = await fetch(baseUrl)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.stats).toBeDefined()
      expect(data.stats.totalListings).toBeDefined()
      expect(data.stats.totalProviders).toBeDefined()
      expect(data.stats.totalBookings).toBeDefined()
    })
  })
})














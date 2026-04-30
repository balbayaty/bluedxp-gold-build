/**
 * Marketplace Analytics API Route - Integration Tests
 */

describe('Marketplace Analytics API', () => {
  const baseUrl = 'http://localhost:3002/api/marketplace/analytics'

  describe('GET /api/marketplace/analytics', () => {
    it('should return analytics data', async () => {
      const response = await fetch(baseUrl)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.analytics).toBeDefined()
    })

    it('should filter by date range', async () => {
      const response = await fetch(`${baseUrl}?startDate=2024-01-01&endDate=2024-01-31`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should filter by category', async () => {
      const response = await fetch(`${baseUrl}?category=STORAGE`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })
})














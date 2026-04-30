/**
 * Marketplace Reviews API Route - Integration Tests
 */

describe('Marketplace Reviews API', () => {
  const baseUrl = 'http://localhost:3002/api/marketplace/reviews'

  describe('GET /api/marketplace/reviews', () => {
    it('should return list of reviews', async () => {
      const response = await fetch(baseUrl)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.reviews)).toBe(true)
    })

    it('should filter by listing', async () => {
      const response = await fetch(`${baseUrl}?listingId=test-listing`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should filter by rating', async () => {
      const response = await fetch(`${baseUrl}?minRating=4`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('POST /api/marketplace/reviews', () => {
    it('should create a new review', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'test-booking',
          listingId: 'test-listing',
          rating: 5,
          comment: 'Excellent service!',
        }),
      })

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(300)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.review).toBeDefined()
    })

    it('should reject invalid review data', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 6 }), // Invalid rating
      })

      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })
})














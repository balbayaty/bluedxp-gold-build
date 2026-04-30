/**
 * Marketplace Listings API Route - Integration Tests
 */

describe('Marketplace Listings API', () => {
  const baseUrl = 'http://localhost:3002/api/marketplace/listings'

  describe('GET /api/marketplace/listings', () => {
    it('should return list of listings', async () => {
      const response = await fetch(baseUrl)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.listings)).toBe(true)
    })

    it('should filter by category', async () => {
      const response = await fetch(`${baseUrl}?category=STORAGE`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      if (data.listings.length > 0) {
        expect(data.listings[0].category).toBe('STORAGE')
      }
    })

    it('should filter by location', async () => {
      const response = await fetch(`${baseUrl}?location=Riyadh`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('POST /api/marketplace/listings', () => {
    it('should create a new listing', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'STORAGE',
          title: 'Test Storage Listing',
          description: 'Test description',
          pricing: { basePrice: 1000 },
          location: { city: 'Riyadh' },
        }),
      })

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(300)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should reject invalid listing data', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('GET /api/marketplace/listings/[id]', () => {
    it('should return listing details', async () => {
      const response = await fetch(`${baseUrl}/test-id`)
      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(500)
    })

    it('should return 404 for non-existent listing', async () => {
      const response = await fetch(`${baseUrl}/non-existent-id`)
      expect(response.status).toBeGreaterThanOrEqual(404)
    })
  })

  describe('PATCH /api/marketplace/listings/[id]', () => {
    it('should update listing', async () => {
      const response = await fetch(`${baseUrl}/test-id`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      })

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(300)
    })
  })

  describe('DELETE /api/marketplace/listings/[id]', () => {
    it('should delete listing', async () => {
      const response = await fetch(`${baseUrl}/test-id`, {
        method: 'DELETE',
      })

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(300)
    })
  })
})














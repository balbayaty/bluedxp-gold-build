/**
 * Marketplace Bookings API Route - Integration Tests
 */

describe('Marketplace Bookings API', () => {
  const baseUrl = 'http://localhost:3002/api/marketplace/bookings'

  describe('GET /api/marketplace/bookings', () => {
    it('should return list of bookings', async () => {
      const response = await fetch(baseUrl)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.bookings)).toBe(true)
    })

    it('should filter by status', async () => {
      const response = await fetch(`${baseUrl}?status=PENDING`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should filter by provider', async () => {
      const response = await fetch(`${baseUrl}?providerId=test-provider`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('POST /api/marketplace/bookings', () => {
    it('should create a new booking', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: 'test-listing',
          schedule: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          },
          requirements: {
            capacity: { value: 100, unit: 'CUBIC_METERS' },
          },
        }),
      })

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(300)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.booking).toBeDefined()
    })

    it('should reject invalid booking data', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('GET /api/marketplace/bookings/[id]', () => {
    it('should return booking details', async () => {
      const response = await fetch(`${baseUrl}/test-id`)
      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(500)
    })
  })

  describe('PATCH /api/marketplace/bookings/[id]', () => {
    it('should update booking status', async () => {
      const response = await fetch(`${baseUrl}/test-id`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(300)
    })
  })
})














/**
 * Marketplace Payments API Route - Integration Tests
 */

describe('Marketplace Payments API', () => {
  const baseUrl = 'http://localhost:3002/api/marketplace/payments'

  describe('GET /api/marketplace/payments', () => {
    it('should return list of payments', async () => {
      const response = await fetch(baseUrl)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.payments)).toBe(true)
    })
  })

  describe('POST /api/marketplace/payments', () => {
    it('should create a payment', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'test-booking',
          amount: 1000,
          currency: 'SAR',
          method: 'CARD',
        }),
      })

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(300)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('POST /api/marketplace/payments/intent', () => {
    it('should create payment intent', async () => {
      const response = await fetch(`${baseUrl}/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'test-booking',
          amount: 1000,
          currency: 'SAR',
        }),
      })

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(300)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.clientSecret).toBeDefined()
    })
  })

  describe('POST /api/marketplace/payments/[id]/refund', () => {
    it('should process refund', async () => {
      const response = await fetch(`${baseUrl}/test-id/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 500,
          reason: 'Cancelled booking',
        }),
      })

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(300)
    })
  })
})














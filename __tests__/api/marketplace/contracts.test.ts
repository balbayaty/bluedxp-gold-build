/**
 * Marketplace Contracts API Route - Integration Tests
 */

describe('Marketplace Contracts API', () => {
  const baseUrl = 'http://localhost:3002/api/marketplace/contracts'

  describe('GET /api/marketplace/contracts', () => {
    it('should return list of contracts', async () => {
      const response = await fetch(baseUrl)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.contracts)).toBe(true)
    })

    it('should filter by booking', async () => {
      const response = await fetch(`${baseUrl}?bookingId=test-booking`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('POST /api/marketplace/contracts', () => {
    it('should create a new contract', async () => {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'test-booking',
          terms: {
            duration: 30,
            paymentTerms: 'NET_30',
          },
        }),
      })

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(300)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.contract).toBeDefined()
    })
  })

  describe('GET /api/marketplace/contracts/[id]', () => {
    it('should return contract details', async () => {
      const response = await fetch(`${baseUrl}/test-id`)
      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(500)
    })
  })

  describe('POST /api/marketplace/contracts/[id]/signature', () => {
    it('should sign contract', async () => {
      const response = await fetch(`${baseUrl}/test-id/signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerId: 'test-user',
          signature: 'base64-signature-data',
        }),
      })

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(300)
    })
  })
})














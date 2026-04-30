/**
 * Marketplace Predictive Pricing API Route - Integration Tests
 */

describe('POST /api/marketplace/predictive-pricing', () => {
  it('should return price estimate', async () => {
    const response = await fetch('http://localhost:3002/api/marketplace/predictive-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'STORAGE',
        requirement: {
          capacity: { value: 1000, unit: 'CUBIC_METERS' },
        },
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.result).toBeDefined()
    expect(data.result.priceRange).toBeDefined()
  })
})






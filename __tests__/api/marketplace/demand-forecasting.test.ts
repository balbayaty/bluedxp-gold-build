/**
 * Marketplace Demand Forecasting API Route - Integration Tests
 */

describe('POST /api/marketplace/demand-forecasting', () => {
  it('should return demand forecast', async () => {
    const response = await fetch('http://localhost:3002/api/marketplace/demand-forecasting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'STORAGE',
        timeframe: '30_DAYS',
        location: { city: 'Riyadh' },
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.result).toBeDefined()
    expect(data.result.forecast).toBeDefined()
  })
})






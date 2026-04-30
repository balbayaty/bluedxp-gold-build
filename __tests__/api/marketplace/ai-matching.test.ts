/**
 * Marketplace AI Matching API Route - Integration Tests
 */

describe('POST /api/marketplace/ai-matching', () => {
  it('should return matching results', async () => {
    const response = await fetch('http://localhost:3002/api/marketplace/ai-matching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirement: {
          category: 'STORAGE',
          location: { city: 'Riyadh' },
          timeline: { startDate: '2024-01-01' },
        },
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.result).toBeDefined()
    expect(data.result.matches).toBeDefined()
  })

  it('should handle invalid request', async () => {
    const response = await fetch('http://localhost:3002/api/marketplace/ai-matching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(response.status).toBeGreaterThanOrEqual(400)
  })
})







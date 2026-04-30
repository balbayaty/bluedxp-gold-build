/**
 * Marketplace Intelligent Search API Route - Integration Tests
 */

describe('POST /api/marketplace/intelligent-search', () => {
  it('should perform semantic search', async () => {
    const response = await fetch('http://localhost:3002/api/marketplace/intelligent-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'warehouse storage in Riyadh',
        category: 'STORAGE',
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.result).toBeDefined()
    expect(data.result.results).toBeDefined()
  })
})






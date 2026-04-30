/**
 * Warehouse Network Optimization API Route - Integration Tests
 */

describe('POST /api/warehouse-network/optimization', () => {
  it('should optimize routes', async () => {
    const response = await fetch('http://localhost:3002/api/warehouse-network/optimization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ROUTE',
        routes: [
          {
            origin: { lat: 24.7136, lng: 46.6753 },
            destination: { lat: 21.4858, lng: 39.1925 },
          },
        ],
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.result).toBeDefined()
  })
})






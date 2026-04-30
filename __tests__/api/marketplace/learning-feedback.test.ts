/**
 * Marketplace Learning Feedback API Route - Integration Tests
 */

describe('POST /api/marketplace/learning-feedback', () => {
  it('should accept feedback and return insights', async () => {
    const response = await fetch('http://localhost:3002/api/marketplace/learning-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirementId: 'req-1',
        matchedProviderId: 'provider-1',
        customerSatisfaction: 5,
        accuracy: 4,
        outcome: 'SUCCESS',
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.result).toBeDefined()
  })
})






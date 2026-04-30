/**
 * Workspace API Integration Tests
 */

import { NextRequest } from 'next/server'

// Mock auth
jest.mock('@/lib/services/workspace/utils/auth', () => ({
  getAuthUser: jest.fn().mockResolvedValue({
    id: 'test-user',
    tenantId: 'test-tenant',
    role: 'SYSTEM_ADMIN',
  }),
}))

describe('Workspace API', () => {
  describe('GET /api/v1/workspace/config', () => {
    it('should return workspace configuration', async () => {
      const { GET } = await import('@/app/api/v1/workspace/config/route')
      const request = new NextRequest('http://localhost/api/v1/workspace/config')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('userId')
      expect(data).toHaveProperty('availableWidgets')
    })
  })

  describe('GET /api/v1/workspace/widgets', () => {
    it('should return available widgets', async () => {
      const { GET } = await import('@/app/api/v1/workspace/widgets/route')
      const request = new NextRequest('http://localhost/api/v1/workspace/widgets')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('GET /api/v1/workspace/categories', () => {
    it('should return categories', async () => {
      const { GET } = await import('@/app/api/v1/workspace/categories/route')
      const request = new NextRequest('http://localhost/api/v1/workspace/categories')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })
  })
})














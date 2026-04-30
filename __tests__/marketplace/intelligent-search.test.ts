/**
 * Marketplace Intelligent Search Service - Integration Tests
 */

import { intelligentSearchService } from '@/lib/services/marketplace/intelligentSearchService'

describe('Marketplace Intelligent Search Service', () => {
  describe('Service Initialization', () => {
    it('should initialize service successfully', () => {
      expect(intelligentSearchService).toBeDefined()
    })
  })

  describe('search', () => {
    it('should perform semantic search', async () => {
      const result = await intelligentSearchService.search(
        'warehouse storage in Riyadh',
        { category: 'STORAGE' }
      )

      expect(result).toBeDefined()
      expect(result.listings).toBeDefined()
      expect(Array.isArray(result.listings)).toBe(true)
      expect(result.intent).toBeDefined()
    })

    it('should detect search intent', async () => {
      const result = await intelligentSearchService.search(
        'I need cold storage for food products'
      )

      expect(result.intent).toBeDefined()
      expect(result.intent.primaryIntent).toBeDefined()
    })

    it('should extract entities from query', async () => {
      const result = await intelligentSearchService.search(
        'transportation from Riyadh to Jeddah'
      )

      expect(result.intent.entities).toBeDefined()
      expect(result.intent.entities.location).toBeDefined()
    })
  })
})







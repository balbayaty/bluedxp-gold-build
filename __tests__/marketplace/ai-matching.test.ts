/**
 * Marketplace AI Matching Service - Integration Tests
 * Tests AI matching functionality end-to-end
 */

import { aiMatchingService } from '@/lib/services/marketplace/aiMatchingService'
import type { ServiceRequirement } from '@/types/marketplace-requirements'

describe('Marketplace AI Matching Service', () => {
  describe('Service Initialization', () => {
    it('should initialize service successfully', () => {
      expect(aiMatchingService).toBeDefined()
    })
  })

  describe('findMatches', () => {
    it('should find matches for storage requirement', async () => {
      const requirement: ServiceRequirement = {
        id: 'test-1',
        category: 'STORAGE',
        serviceType: 'GENERAL_STORAGE',
        location: {
          address: 'Riyadh, Saudi Arabia',
          city: 'Riyadh',
          country: 'Saudi Arabia',
          coordinates: { lat: 24.7136, lng: 46.6753 },
        },
        timeline: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          flexible: false,
        },
        capacity: {
          value: 1000,
          unit: 'CUBIC_METERS',
        },
        urgency: 'MEDIUM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const result = await aiMatchingService.findMatches(requirement)

      expect(result).toBeDefined()
      expect(result.matches).toBeDefined()
      expect(Array.isArray(result.matches)).toBe(true)
      expect(result.completeness).toBeDefined()
      expect(result.completeness.completeness).toBeGreaterThanOrEqual(0)
      expect(result.completeness.completeness).toBeLessThanOrEqual(100)
    })

    it('should handle incomplete requirements gracefully', async () => {
      const requirement: Partial<ServiceRequirement> = {
        category: 'STORAGE',
      }

      const result = await aiMatchingService.findMatches(requirement as ServiceRequirement)

      expect(result).toBeDefined()
      expect(result.completeness.completeness).toBeLessThan(100)
      expect(result.completeness.missingFields.length).toBeGreaterThan(0)
    })

    it('should return matches sorted by score', async () => {
      const requirement: ServiceRequirement = {
        id: 'test-2',
        category: 'TRANSPORTATION',
        serviceType: 'FTL',
        location: {
          address: 'Jeddah, Saudi Arabia',
          city: 'Jeddah',
          country: 'Saudi Arabia',
        },
        timeline: {
          startDate: '2024-01-01',
          flexible: false,
        },
        urgency: 'HIGH',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const result = await aiMatchingService.findMatches(requirement)

      if (result.matches.length > 1) {
        for (let i = 0; i < result.matches.length - 1; i++) {
          expect(result.matches[i].matchScore).toBeGreaterThanOrEqual(
            result.matches[i + 1].matchScore
          )
        }
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid requirement gracefully', async () => {
      const invalidRequirement = null as any

      await expect(
        aiMatchingService.findMatches(invalidRequirement)
      ).rejects.toThrow()
    })

    it('should handle missing category', async () => {
      const requirement = {
        location: { city: 'Riyadh' },
      } as any

      const result = await aiMatchingService.findMatches(requirement)
      expect(result.completeness.completeness).toBeLessThan(50)
    })
  })
})







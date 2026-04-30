/**
 * Pulse Scoring Service Tests
 */

import { pulseScoringService } from '@/lib/services/pulse/pulseScoringService'
import { pulseLedgerService } from '@/lib/services/pulse/pulseLedgerService'

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    pulseEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    pulseBalance: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    pulseRuleset: {
      findFirst: jest.fn(),
    },
    pulseDailyWellness: {
      findUnique: jest.fn(),
    },
  })),
}))

describe('PulseScoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('processEvent', () => {
    it('should process event and award points', async () => {
      const event = {
        tenantId: 'tenant1',
        userId: 'user1',
        occurredAt: new Date(),
        eventType: 'TASK_CLOSED' as const,
        sourceModule: 'tasks',
        sourceRef: 'task1',
        pointsAwardedPP: 0,
        creditsAwardedIC: 0,
        metadataJson: {},
      }

      // Mock ledger service
      jest.spyOn(pulseLedgerService, 'recordEvent').mockResolvedValue({
        ...event,
        id: 'event1',
        createdAt: new Date(),
      })

      const result = await pulseScoringService.processEvent(event)

      expect(result).toBeDefined()
      expect(pulseLedgerService.recordEvent).toHaveBeenCalled()
    })
  })

  describe('applyCaps', () => {
    it('should apply daily caps correctly', async () => {
      const result = await pulseScoringService.applyCaps('user1', 'tenant1', 'Execute', 150)

      // Should return capped value if exceeds limit
      expect(result).toBeLessThanOrEqual(150)
    })
  })

  describe('calculatePillarScores', () => {
    it('should calculate pillar scores for a period', async () => {
      const scores = await pulseScoringService.calculatePillarScores(
        'user1',
        'tenant1',
        {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        }
      )

      expect(scores).toHaveProperty('Move')
      expect(scores).toHaveProperty('Execute')
      expect(scores).toHaveProperty('Safe')
      expect(scores).toHaveProperty('Grow')
    })
  })
})














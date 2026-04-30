/**
 * Pulse Rewards Service Tests
 */

import { pulseRewardsService } from '@/lib/services/pulse/pulseRewardsService'
import { pulseLedgerService } from '@/lib/services/pulse/pulseLedgerService'

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    pulseRewardsCatalog: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    pulseRedemption: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  })),
}))

describe('PulseRewardsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('redeemReward', () => {
    it('should create redemption when balance is sufficient', async () => {
      // Mock balance check
      jest.spyOn(pulseLedgerService, 'getBalance').mockResolvedValue({
        tenantId: 'tenant1',
        userId: 'user1',
        balancePP: 200,
        balanceIC: 50,
        lifetimePP: 200,
        lifetimeIC: 50,
        updatedAt: new Date(),
      })

      const result = await pulseRewardsService.redeemReward('user1', 'tenant1', 'reward1')

      expect(result).toBeDefined()
      expect(result.status).toBe('REQUESTED')
    })

    it('should throw error when balance is insufficient', async () => {
      jest.spyOn(pulseLedgerService, 'getBalance').mockResolvedValue({
        tenantId: 'tenant1',
        userId: 'user1',
        balancePP: 50,
        balanceIC: 10,
        lifetimePP: 50,
        lifetimeIC: 10,
        updatedAt: new Date(),
      })

      await expect(
        pulseRewardsService.redeemReward('user1', 'tenant1', 'reward1')
      ).rejects.toThrow('Insufficient Pulse Points')
    })
  })

  describe('approveRedemption', () => {
    it('should approve redemption and deduct points', async () => {
      jest.spyOn(pulseLedgerService, 'updateBalance').mockResolvedValue({
        tenantId: 'tenant1',
        userId: 'user1',
        balancePP: 80,
        balanceIC: 50,
        lifetimePP: 200,
        lifetimeIC: 50,
        updatedAt: new Date(),
      })

      const result = await pulseRewardsService.approveRedemption(
        'redemption1',
        'approver1',
        'tenant1',
        true
      )

      expect(result.status).toBe('APPROVED')
      expect(pulseLedgerService.updateBalance).toHaveBeenCalled()
    })
  })
})














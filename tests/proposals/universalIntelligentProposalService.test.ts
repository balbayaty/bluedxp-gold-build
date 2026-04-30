/**
 * Universal Intelligent Proposal Service Tests
 * 
 * Comprehensive tests for proposal generation, insights, and win strategies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { universalIntelligentProposalService } from '@/lib/services/proposals/universalIntelligentProposalService'
import type { UniversalProposalConfig } from '@/lib/services/proposals/universalIntelligentProposalService'

// Mock dependencies
vi.mock('@/lib/services/knowledge-base', () => ({
  knowledgeBaseService: {
    semanticSearch: vi.fn().mockResolvedValue({
      results: [
        {
          entry: {
            id: 'kb-1',
            title: 'Test Knowledge',
            content: 'Test content',
            category: 'proposal',
            metadata: { priority: 'HIGH' },
          },
          score: 0.85,
        },
      ],
    }),
  },
}))

vi.mock('@/lib/services/llm-provider', () => ({
  callAI: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      insights: [
        {
          type: 'CONTENT',
          priority: 'HIGH',
          title: 'Test Insight',
          description: 'Test description',
          recommendation: 'Test recommendation',
          impact: { winRateIncrease: 15 },
          confidence: 80,
        },
      ],
    }),
  }),
}))

vi.mock('@/lib/services/event-store', () => ({
  eventBus: {
    publish: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/lib/services/notifications/notificationService', () => ({
  notificationService: {
    send: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/lib/services/agents/agentMemory', () => ({
  getAgentMemory: vi.fn().mockReturnValue({
    remember: vi.fn().mockResolvedValue(undefined),
    recall: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('@/lib/modules/registry', () => ({
  moduleRegistry: {
    isModuleEnabled: vi.fn().mockReturnValue(true),
  },
}))

describe('Universal Intelligent Proposal Service', () => {
  const baseConfig: UniversalProposalConfig = {
    moduleId: 'wms',
    proposalType: 'WMS_WAREHOUSING',
    customerId: 'cust-123',
    customerName: 'Test Customer',
    tenantId: 'tenant-1',
    userId: 'user-123',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateUniversalProposal', () => {
    it('should generate a proposal with insights and win strategy', async () => {
      const result = await universalIntelligentProposalService.generateUniversalProposal(baseConfig)

      expect(result).toBeDefined()
      expect(result.proposal).toBeDefined()
      expect(result.proposal.id).toBeDefined()
      expect(result.proposal.proposalNumber).toBeDefined()
      expect(result.proposal.title).toBeDefined()
      expect(result.proposal.sections).toBeDefined()
      expect(result.proposal.sections.length).toBeGreaterThan(0)
    })

    it('should generate insights', async () => {
      const result = await universalIntelligentProposalService.generateUniversalProposal(baseConfig)

      expect(result.insights).toBeDefined()
      expect(Array.isArray(result.insights)).toBe(true)
      expect(result.insights.length).toBeGreaterThan(0)
    })

    it('should generate win strategy', async () => {
      const result = await universalIntelligentProposalService.generateUniversalProposal(baseConfig)

      expect(result.winStrategy).toBeDefined()
      expect(result.winStrategy.proposalId).toBe(result.proposal.id)
      expect(result.winStrategy.winProbability).toBeGreaterThanOrEqual(0)
      expect(result.winStrategy.winProbability).toBeLessThanOrEqual(100)
      expect(result.winStrategy.keyStrengths).toBeDefined()
      expect(Array.isArray(result.winStrategy.keyStrengths)).toBe(true)
    })

    it('should work with different module types', async () => {
      const tmsConfig: UniversalProposalConfig = {
        ...baseConfig,
        moduleId: 'tms',
        proposalType: 'TMS_TRANSPORTATION',
      }

      const result = await universalIntelligentProposalService.generateUniversalProposal(tmsConfig)

      expect(result.proposal).toBeDefined()
      expect(result.insights).toBeDefined()
      expect(result.winStrategy).toBeDefined()
    })

    it('should work with marketplace module', async () => {
      const marketplaceConfig: UniversalProposalConfig = {
        ...baseConfig,
        moduleId: 'marketplace',
        proposalType: 'MARKETPLACE_SERVICE',
        relatedEntityId: 'listing-123',
        relatedEntityType: 'SERVICE_LISTING',
      }

      const result = await universalIntelligentProposalService.generateUniversalProposal(marketplaceConfig)

      expect(result.proposal).toBeDefined()
      expect(result.insights).toBeDefined()
      expect(result.winStrategy).toBeDefined()
    })
  })

  describe('getInsights', () => {
    it('should retrieve insights for a proposal', async () => {
      const result = await universalIntelligentProposalService.generateUniversalProposal(baseConfig)
      const proposalId = result.proposal.id

      const insights = await universalIntelligentProposalService.getInsights(proposalId, baseConfig.tenantId)

      expect(insights).toBeDefined()
      expect(Array.isArray(insights)).toBe(true)
    })

    it('should return empty array if no insights found', async () => {
      const insights = await universalIntelligentProposalService.getInsights('non-existent-id', baseConfig.tenantId)

      expect(insights).toBeDefined()
      expect(Array.isArray(insights)).toBe(true)
      expect(insights.length).toBe(0)
    })
  })

  describe('getWinStrategy', () => {
    it('should retrieve win strategy for a proposal', async () => {
      const result = await universalIntelligentProposalService.generateUniversalProposal(baseConfig)
      const proposalId = result.proposal.id

      const winStrategy = await universalIntelligentProposalService.getWinStrategy(proposalId, baseConfig.tenantId)

      expect(winStrategy).toBeDefined()
      expect(winStrategy?.proposalId).toBe(proposalId)
      expect(winStrategy?.winProbability).toBeGreaterThanOrEqual(0)
      expect(winStrategy?.winProbability).toBeLessThanOrEqual(100)
    })

    it('should return undefined if no win strategy found', async () => {
      const winStrategy = await universalIntelligentProposalService.getWinStrategy('non-existent-id', baseConfig.tenantId)

      expect(winStrategy).toBeUndefined()
    })
  })

  describe('getProposal', () => {
    it('should retrieve a proposal by ID', async () => {
      const result = await universalIntelligentProposalService.generateUniversalProposal(baseConfig)
      const proposalId = result.proposal.id

      const proposal = await universalIntelligentProposalService.getProposal(proposalId, baseConfig.tenantId)

      expect(proposal).toBeDefined()
      expect(proposal?.id).toBe(proposalId)
    })

    it('should return undefined if proposal not found', async () => {
      const proposal = await universalIntelligentProposalService.getProposal('non-existent-id', baseConfig.tenantId)

      expect(proposal).toBeUndefined()
    })
  })

  describe('listProposals', () => {
    it('should list proposals for a tenant', async () => {
      // Generate a proposal first
      await universalIntelligentProposalService.generateUniversalProposal(baseConfig)

      const proposals = await universalIntelligentProposalService.listProposals(baseConfig.tenantId)

      expect(proposals).toBeDefined()
      expect(Array.isArray(proposals)).toBe(true)
    })

    it('should filter by module ID', async () => {
      await universalIntelligentProposalService.generateUniversalProposal(baseConfig)

      const proposals = await universalIntelligentProposalService.listProposals(baseConfig.tenantId, {
        moduleId: 'wms',
      })

      expect(proposals).toBeDefined()
      expect(Array.isArray(proposals)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const invalidConfig = {
        ...baseConfig,
        moduleId: '', // Invalid
      }

      await expect(
        universalIntelligentProposalService.generateUniversalProposal(invalidConfig)
      ).rejects.toThrow()
    })
  })
})



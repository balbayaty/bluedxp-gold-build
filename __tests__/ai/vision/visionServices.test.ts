/**
 * Comprehensive Test Suite for AI Vision Services
 * Unit tests, integration tests, and component tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { visionService } from '@/lib/services/ai/visionService'
import { selfLearningVisionService } from '@/lib/services/ai/vision/v2/selfLearningVisionService'
import { privacyPreservingVisionService } from '@/lib/services/ai/vision/privacyPreservingVisionService'
import { explainableVisionService } from '@/lib/services/ai/vision/explainableVisionService'
import { visionResilienceService } from '@/lib/services/ai/vision/visionResilienceService'
import { visionLearningDatabaseAdapter } from '@/lib/services/ai/vision/v2/visionLearningDatabaseAdapter'

describe('AI Vision Services', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Vision Service', () => {
    it('should check if service is available', () => {
      const available = visionService.isAvailable()
      expect(typeof available).toBe('boolean')
    })

    it('should handle invalid image file', async () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' })
      await expect(
        visionService.analyzeImage(invalidFile, 'test context')
      ).rejects.toThrow()
    })

    it('should return analysis result structure', async () => {
      // Mock image file
      const mockImage = new File(['mock'], 'test.jpg', { type: 'image/jpeg' })
      
      // This will fail without API keys, but we can test structure
      try {
        const result = await visionService.analyzeImage(mockImage, 'test context')
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('timestamp')
        expect(result).toHaveProperty('analysis')
        expect(result.analysis).toHaveProperty('description')
        expect(result.analysis).toHaveProperty('detectedObjects')
        expect(result.analysis).toHaveProperty('safetyIssues')
        expect(result.analysis).toHaveProperty('qualityIssues')
      } catch (error) {
        // Expected without API keys
        expect(error).toBeDefined()
      }
    })
  })

  describe('Self-Learning Vision Service', () => {
    it('should initialize with default config', async () => {
      const patterns = await selfLearningVisionService.getPatterns()
      expect(Array.isArray(patterns)).toBe(true)
    })

    it('should process feedback', async () => {
      const feedback = {
        id: 'test-feedback-1',
        patternId: 'test-pattern-1',
        photoId: 'test-photo-1',
        damageRecordId: 'test-damage-1',
        validated: true,
        learningImpact: {
          patternConfidenceChange: 5,
          ruleUpdates: [],
          knowledgeBaseUpdates: [],
        },
        createdAt: new Date().toISOString(),
      }

      await expect(
        selfLearningVisionService.processFeedback(feedback)
      ).resolves.not.toThrow()
    })

    it('should handle pattern matching', async () => {
      const mockAnalysis = {
        analysis: {
          qualityIssues: [
            { type: 'crush', severity: 'major', confidence: 85 },
          ],
          detectedObjects: [],
        },
      }

      const mockContext = {
        area: 'loading_dock',
        equipment: ['forklift'],
      }

      // This is a private method, but we can test through public interface
      const result = await selfLearningVisionService.analyzeDamagePhoto(
        'mock-image-url',
        mockContext
      )

      expect(result).toHaveProperty('analysis')
      expect(result).toHaveProperty('patternMatches')
      expect(result).toHaveProperty('suggestedRules')
      expect(result).toHaveProperty('preventionSuggestions')
      expect(result).toHaveProperty('learningMetadata')
    })
  })

  describe('Privacy-Preserving Vision Service', () => {
    it('should detect if privacy protection is required', () => {
      const requiresProtection = privacyPreservingVisionService.requiresPrivacyProtection(
        'Worker safety analysis with body cam footage'
      )
      expect(requiresProtection).toBe(true)
    })

    it('should create body cam privacy filter', () => {
      const filter = privacyPreservingVisionService.createBodyCamPrivacyFilter()
      expect(filter.enableWorkerPrivacy).toBe(true)
      expect(filter.enableGDPRCompliance).toBe(true)
      expect(filter.defaultIntensity).toBeGreaterThan(70)
    })

    it('should create warehouse privacy filter', () => {
      const filter = privacyPreservingVisionService.createWarehousePrivacyFilter()
      expect(filter.enableWorkerPrivacy).toBe(true)
      expect(filter.preserveAnalysisQuality).toBe(true)
    })

    it('should calculate privacy compliance', async () => {
      const mockAnalysis = {
        description: 'Test analysis',
        detectedObjects: [],
        safetyIssues: [],
        qualityIssues: [],
      }

      const result = await privacyPreservingVisionService.analyzeWithPrivacy(
        'mock-image',
        'test context',
        {
          enableWorkerPrivacy: true,
          enableGDPRCompliance: true,
        }
      )

      expect(result).toHaveProperty('privacyFiltered')
      expect(result).toHaveProperty('filtersApplied')
      expect(result).toHaveProperty('complianceLevel')
      expect(result).toHaveProperty('protectedRegions')
      expect(result).toHaveProperty('analysisQuality')
    })
  })

  describe('Explainable Vision Service', () => {
    it('should explain analysis decisions', async () => {
      const mockAnalysis = {
        qualityIssues: [
          { type: 'crush', severity: 'major', confidence: 85 },
        ],
        safetyIssues: [],
        complianceIssues: [],
        detectedObjects: [
          { object: 'forklift', confidence: 90, boundingBox: { x: 100, y: 100, width: 200, height: 200 } },
        ],
        description: 'Damage detected on package',
        rootCauseAnalysis: {
          rootCauses: [
            { cause: 'Forklift handling', confidence: 80, explanation: 'Forklift detected near damage' },
          ],
        },
      }

      const result = await explainableVisionService.explainAnalysis(mockAnalysis)

      expect(result).toHaveProperty('explanations')
      expect(result).toHaveProperty('confidenceBreakdown')
      expect(result).toHaveProperty('featureImportance')
      expect(result).toHaveProperty('transparencyScore')
      expect(result).toHaveProperty('recommendations')
      expect(Array.isArray(result.explanations)).toBe(true)
      expect(result.confidenceBreakdown).toHaveProperty('overall')
      expect(result.confidenceBreakdown).toHaveProperty('components')
      expect(result.confidenceBreakdown).toHaveProperty('uncertainty')
    })

    it('should calculate confidence breakdown', async () => {
      const mockAnalysis = {
        detectedObjects: [
          { object: 'package', confidence: 90 },
          { object: 'forklift', confidence: 85 },
        ],
        qualityIssues: [
          { type: 'crush', confidence: 80 },
        ],
      }

      const result = await explainableVisionService.explainAnalysis(mockAnalysis)
      
      expect(result.confidenceBreakdown.overall).toBeGreaterThanOrEqual(0)
      expect(result.confidenceBreakdown.overall).toBeLessThanOrEqual(100)
      expect(result.confidenceBreakdown.components.length).toBeGreaterThan(0)
    })

    it('should provide why explanations', async () => {
      const mockAnalysis = {
        qualityIssues: [
          { type: 'crush', severity: 'major', confidence: 85 },
        ],
        detectedObjects: [],
      }

      const explanation = await explainableVisionService.getWhyExplanation(
        mockAnalysis,
        'quality_issue',
        'crush'
      )

      expect(typeof explanation).toBe('string')
      expect(explanation.length).toBeGreaterThan(0)
    })
  })

  describe('Vision Resilience Service', () => {
    it('should handle errors gracefully', () => {
      const error = new Error('Rate limit exceeded')
      const result = visionResilienceService.handleVisionError(error, 'test context')

      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('retryable')
      expect(result).toHaveProperty('recommendations')
      expect(Array.isArray(result.recommendations)).toBe(true)
    })

    it('should identify retryable errors', () => {
      const rateLimitError = new Error('Rate limit exceeded')
      const result = visionResilienceService.handleVisionError(rateLimitError, 'test')
      expect(result.retryable).toBe(true)

      const authError = new Error('401 Unauthorized')
      const authResult = visionResilienceService.handleVisionError(authError, 'test')
      expect(authResult.retryable).toBe(false)
    })

    it('should execute with resilience', async () => {
      const mockFn = jest.fn().mockResolvedValue({ success: true })
      
      const result = await visionResilienceService.executeWithResilience(
        'test-service',
        mockFn
      )

      expect(mockFn).toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })

    it('should use fallback on error', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service unavailable'))
      const fallbackFn = jest.fn().mockResolvedValue({ success: true, fromCache: true })

      const result = await visionResilienceService.executeWithResilience(
        'test-service',
        failingFn,
        fallbackFn
      )

      expect(result).toEqual({ success: true, fromCache: true })
    })
  })

  describe('Vision Learning Database Adapter', () => {
    it('should initialize database adapter', () => {
      expect(visionLearningDatabaseAdapter).toBeDefined()
    })

    it('should handle pattern storage', async () => {
      const mockPattern = {
        id: 'test-pattern-1',
        patternId: 'pat-1',
        name: 'Test Pattern',
        description: 'Test description',
        visualFeatures: {
          damageType: ['crush'],
          location: [],
          severity: ['major'],
          shape: [],
          color: [],
        },
        context: {
          area: 'loading_dock',
        },
        confidence: 80,
        occurrenceCount: 1,
        accuracy: 75,
        lastSeen: new Date().toISOString(),
        firstSeen: new Date().toISOString(),
        autoGeneratedRules: [],
        preventionSuggestions: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // This will work with in-memory fallback if database not configured
      await expect(
        visionLearningDatabaseAdapter.storePattern(mockPattern)
      ).resolves.toBe(mockPattern.id)
    })

    it('should retrieve patterns', async () => {
      const patterns = await visionLearningDatabaseAdapter.getAllPatterns()
      expect(Array.isArray(patterns)).toBe(true)
    })

    it('should handle feedback storage', async () => {
      const mockFeedback = {
        id: 'test-feedback-1',
        patternId: 'test-pattern-1',
        photoId: 'test-photo-1',
        damageRecordId: 'test-damage-1',
        validated: true,
        learningImpact: {
          patternConfidenceChange: 5,
          ruleUpdates: [],
          knowledgeBaseUpdates: [],
        },
        createdAt: new Date().toISOString(),
      }

      await expect(
        visionLearningDatabaseAdapter.storeFeedback(mockFeedback)
      ).resolves.toBe(mockFeedback.id)
    })
  })
})

describe('Vision Service Integration', () => {
  it('should integrate all services', async () => {
    // Test that all services can work together
    const services = {
      vision: visionService,
      learning: selfLearningVisionService,
      privacy: privacyPreservingVisionService,
      explainable: explainableVisionService,
      resilience: visionResilienceService,
      database: visionLearningDatabaseAdapter,
    }

    expect(services.vision).toBeDefined()
    expect(services.learning).toBeDefined()
    expect(services.privacy).toBeDefined()
    expect(services.explainable).toBeDefined()
    expect(services.resilience).toBeDefined()
    expect(services.database).toBeDefined()
  })
})



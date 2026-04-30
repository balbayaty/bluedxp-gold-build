/**
 * Marketplace Learning Feedback Service - Integration Tests
 */

import { learningFeedbackService } from '@/lib/services/marketplace/learningFeedbackService'

describe('Marketplace Learning Feedback Service', () => {
  describe('Service Initialization', () => {
    it('should initialize service successfully', () => {
      expect(learningFeedbackService).toBeDefined()
    })
  })

  describe('submitFeedback', () => {
    it('should accept feedback', async () => {
      const feedback = {
        requirementId: 'req-1',
        matchedProviderId: 'provider-1',
        matchedServiceId: 'service-1',
        accuracy: 4,
        outcome: 'SUCCESS' as const,
        customerSatisfaction: 5,
      }

      const result = await learningFeedbackService.submitFeedback(feedback)

      expect(result).toBeDefined()
      expect(result.feedbackId).toBeDefined()
    })
  })

  describe('getLearningInsights', () => {
    it('should return learning insights', async () => {
      const insights = await learningFeedbackService.getLearningInsights('STORAGE')

      expect(insights).toBeDefined()
      expect(insights.commonMissingFields).toBeDefined()
      expect(insights.recommendedFields).toBeDefined()
    })
  })
})






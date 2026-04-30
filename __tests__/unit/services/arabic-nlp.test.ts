/**
 * Unit Tests: Arabic NLP Service
 * 
 * Tests for Arabic-native NLP engine
 */

import { arabicNLPService } from '@/lib/services/nlp/arabic-nlp'

describe('Arabic NLP Service', () => {
  describe('analyze', () => {
    it('should analyze Arabic text', async () => {
      const text = 'أريد شحنة إلى الرياض'
      const result = await arabicNLPService.analyze(text)

      expect(result).toBeDefined()
      expect(result.sentiment).toBeDefined()
      expect(result.intent).toBeDefined()
      expect(result.commitmentLevel).toBeDefined()
    })

    it('should detect positive sentiment', async () => {
      const text = 'رائع! شكراً لك'
      const result = await arabicNLPService.analyze(text)

      expect(result.sentiment.sentiment).toBe('positive')
      expect(result.sentiment.score).toBeGreaterThan(0)
    })

    it('should detect negative sentiment', async () => {
      const text = 'مشكلة كبيرة في الشحنة'
      const result = await arabicNLPService.analyze(text)

      expect(result.sentiment.sentiment).toBe('negative')
      expect(result.sentiment.score).toBeLessThan(0)
    })

    it('should detect intent', async () => {
      const text = 'أريد تأكيد الشحنة'
      const result = await arabicNLPService.analyze(text)

      expect(result.intent.intent).toBeDefined()
      expect(result.intent.confidence).toBeGreaterThanOrEqual(0)
      expect(result.intent.confidence).toBeLessThanOrEqual(1)
    })

    it('should detect commitment level', async () => {
      const text = 'أؤكد أن الشحنة ستصل في الوقت المحدد'
      const result = await arabicNLPService.analyze(text)

      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.commitmentLevel)
    })
  })

  describe('tokenize', () => {
    it('should tokenize Arabic text', async () => {
      const text = 'الشحنة في الطريق'
      const tokens = await arabicNLPService.tokenize(text)

      expect(tokens).toBeDefined()
      expect(Array.isArray(tokens)).toBe(true)
      expect(tokens.length).toBeGreaterThan(0)
    })
  })
})


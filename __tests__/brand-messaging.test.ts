/**
 * Brand Messaging Engine - Basic Tests
 * Tests core functionality and integration
 */

import { brandMessagingService } from '@/lib/services/brand-messaging/brandMessagingService'
import type { MessagingGenerationRequest } from '@/types/brand-messaging'

describe('Brand Messaging Engine', () => {
  describe('Service Initialization', () => {
    it('should initialize service successfully', () => {
      expect(brandMessagingService).toBeDefined()
    })

    it('should have cache stats', () => {
      const stats = brandMessagingService.getCacheStats()
      expect(stats).toBeDefined()
      expect(stats.maxSize).toBe(1000)
      expect(stats.size).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Message Generation', () => {
    it('should generate message with template fallback', async () => {
      const request: MessagingGenerationRequest = {
        type: 'module_header',
        context: {
          moduleId: 'wms',
          moduleName: 'Warehouse Management',
          language: 'both',
        },
        useCache: false,
        qualityCheck: false,
        promptConfig: {
          includeBrandContext: false,
          includeSaudiContext: false,
          includeModuleContext: false,
          systemPromptOverride: 'template',
        },
      }

      const message = await brandMessagingService.generateMessage(request)

      expect(message).toBeDefined()
      expect(message.type).toBe('module_header')
      expect(message.content.en).toBeTruthy()
      expect(message.content.ar).toBeTruthy()
      expect(message.metadata?.generatedBy).toBe('template')
    })

    it('should generate empty state message', async () => {
      const request: MessagingGenerationRequest = {
        type: 'empty_state',
        context: {
          moduleId: 'wms',
          language: 'both',
          metadata: {
            items: 'shipments',
            potential: 'Every journey awaits',
          },
        },
        useCache: false,
        qualityCheck: false,
        promptConfig: {
          systemPromptOverride: 'template',
        },
      }

      const message = await brandMessagingService.generateMessage(request)

      expect(message).toBeDefined()
      expect(message.type).toBe('empty_state')
      expect(message.content.en.length).toBeGreaterThan(0)
    })

    it('should cache generated messages', async () => {
      const request: MessagingGenerationRequest = {
        type: 'loading_state',
        context: {
          moduleId: 'wms',
          action: 'Processing',
          language: 'both',
        },
        useCache: true,
        qualityCheck: false,
        promptConfig: {
          systemPromptOverride: 'template',
        },
      }

      const message1 = await brandMessagingService.generateMessage(request)
      const message2 = await brandMessagingService.generateMessage(request)

      // Should be same instance from cache
      expect(message1.id).toBe(message2.id)
    })
  })

  describe('Quality Checking', () => {
    it('should check message quality', async () => {
      const request: MessagingGenerationRequest = {
        type: 'module_header',
        context: {
          moduleId: 'wms',
          moduleName: 'Warehouse Management',
          language: 'both',
        },
        useCache: false,
        qualityCheck: true,
        promptConfig: {
          systemPromptOverride: 'template',
        },
      }

      const message = await brandMessagingService.generateMessage(request)

      expect(message.metadata?.qualityScore).toBeDefined()
      expect(message.metadata?.qualityScore).toBeGreaterThanOrEqual(0)
      expect(message.metadata?.qualityScore).toBeLessThanOrEqual(100)
    })
  })

  describe('Batch Generation', () => {
    it('should generate multiple messages', async () => {
      const items = [
        {
          type: 'module_header' as const,
          context: {
            moduleId: 'wms',
            moduleName: 'Warehouse Management',
            language: 'both' as const,
          },
        },
        {
          type: 'empty_state' as const,
          context: {
            moduleId: 'wms',
            language: 'both' as const,
          },
        },
      ]

      const result = await brandMessagingService.batchGenerate({
        items,
        parallel: false,
        consistencyCheck: false,
      })

      expect(result.messages).toBeDefined()
      expect(result.messages.length).toBe(2)
      expect(result.generationTime).toBeGreaterThan(0)
    })
  })

  describe('Message Text Retrieval', () => {
    it('should return English text', () => {
      const message = {
        id: 'test',
        type: 'module_header' as const,
        context: { language: 'both' as const },
        content: {
          en: 'English Text',
          ar: 'النص العربي',
        },
      }

      const text = brandMessagingService.getMessageText(message, 'en')
      expect(text).toBe('English Text')
    })

    it('should return Arabic text', () => {
      const message = {
        id: 'test',
        type: 'module_header' as const,
        context: { language: 'both' as const },
        content: {
          en: 'English Text',
          ar: 'النص العربي',
        },
      }

      const text = brandMessagingService.getMessageText(message, 'ar')
      expect(text).toBe('النص العربي')
    })
  })

  describe('Cache Management', () => {
    it('should clear cache', () => {
      brandMessagingService.clearCache()
      const stats = brandMessagingService.getCacheStats()
      expect(stats.size).toBe(0)
    })
  })
})












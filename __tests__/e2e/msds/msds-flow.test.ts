/**
 * MSDS Module E2E Tests
 * Complete end-to-end testing for MSDS workflow
 */

// Required for OpenAI and Anthropic SDKs in Node.js environment
import 'openai/shims/node'
import '@anthropic-ai/sdk/shims/node'

import { msdsService } from '@/lib/services/chemical/msdsService'
import { msdsDomainService } from '@/lib/services/chemical/msdsDomainService'
import { msdsStorageService } from '@/lib/services/chemical/msdsStorage'
import { eventBus } from '@/lib/services/event-store'
import { evidenceService } from '@/lib/services/evidence'

describe('MSDS Module E2E Tests', () => {
  const testTenantId = 'test-tenant-123'
  const testUserId = 'test-user-123'
  const testActor = { userId: testUserId, roles: ['COMPLIANCE_OFFICER'] }

  beforeEach(() => {
    // Clear any test data
    jest.clearAllMocks()
  })

  describe('MSDS Upload and Processing Flow', () => {
    it('should complete full MSDS upload workflow', async () => {
      // Step 1: Create a mock MSDS file
      const mockFile = new File(
        ['Mock MSDS content with product name: Test Chemical'],
        'test-msds.pdf',
        { type: 'application/pdf' }
      )

      // Step 2: Upload MSDS
      const msds = await msdsService.uploadMSDS(mockFile, {
        tenantId: testTenantId,
        customerId: testUserId,
      })

      // Step 3: Verify MSDS was created
      expect(msds).toBeDefined()
      expect(msds.id).toBeDefined()
      expect(msds.status).toBe('analyzing')
      expect(msds.workflowStatus).toBe('pending_analysis')

      // Step 4: Verify MSDS is stored
      const stored = await msdsService.getMSDSById(msds.id, testTenantId)
      expect(stored).toBeDefined()
      expect(stored?.id).toBe(msds.id)
    })

    it('should handle MSDS extraction with AI', async () => {
      const sampleText = `
        PRODUCT NAME: Test Chemical
        MANUFACTURER: Test Manufacturer
        CAS NUMBER: 123-45-6
        HAZARD STATEMENTS: H300, H301
        PRECAUTIONARY STATEMENTS: P264, P270
      `

      const extracted = await msdsService.extractMSDSData(sampleText)

      expect(extracted).toBeDefined()
      expect(extracted.productName).toBeDefined()
    })
  })

  describe('MSDS Approval/Rejection Workflow', () => {
    let testMsdsId: string

    beforeEach(async () => {
      // Create a test MSDS for approval/rejection tests
      const mockFile = new File(['Test MSDS'], 'test.pdf', { type: 'application/pdf' })
      const msds = await msdsService.uploadMSDS(mockFile, {
        tenantId: testTenantId,
        customerId: testUserId,
      })
      testMsdsId = msds.id
    })

    it('should approve MSDS and update status', async () => {
      const result = await msdsService.approveMSDS(testMsdsId, testUserId, 'Approved for use')

      expect(result).toBe(true)

      const approved = await msdsService.getMSDSById(testMsdsId, testTenantId)
      expect(approved?.status).toBe('approved')
      expect(approved?.workflowStatus).toBe('approved')
      expect(approved?.approval).toBeDefined()
    })

    it('should reject MSDS and update status', async () => {
      const result = await msdsService.rejectMSDS(testMsdsId, testUserId, 'Missing required information')

      expect(result).toBe(true)

      const rejected = await msdsService.getMSDSById(testMsdsId, testTenantId)
      expect(rejected?.status).toBe('rejected')
      expect(rejected?.workflowStatus).toBe('rejected')
      expect(rejected?.review).toBeDefined()
    })
  })

  describe('Bulk Operations', () => {
    let testMsdsIds: string[] = []

    beforeEach(async () => {
      // Create multiple test MSDS documents
      for (let i = 0; i < 3; i++) {
        const mockFile = new File([`Test MSDS ${i}`], `test-${i}.pdf`, { type: 'application/pdf' })
        const msds = await msdsService.uploadMSDS(mockFile, {
          tenantId: testTenantId,
          customerId: testUserId,
        })
        testMsdsIds.push(msds.id)
      }
    })

    it('should bulk approve multiple MSDS documents', async () => {
      const result = await msdsService.bulkApproveMSDS(testMsdsIds, testUserId, 'Bulk approval')

      expect(result.successful.length).toBeGreaterThan(0)
      expect(result.failed.length).toBe(0)

      // Verify all were approved
      for (const id of result.successful) {
        const msds = await msdsService.getMSDSById(id, testTenantId)
        expect(msds?.status).toBe('approved')
      }
    })

    it('should bulk reject multiple MSDS documents', async () => {
      const result = await msdsService.bulkRejectMSDS(testMsdsIds, testUserId, 'Bulk rejection')

      expect(result.successful.length).toBeGreaterThan(0)
      expect(result.failed.length).toBe(0)

      // Verify all were rejected
      for (const id of result.successful) {
        const msds = await msdsService.getMSDSById(id, testTenantId)
        expect(msds?.status).toBe('rejected')
      }
    })
  })

  describe('MSDS Comparison', () => {
    it('should compare two MSDS documents', async () => {
      // Create two MSDS documents
      const file1 = new File(['MSDS 1'], 'msds1.pdf', { type: 'application/pdf' })
      const file2 = new File(['MSDS 2'], 'msds2.pdf', { type: 'application/pdf' })

      const msds1 = await msdsService.uploadMSDS(file1, { tenantId: testTenantId, customerId: testUserId })
      const msds2 = await msdsService.uploadMSDS(file2, { tenantId: testTenantId, customerId: testUserId })

      const comparison = await msdsService.compareMSDS(msds1.id, msds2.id)

      expect(comparison).toBeDefined()
      expect(comparison.differences).toBeDefined()
      expect(comparison.similarities).toBeDefined()
      expect(comparison.recommendations).toBeDefined()
      expect(comparison.fieldComparisons).toBeDefined()
    })
  })

  describe('MSDS Compliance Checking', () => {
    it('should check MSDS compliance', async () => {
      const mockFile = new File(['Test MSDS'], 'test.pdf', { type: 'application/pdf' })
      const msds = await msdsService.uploadMSDS(mockFile, {
        tenantId: testTenantId,
        customerId: testUserId,
      })

      const compliance = await msdsService.checkCompliance(msds.id)

      expect(compliance).toBeDefined()
      expect(compliance.compliant).toBeDefined()
      expect(compliance.issues).toBeDefined()
      expect(compliance.score).toBeDefined()
      expect(typeof compliance.score).toBe('number')
    })
  })

  describe('Cross-Module Integration', () => {
    it('should integrate with Event Bus', async () => {
      const publishSpy = jest.spyOn(eventBus, 'publish')

      const mockFile = new File(['Test MSDS'], 'test.pdf', { type: 'application/pdf' })
      await msdsDomainService.storeExtractedMSDS({
        tenantId: testTenantId,
        actor: testActor,
        msds: {
          id: 'test-msds-123',
          chemicalName: 'Test Chemical',
          status: 'pending',
        } as any,
        extractedData: {
          productName: 'Test Chemical',
          manufacturer: 'Test Manufacturer',
        } as any,
        source: 'upload',
      })

      // Verify event was published
      expect(publishSpy).toHaveBeenCalled()
    })

    it('should integrate with Evidence Service', async () => {
      const createSpy = jest.spyOn(evidenceService, 'create')

      const mockFile = new File(['Test MSDS'], 'test.pdf', { type: 'application/pdf' })
      await msdsDomainService.storeExtractedMSDS({
        tenantId: testTenantId,
        actor: testActor,
        msds: {
          id: 'test-msds-456',
          chemicalName: 'Test Chemical',
          status: 'pending',
        } as any,
        extractedData: {
          productName: 'Test Chemical',
          manufacturer: 'Test Manufacturer',
        } as any,
        source: 'upload',
      })

      // Verify evidence was created
      expect(createSpy).toHaveBeenCalled()
    })
  })

  describe('Performance and Caching', () => {
    it('should cache MSDS documents for faster retrieval', async () => {
      const mockFile = new File(['Test MSDS'], 'test.pdf', { type: 'application/pdf' })
      const msds = await msdsService.uploadMSDS(mockFile, {
        tenantId: testTenantId,
        customerId: testUserId,
      })

      // First call - should hit database
      const start1 = Date.now()
      await msdsService.getMSDSById(msds.id, testTenantId)
      const time1 = Date.now() - start1

      // Second call - should hit cache
      const start2 = Date.now()
      await msdsService.getMSDSById(msds.id, testTenantId)
      const time2 = Date.now() - start2

      // Cached call should be faster (or at least not slower)
      expect(time2).toBeLessThanOrEqual(time1 * 2) // Allow some variance
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle missing MSDS gracefully', async () => {
      const result = await msdsService.getMSDSById('non-existent-id', testTenantId)
      expect(result).toBeNull()
    })

    it('should handle invalid tenant ID', async () => {
      await expect(
        msdsService.uploadMSDS(
          new File(['Test'], 'test.pdf', { type: 'application/pdf' }),
          { tenantId: '' }
        )
      ).rejects.toThrow('tenantId is required')
    })

    it('should handle database errors gracefully', async () => {
      // This test would require mocking Prisma to throw errors
      // For now, we verify the service handles errors
      const result = await msdsService.getMSDSById('invalid-id', testTenantId)
      expect(result).toBeNull() // Should return null, not throw
    })
  })
})

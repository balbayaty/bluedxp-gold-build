/**
 * ASN Service Tests
 * Unit tests for ASN core service
 */

import { getAsnService } from '@/lib/services/asn'
import type { CreateASNRequest } from '@/types/asn'

describe('AsnService', () => {
  let asnService: ReturnType<typeof getAsnService>
  const testTenantId = 'test-tenant'
  const testUserId = 'test-user'

  beforeEach(() => {
    asnService = getAsnService()
  })

  describe('createAsn', () => {
    it('should create a new ASN with valid data', async () => {
      const request: CreateASNRequest = {
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        expectedArrivalDate: new Date('2025-02-01'),
        items: [
          {
            lineNumber: 1,
            sku: 'SKU-001',
            description: 'Test Item',
            quantity: 10,
            unitPrice: 50,
            unitOfMeasure: 'PCS',
          },
        ],
      }

      const asn = await asnService.createAsn(request, testUserId, testTenantId)

      expect(asn).toBeDefined()
      expect(asn.asnNumber).toBeDefined()
      expect(asn.supplierId).toBe('supplier-1')
      expect(asn.warehouseId).toBe('warehouse-1')
      expect(asn.status).toBe('pending')
      expect(asn.items).toHaveLength(1)
      expect(asn.totalItems).toBe(1)
      expect(asn.totalQuantity).toBe(10)
      expect(asn.totalValue).toBe(500)
    })

    it('should throw error if supplier ID is missing', async () => {
      const request: CreateASNRequest = {
        supplierId: '',
        warehouseId: 'warehouse-1',
        expectedArrivalDate: new Date(),
        items: [],
      }

      await expect(
        asnService.createAsn(request, testUserId, testTenantId)
      ).rejects.toThrow('Supplier ID is required')
    })

    it('should throw error if no items provided', async () => {
      const request: CreateASNRequest = {
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        expectedArrivalDate: new Date(),
        items: [],
      }

      await expect(
        asnService.createAsn(request, testUserId, testTenantId)
      ).rejects.toThrow('At least one item is required')
    })
  })

  describe('getAsnById', () => {
    it('should return ASN if found', async () => {
      // Create ASN first
      const request: CreateASNRequest = {
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        expectedArrivalDate: new Date(),
        items: [
          {
            lineNumber: 1,
            sku: 'SKU-001',
            description: 'Test',
            quantity: 10,
            unitPrice: 50,
            unitOfMeasure: 'PCS',
          },
        ],
      }

      const created = await asnService.createAsn(request, testUserId, testTenantId)
      const asn = await asnService.getAsnById(created.id, testTenantId)

      expect(asn).toBeDefined()
      expect(asn?.id).toBe(created.id)
    })

    it('should return null if ASN not found', async () => {
      const asn = await asnService.getAsnById('non-existent-id', testTenantId)
      expect(asn).toBeNull()
    })
  })

  describe('listAsns', () => {
    it('should return paginated list of ASNs', async () => {
      const result = await asnService.listAsns(
        {
          page: 1,
          limit: 10,
        },
        testTenantId
      )

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.pagination).toBeDefined()
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)
    })

    it('should filter by status', async () => {
      const result = await asnService.listAsns(
        {
          status: ['pending'],
          page: 1,
          limit: 10,
        },
        testTenantId
      )

      expect(result.data.every((asn) => asn.status === 'pending')).toBe(true)
    })
  })

  describe('updateAsn', () => {
    it('should update ASN status', async () => {
      // Create ASN first
      const request: CreateASNRequest = {
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        expectedArrivalDate: new Date(),
        items: [
          {
            lineNumber: 1,
            sku: 'SKU-001',
            description: 'Test',
            quantity: 10,
            unitPrice: 50,
            unitOfMeasure: 'PCS',
          },
        ],
      }

      const created = await asnService.createAsn(request, testUserId, testTenantId)
      
      const updated = await asnService.updateAsn(
        created.id,
        { status: 'receiving' },
        testUserId,
        testTenantId
      )

      expect(updated.status).toBe('receiving')
    })
  })
})



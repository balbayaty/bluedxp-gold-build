/**
 * Warehouse Network API Comprehensive Test Suite
 * Tests all warehouse network endpoints and functionality
 */

import { describe, it, expect, beforeAll } from '@jest/globals'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

describe('Warehouse Network API Tests', () => {
  let testNetworkId: string
  let testTransferId: string

  beforeAll(() => {
    console.log('🧪 Starting Warehouse Network API Tests...')
  })

  describe('Networks API', () => {
    it('should get all networks', async () => {
      const response = await fetch(`${API_BASE}/api/warehouse-network/networks`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should create a network', async () => {
      const network = {
        name: 'Test Network',
        description: 'Test network description',
        warehouseIds: ['warehouse-1', 'warehouse-2'],
        status: 'active',
      }

      const response = await fetch(`${API_BASE}/api/warehouse-network/networks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(network),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      testNetworkId = data.data.id
    })

    it('should get a specific network', async () => {
      if (!testNetworkId) {
        console.log('⚠️ Skipping: No test network ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/warehouse-network/networks/${testNetworkId}`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testNetworkId)
    })
  })

  describe('Transfers API', () => {
    it('should get all transfers', async () => {
      const response = await fetch(`${API_BASE}/api/warehouse-network/transfers`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should create a transfer', async () => {
      if (!testNetworkId) {
        console.log('⚠️ Skipping: No test network ID')
        return
      }

      const transfer = {
        networkId: testNetworkId,
        fromWarehouseId: 'warehouse-1',
        toWarehouseId: 'warehouse-2',
        items: [
          {
            sku: 'SKU-001',
            quantity: 10,
            description: 'Test Item',
          },
        ],
        scheduledDate: new Date().toISOString(),
        priority: 'normal',
      }

      const response = await fetch(`${API_BASE}/api/warehouse-network/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transfer),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      testTransferId = data.data.id
    })
  })

  describe('Routes API', () => {
    it('should get network routes', async () => {
      if (!testNetworkId) {
        console.log('⚠️ Skipping: No test network ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/warehouse-network/routes?networkId=${testNetworkId}`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })
  })

  describe('Analytics API', () => {
    it('should get network analytics', async () => {
      if (!testNetworkId) {
        console.log('⚠️ Skipping: No test network ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/warehouse-network/analytics?networkId=${testNetworkId}`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('totalWarehouses')
      expect(data.data).toHaveProperty('totalTransfers')
    })
  })

  describe('Export API', () => {
    it('should export network data', async () => {
      if (!testNetworkId) {
        console.log('⚠️ Skipping: No test network ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/warehouse-network/export?networkId=${testNetworkId}&format=json`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
    })
  })
})










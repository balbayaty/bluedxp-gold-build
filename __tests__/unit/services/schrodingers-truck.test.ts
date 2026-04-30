/**
 * Unit Tests: Schrödinger's Truck Service
 * 
 * Tests for quantum logistics service
 */

import { schrodingersTruckService } from '@/lib/services/schrodingers-truck/service'
import type { Shipment } from '@/types/tms'

describe('Schrödinger\'s Truck Service', () => {
  const mockShipment: Shipment = {
    id: 'test-shipment-1',
    tenantId: 'test-tenant',
    origin: { lat: 24.7136, lng: 46.6753, address: 'Riyadh' },
    destination: { lat: 21.4858, lng: 39.1925, address: 'Jeddah' },
    status: 'IN_TRANSIT',
  } as Shipment

  beforeEach(() => {
    // Reset state before each test
  })

  describe('initializeQuantumState', () => {
    it('should initialize quantum state for shipment', async () => {
      const state = await schrodingersTruckService.initializeQuantumState(mockShipment)

      expect(state).toBeDefined()
      expect(state.shipmentId).toBe(mockShipment.id)
      expect(['COMMITTED', 'CONTINGENT', 'PHANTOM']).toContain(state.currentState)
      expect(state.probabilities.onTime + state.probabilities.delayed + state.probabilities.noShow).toBeCloseTo(1.0, 2)
    })

    it('should calculate probabilities based on 8 factors', async () => {
      const state = await schrodingersTruckService.initializeQuantumState(mockShipment)

      expect(state.factors).toBeDefined()
      expect(Object.keys(state.factors)).toHaveLength(8)
      expect(state.factors.driverReliability).toBeGreaterThanOrEqual(0)
      expect(state.factors.driverReliability).toBeLessThanOrEqual(1)
    })
  })

  describe('getQuantumState', () => {
    it('should retrieve quantum state for shipment', async () => {
      await schrodingersTruckService.initializeQuantumState(mockShipment)
      const state = await schrodingersTruckService.getQuantumState(mockShipment.id, mockShipment.tenantId)

      expect(state).toBeDefined()
      expect(state?.shipmentId).toBe(mockShipment.id)
    })

    it('should return null for non-existent shipment', async () => {
      const state = await schrodingersTruckService.getQuantumState('non-existent', 'test-tenant')
      expect(state).toBeNull()
    })
  })

  describe('updateQuantumState', () => {
    it('should update quantum state with new observation', async () => {
      await schrodingersTruckService.initializeQuantumState(mockShipment)
      
      const updated = await schrodingersTruckService.updateQuantumState(mockShipment.id, {
        trigger: 'WHATSAPP_MESSAGE',
        positiveSignal: true,
      } as any)

      expect(updated).toBeDefined()
      expect(updated.probabilities.onTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('collapseState', () => {
    it('should collapse to COMMITTED state', async () => {
      await schrodingersTruckService.initializeQuantumState(mockShipment)
      
      const collapsed = await schrodingersTruckService.collapseState(
        mockShipment.id,
        mockShipment.tenantId,
        'COMMITTED'
      )

      expect(collapsed.currentState).toBe('COMMITTED')
      expect(collapsed.probabilities.onTime).toBeGreaterThan(0.7)
    })
  })
})


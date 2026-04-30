/**
 * Integration Tests: Quantum Logistics
 * 
 * Tests integration between Schrödinger's Truck, Cargo Psychology, and Arabic NLP
 */

import { schrodingersTruckService } from '@/lib/services/schrodingers-truck/service'
import { cargoPsychologyService } from '@/lib/services/cargo-psychology/service'
import { arabicNLPService } from '@/lib/services/nlp/arabic-nlp'

describe('Quantum Logistics Integration', () => {
  const mockShipment = {
    id: 'test-shipment-1',
    tenantId: 'test-tenant',
  } as any

  it('should integrate quantum state with psychology state', async () => {
    // Initialize quantum state
    const quantumState = await schrodingersTruckService.initializeQuantumState(mockShipment)

    // Initialize psychology state
    const psychologyState = await cargoPsychologyService.initializePsychologyForShipment(mockShipment)

    expect(quantumState).toBeDefined()
    expect(psychologyState).toBeDefined()
    expect(quantumState.shipmentId).toBe(psychologyState.shipmentId)
  })

  it('should update quantum state from Arabic message', async () => {
    await schrodingersTruckService.initializeQuantumState(mockShipment)

    const message = 'أؤكد أن الشحنة في الطريق'
    const analysis = await arabicNLPService.analyze(message)

    // Update quantum state based on Arabic NLP analysis
    if (analysis.intent.intent === 'CONFIRMATION') {
      const updated = await schrodingersTruckService.updateQuantumState(mockShipment.id, {
        trigger: 'ARABIC_NLP_ANALYSIS',
        positiveSignal: true,
        messageAnalysis: analysis,
      } as any)

      expect(updated).toBeDefined()
      expect(updated.probabilities.onTime).toBeGreaterThanOrEqual(0)
    }
  })

  it('should update psychology state from Arabic message', async () => {
    await cargoPsychologyService.initializePsychologyForShipment(mockShipment)

    const message = 'أؤكد أن الشحنة في الطريق'
    const analysis = await arabicNLPService.analyze(message)

    const updated = await cargoPsychologyService.updatePsychologyFromMessage(
      mockShipment.id,
      message,
      analysis
    )

    expect(updated).toBeDefined()
  })
})


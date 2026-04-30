/**
 * End-to-End Tests: Evidence Packet Flow
 * 
 * Tests complete evidence packet workflow
 */

import { evidencePacketService } from '@/lib/services/evidence/packet-service'
import { truthEngine } from '@/lib/services/truth-engine/truthEngineService'

describe('Evidence Packet E2E Flow', () => {
  it('should complete full evidence packet workflow', async () => {
    // 1. Create truth event
    const event = await truthEngine.createEvent({
      claim: 'Shipment delivered on time',
      actor: {
        id: 'test-actor',
        name: 'Test Actor',
        tenantId: 'test-tenant',
        type: 'user',
      },
      evidence: [],
      tenantId: 'test-tenant',
    })

    expect(event).toBeDefined()
    expect(event.id).toBeDefined()

    // 2. Generate evidence packet from truth event
    const packet = await evidencePacketService.generatePacket(
      {
        entityType: 'TruthEvent',
        entityId: event.id,
        claimType: 'service_completion',
      },
      {
        id: 'test-actor',
        name: 'Test Actor',
        tenantId: 'test-tenant',
        type: 'user',
      }
    )

    expect(packet).toBeDefined()
    expect(packet.id).toBeDefined()

    // 3. Verify packet
    const verification = await evidencePacketService.verifyPacket(packet.id)

    expect(verification).toBeDefined()
    expect(verification.valid).toBe(true)

    // 4. Generate court-ready packet
    const courtReady = await evidencePacketService.generateCourtReadyPacket(packet.id)

    expect(courtReady).toBeDefined()
    expect(courtReady.formatted).toBeDefined()
  })
})


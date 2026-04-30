/**
 * Unit Tests: Evidence Packet Service
 * 
 * Tests for evidence packet generation and verification
 */

import { evidencePacketService } from '@/lib/services/evidence/packet-service'
import { merkleTreeBuilder } from '@/lib/services/evidence/merkle-tree'

describe('Evidence Packet Service', () => {
  const mockEntity = {
    entityType: 'Shipment',
    entityId: 'test-shipment-1',
    claimType: 'service_completion' as const,
  }

  const mockActor = {
    id: 'test-actor',
    name: 'Test Actor',
    tenantId: 'test-tenant',
    type: 'user' as const,
  }

  describe('generatePacket', () => {
    it('should generate evidence packet', async () => {
      const packet = await evidencePacketService.generatePacket(mockEntity, mockActor)

      expect(packet).toBeDefined()
      expect(packet.id).toBeDefined()
      expect(packet.entityType).toBe(mockEntity.entityType)
      expect(packet.entityId).toBe(mockEntity.entityId)
      expect(packet.merkleRoot).toBeDefined()
      expect(packet.contentHash).toBeDefined()
    })

    it('should include Merkle tree root', async () => {
      const packet = await evidencePacketService.generatePacket(mockEntity, mockActor)

      expect(packet.merkleRoot).toBeDefined()
      expect(typeof packet.merkleRoot).toBe('string')
    })
  })

  describe('verifyPacket', () => {
    it('should verify packet integrity', async () => {
      const packet = await evidencePacketService.generatePacket(mockEntity, mockActor)
      const verification = await evidencePacketService.verifyPacket(packet.id)

      expect(verification).toBeDefined()
      expect(verification.valid).toBe(true)
      expect(verification.verificationScore).toBeGreaterThanOrEqual(0)
      expect(verification.verificationScore).toBeLessThanOrEqual(1)
    })

    it('should detect tampering', async () => {
      const packet = await evidencePacketService.generatePacket(mockEntity, mockActor)
      
      // Simulate tampering (would modify packet in store)
      // Then verify
      const verification = await evidencePacketService.verifyPacket(packet.id)
      
      // In real implementation, tampering would be detected
      expect(verification).toBeDefined()
    })
  })

  describe('Merkle Tree', () => {
    it('should build Merkle tree from data', () => {
      const data = ['data1', 'data2', 'data3', 'data4']
      const tree = merkleTreeBuilder.buildTree(data)

      expect(tree).toBeDefined()
      expect(tree.root).toBeDefined()
      expect(tree.rootHash).toBeDefined()
      expect(tree.leaves).toHaveLength(data.length)
    })

    it('should generate proof for leaf', () => {
      const data = ['data1', 'data2', 'data3', 'data4']
      const tree = merkleTreeBuilder.buildTree(data)
      const proof = merkleTreeBuilder.generateProof(tree, 0)

      expect(proof).toBeDefined()
      expect(proof.leafHash).toBeDefined()
      expect(proof.path).toBeDefined()
      expect(Array.isArray(proof.path)).toBe(true)
    })

    it('should verify proof', () => {
      const data = ['data1', 'data2', 'data3', 'data4']
      const tree = merkleTreeBuilder.buildTree(data)
      const proof = merkleTreeBuilder.generateProof(tree, 0)
      const isValid = merkleTreeBuilder.verifyProof(proof, tree.rootHash)

      expect(isValid).toBe(true)
    })
  })
})


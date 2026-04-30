/**
 * MCP Tools - Evidence
 */

import type { MCPServer } from '../server'

export function registerEvidenceTools(server: MCPServer): void {
  // Enhanced evidence_create
  server.registerTool({
    name: 'evidence_create',
    description: 'Create evidence record with chain of custody',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Evidence type' },
        data: { type: 'object', description: 'Evidence data' },
        source: { type: 'string', description: 'Evidence source' },
        tenantId: { type: 'string', description: 'Tenant ID' },
      },
      required: ['type', 'data'],
    },
    handler: async (params) => {
      try {
        const { evidenceService } = await import('@/lib/services/evidence/evidenceService')
        const evidence = await evidenceService.createEvidence({
          type: params.type,
          data: params.data,
          source: params.source,
          tenantId: params.tenantId,
        })
        return evidence
      } catch (error: any) {
        throw new Error(`Failed to create evidence: ${error.message}`)
      }
    },
  })

  // generate_evidence_packet
  server.registerTool({
    name: 'generate_evidence_packet',
    description: 'Generate evidence packet with all related evidence',
    inputSchema: {
      type: 'object',
      properties: {
        entityId: { type: 'string', description: 'Entity ID to generate packet for' },
        entityType: { type: 'string', description: 'Entity type' },
        tenantId: { type: 'string', description: 'Tenant ID' },
      },
      required: ['entityId', 'entityType', 'tenantId'],
    },
    handler: async (params) => {
      try {
        const { evidenceService } = await import('@/lib/services/evidence/evidenceService')
        const packet = await evidenceService.generatePacket(params.entityId, params.entityType, params.tenantId)
        return packet
      } catch (error: any) {
        throw new Error(`Failed to generate evidence packet: ${error.message}`)
      }
    },
  })
}


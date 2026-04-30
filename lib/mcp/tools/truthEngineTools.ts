/**
 * MCP Tools - Truth Engine
 */

import type { MCPServer } from '../server'

export function registerTruthEngineTools(server: MCPServer): void {
  // verify_claim
  server.registerTool({
    name: 'verify_claim',
    description: 'Verify claim using truth engine',
    inputSchema: {
      type: 'object',
      properties: {
        claim: { type: 'string', description: 'Claim to verify' },
        context: { type: 'object', description: 'Additional context' },
        tenantId: { type: 'string', description: 'Tenant ID' },
      },
      required: ['claim', 'tenantId'],
    },
    handler: async (params) => {
      try {
        const { truthEngineService } = await import('@/lib/services/truth-engine/truthEngineService')
        const result = await truthEngineService.verifyClaim({
          claim: params.claim,
          context: params.context || {},
          tenantId: params.tenantId,
        })
        return result
      } catch (error: any) {
        throw new Error(`Failed to verify claim: ${error.message}`)
      }
    },
  })
}


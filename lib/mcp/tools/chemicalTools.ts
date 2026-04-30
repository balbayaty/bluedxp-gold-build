/**
 * MCP Tools - Chemical Safety
 */

import type { MCPServer } from '../server'

export function registerChemicalTools(server: MCPServer): void {
  // check_chemical_compatibility
  server.registerTool({
    name: 'check_chemical_compatibility',
    description: 'Check chemical compatibility and safety',
    inputSchema: {
      type: 'object',
      properties: {
        chemical1: { type: 'string', description: 'First chemical CAS number or name' },
        chemical2: { type: 'string', description: 'Second chemical CAS number or name' },
        tenantId: { type: 'string', description: 'Tenant ID' },
      },
      required: ['chemical1', 'chemical2'],
    },
    handler: async (params) => {
      try {
        const { chemicalCompatibilityService } = await import('@/lib/services/ml/chemical-compatibility')
        // Convert params to ChemicalProperties format
        const chemical1 = typeof params.chemical1 === 'string' 
          ? { id: params.chemical1, name: params.chemical1 } 
          : params.chemical1
        const chemical2 = typeof params.chemical2 === 'string'
          ? { id: params.chemical2, name: params.chemical2 }
          : params.chemical2
        const result = await chemicalCompatibilityService.predictCompatibility(chemical1, chemical2)
        return result
      } catch (error: any) {
        // Fallback if service doesn't exist
        return {
          compatible: false,
          riskLevel: 'unknown',
          message: 'Compatibility check service not available',
          warnings: [],
        }
      }
    },
  })

  // approve_msds
  server.registerTool({
    name: 'approve_msds',
    description: 'Approve MSDS document through workflow',
    inputSchema: {
      type: 'object',
      properties: {
        msdsId: { type: 'string', description: 'MSDS document ID' },
        approverId: { type: 'string', description: 'User ID of approver' },
        tenantId: { type: 'string', description: 'Tenant ID' },
        comments: { type: 'string', description: 'Approval comments' },
      },
      required: ['msdsId', 'approverId'],
    },
    handler: async (params) => {
      try {
        const { msdsService } = await import('@/lib/services/chemical/msdsService')
        const result = await msdsService.approveMSDS(params.msdsId, params.approverId, params.tenantId, params.comments)
        return result
      } catch (error: any) {
        throw new Error(`Failed to approve MSDS: ${error.message}`)
      }
    },
  })
}


/**
 * MCP Tools - Compliance
 */

import type { MCPServer } from '../server'

export function registerComplianceTools(server: MCPServer): void {
  // get_compliance_status
  server.registerTool({
    name: 'get_compliance_status',
    description: 'Get compliance dashboard status',
    inputSchema: {
      type: 'object',
      properties: {
        tenantId: { type: 'string', description: 'Tenant ID' },
        module: { type: 'string', description: 'Module to check (optional)' },
      },
      required: ['tenantId'],
    },
    handler: async (params) => {
      try {
        const { complianceService } = await import('@/lib/services/compliance/complianceService')
        const status = await complianceService.getComplianceStatus(params.tenantId, params.module)
        return status
      } catch (error: any) {
        throw new Error(`Failed to get compliance status: ${error.message}`)
      }
    },
  })
}


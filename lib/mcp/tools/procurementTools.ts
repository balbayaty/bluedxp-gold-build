/**
 * MCP Tools - Procurement & RFQ
 */

import type { MCPServer } from '../server'

export function registerProcurementTools(server: MCPServer): void {
  // get_vendor_score
  server.registerTool({
    name: 'get_vendor_score',
    description: 'Get vendor performance score',
    inputSchema: {
      type: 'object',
      properties: {
        vendorId: { type: 'string', description: 'Vendor ID' },
        tenantId: { type: 'string', description: 'Tenant ID' },
      },
      required: ['vendorId'],
    },
    handler: async (params) => {
      try {
        // Try to import vendor service
        const vendorService = await import('@/lib/services/procurement/vendorService').catch(() => null)
        if (vendorService?.vendorService) {
          const score = await vendorService.vendorService.getVendorScore(params.vendorId, params.tenantId)
          return score
        }
        // Fallback
        return {
          vendorId: params.vendorId,
          overallScore: 0,
          metrics: {},
          message: 'Vendor service not available',
        }
      } catch (error: any) {
        throw new Error(`Failed to get vendor score: ${error.message}`)
      }
    },
  })

  // create_rfq
  server.registerTool({
    name: 'create_rfq',
    description: 'Create Request for Quotation',
    inputSchema: {
      type: 'object',
      properties: {
        items: { type: 'array', description: 'Items to quote', items: { type: 'object' } },
        tenantId: { type: 'string', description: 'Tenant ID' },
        dueDate: { type: 'string', description: 'RFQ due date (ISO string)' },
      },
      required: ['items', 'tenantId'],
    },
    handler: async (params) => {
      try {
        const { rfqService } = await import('@/lib/services/proposals/RFQService')
        const rfq = await rfqService.createRFQ({
          tenantId: params.tenantId,
          items: params.items,
          dueDate: params.dueDate ? new Date(params.dueDate) : undefined,
        })
        return rfq
      } catch (error: any) {
        throw new Error(`Failed to create RFQ: ${error.message}`)
      }
    },
  })
}


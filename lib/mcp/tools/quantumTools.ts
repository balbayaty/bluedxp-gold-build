/**
 * MCP Tools - Quantum Logistics (Schrödinger's Truck)
 */

import type { MCPServer } from '../server'

export function registerQuantumTools(server: MCPServer): void {
  // get_shipment_quantum_state
  server.registerTool({
    name: 'get_shipment_quantum_state',
    description: 'Get quantum state for a shipment (superposition of possible states)',
    inputSchema: {
      type: 'object',
      properties: {
        shipmentId: { type: 'string', description: 'Shipment ID' },
        tenantId: { type: 'string', description: 'Tenant ID' },
      },
      required: ['shipmentId'],
    },
    handler: async (params) => {
      try {
        const { schrodingersTruckService } = await import('@/lib/services/schrodingers-truck/service')
        const state = await schrodingersTruckService.getQuantumState(params.shipmentId, params.tenantId)
        return state
      } catch (error: any) {
        throw new Error(`Failed to get quantum state: ${error.message}`)
      }
    },
  })

  // collapse_quantum_state
  server.registerTool({
    name: 'collapse_quantum_state',
    description: 'Trigger state collapse for a shipment (observe and fix state)',
    inputSchema: {
      type: 'object',
      properties: {
        shipmentId: { type: 'string', description: 'Shipment ID' },
        tenantId: { type: 'string', description: 'Tenant ID' },
        preferredState: { type: 'string', description: 'Preferred state to collapse to' },
      },
      required: ['shipmentId'],
    },
    handler: async (params) => {
      try {
        const { schrodingersTruckService } = await import('@/lib/services/schrodingers-truck/service')
        const result = await schrodingersTruckService.collapseState(
          params.shipmentId,
          params.tenantId,
          params.preferredState
        )
        return result
      } catch (error: any) {
        throw new Error(`Failed to collapse state: ${error.message}`)
      }
    },
  })
}


/**
 * MCP Tools - QHSE (Quality, Health, Safety, Environment)
 */

import type { MCPServer } from '../server'

export function registerQHSETools(server: MCPServer): void {
  // report_incident
  server.registerTool({
    name: 'report_incident',
    description: 'Report QHSE incident',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Incident type (safety, quality, environmental, health)' },
        severity: { type: 'string', description: 'Severity level' },
        description: { type: 'string', description: 'Incident description' },
        location: { type: 'string', description: 'Location' },
        reportedBy: { type: 'string', description: 'User ID who reported' },
        tenantId: { type: 'string', description: 'Tenant ID' },
      },
      required: ['type', 'severity', 'description', 'reportedBy', 'tenantId'],
    },
    handler: async (params) => {
      try {
        const { incidentService } = await import('@/lib/services/qhse/incidentService')
        const incident = await incidentService.createIncident({
          type: params.type,
          severity: params.severity,
          description: params.description,
          location: params.location,
          reportedBy: params.reportedBy,
          tenantId: params.tenantId,
        })
        return incident
      } catch (error: any) {
        throw new Error(`Failed to report incident: ${error.message}`)
      }
    },
  })
}


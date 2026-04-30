/**
 * Example: Enhanced MCP Tool Registration
 * 
 * Shows how to register tools with enhanced metadata
 * Use this as a template for migrating existing tools
 * 
 * @module mcp
 */

import { enhancedMCPServer } from '../enhanced-server'
import { createTransportationToolMetadata } from './toolMetadata'
import type { EnhancedMCPTool } from '../enhanced-server'

/**
 * Example: Enhanced tool registration with full metadata
 */
export function registerEnhancedTransportationTool(): void {
  enhancedMCPServer.registerTool({
    name: 'track_shipment_enhanced',
    description: 'Track shipment with enhanced features including caching, rate limiting, and analytics',
    inputSchema: {
      type: 'object',
      properties: {
        shipmentId: {
          type: 'string',
          description: 'Shipment ID to track',
        },
        tenantId: {
          type: 'string',
          description: 'Tenant ID',
        },
        includeJourney: {
          type: 'boolean',
          description: 'Include journey analysis',
          default: false,
        },
      },
      required: ['shipmentId', 'tenantId'],
    },
    handler: async (params) => {
      // Tool implementation
      return {
        shipmentId: params.shipmentId,
        status: 'IN_TRANSIT',
        location: { lat: 24.7136, lng: 46.6753 },
      }
    },
    metadata: createTransportationToolMetadata({
      version: '1.0.0',
      tags: ['tracking', 'real-time', 'shipment', 'transportation'],
      author: 'BlueDXP Team',
      description: 'Track shipment in real-time',
      longDescription: 'Get comprehensive tracking information for shipments including current location, status, estimated delivery, and tracking events. Supports multi-modal transportation tracking.',
      examples: [
        {
          input: { shipmentId: 'SH-123', tenantId: 'tenant-1' },
          output: { shipmentId: 'SH-123', status: 'IN_TRANSIT', location: { lat: 24.7136, lng: 46.6753 } },
        },
      ],
      permissions: ['shipment:read', 'shipment:track'],
      rateLimit: {
        requests: 100,
        window: 60, // 100 requests per minute
      },
      cacheable: true,
      cacheTTL: 30, // Cache for 30 seconds
      timeout: 15000, // 15 second timeout
      retries: 1,
      batchable: true,
      streaming: false,
      status: 'ACTIVE',
      healthCheck: async () => {
        // Check if transportation service is healthy
        try {
          // const health = await transportationService.healthCheck()
          return true
        } catch {
          return false
        }
      },
    }),
  })
}

/**
 * Example: Streaming tool
 */
export function registerStreamingTool(): void {
  enhancedMCPServer.registerTool({
    name: 'stream_shipment_updates',
    description: 'Stream real-time shipment updates',
    inputSchema: {
      type: 'object',
      properties: {
        shipmentId: { type: 'string' },
        tenantId: { type: 'string' },
      },
      required: ['shipmentId', 'tenantId'],
    },
    handler: async (params) => {
      // Fallback for non-streaming clients
      throw new Error('This tool requires streaming. Use streamTool() method.')
    },
    streamHandler: async function* (params) {
      // Stream implementation
      for (let i = 0; i < 10; i++) {
        yield {
          update: i + 1,
          timestamp: new Date().toISOString(),
          data: { status: 'IN_TRANSIT', location: { lat: 24.7136, lng: 46.6753 } },
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    },
    metadata: createTransportationToolMetadata({
      version: '1.0.0',
      tags: ['streaming', 'real-time', 'shipment'],
      streaming: true,
      cacheable: false, // Streaming tools shouldn't be cached
      timeout: 60000, // 60 seconds for streaming
    }),
  })
}














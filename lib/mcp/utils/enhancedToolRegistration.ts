/**
 * Enhanced Tool Registration Helpers
 * 
 * Utilities to register tools with enhanced metadata
 * Use these helpers to migrate existing tools
 * 
 * @module mcp
 */

import { enhancedMCPServer } from '../enhanced-server'
import type { EnhancedMCPTool } from '../enhanced-server'
import {
  createTransportationToolMetadata,
  createWarehouseToolMetadata,
  createComplianceToolMetadata,
  createAnalyticsToolMetadata,
  createIntelligenceToolMetadata,
  createCoreToolMetadata,
  createAdvancedToolMetadata,
} from './toolMetadata'

/**
 * Register enhanced transportation tool
 */
export function registerEnhancedTransportationTool(tool: Omit<EnhancedMCPTool, 'metadata'> & {
  metadata?: Partial<import('../enhanced-server').ToolMetadata>
}): void {
  enhancedMCPServer.registerTool({
    ...tool,
    metadata: createTransportationToolMetadata({
      version: '1.0.0',
      tags: ['transportation', 'tms'],
      ...tool.metadata,
    }),
  })
}

/**
 * Register enhanced warehouse tool
 */
export function registerEnhancedWarehouseTool(tool: Omit<EnhancedMCPTool, 'metadata'> & {
  metadata?: Partial<import('../enhanced-server').ToolMetadata>
}): void {
  enhancedMCPServer.registerTool({
    ...tool,
    metadata: createWarehouseToolMetadata({
      version: '1.0.0',
      tags: ['warehouse', 'wms'],
      ...tool.metadata,
    }),
  })
}

/**
 * Register enhanced compliance tool
 */
export function registerEnhancedComplianceTool(tool: Omit<EnhancedMCPTool, 'metadata'> & {
  metadata?: Partial<import('../enhanced-server').ToolMetadata>
}): void {
  enhancedMCPServer.registerTool({
    ...tool,
    metadata: createComplianceToolMetadata({
      version: '1.0.0',
      tags: ['compliance', 'regulatory'],
      ...tool.metadata,
    }),
  })
}

/**
 * Register enhanced analytics tool
 */
export function registerEnhancedAnalyticsTool(tool: Omit<EnhancedMCPTool, 'metadata'> & {
  metadata?: Partial<import('../enhanced-server').ToolMetadata>
}): void {
  enhancedMCPServer.registerTool({
    ...tool,
    metadata: createAnalyticsToolMetadata({
      version: '1.0.0',
      tags: ['analytics', 'intelligence'],
      ...tool.metadata,
    }),
  })
}

/**
 * Register enhanced intelligence tool
 */
export function registerEnhancedIntelligenceTool(tool: Omit<EnhancedMCPTool, 'metadata'> & {
  metadata?: Partial<import('../enhanced-server').ToolMetadata>
}): void {
  enhancedMCPServer.registerTool({
    ...tool,
    metadata: createIntelligenceToolMetadata({
      version: '1.0.0',
      tags: ['intelligence', 'ai', 'ml'],
      ...tool.metadata,
    }),
  })
}

/**
 * Register enhanced core tool
 */
export function registerEnhancedCoreTool(tool: Omit<EnhancedMCPTool, 'metadata'> & {
  metadata?: Partial<import('../enhanced-server').ToolMetadata>
}): void {
  enhancedMCPServer.registerTool({
    ...tool,
    metadata: createCoreToolMetadata({
      version: '1.0.0',
      tags: ['core', 'system'],
      ...tool.metadata,
    }),
  })
}

/**
 * Register enhanced advanced tool
 */
export function registerEnhancedAdvancedTool(tool: Omit<EnhancedMCPTool, 'metadata'> & {
  metadata?: Partial<import('../enhanced-server').ToolMetadata>
}): void {
  enhancedMCPServer.registerTool({
    ...tool,
    metadata: createAdvancedToolMetadata({
      version: '1.0.0',
      tags: ['advanced', 'experimental'],
      ...tool.metadata,
    }),
  })
}














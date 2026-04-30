/**
 * MCP Tool Migration Utilities
 * 
 * Helpers to migrate existing tools to enhanced format
 * 
 * @module mcp
 */

import type { MCPTool } from '../server'
import type { EnhancedMCPTool, ToolCategory } from '../enhanced-server'
import { createToolMetadata } from './toolMetadata'

/**
 * Migrate simple tool to enhanced tool
 */
export function migrateToolToEnhanced(
  tool: MCPTool,
  category: ToolCategory,
  metadataOverrides?: Partial<import('../enhanced-server').ToolMetadata>
): EnhancedMCPTool {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    handler: tool.handler,
    metadata: createToolMetadata(category, {
      description: tool.description,
      ...metadataOverrides,
    }),
  }
}

/**
 * Infer category from tool name
 */
export function inferCategoryFromToolName(toolName: string): ToolCategory {
  const name = toolName.toLowerCase()
  
  if (name.includes('shipment') || name.includes('route') || name.includes('carrier') || name.includes('transport')) {
    return 'TRANSPORTATION'
  }
  if (name.includes('inventory') || name.includes('warehouse') || name.includes('putaway') || name.includes('picking')) {
    return 'WAREHOUSE'
  }
  if (name.includes('compliance') || name.includes('customs') || name.includes('regulatory')) {
    return 'COMPLIANCE'
  }
  if (name.includes('analyze') || name.includes('insight') || name.includes('predict')) {
    return 'ANALYTICS'
  }
  if (name.includes('intelligence') || name.includes('mining') || name.includes('root_cause')) {
    return 'INTELLIGENCE'
  }
  if (name.includes('quantum') || name.includes('psychology') || name.includes('advanced')) {
    return 'ADVANCED'
  }
  
  return 'CORE'
}














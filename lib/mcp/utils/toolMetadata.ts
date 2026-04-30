/**
 * MCP Tool Metadata Utilities
 * 
 * Helper functions for creating tool metadata with defaults
 * 
 * @module mcp
 */

import type { ToolMetadata, ToolCategory, ToolStatus } from '../enhanced-server'

/**
 * Create default metadata for a tool
 */
export function createToolMetadata(
  category: ToolCategory,
  overrides?: Partial<ToolMetadata>
): ToolMetadata {
  return {
    version: '1.0.0',
    category,
    tags: [],
    description: '',
    status: 'ACTIVE',
    cacheable: false,
    timeout: 30000,
    retries: 0,
    streaming: false,
    batchable: false,
    ...overrides,
  }
}

/**
 * Create metadata for transportation tools
 */
export function createTransportationToolMetadata(overrides?: Partial<ToolMetadata>): ToolMetadata {
  return createToolMetadata('TRANSPORTATION', {
    tags: ['transportation', 'tms', 'shipment'],
    ...overrides,
  })
}

/**
 * Create metadata for warehouse tools
 */
export function createWarehouseToolMetadata(overrides?: Partial<ToolMetadata>): ToolMetadata {
  return createToolMetadata('WAREHOUSE', {
    tags: ['warehouse', 'wms', 'inventory'],
    ...overrides,
  })
}

/**
 * Create metadata for compliance tools
 */
export function createComplianceToolMetadata(overrides?: Partial<ToolMetadata>): ToolMetadata {
  return createToolMetadata('COMPLIANCE', {
    tags: ['compliance', 'regulatory', 'customs'],
    ...overrides,
  })
}

/**
 * Create metadata for analytics tools
 */
export function createAnalyticsToolMetadata(overrides?: Partial<ToolMetadata>): ToolMetadata {
  return createToolMetadata('ANALYTICS', {
    tags: ['analytics', 'intelligence', 'insights'],
    ...overrides,
  })
}

/**
 * Create metadata for intelligence tools
 */
export function createIntelligenceToolMetadata(overrides?: Partial<ToolMetadata>): ToolMetadata {
  return createToolMetadata('INTELLIGENCE', {
    tags: ['intelligence', 'ai', 'ml', 'analytics'],
    ...overrides,
  })
}

/**
 * Create metadata for core tools
 */
export function createCoreToolMetadata(overrides?: Partial<ToolMetadata>): ToolMetadata {
  return createToolMetadata('CORE', {
    tags: ['core', 'system'],
    ...overrides,
  })
}

/**
 * Create metadata for advanced tools
 */
export function createAdvancedToolMetadata(overrides?: Partial<ToolMetadata>): ToolMetadata {
  return createToolMetadata('ADVANCED', {
    tags: ['advanced', 'experimental'],
    status: 'BETA',
    ...overrides,
  })
}














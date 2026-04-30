/**
 * MCP (Model Context Protocol) Server
 * Provides tools and context for LLM interactions with BlueDXP Platform
 * 
 * NOTE: This is the legacy simple server. For enhanced features, use EnhancedMCPServer.
 * This server is kept for backward compatibility and wraps the enhanced server.
 */

import { enhancedMCPServer, type EnhancedMCPTool } from './enhanced-server'
import { createToolMetadata } from './utils/toolMetadata'

export interface MCPTool {
  name: string
  description: string
  inputSchema: any
  handler: (params: any) => Promise<any>
}

export class MCPServer {
  private tools: Map<string, MCPTool> = new Map()
  private enhancedServer = enhancedMCPServer

  /**
   * Register MCP tool
   * Also registers with enhanced server for analytics and advanced features
   */
  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool)
    
    // Also register with enhanced server for backward compatibility
    // Extract category from tool name or use CORE as default
    const category = this.inferCategory(tool.name)
    
    const enhancedTool: EnhancedMCPTool = {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      handler: tool.handler,
      metadata: createToolMetadata(category, {
        description: tool.description,
      }),
    }
    
    this.enhancedServer.registerTool(enhancedTool)
  }
  
  /**
   * Infer category from tool name
   */
  private inferCategory(toolName: string): 'TRANSPORTATION' | 'WAREHOUSE' | 'COMPLIANCE' | 'ANALYTICS' | 'INTELLIGENCE' | 'CORE' | 'ADVANCED' {
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
    
    return 'CORE'
  }

  /**
   * List all available tools
   */
  listTools(): MCPTool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Execute tool
   * Uses enhanced server for execution with enterprise features
   */
  async executeTool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`Tool ${name} not found`)
    }

    // Use enhanced server for execution (includes caching, rate limiting, etc.)
    const result = await this.enhancedServer.executeTool(name, params, {
      tenantId: params.tenantId,
      userId: params.userId,
    })

    if (!result.success) {
      throw new Error(result.error || 'Tool execution failed')
    }

    return result.data
  }
  
  /**
   * Get enhanced server instance (for advanced features)
   */
  getEnhancedServer() {
    return this.enhancedServer
  }

  /**
   * Initialize MCP server with BlueDXP tools
   */
  async initialize(): Promise<void> {
    // Register all tool modules
    try {
      const { registerKnowledgeTools } = await import('./tools/knowledgeTools')
      registerKnowledgeTools(this)
    } catch (error) {
      console.warn('Failed to register knowledge tools:', error)
    }

    try {
      const { registerQuantumTools } = await import('./tools/quantumTools')
      registerQuantumTools(this)
    } catch (error) {
      console.warn('Failed to register quantum tools:', error)
    }

    try {
      const { registerChemicalTools } = await import('./tools/chemicalTools')
      registerChemicalTools(this)
    } catch (error) {
      console.warn('Failed to register chemical tools:', error)
    }

    try {
      const { registerProcurementTools } = await import('./tools/procurementTools')
      registerProcurementTools(this)
    } catch (error) {
      console.warn('Failed to register procurement tools:', error)
    }

    try {
      const { registerComplianceTools } = await import('./tools/complianceTools')
      registerComplianceTools(this)
    } catch (error) {
      console.warn('Failed to register compliance tools:', error)
    }

    try {
      const { registerQHSETools } = await import('./tools/qhseTools')
      registerQHSETools(this)
    } catch (error) {
      console.warn('Failed to register QHSE tools:', error)
    }

    try {
      const { registerTruthEngineTools } = await import('./tools/truthEngineTools')
      registerTruthEngineTools(this)
    } catch (error) {
      console.warn('Failed to register truth engine tools:', error)
    }

    try {
      const { registerEvidenceTools } = await import('./tools/evidenceTools')
      registerEvidenceTools(this)
    } catch (error) {
      console.warn('Failed to register evidence tools:', error)
    }

    // Register graph tools
    this.registerTool({
      name: 'graph_query',
      description: 'Query entity graph',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Graph query' },
          tenantId: { type: 'string', description: 'Tenant ID' },
        },
        required: ['query'],
      },
      handler: async (params) => {
        try {
          const { entityGraphService } = await import('@/lib/services/graph')
          const result = await entityGraphService.query(params.query, params.tenantId)
          return result
        } catch (error: any) {
          throw new Error(`Failed to query graph: ${error.message}`)
        }
      },
    })

    // Register agent tools
    this.registerTool({
      name: 'agent_execute',
      description: 'Execute agent task',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'Agent ID' },
          task: { type: 'string', description: 'Task to execute' },
          params: { type: 'object', description: 'Task parameters' },
          tenantId: { type: 'string', description: 'Tenant ID' },
        },
        required: ['agentId', 'task'],
      },
      handler: async (params) => {
        try {
          const { agentOrchestrator } = await import('@/lib/services/agents/agentOrchestrator')
          const result = await agentOrchestrator.executeTask(params.agentId, params.task, params.params, params.tenantId)
          return result
        } catch (error: any) {
          throw new Error(`Failed to execute agent task: ${error.message}`)
        }
      },
    })

    // Register Schrödinger's Truck quantum logistics tools
    try {
      const { registerMCPTools } = await import('@/lib/services/schrodingers-truck/mcp-tool')
      registerMCPTools(this)
    } catch (error) {
      console.warn('Failed to register quantum logistics MCP tools:', error)
    }

    // Register Cargo Psychology tools
    try {
      const { registerMCPTools } = await import('@/lib/services/cargo-psychology/mcp-tool')
      registerMCPTools(this)
    } catch (error) {
      console.warn('Failed to register cargo psychology MCP tools:', error)
    }

    // Register Arabic NLP tools
    try {
      const { registerMCPTools } = await import('@/lib/services/nlp/arabic-nlp/mcp-tool')
      registerMCPTools(this)
    } catch (error) {
      console.warn('Failed to register Arabic NLP MCP tools:', error)
    }

    // Register Evidence Packet tools
    try {
      const { registerMCPTools } = await import('@/lib/services/evidence/mcp-tool')
      registerMCPTools(this)
    } catch (error) {
      console.warn('Failed to register Evidence Packet MCP tools:', error)
    }

    // Register Saudi Alignment tools
    try {
      const { registerMCPTools } = await import('@/lib/services/saudi-alignment/mcp-tool')
      registerMCPTools(this)
    } catch (error) {
      console.warn('Failed to register Saudi Alignment MCP tools:', error)
    }

    // Register Transportation tools (CRITICAL)
    try {
      const { registerMCPTools } = await import('@/lib/services/transportation/mcp-tool')
      registerMCPTools(this)
    } catch (error) {
      console.warn('Failed to register Transportation MCP tools:', error)
    }

    // Register WMS tools (CRITICAL)
    try {
      const { registerMCPTools } = await import('@/lib/services/wms/mcp-tool')
      registerMCPTools(this)
    } catch (error) {
      console.warn('Failed to register WMS MCP tools:', error)
    }

    // Register Customs tools (CRITICAL)
    try {
      const { registerMCPTools } = await import('@/lib/services/customs/mcp-tool')
      registerMCPTools(this)
    } catch (error) {
      console.warn('Failed to register Customs MCP tools:', error)
    }

    // Register Trade Compliance tools (CRITICAL)
    try {
      const { registerMCPTools } = await import('@/lib/services/trade-compliance/mcp-tool')
      registerMCPTools(this)
    } catch (error) {
      console.warn('Failed to register Trade Compliance MCP tools:', error)
    }

    // Register Intelligence Analytics tools (CRITICAL)
    try {
      const { registerMCPTools } = await import('@/lib/services/intelligence-analytics/mcp-tool')
      registerMCPTools(this)
    } catch (error) {
      console.warn('Failed to register Intelligence Analytics MCP tools:', error)
    }

    // Register Business Intelligence tools (CRITICAL)
    try {
      const { registerMCPTools } = await import('@/lib/services/business-intelligence/mcp-tool')
      registerMCPTools(this)
    } catch (error) {
      console.warn('Failed to register Business Intelligence MCP tools:', error)
    }

    console.log('✅ MCP Server: Initialized with', this.tools.size, 'tools')
  }
}

export const mcpServer = new MCPServer()


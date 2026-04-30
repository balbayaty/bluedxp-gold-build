/**
 * MCP Tools - Knowledge Base
 */

import { knowledgeBaseService } from '@/lib/services/knowledge-base'
import type { MCPServer } from '../server'

export function registerKnowledgeTools(server: MCPServer): void {
  // Enhanced knowledge_base_query
  server.registerTool({
    name: 'knowledge_base_query',
    description: 'Query the knowledge base using semantic search',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        tenantId: { type: 'string', description: 'Tenant ID for isolation' },
        limit: { type: 'number', description: 'Maximum results', default: 10 },
        threshold: { type: 'number', description: 'Similarity threshold', default: 0.5 },
      },
      required: ['query'],
    },
    handler: async (params) => {
      const results = await knowledgeBaseService.search({
        query: params.query,
        tenantId: params.tenantId,
        limit: params.limit || 10,
        threshold: params.threshold || 0.5,
      })
      return { results: results.map(r => ({ entry: r.entry, score: r.score, highlights: r.highlights })) }
    },
  })

  // search_knowledge - RAG search
  server.registerTool({
    name: 'search_knowledge',
    description: 'RAG search across knowledge base with semantic similarity',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to search for' },
        tenantId: { type: 'string', description: 'Tenant ID' },
        limit: { type: 'number', description: 'Max results', default: 5 },
      },
      required: ['text'],
    },
    handler: async (params) => {
      const results = await knowledgeBaseService.semanticSearch(params.text, {
        tenantId: params.tenantId,
        limit: params.limit || 5,
      })
      return { results: results.map(r => ({ entry: r.entry, score: r.score })) }
    },
  })
}


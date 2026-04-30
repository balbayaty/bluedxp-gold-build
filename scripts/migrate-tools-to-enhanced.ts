/**
 * MCP Tool Migration Script
 * 
 * Migrates existing tools to enhanced format
 * Run with: ts-node --project tsconfig.scripts.json scripts/migrate-tools-to-enhanced.ts
 */

import { mcpServer, enhancedMCPServer } from '../lib/mcp'
import { migrateToolToEnhanced, inferCategoryFromToolName } from '../lib/mcp/utils/migrateTools'
import type { MCPTool } from '../lib/mcp/server'

async function main() {
  console.log('🔄 Starting MCP tool migration to enhanced format...\n')

  try {
    // Initialize legacy server to get all tools
    await mcpServer.initialize()
    
    const legacyTools = mcpServer.listTools()
    console.log(`Found ${legacyTools.length} tools to migrate\n`)

    let migrated = 0
    let skipped = 0

    for (const tool of legacyTools) {
      try {
        // Check if already registered in enhanced server
        const existing = enhancedMCPServer.getTool(tool.name)
        if (existing) {
          console.log(`⏭️  Skipping ${tool.name} (already in enhanced server)`)
          skipped++
          continue
        }

        // Infer category
        const category = inferCategoryFromToolName(tool.name)

        // Migrate tool
        const enhancedTool = migrateToolToEnhanced(tool, category, {
          version: '1.0.0',
          status: 'ACTIVE',
          cacheable: false, // Default to no caching
          timeout: 30000,
          retries: 0,
        })

        // Register with enhanced server
        enhancedMCPServer.registerTool(enhancedTool)
        
        console.log(`✅ Migrated ${tool.name} (category: ${category})`)
        migrated++
      } catch (error: any) {
        console.error(`❌ Failed to migrate ${tool.name}:`, error.message)
      }
    }

    console.log(`\n📊 Migration Summary:`)
    console.log(`   ✅ Migrated: ${migrated}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   📦 Total: ${legacyTools.length}`)

    const stats = enhancedMCPServer.getServerStats()
    console.log(`\n📈 Enhanced Server Stats:`)
    console.log(`   Total Tools: ${stats.totalTools}`)
    console.log(`   By Category:`, stats.toolsByCategory)
    console.log(`   By Status:`, stats.toolsByStatus)

    console.log('\n✅ Migration complete!')
  } catch (error: any) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()














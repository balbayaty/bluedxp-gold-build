/**
 * Service Initialization Script
 * Initialize all infrastructure services manually
 */

import { redisService } from '@/lib/services/cache/redisService'
import { kafkaClient } from '@/lib/services/kafka'
import { minioClient } from '@/lib/services/storage'
import { opensearchClient } from '@/lib/services/search'
import { objectStorageService } from '@/lib/services/storage'
import { searchService } from '@/lib/services/search'
import { mcpServer } from '@/lib/mcp'

async function initializeServices() {
  console.log('🚀 Initializing BlueDXP Infrastructure Services...\n')

  // Initialize Redis
  try {
    console.log('📦 Initializing Redis...')
    await redisService.initialize()
    const stats = await redisService.getStats()
    console.log('✅ Redis initialized:', stats)
  } catch (error) {
    console.error('❌ Redis initialization failed:', error)
  }

  // Initialize Kafka
  if (process.env.KAFKA_ENABLED === 'true' || process.env.KAFKA_BROKERS) {
    try {
      console.log('\n📦 Initializing Kafka...')
      await kafkaClient.initialize()
      const connected = await kafkaClient.testConnection()
      console.log('✅ Kafka initialized:', connected ? 'Connected' : 'Connection failed')
    } catch (error) {
      console.error('❌ Kafka initialization failed:', error)
    }
  }

  // Initialize MinIO
  if (process.env.MINIO_ENABLED === 'true' || process.env.MINIO_ENDPOINT) {
    try {
      console.log('\n📦 Initializing MinIO...')
      await minioClient.initialize()
      await objectStorageService.initialize()
      console.log('✅ MinIO initialized')
    } catch (error) {
      console.error('❌ MinIO initialization failed:', error)
    }
  }

  // Initialize OpenSearch
  if (process.env.OPENSEARCH_ENABLED === 'true' || process.env.OPENSEARCH_NODE) {
    try {
      console.log('\n📦 Initializing OpenSearch...')
      await opensearchClient.initialize()
      await searchService.initialize()
      console.log('✅ OpenSearch initialized')
    } catch (error) {
      console.error('❌ OpenSearch initialization failed:', error)
    }
  }

  // Initialize MCP Server
  if (process.env.MCP_ENABLED === 'true') {
    try {
      console.log('\n📦 Initializing MCP Server...')
      await mcpServer.initialize()
      console.log('✅ MCP Server initialized')
    } catch (error) {
      console.error('❌ MCP Server initialization failed:', error)
    }
  }

  console.log('\n🎉 Service initialization complete!')
}

// Run if executed directly
if (require.main === module) {
  initializeServices()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { initializeServices }


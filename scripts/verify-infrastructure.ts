/**
 * Infrastructure Verification Script
 * Tests all infrastructure services and reports status
 */

import { execSync } from 'child_process'

interface VerificationResult {
  service: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
}

const results: VerificationResult[] = []

function addResult(service: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
  results.push({ service, status, message, details })
  const icon = status === 'pass' ? '✅' : status === 'warning' ? '⚠️' : '❌'
  console.log(`${icon} ${service}: ${message}`)
}

async function checkRedis(): Promise<void> {
  try {
    const { redisService } = await import('@/lib/services/cache/redisService')
    await redisService.initialize()
    await redisService.set('test', 'value', { ttl: 10 })
    const value = await redisService.get('test')
    if (value === 'value') {
      addResult('Redis', 'pass', 'Redis cache working')
    } else {
      addResult('Redis', 'fail', 'Redis cache not working correctly')
    }
  } catch (error: any) {
    addResult('Redis', 'warning', `Redis not available: ${error.message}`)
  }
}

async function checkDatabase(): Promise<void> {
  try {
    const { prisma } = await import('@/lib/services/database/prismaClient')
    await prisma.$queryRaw`SELECT 1`
    addResult('Database', 'pass', 'PostgreSQL connection working')
  } catch (error: any) {
    addResult('Database', 'fail', `Database connection failed: ${error.message}`)
  }
}

async function checkKnowledgeBase(): Promise<void> {
  try {
    const { knowledgeBaseService } = await import('@/lib/services/knowledge-base')
    const entry = await knowledgeBaseService.create({
      tenantId: 'test',
      type: 'general',
      category: 'general',
      content: 'Test content',
      summary: 'Test',
      keywords: ['test'],
      searchableText: 'Test content',
      source: 'user_input',
      confidence: 100,
      verified: false,
      feedbackScore: 0,
      usageCount: 0,
      status: 'active',
    })
    if (entry) {
      addResult('Knowledge Base', 'pass', 'Knowledge Base with pgvector working')
    } else {
      addResult('Knowledge Base', 'fail', 'Knowledge Base create failed')
    }
  } catch (error: any) {
    addResult('Knowledge Base', 'warning', `Knowledge Base not fully available: ${error.message}`)
  }
}

async function checkOpenSearch(): Promise<void> {
  try {
    const { opensearchClient } = await import('@/lib/services/search/opensearchClient')
    await opensearchClient.initialize()
    if (opensearchClient.isEnabled()) {
      addResult('OpenSearch', 'pass', 'OpenSearch client connected')
    } else {
      addResult('OpenSearch', 'warning', 'OpenSearch client not enabled')
    }
  } catch (error: any) {
    addResult('OpenSearch', 'warning', `OpenSearch not available: ${error.message}`)
  }
}

async function checkLoki(): Promise<void> {
  try {
    const { logger } = await import('@/lib/services/observability/logger')
    logger.info('Test log message', { test: true })
    addResult('Loki Logger', 'pass', 'Logger initialized (Loki connection depends on LOKI_ENABLED)')
  } catch (error: any) {
    addResult('Loki Logger', 'warning', `Logger not fully available: ${error.message}`)
  }
}

async function checkPrometheus(): Promise<void> {
  try {
    const { metricsService } = await import('@/lib/services/observability/metrics')
    const metrics = await metricsService.exportPrometheusFormat()
    if (metrics && metrics.length > 0) {
      addResult('Prometheus Metrics', 'pass', 'Metrics endpoint working')
    } else {
      addResult('Prometheus Metrics', 'warning', 'Metrics endpoint available but no metrics')
    }
  } catch (error: any) {
    addResult('Prometheus Metrics', 'warning', `Metrics not available: ${error.message}`)
  }
}

async function checkJaeger(): Promise<void> {
  try {
    const { tracingService } = await import('@/lib/services/observability/tracing')
    await tracingService.initialize()
    const trace = tracingService.startTrace('test', 'test-operation')
    if (trace) {
      addResult('Jaeger Tracing', 'pass', 'Tracing service initialized')
    } else {
      addResult('Jaeger Tracing', 'warning', 'Tracing service initialized but may not be connected to Jaeger')
    }
  } catch (error: any) {
    addResult('Jaeger Tracing', 'warning', `Tracing not fully available: ${error.message}`)
  }
}

async function checkSentry(): Promise<void> {
  try {
    const { errorTrackingService } = await import('@/lib/services/observability/errorTracking')
    await errorTrackingService.initialize()
    addResult('Sentry Error Tracking', 'pass', 'Error tracking service initialized (Sentry connection depends on SENTRY_DSN)')
  } catch (error: any) {
    addResult('Sentry Error Tracking', 'warning', `Error tracking not fully available: ${error.message}`)
  }
}

async function checkMCPTools(): Promise<void> {
  try {
    const { mcpServer } = await import('@/lib/mcp/server')
    await mcpServer.initialize()
    const tools = mcpServer.listTools()
    if (tools.length >= 11) {
      addResult('MCP Tools', 'pass', `All ${tools.length} MCP tools registered`)
    } else {
      addResult('MCP Tools', 'warning', `Only ${tools.length} MCP tools registered (expected 11+)`)
    }
  } catch (error: any) {
    addResult('MCP Tools', 'fail', `MCP tools not available: ${error.message}`)
  }
}

async function checkDocker(): Promise<void> {
  try {
    execSync('docker ps', { stdio: 'ignore' })
    addResult('Docker', 'pass', 'Docker is running')
  } catch (error) {
    addResult('Docker', 'fail', 'Docker is not running or not available')
  }
}

async function checkAPIEndpoints(): Promise<void> {
  try {
    // Check health endpoint
    const healthUrl = process.env.APP_URL || 'http://localhost:3002'
    const response = await fetch(`${healthUrl}/api/health`)
    if (response.ok) {
      addResult('API Health Endpoint', 'pass', 'Health endpoint responding')
    } else {
      addResult('API Health Endpoint', 'fail', `Health endpoint returned ${response.status}`)
    }

    // Check metrics endpoint
    const metricsResponse = await fetch(`${healthUrl}/api/metrics`)
    if (metricsResponse.ok) {
      addResult('API Metrics Endpoint', 'pass', 'Metrics endpoint responding')
    } else {
      addResult('API Metrics Endpoint', 'warning', `Metrics endpoint returned ${metricsResponse.status}`)
    }
  } catch (error: any) {
    addResult('API Endpoints', 'warning', `API endpoints not accessible: ${error.message}`)
  }
}

async function runAllChecks(): Promise<void> {
  console.log('🔍 Starting infrastructure verification...\n')

  await checkDocker()
  await checkRedis()
  await checkDatabase()
  await checkKnowledgeBase()
  await checkOpenSearch()
  await checkLoki()
  await checkPrometheus()
  await checkJaeger()
  await checkSentry()
  await checkMCPTools()
  await checkAPIEndpoints()

  console.log('\n📊 Verification Summary:')
  console.log('='.repeat(50))
  
  const passed = results.filter(r => r.status === 'pass').length
  const warnings = results.filter(r => r.status === 'warning').length
  const failed = results.filter(r => r.status === 'fail').length

  console.log(`✅ Passed: ${passed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📋 Total: ${results.length}`)

  if (failed > 0) {
    console.log('\n❌ Failed Services:')
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - ${r.service}: ${r.message}`)
    })
  }

  if (warnings > 0) {
    console.log('\n⚠️  Warnings:')
    results.filter(r => r.status === 'warning').forEach(r => {
      console.log(`  - ${r.service}: ${r.message}`)
    })
  }

  console.log('\n' + '='.repeat(50))

  if (failed === 0) {
    console.log('✅ All critical services are working!')
    process.exit(0)
  } else {
    console.log('❌ Some services failed. Please check the errors above.')
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runAllChecks().catch((error) => {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  })
}

export { runAllChecks }


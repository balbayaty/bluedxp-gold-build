/**
 * Service Connectivity Checker
 * Tests connectivity to all infrastructure services
 */

import { execSync } from 'child_process'

interface ConnectivityResult {
  service: string
  status: 'connected' | 'disconnected' | 'error'
  message: string
  latency?: number
}

const results: ConnectivityResult[] = []

function addResult(service: string, status: 'connected' | 'disconnected' | 'error', message: string, latency?: number) {
  results.push({ service, status, message, latency })
}

async function checkPostgreSQL() {
  try {
    const start = Date.now()
    execSync('docker-compose exec -T postgres psql -U bluedxp -d bluedxp -c "SELECT 1"', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    const latency = Date.now() - start
    addResult('PostgreSQL', 'connected', 'Database accessible', latency)
  } catch (error) {
    addResult('PostgreSQL', 'disconnected', 'Cannot connect to database')
  }
}

async function checkRedis() {
  try {
    const start = Date.now()
    execSync('docker-compose exec -T redis redis-cli ping', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    const latency = Date.now() - start
    addResult('Redis', 'connected', 'Redis accessible', latency)
  } catch (error) {
    addResult('Redis', 'disconnected', 'Cannot connect to Redis')
  }
}

async function checkKafka() {
  try {
    const start = Date.now()
    execSync('docker-compose exec -T kafka kafka-broker-api-versions --bootstrap-server localhost:9092', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    const latency = Date.now() - start
    addResult('Kafka', 'connected', 'Kafka accessible', latency)
  } catch (error) {
    addResult('Kafka', 'disconnected', 'Cannot connect to Kafka')
  }
}

async function checkMinIO() {
  try {
    const start = Date.now()
    execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/minio/health/live', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    const latency = Date.now() - start
    addResult('MinIO', 'connected', 'MinIO accessible', latency)
  } catch (error) {
    addResult('MinIO', 'disconnected', 'Cannot connect to MinIO')
  }
}

async function checkOpenSearch() {
  try {
    const start = Date.now()
    execSync('curl -s http://localhost:9200/_cluster/health', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    const latency = Date.now() - start
    addResult('OpenSearch', 'connected', 'OpenSearch accessible', latency)
  } catch (error) {
    addResult('OpenSearch', 'disconnected', 'Cannot connect to OpenSearch')
  }
}

async function checkApplication() {
  try {
    const start = Date.now()
    execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/health', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    const latency = Date.now() - start
    addResult('Application', 'connected', 'Application API accessible', latency)
  } catch (error) {
    addResult('Application', 'disconnected', 'Application not responding')
  }
}

async function runAllChecks() {
  console.log('🔍 BlueDXP Platform - Service Connectivity Check\n')
  console.log('=' .repeat(50))
  console.log('')

  await checkPostgreSQL()
  await checkRedis()
  await checkKafka()
  await checkMinIO()
  await checkOpenSearch()
  await checkApplication()

  // Print results
  console.log('📊 Connectivity Results\n')
  console.log('=' .repeat(50))
  console.log('')

  let connectedCount = 0
  let disconnectedCount = 0

  for (const result of results) {
    const icon = result.status === 'connected' ? '✅' : '❌'
    const latency = result.latency ? ` (${result.latency}ms)` : ''
    console.log(`${icon} ${result.service}: ${result.message}${latency}`)

    if (result.status === 'connected') connectedCount++
    else disconnectedCount++
  }

  console.log('')
  console.log('=' .repeat(50))
  console.log(`✅ Connected: ${connectedCount}`)
  console.log(`❌ Disconnected: ${disconnectedCount}`)
  console.log('')

  if (disconnectedCount === 0) {
    console.log('🎉 All services are connected!')
    process.exit(0)
  } else {
    console.log('⚠️  Some services are not connected. Check Docker services:')
    console.log('   docker-compose ps')
    process.exit(1)
  }
}

if (require.main === module) {
  runAllChecks()
}

export { runAllChecks }


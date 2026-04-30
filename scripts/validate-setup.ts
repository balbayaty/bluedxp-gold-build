/**
 * Setup Validation Script
 * Comprehensive validation of all infrastructure components
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'

interface ValidationResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string
}

const results: ValidationResult[] = []

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: string) {
  results.push({ name, status, message, details })
}

async function validateEnvironment() {
  console.log('🔍 Validating Environment Configuration...\n')

  // Check .env.local exists
  if (existsSync('.env.local')) {
    addResult('Environment File', 'pass', '.env.local exists')
    
    // Check critical variables
    const envContent = readFileSync('.env.local', 'utf-8')
    const requiredVars = [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
    ]
    
    const missing: string[] = []
    for (const varName of requiredVars) {
      if (!envContent.includes(varName) || envContent.includes(`${varName}=`)) {
        missing.push(varName)
      }
    }
    
    if (missing.length === 0) {
      addResult('Required Variables', 'pass', 'All required environment variables present')
    } else {
      addResult('Required Variables', 'warning', `Some variables may be missing: ${missing.join(', ')}`)
    }
  } else {
    addResult('Environment File', 'fail', '.env.local not found', 'Run: cp .env.example .env.local')
  }
}

async function validateDocker() {
  console.log('🐳 Validating Docker Services...\n')

  try {
    const output = execSync('docker-compose ps', { encoding: 'utf-8', stdio: 'pipe' })
    const lines = output.split('\n').filter(line => line.trim() && !line.includes('NAME'))
    
    if (lines.length > 0) {
      const running = lines.filter(line => line.includes('Up')).length
      addResult('Docker Services', 'pass', `${running} services running`)
    } else {
      addResult('Docker Services', 'warning', 'No Docker services found', 'Run: docker-compose up -d')
    }
  } catch (error) {
    addResult('Docker Services', 'fail', 'Could not check Docker services', (error as Error).message)
  }

  // Check specific services
  const services = ['postgres', 'redis', 'kafka', 'minio', 'opensearch']
  for (const service of services) {
    try {
      execSync(`docker-compose ps ${service}`, { encoding: 'utf-8', stdio: 'pipe' })
      addResult(`Service: ${service}`, 'pass', 'Service configured')
    } catch (error) {
      addResult(`Service: ${service}`, 'warning', 'Service not running')
    }
  }
}

async function validateDatabase() {
  console.log('🗄️  Validating Database...\n')

  try {
    execSync('docker-compose exec -T postgres psql -U bluedxp -d bluedxp -c "SELECT 1"', {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    addResult('Database Connection', 'pass', 'PostgreSQL accessible')

    // Check pgvector
    try {
      execSync('docker-compose exec -T postgres psql -U bluedxp -d bluedxp -c "SELECT * FROM pg_extension WHERE extname = \'vector\';"', {
        encoding: 'utf-8',
        stdio: 'pipe',
      })
      addResult('pgvector Extension', 'pass', 'pgvector extension enabled')
    } catch (error) {
      addResult('pgvector Extension', 'warning', 'pgvector may not be enabled')
    }
  } catch (error) {
    addResult('Database Connection', 'fail', 'Cannot connect to PostgreSQL', (error as Error).message)
  }
}

async function validatePrisma() {
  console.log('📦 Validating Prisma...\n')

  try {
    execSync('npx prisma --version', { encoding: 'utf-8', stdio: 'pipe' })
    addResult('Prisma CLI', 'pass', 'Prisma CLI available')
  } catch (error) {
    addResult('Prisma CLI', 'fail', 'Prisma CLI not found', 'Run: npm install')
  }

  if (existsSync('prisma/schema.prisma')) {
    addResult('Prisma Schema', 'pass', 'schema.prisma exists')
  } else {
    addResult('Prisma Schema', 'fail', 'schema.prisma not found')
  }
}

async function validateAPIs() {
  console.log('🌐 Validating API Endpoints...\n')

  const endpoints = [
    { name: 'Health Check', url: 'http://localhost:3002/api/health' },
    { name: 'Metrics', url: 'http://localhost:3002/api/metrics' },
  ]

  for (const endpoint of endpoints) {
    try {
      const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${endpoint.url}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      })
      if (response.trim() === '200') {
        addResult(`API: ${endpoint.name}`, 'pass', 'Endpoint responding')
      } else {
        addResult(`API: ${endpoint.name}`, 'warning', `Endpoint returned ${response.trim()}`)
      }
    } catch (error) {
      addResult(`API: ${endpoint.name}`, 'warning', 'Endpoint not accessible (app may not be running)')
    }
  }
}

async function validateFiles() {
  console.log('📁 Validating Required Files...\n')

  const requiredFiles = [
    'docker-compose.yml',
    'package.json',
    'prisma/schema.prisma',
    'prometheus.yml',
    'loki-config.yaml',
  ]

  for (const file of requiredFiles) {
    if (existsSync(file)) {
      addResult(`File: ${file}`, 'pass', 'File exists')
    } else {
      addResult(`File: ${file}`, 'fail', 'File not found')
    }
  }
}

async function runAllValidations() {
  console.log('🚀 BlueDXP Platform - Setup Validation\n')
  console.log('=' .repeat(50))
  console.log('')

  await validateEnvironment()
  await validateDocker()
  await validateDatabase()
  await validatePrisma()
  await validateFiles()
  await validateAPIs()

  // Print results
  console.log('\n📊 Validation Results\n')
  console.log('=' .repeat(50))
  console.log('')

  let passCount = 0
  let failCount = 0
  let warnCount = 0

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} ${result.name}: ${result.message}`)
    if (result.details) {
      console.log(`   ${result.details}`)
    }

    if (result.status === 'pass') passCount++
    else if (result.status === 'fail') failCount++
    else warnCount++
  }

  console.log('')
  console.log('=' .repeat(50))
  console.log(`✅ Passed: ${passCount}`)
  console.log(`⚠️  Warnings: ${warnCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('')

  if (failCount === 0 && warnCount === 0) {
    console.log('🎉 All validations passed! System is ready.')
    process.exit(0)
  } else if (failCount === 0) {
    console.log('✅ System is ready with some warnings.')
    process.exit(0)
  } else {
    console.log('❌ Some validations failed. Please fix the issues above.')
    process.exit(1)
  }
}

if (require.main === module) {
  runAllValidations()
}

export { runAllValidations }


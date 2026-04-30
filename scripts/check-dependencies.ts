/**
 * Dependency Check Script
 * Verify all required dependencies and services are available
 */

import { execSync } from 'child_process'

interface Dependency {
  name: string
  command: string
  required: boolean
  version?: string
}

const dependencies: Dependency[] = [
  { name: 'Node.js', command: 'node --version', required: true },
  { name: 'npm', command: 'npm --version', required: true },
  { name: 'Docker', command: 'docker --version', required: true },
  { name: 'Docker Compose', command: 'docker-compose --version', required: true },
  { name: 'Git', command: 'git --version', required: false },
]

function checkDependency(dep: Dependency): { installed: boolean; version?: string; error?: string } {
  try {
    const output = execSync(dep.command, { encoding: 'utf-8', stdio: 'pipe' })
    return { installed: true, version: output.trim() }
  } catch (error: any) {
    return { installed: false, error: error.message }
  }
}

async function checkAllDependencies() {
  console.log('🔍 Checking BlueDXP Platform Dependencies...\n')

  let allRequiredInstalled = true

  for (const dep of dependencies) {
    const result = checkDependency(dep)
    const status = result.installed ? '✅' : '❌'
    const required = dep.required ? '(Required)' : '(Optional)'

    console.log(`${status} ${dep.name} ${required}`)
    if (result.installed) {
      console.log(`   Version: ${result.version}\n`)
    } else {
      console.log(`   Not installed\n`)
      if (dep.required) {
        allRequiredInstalled = false
      }
    }
  }

  // Check environment file
  console.log('📋 Checking Configuration...\n')
  try {
    const fs = require('fs')
    if (fs.existsSync('.env.local')) {
      console.log('✅ .env.local file exists\n')
    } else {
      console.log('⚠️  .env.local file not found')
      console.log('   Run: cp .env.example .env.local\n')
    }
  } catch (error) {
    console.log('⚠️  Could not check .env.local file\n')
  }

  // Check Docker services
  console.log('🐳 Checking Docker Services...\n')
  try {
    const output = execSync('docker-compose ps', { encoding: 'utf-8', stdio: 'pipe' })
    const lines = output.split('\n').filter(line => line.trim() && !line.includes('NAME'))
    if (lines.length > 0) {
      console.log(`✅ ${lines.length} Docker services found\n`)
    } else {
      console.log('⚠️  No Docker services running')
      console.log('   Run: docker-compose up -d\n')
    }
  } catch (error) {
    console.log('⚠️  Could not check Docker services\n')
  }

  if (allRequiredInstalled) {
    console.log('🎉 All required dependencies are installed!')
    process.exit(0)
  } else {
    console.log('❌ Some required dependencies are missing')
    console.log('   Please install the missing dependencies and try again')
    process.exit(1)
  }
}

if (require.main === module) {
  checkAllDependencies()
}

export { checkAllDependencies }


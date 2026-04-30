/**
 * Environment File Generator
 * Generates .env.local from .env.example with interactive prompts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { createInterface } from 'readline'

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function generateEnvFile() {
  console.log('🔧 BlueDXP Platform - Environment File Generator\n')
  console.log('=' .repeat(50))
  console.log('')

  // Check if .env.example exists
  if (!existsSync('.env.example')) {
    console.log('❌ .env.example not found')
    console.log('   Please create .env.example first')
    process.exit(1)
  }

  // Check if .env.local already exists
  if (existsSync('.env.local')) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Cancelled.')
      rl.close()
      return
    }
  }

  // Read .env.example
  const envExample = readFileSync('.env.example', 'utf-8')
  const lines = envExample.split('\n')
  const envVars: Record<string, string> = {}

  console.log('📝 Please provide values for the following variables:\n')
  console.log('(Press Enter to use default or skip)\n')

  // Parse and prompt for each variable
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    // Extract variable name and default value
    const match = trimmed.match(/^([A-Z_]+)=(.+)?$/)
    if (match) {
      const [, varName, defaultValue] = match
      const defaultDisplay = defaultValue ? ` (default: ${defaultValue})` : ''
      
      const value = await question(`${varName}${defaultDisplay}: `)
      envVars[varName] = value.trim() || defaultValue || ''
    }
  }

  // Generate .env.local content
  let envContent = '# BlueDXP Platform - Environment Variables\n'
  envContent += '# Generated automatically\n'
  envContent += '# DO NOT COMMIT THIS FILE\n\n'

  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      envContent += `${key}=${value}\n`
    }
  }

  // Write .env.local
  writeFileSync('.env.local', envContent)

  console.log('\n✅ .env.local generated successfully!')
  console.log('\n⚠️  Remember:')
  console.log('   - Never commit .env.local to version control')
  console.log('   - Keep your secrets secure')
  console.log('   - Review the file and update as needed\n')

  rl.close()
}

if (require.main === module) {
  generateEnvFile().catch((error) => {
    console.error('❌ Error:', error.message)
    process.exit(1)
  })
}

export { generateEnvFile }


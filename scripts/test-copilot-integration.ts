/**
 * Copilot Integration Test Script
 * Run this to test all copilot integrations
 * 
 * Usage: npx tsx scripts/test-copilot-integration.ts
 */

import { testCopilotIntegration } from '../lib/services/copilot/integrationTest'

async function main() {
  console.log('🧪 Testing HazalyzeCopilot Integration...\n')

  const results = await testCopilotIntegration()

  console.log('Test Results:')
  console.log('='.repeat(50))
  
  let passCount = 0
  let failCount = 0

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : '❌'
    console.log(`${icon} ${result.test}: ${result.status.toUpperCase()}`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
    if (result.status === 'pass') passCount++
    else failCount++
  }

  console.log('='.repeat(50))
  console.log(`Total: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`)
  
  if (failCount === 0) {
    console.log('\n🎉 All integration tests passed!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some integration tests failed. Please review the errors above.')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})







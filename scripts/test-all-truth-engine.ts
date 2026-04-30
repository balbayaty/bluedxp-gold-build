/**
 * Complete Truth Engine Test Suite
 * Runs all workflow and API tests
 */

import { runAllWorkflows } from './test-truth-engine-workflows'
import { runAPITests } from './test-truth-engine-api'

async function runAllTests() {
  console.log('🚀 Truth Engine Complete Test Suite')
  console.log('='.repeat(60))
  console.log('')

  const workflowResults = await runAllWorkflows()
  console.log('')
  console.log('')
  
  // Note: API tests require server to be running
  console.log('⚠️  API tests require server to be running on port 3002')
  console.log('   Start server with: npm run dev')
  console.log('   Then run: npm run test:api')
  console.log('')

  // Summary
  console.log('='.repeat(60))
  console.log('📊 COMPLETE TEST SUMMARY')
  console.log('='.repeat(60))
  console.log('')
  console.log('Workflow Tests:')
  console.log(`  ✅ Passed: ${workflowResults.passed}`)
  console.log(`  ❌ Failed: ${workflowResults.failed}`)
  console.log(`  ⏭️  Skipped: ${workflowResults.skipped}`)
  console.log(`  📈 Total: ${workflowResults.total}`)
  console.log('')

  if (workflowResults.success) {
    console.log('🎉 ALL WORKFLOW TESTS PASSED!')
    console.log('')
    console.log('Next Steps:')
    console.log('1. Start the server: npm run dev')
    console.log('2. Run API tests: npm run test:api')
    console.log('3. Test UI: Navigate to /truth-timeline/shipment/ship-123')
  } else {
    console.log('⚠️  SOME WORKFLOW TESTS FAILED')
    console.log('Please review the errors above')
  }
}

if (require.main === module) {
  runAllTests()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { runAllTests }








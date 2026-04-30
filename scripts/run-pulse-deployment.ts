/**
 * Pulse Module - Quick Deployment Runner
 * Simple wrapper to run the complete deployment
 */

import { execSync } from 'child_process'
import * as path from 'path'

console.log('\n🚀 PULSE MODULE - DEPLOYMENT\n')
console.log('='.repeat(60))

try {
  console.log('\n📊 Step 1: Running complete deployment...\n')
  
  // Run the deployment script
  execSync('ts-node --project tsconfig.scripts.json scripts/deploy-pulse-module-complete.ts', {
    stdio: 'inherit',
    cwd: process.cwd(),
    encoding: 'utf-8'
  })
  
  console.log('\n✅ Deployment completed successfully!')
  
} catch (error: any) {
  console.error('\n❌ Deployment failed:', error.message)
  console.log('\n💡 Try running manually:')
  console.log('   npm run deploy:pulse')
  process.exit(1)
}

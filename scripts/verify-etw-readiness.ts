/**
 * ETW Module Readiness Verification
 * 
 * Quick verification script to check if ETW module is ready for end-users
 * Run with: npx tsx scripts/verify-etw-readiness.ts
 */

import * as fs from 'fs'
import * as path from 'path'

console.log('🔍 Verifying ETW Module Readiness...\n')

let checksPassed = 0
let checksFailed = 0

// Check 1: Prisma Schema
console.log('Check 1: Prisma schema...')
try {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
  const schema = fs.readFileSync(schemaPath, 'utf-8')
  
  const requiredModels = ['model eTW', 'model eTWVersion', 'model eTWEvent', 'model eTWLeg', 'model eTWAttachment', 'model eTWQRToken']
  for (const model of requiredModels) {
    if (!schema.includes(model)) {
      throw new Error(`Missing model: ${model}`)
    }
  }
  console.log('✅ Prisma schema contains all ETW models\n')
  checksPassed++
} catch (error) {
  console.error('❌ Prisma schema check failed:', error)
  checksFailed++
}

// Check 2: Module Definition
console.log('Check 2: Module definition...')
try {
  const modulePath = path.join(process.cwd(), 'lib', 'modules', 'etw.ts')
  if (!fs.existsSync(modulePath)) {
    throw new Error('Module file not found')
  }
  const moduleContent = fs.readFileSync(modulePath, 'utf-8')
  if (!moduleContent.includes('export const etwModule')) {
    throw new Error('Module not exported')
  }
  if (!moduleContent.includes('initializeETWModule')) {
    throw new Error('Initialization function not found')
  }
  console.log('✅ Module definition exists\n')
  checksPassed++
} catch (error) {
  console.error('❌ Module definition check failed:', error)
  checksFailed++
}

// Check 3: API Routes
console.log('Check 3: API routes...')
const apiRoutes = [
  'app/api/etw/route.ts',
  'app/api/etw/[id]/route.ts',
  'app/api/etw/[id]/events/route.ts',
  'app/api/etw/[id]/verify/route.ts',
  'app/api/etw/[id]/qr/route.ts',
  'app/api/etw/[id]/intelligence/route.ts',
  'app/api/etw/[id]/export/pdf/route.ts',
  'app/api/etw/[id]/export/proof-bundle/route.ts',
]

let routesFound = 0
for (const route of apiRoutes) {
  const routePath = path.join(process.cwd(), route)
  if (fs.existsSync(routePath)) {
    routesFound++
  }
}

if (routesFound === apiRoutes.length) {
  console.log(`✅ All ${apiRoutes.length} API routes exist\n`)
  checksPassed++
} else {
  console.error(`❌ Missing ${apiRoutes.length - routesFound} API routes\n`)
  checksFailed++
}

// Check 4: Pages
console.log('Check 4: Pages...')
const pages = [
  'app/etw/page.tsx',
  'app/etw/create/page.tsx',
  'app/etw/[id]/page.tsx',
  'app/etw/[id]/edit/page.tsx',
  'app/etw/[id]/print/page.tsx',
  'app/etw/verify/[token]/page.tsx',
]

let pagesFound = 0
for (const page of pages) {
  const pagePath = path.join(process.cwd(), page)
  if (fs.existsSync(pagePath)) {
    pagesFound++
  }
}

if (pagesFound === pages.length) {
  console.log(`✅ All ${pages.length} pages exist\n`)
  checksPassed++
} else {
  console.error(`❌ Missing ${pages.length - pagesFound} pages\n`)
  checksFailed++
}

// Check 5: Services
console.log('Check 5: Services...')
const services = [
  'lib/services/etw/etwService.ts',
  'lib/services/etw/eventService.ts',
  'lib/services/etw/qrVerificationService.ts',
  'lib/services/etw/intelligence/intelligenceOrchestrator.ts',
  'lib/services/etw/pdfService.ts',
  'lib/services/etw/permitService.ts',
]

let servicesFound = 0
for (const service of services) {
  const servicePath = path.join(process.cwd(), service)
  if (fs.existsSync(servicePath)) {
    servicesFound++
  }
}

if (servicesFound === services.length) {
  console.log(`✅ All ${services.length} services exist\n`)
  checksPassed++
} else {
  console.error(`❌ Missing ${services.length - servicesFound} services\n`)
  checksFailed++
}

// Check 6: Navigation
console.log('Check 6: Navigation integration...')
try {
  const navPath = path.join(process.cwd(), 'lib', 'services', 'navigation', 'defaultNavigation.ts')
  const navContent = fs.readFileSync(navPath, 'utf-8')
  if (!navContent.includes('/etw') || !navContent.includes('e-Waybills')) {
    throw new Error('ETW not in navigation')
  }
  console.log('✅ ETW added to navigation\n')
  checksPassed++
} catch (error) {
  console.error('❌ Navigation check failed:', error)
  checksFailed++
}

// Check 7: RBAC
console.log('Check 7: RBAC integration...')
try {
  const typesPath = path.join(process.cwd(), 'types', 'user.ts')
  const typesContent = fs.readFileSync(typesPath, 'utf-8')
  if (!typesContent.includes('tms.etw')) {
    throw new Error('Feature ID not found')
  }
  console.log('✅ RBAC feature ID configured\n')
  checksPassed++
} catch (error) {
  console.error('❌ RBAC check failed:', error)
  checksFailed++
}

// Check 8: Module Registration
console.log('Check 8: Module registration...')
try {
  const indexPath = path.join(process.cwd(), 'lib', 'modules', 'index.ts')
  const indexContent = fs.readFileSync(indexPath, 'utf-8')
  if (!indexContent.includes('etwModule') || !indexContent.includes('initializeETWModule')) {
    throw new Error('Module not registered')
  }
  console.log('✅ Module registered in index\n')
  checksPassed++
} catch (error) {
  console.error('❌ Module registration check failed:', error)
  checksFailed++
}

// Summary
console.log('='.repeat(60))
console.log('VERIFICATION SUMMARY')
console.log('='.repeat(60))
console.log(`✅ Checks Passed: ${checksPassed}`)
console.log(`❌ Checks Failed: ${checksFailed}`)
console.log(`📊 Total Checks: ${checksPassed + checksFailed}`)
console.log(`📈 Success Rate: ${checksFailed === 0 ? '100%' : ((checksPassed / (checksPassed + checksFailed)) * 100).toFixed(1) + '%'}`)
console.log('='.repeat(60))

if (checksFailed === 0) {
  console.log('🎉 All checks passed! ETW module is ready for end-users.')
  console.log('\n📋 Next Steps:')
  console.log('   1. Run: npx prisma generate')
  console.log('   2. Run: npx prisma migrate dev --name add_etw_models')
  console.log('   3. Restart development server')
  console.log('   4. Navigate to /etw to test')
  process.exit(0)
} else {
  console.log('⚠️ Some checks failed. Please review and fix issues.')
  process.exit(1)
}



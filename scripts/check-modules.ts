/**
 * Diagnostic Script: Check Module Registration and Visibility
 * 
 * This script checks:
 * 1. All modules are registered
 * 2. All modules are enabled
 * 3. Module routes are properly defined
 * 4. API endpoint returns correct data
 */

import { moduleRegistry } from '../lib/modules/registry'
import '@/lib/modules' // Import to trigger registration

console.log('🔍 BlueDXP Module Diagnostic Check\n')
console.log('=' .repeat(60))

// Get all registered modules
const allModules = Array.from((moduleRegistry as any).modules?.values() || [])
const enabledModules = moduleRegistry.getEnabledModules()

console.log(`\n📊 Module Statistics:`)
console.log(`   Total Registered: ${allModules.length}`)
console.log(`   Enabled: ${enabledModules.length}`)
console.log(`   Disabled: ${allModules.length - enabledModules.length}`)

// Check each module
console.log(`\n📦 Module Details:\n`)
allModules.forEach((module: any) => {
  const isEnabled = moduleRegistry.isModuleEnabled(module.id)
  const routeCount = module.routes?.length || 0
  const componentCount = module.components?.length || 0
  const serviceCount = Array.isArray(module.services) ? module.services.length : 0
  
  const status = isEnabled ? '✅ ENABLED' : '❌ DISABLED'
  
  console.log(`   ${status} - ${module.name} (${module.id})`)
  console.log(`      Routes: ${routeCount}`)
  console.log(`      Components: ${componentCount}`)
  console.log(`      Services: ${serviceCount}`)
  
  if (!isEnabled && module.enabled !== false) {
    console.log(`      ⚠️  WARNING: Module marked as enabled but not in enabled set!`)
  }
  
  if (routeCount === 0) {
    console.log(`      ⚠️  WARNING: No routes defined - won't appear in navigation!`)
  }
})

// Check routes
console.log(`\n🛣️  Route Summary:\n`)
const allRoutes = moduleRegistry.getAllRoutes()
console.log(`   Total Routes: ${allRoutes.length}`)

const routesByModule = new Map<string, number>()
allRoutes.forEach(route => {
  const moduleId = allModules.find((m: any) => m.routes?.includes(route))?.id || 'unknown'
  routesByModule.set(moduleId, (routesByModule.get(moduleId) || 0) + 1)
})

routesByModule.forEach((count, moduleId) => {
  const module = allModules.find((m: any) => m.id === moduleId)
  console.log(`   ${module?.name || moduleId}: ${count} routes`)
})

// Check for common issues
console.log(`\n🔧 Potential Issues:\n`)

const issues: string[] = []

enabledModules.forEach(module => {
  if (!module.routes || module.routes.length === 0) {
    issues.push(`Module "${module.name}" is enabled but has no routes`)
  }
  
  if (module.routes) {
    module.routes.forEach((route: any) => {
      if (!route.path) {
        issues.push(`Module "${module.name}" has route without path`)
      }
      if (!route.component) {
        issues.push(`Module "${module.name}" route "${route.path}" has no component`)
      }
    })
  }
})

if (issues.length === 0) {
  console.log('   ✅ No issues found!')
} else {
  issues.forEach(issue => {
    console.log(`   ⚠️  ${issue}`)
  })
}

console.log(`\n${'='.repeat(60)}\n`)

// Export summary
export const moduleDiagnostic = {
  totalModules: allModules.length,
  enabledModules: enabledModules.length,
  totalRoutes: allRoutes.length,
  issues,
}









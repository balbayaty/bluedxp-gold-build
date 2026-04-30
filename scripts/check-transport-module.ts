/**
 * Transport Module Diagnostic Tool
 * Checks if the transport module is properly registered and visible
 */

import { moduleRegistry, getEnabledModules, getAllRoutes } from '@/lib/modules/registry'
import { tmsModule } from '@/lib/modules/tms'
import { getDefaultNavigationStructure } from '@/lib/services/navigation/defaultNavigation'

console.log('🔍 Transport Module Diagnostic Tool\n')
console.log('=' .repeat(60))

// 1. Check if module is registered
console.log('\n1️⃣ Checking Module Registration...')
const registeredModule = moduleRegistry.getModule('tms')
if (registeredModule) {
  console.log('✅ TMS module is registered')
  console.log(`   - Name: ${registeredModule.name}`)
  console.log(`   - Enabled: ${registeredModule.enabled}`)
  console.log(`   - Routes: ${registeredModule.routes.length}`)
} else {
  console.log('❌ TMS module is NOT registered')
}

// 2. Check if module is enabled
console.log('\n2️⃣ Checking Module Status...')
const isEnabled = moduleRegistry.isModuleEnabled('tms')
if (isEnabled) {
  console.log('✅ TMS module is ENABLED')
} else {
  console.log('❌ TMS module is DISABLED')
}

// 3. List all enabled modules
console.log('\n3️⃣ All Enabled Modules:')
const enabledModules = getEnabledModules()
enabledModules.forEach(m => {
  const marker = m.id === 'tms' ? '🚛' : '  '
  console.log(`${marker} ${m.id} - ${m.name} (${m.routes.length} routes)`)
})

// 4. Check TMS routes
console.log('\n4️⃣ TMS Module Routes:')
const tmsRoutes = registeredModule?.routes || []
console.log(`   Total routes: ${tmsRoutes.length}`)
console.log('\n   Main Transportation Routes:')
tmsRoutes
  .filter(r => r.path.startsWith('/transportation'))
  .slice(0, 10)
  .forEach(route => {
    console.log(`   - ${route.path} → ${route.title}`)
  })
if (tmsRoutes.filter(r => r.path.startsWith('/transportation')).length > 10) {
  console.log(`   ... and ${tmsRoutes.filter(r => r.path.startsWith('/transportation')).length - 10} more`)
}

// 5. Check navigation structure
console.log('\n5️⃣ Checking Navigation Structure...')
const navStructure = getDefaultNavigationStructure()
const transportNav = navStructure.find(item => item.name === 'Transportation')
if (transportNav) {
  console.log('✅ Transportation found in navigation')
  console.log(`   - Children: ${transportNav.children?.length || 0}`)
  if (transportNav.children && transportNav.children.length > 0) {
    console.log('\n   Sample navigation items:')
    transportNav.children.slice(0, 5).forEach(child => {
      console.log(`   - ${child.name} → ${child.href}`)
    })
  }
} else {
  console.log('❌ Transportation NOT found in navigation')
}

// 6. Check all routes from registry
console.log('\n6️⃣ All Routes from Registry:')
const allRoutes = getAllRoutes()
const transportRoutes = allRoutes.filter(r => r.path.includes('transport') || r.path.includes('shipment') || r.path.includes('carrier'))
console.log(`   Total transportation-related routes: ${transportRoutes.length}`)
transportRoutes.slice(0, 10).forEach(route => {
  console.log(`   - ${route.path} → ${route.title}`)
})

// 7. Summary
console.log('\n' + '='.repeat(60))
console.log('\n📊 SUMMARY:')
console.log(`   ✅ Module Registered: ${registeredModule ? 'YES' : 'NO'}`)
console.log(`   ✅ Module Enabled: ${isEnabled ? 'YES' : 'NO'}`)
console.log(`   ✅ Routes Defined: ${tmsRoutes.length}`)
console.log(`   ✅ In Navigation: ${transportNav ? 'YES' : 'NO'}`)

if (registeredModule && isEnabled && transportNav) {
  console.log('\n🎉 Transport module is properly configured!')
  console.log('\n📍 How to Access:')
  console.log('   1. Look in the sidebar for "Transportation" section')
  console.log('   2. Click to expand the Transportation menu')
  console.log('   3. You should see items like:')
  console.log('      - Transportation Dashboard → /transportation')
  console.log('      - Shipments → /shipments')
  console.log('      - Tracking → /tracking')
  console.log('      - And many more...')
  console.log('\n   4. Or navigate directly to: http://localhost:3000/transportation')
} else {
  console.log('\n⚠️  There may be an issue with the transport module configuration.')
}

console.log('\n' + '='.repeat(60))




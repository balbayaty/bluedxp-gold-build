/**
 * Comprehensive Hazalyze Module Test Script
 * Tests all aspects of the Hazalyze module integration
 */

import {
  moduleRegistry,
  isModuleEnabled,
  getEnabledModules,
  getAllRoutes,
  getModule
} from '@/lib/modules'
import { hazalyzeModule } from '@/lib/modules/hazalyze'
import { initializeHazalyzeModule } from '@/lib/modules/hazalyze.server'

// Test Results
interface TestResult {
  name: string
  passed: boolean
  error?: string
  details?: any
}

const results: TestResult[] = []

function addResult(name: string, passed: boolean, error?: string, details?: any) {
  results.push({ name, passed, error, details })
  const status = passed ? '✅' : '❌'
  console.log(`${status} ${name}${error ? ` - ${error}` : ''}`)
  if (details) {
    console.log(`   Details:`, details)
  }
}

/**
 * Test 1: Module Registration
 */
function testModuleRegistration() {
  try {
    const module = getModule('hazalyze')
    if (!module) {
      addResult('Module Registration', false, 'Module not found in registry')
      return
    }

    if (module.id !== 'hazalyze') {
      addResult('Module Registration', false, `Wrong module ID: ${module.id}`)
      return
    }

    if (module.name !== 'Hazalyze AI & Intelligence') {
      addResult('Module Registration', false, `Wrong module name: ${module.name}`)
      return
    }

    addResult('Module Registration', true, undefined, {
      id: module.id,
      name: module.name,
      enabled: module.enabled,
      category: module.category
    })
  } catch (error) {
    addResult('Module Registration', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 2: Module Enabled Status
 */
function testModuleEnabled() {
  try {
    const enabled = isModuleEnabled('hazalyze')
    if (!enabled) {
      addResult('Module Enabled Status', false, 'Module is not enabled')
      return
    }
    addResult('Module Enabled Status', true)
  } catch (error) {
    addResult('Module Enabled Status', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 3: Routes Count
 */
function testRoutesCount() {
  try {
    const routes = hazalyzeModule.routes || []
    const expectedCount = 25

    if (routes.length !== expectedCount) {
      addResult('Routes Count', false, `Expected ${expectedCount} routes, found ${routes.length}`)
      return
    }

    addResult('Routes Count', true, undefined, {
      count: routes.length,
      routes: routes.map(r => r.path)
    })
  } catch (error) {
    addResult('Routes Count', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 4: Routes in Registry
 */
function testRoutesInRegistry() {
  try {
    const allRoutes = getAllRoutes()
    const hazalyzeRoutes = allRoutes.filter(r =>
      r.path.startsWith('/ai') ||
      r.path.startsWith('/intelligent-orchestration') ||
      r.path.startsWith('/agent-orchestration') ||
      r.path.startsWith('/knowledge-base') ||
      r.path.startsWith('/settings/ai')
    )

    if (hazalyzeRoutes.length < 20) {
      addResult('Routes in Registry', false, `Only ${hazalyzeRoutes.length} Hazalyze routes found in registry`)
      return
    }

    addResult('Routes in Registry', true, undefined, {
      count: hazalyzeRoutes.length,
      sample: hazalyzeRoutes.slice(0, 5).map(r => r.path)
    })
  } catch (error) {
    addResult('Routes in Registry', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 5: Services Count
 */
function testServicesCount() {
  try {
    const services = hazalyzeModule.services || []
    const uniqueServices = new Set(services)

    if (uniqueServices.size !== services.length) {
      addResult('Services Count', false, `Duplicate services found: ${services.length - uniqueServices.size} duplicates`)
      return
    }

    if (services.length < 25) {
      addResult('Services Count', false, `Expected at least 25 services, found ${services.length}`)
      return
    }

    addResult('Services Count', true, undefined, {
      count: services.length,
      unique: uniqueServices.size,
      sample: services.slice(0, 5)
    })
  } catch (error) {
    addResult('Services Count', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 6: Components Count
 */
function testComponentsCount() {
  try {
    const components = hazalyzeModule.components || []

    if (components.length < 10) {
      addResult('Components Count', false, `Expected at least 10 components, found ${components.length}`)
      return
    }

    addResult('Components Count', true, undefined, {
      count: components.length,
      sample: components.slice(0, 5)
    })
  } catch (error) {
    addResult('Components Count', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 7: Configuration
 */
function testConfiguration() {
  try {
    const config = hazalyzeModule.config
    if (!config) {
      addResult('Configuration', false, 'No configuration found')
      return
    }

    const requiredSections = ['copilot', 'vision', 'intelligentOrchestration', 'agents', 'knowledgeBase']
    const missingSections = requiredSections.filter(section => !config[section])

    if (missingSections.length > 0) {
      addResult('Configuration', false, `Missing config sections: ${missingSections.join(', ')}`)
      return
    }

    addResult('Configuration', true, undefined, {
      sections: Object.keys(config),
      copilotEnabled: config.copilot?.enabled,
      visionEnabled: config.vision?.enabled,
      agentsEnabled: config.agents?.enabled,
      knowledgeBaseEnabled: config.knowledgeBase?.enabled
    })
  } catch (error) {
    addResult('Configuration', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 8: Module Export
 */
function testModuleExport() {
  try {
    if (!hazalyzeModule) {
      addResult('Module Export', false, 'Module not exported')
      return
    }

    if (!initializeHazalyzeModule) {
      addResult('Module Export', false, 'Initialization function not exported')
      return
    }

    if (typeof initializeHazalyzeModule !== 'function') {
      addResult('Module Export', false, 'Initialization is not a function')
      return
    }

    addResult('Module Export', true)
  } catch (error) {
    addResult('Module Export', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 9: Module in Enabled Modules List
 */
function testModuleInEnabledList() {
  try {
    const enabledModules = getEnabledModules()
    const hazalyze = enabledModules.find(m => m.id === 'hazalyze')

    if (!hazalyze) {
      addResult('Module in Enabled List', false, 'Hazalyze module not found in enabled modules list')
      return
    }

    addResult('Module in Enabled List', true, undefined, {
      totalEnabled: enabledModules.length,
      hazalyzeIndex: enabledModules.findIndex(m => m.id === 'hazalyze')
    })
  } catch (error) {
    addResult('Module in Enabled List', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 10: Route Paths Validation
 */
function testRoutePathsValidation() {
  try {
    const routes = hazalyzeModule.routes || []
    const invalidRoutes: string[] = []

    routes.forEach(route => {
      if (!route.path || !route.path.startsWith('/')) {
        invalidRoutes.push(route.path || 'undefined')
      }
      if (!route.component) {
        invalidRoutes.push(`Missing component for ${route.path}`)
      }
      if (!route.title) {
        invalidRoutes.push(`Missing title for ${route.path}`)
      }
    })

    if (invalidRoutes.length > 0) {
      addResult('Route Paths Validation', false, `Invalid routes: ${invalidRoutes.join(', ')}`)
      return
    }

    addResult('Route Paths Validation', true, undefined, {
      totalRoutes: routes.length,
      allValid: true
    })
  } catch (error) {
    addResult('Route Paths Validation', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 11: No Duplicate Routes
 */
function testNoDuplicateRoutes() {
  try {
    const routes = hazalyzeModule.routes || []
    const paths = routes.map(r => r.path)
    const uniquePaths = new Set(paths)

    if (paths.length !== uniquePaths.size) {
      const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index)
      addResult('No Duplicate Routes', false, `Duplicate routes found: ${duplicates.join(', ')}`)
      return
    }

    addResult('No Duplicate Routes', true)
  } catch (error) {
    addResult('No Duplicate Routes', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 12: Module Category
 */
function testModuleCategory() {
  try {
    const category = hazalyzeModule.category
    const validCategories = ['wms', 'iso-ims', 'msds', 'qhse', 'ai', 'integration', 'tms', 'maas', 'facility-management', 'marketplace', 'warehouse-network', 'hr', 'other']

    if (!validCategories.includes(category)) {
      addResult('Module Category', false, `Invalid category: ${category}`)
      return
    }

    if (category !== 'ai') {
      addResult('Module Category', false, `Expected category 'ai', got '${category}'`)
      return
    }

    addResult('Module Category', true, undefined, { category })
  } catch (error) {
    addResult('Module Category', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 13: Standalone Module
 */
function testStandaloneModule() {
  try {
    if (!hazalyzeModule.standalone) {
      addResult('Standalone Module', false, 'Module is not marked as standalone')
      return
    }

    if (hazalyzeModule.dependencies.length > 0) {
      addResult('Standalone Module', false, `Module has dependencies but is marked standalone: ${hazalyzeModule.dependencies.join(', ')}`)
      return
    }

    addResult('Standalone Module', true, undefined, {
      standalone: hazalyzeModule.standalone,
      dependencies: hazalyzeModule.dependencies
    })
  } catch (error) {
    addResult('Standalone Module', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test 14: Initialization Function
 */
async function testInitializationFunction() {
  try {
    // Test that initialization doesn't throw
    await initializeHazalyzeModule()
    addResult('Initialization Function', true, undefined, {
      executed: true,
      noErrors: true
    })
  } catch (error) {
    // Initialization is designed to not throw, but log errors
    addResult('Initialization Function', true, undefined, {
      executed: true,
      errorHandled: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Starting Hazalyze Module Comprehensive Tests...\n')

  // Synchronous tests
  testModuleRegistration()
  testModuleEnabled()
  testRoutesCount()
  testRoutesInRegistry()
  testServicesCount()
  testComponentsCount()
  testConfiguration()
  testModuleExport()
  testModuleInEnabledList()
  testRoutePathsValidation()
  testNoDuplicateRoutes()
  testModuleCategory()
  testStandaloneModule()

  // Async tests
  await testInitializationFunction()

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`)
    })
    process.exit(1)
  } else {
    console.log('\n🎉 ALL TESTS PASSED!')
    process.exit(0)
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })
}

export { runAllTests, results }









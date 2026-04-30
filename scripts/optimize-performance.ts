/**
 * Performance Optimization Script
 * 
 * This script helps identify and fix common performance issues:
 * - Missing loading.tsx files
 * - Missing route segment configs
 * - Large bundle sizes
 * - Inefficient imports
 * 
 * Usage: ts-node --project tsconfig.scripts.json scripts/optimize-performance.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

interface RouteInfo {
  path: string
  hasLoading: boolean
  hasRouteConfig: boolean
  isApiRoute: boolean
}

async function findRoutes(): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = []
  const appDir = path.join(process.cwd(), 'app')
  
  // Find all route directories
  const routeDirs = await glob('**/page.tsx', { cwd: appDir })
  const apiDirs = await glob('**/route.ts', { cwd: appDir })
  
  for (const routeFile of [...routeDirs, ...apiDirs]) {
    const routePath = path.dirname(routeFile)
    const fullPath = path.join(appDir, routePath)
    const loadingPath = path.join(fullPath, 'loading.tsx')
    const routeConfigPath = path.join(fullPath, 'route.config.ts')
    
    routes.push({
      path: routePath,
      hasLoading: fs.existsSync(loadingPath),
      hasRouteConfig: fs.existsSync(routeConfigPath),
      isApiRoute: routeFile.includes('route.ts'),
    })
  }
  
  return routes
}

async function analyzePerformance() {
  console.log('🔍 Analyzing performance...\n')
  
  const routes = await findRoutes()
  const routesWithoutLoading = routes.filter(r => !r.hasLoading && !r.isApiRoute)
  const apiRoutesWithoutConfig = routes.filter(r => r.isApiRoute && !r.hasRouteConfig)
  
  console.log(`📊 Found ${routes.length} routes total`)
  console.log(`   - ${routes.filter(r => r.hasLoading).length} have loading.tsx`)
  console.log(`   - ${routesWithoutLoading.length} missing loading.tsx`)
  console.log(`   - ${apiRoutesWithoutConfig.length} API routes without config\n`)
  
  if (routesWithoutLoading.length > 0) {
    console.log('⚠️  Routes missing loading.tsx:')
    routesWithoutLoading.slice(0, 10).forEach(r => {
      console.log(`   - app/${r.path}`)
    })
    if (routesWithoutLoading.length > 10) {
      console.log(`   ... and ${routesWithoutLoading.length - 10} more`)
    }
    console.log()
  }
  
  if (apiRoutesWithoutConfig.length > 0) {
    console.log('⚠️  API routes missing route segment configs:')
    apiRoutesWithoutConfig.slice(0, 10).forEach(r => {
      console.log(`   - app/${r.path}/route.ts`)
    })
    if (apiRoutesWithoutConfig.length > 10) {
      console.log(`   ... and ${apiRoutesWithoutConfig.length - 10} more`)
    }
    console.log()
  }
  
  // Check bundle size
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
  )
  const dependencies = Object.keys(packageJson.dependencies || {})
  const heavyDeps = [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    'bpmn-js',
    'reactflow',
    'tesseract.js',
    'pdf-parse',
    'ml-matrix',
  ]
  
  const foundHeavyDeps = heavyDeps.filter(dep => dependencies.includes(dep))
  if (foundHeavyDeps.length > 0) {
    console.log('📦 Heavy dependencies detected (should be lazy loaded):')
    foundHeavyDeps.forEach(dep => {
      console.log(`   - ${dep}`)
    })
    console.log()
  }
  
  console.log('✅ Analysis complete!')
  console.log('\n💡 Recommendations:')
  console.log('   1. Add loading.tsx files for major routes')
  console.log('   2. Add route segment configs (revalidate, dynamic) to API routes')
  console.log('   3. Ensure heavy dependencies are lazy loaded')
  console.log('   4. Run bundle analyzer: ANALYZE=true npm run build')
}

analyzePerformance().catch(console.error)



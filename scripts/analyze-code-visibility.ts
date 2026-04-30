/**
 * Comprehensive Code Visibility Analysis Script
 * This script analyzes the entire codebase to find:
 * 1. Pages that exist but aren't in navigation
 * 2. Navigation items that don't have pages
 * 3. Components that aren't used
 * 4. Services that aren't connected to UI
 */

import * as fs from 'fs'
import * as path from 'path'

interface AnalysisResult {
  totalPages: number
  pagesInNavigation: number
  pagesNotInNavigation: string[]
  navigationItemsWithoutPages: string[]
  totalComponents: number
  totalServices: number
  totalApiRoutes: number
}

function walkFiles(rootDir: string, predicate: (fileName: string) => boolean): string[] {
  const results: string[] = []
  const stack: string[] = [rootDir]

  while (stack.length) {
    const current = stack.pop()!
    const entries = fs.readdirSync(current, { withFileTypes: true })

    for (const entry of entries) {
      // Skip dot directories
      if (entry.name.startsWith('.')) continue

      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        // Skip common noisy dirs if they exist
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue
        stack.push(fullPath)
      } else if (entry.isFile()) {
        if (predicate(entry.name)) results.push(fullPath)
      }
    }
  }

  return results
}

async function analyzeCodebase(): Promise<AnalysisResult> {
  const result: AnalysisResult = {
    totalPages: 0,
    pagesInNavigation: 0,
    pagesNotInNavigation: [],
    navigationItemsWithoutPages: [],
    totalComponents: 0,
    totalServices: 0,
    totalApiRoutes: 0
  }

  // 1. Get all page files
  const appDir = path.join(process.cwd(), 'app')
  const pageFiles = walkFiles(appDir, (name) => name === 'page.tsx')
  result.totalPages = pageFiles.length

  // 2. Extract all hrefs from navigation
  const navFile = path.join(process.cwd(), 'lib/services/navigation/defaultNavigation.ts')
  const navContent = fs.readFileSync(navFile, 'utf-8')
  
  // Extract all href values from navigation
  const hrefRegex = /href:\s*['"]([^'"]+)['"]/g
  const navigationHrefs = new Set<string>()
  let match
  while ((match = hrefRegex.exec(navContent)) !== null) {
    navigationHrefs.add(match[1])
  }

  // 3. Convert page files to routes
  const pageRoutes = new Set<string>()
  pageFiles.forEach(file => {
    // Convert .../app/skus/page.tsx -> /skus
    const rel = path.relative(appDir, file).replace(/\\/g, '/')
    let route = '/' + rel.replace('/page.tsx', '')
    // Handle dynamic routes [id] -> [id]
    route = route.replace(/\[([^\]]+)\]/g, '[$1]')
    pageRoutes.add(route)
  })

  // 4. Find pages not in navigation
  pageRoutes.forEach(route => {
    // Check if route or any parent route is in navigation
    let found = false
    const routeParts = route.split('/').filter(Boolean)
    
    for (let i = routeParts.length; i > 0; i--) {
      const checkRoute = '/' + routeParts.slice(0, i).join('/')
      if (navigationHrefs.has(checkRoute) || navigationHrefs.has(route)) {
        found = true
        break
      }
    }
    
    // Also check for dynamic routes
    navigationHrefs.forEach(navHref => {
      if (navHref.includes('[') && route.includes('[')) {
        // Match dynamic routes like /warehouses/[id] with /warehouses/123
        const navPattern = navHref.replace(/\[[^\]]+\]/g, '[id]')
        const routePattern = route.replace(/\/[^/]+$/, '/[id]')
        if (navPattern === routePattern) {
          found = true
        }
      }
    })

    if (!found && !route.includes('api') && !route.includes('(portal)')) {
      result.pagesNotInNavigation.push(route)
    }
  })

  // 5. Find navigation items without pages
  navigationHrefs.forEach(href => {
    if (href.startsWith('/') && !href.includes('[')) {
      // Check if page exists
      const pagePath = href === '/' ? 'app/page.tsx' : `app${href}/page.tsx`
      if (!fs.existsSync(path.join(process.cwd(), pagePath))) {
        result.navigationItemsWithoutPages.push(href)
      }
    }
  })

  // 6. Count components
  const componentsDir = path.join(process.cwd(), 'components')
  const componentFiles = fs.existsSync(componentsDir)
    ? walkFiles(componentsDir, (name) => name.endsWith('.tsx'))
    : []
  result.totalComponents = componentFiles.length

  // 7. Count services
  const servicesDir = path.join(process.cwd(), 'lib', 'services')
  const serviceFiles = fs.existsSync(servicesDir)
    ? walkFiles(servicesDir, (name) => name.endsWith('.ts'))
    : []
  result.totalServices = serviceFiles.length

  // 8. Count API routes
  const apiDir = path.join(process.cwd(), 'app', 'api')
  const apiFiles = fs.existsSync(apiDir)
    ? walkFiles(apiDir, (name) => name === 'route.ts')
    : []
  result.totalApiRoutes = apiFiles.length

  result.pagesInNavigation = result.totalPages - result.pagesNotInNavigation.length

  return result
}

// Run analysis
analyzeCodebase().then(result => {
  console.log('\n=== COMPREHENSIVE CODE VISIBILITY ANALYSIS ===\n')
  console.log(`Total Pages: ${result.totalPages}`)
  console.log(`Pages in Navigation: ${result.pagesInNavigation}`)
  console.log(`Pages NOT in Navigation: ${result.pagesNotInNavigation.length}`)
  console.log(`\nPages Not in Navigation:`)
  result.pagesNotInNavigation.forEach(page => console.log(`  - ${page}`))
  console.log(`\nNavigation Items Without Pages: ${result.navigationItemsWithoutPages.length}`)
  result.navigationItemsWithoutPages.forEach(nav => console.log(`  - ${nav}`))
  console.log(`\nTotal Components: ${result.totalComponents}`)
  console.log(`Total Services: ${result.totalServices}`)
  console.log(`Total API Routes: ${result.totalApiRoutes}`)
  
  // Write detailed report
  const report = {
    summary: {
      totalPages: result.totalPages,
      pagesInNavigation: result.pagesInNavigation,
      pagesNotInNavigation: result.pagesNotInNavigation.length,
      navigationItemsWithoutPages: result.navigationItemsWithoutPages.length,
      totalComponents: result.totalComponents,
      totalServices: result.totalServices,
      totalApiRoutes: result.totalApiRoutes
    },
    pagesNotInNavigation: result.pagesNotInNavigation,
    navigationItemsWithoutPages: result.navigationItemsWithoutPages
  }
  
  fs.writeFileSync(
    path.join(process.cwd(), 'CODE_VISIBILITY_ANALYSIS_RESULT.json'),
    JSON.stringify(report, null, 2)
  )
  
  console.log('\n✅ Detailed report saved to CODE_VISIBILITY_ANALYSIS_RESULT.json')
}).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})












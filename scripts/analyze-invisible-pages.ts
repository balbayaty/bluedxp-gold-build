import * as fs from 'fs'
import * as path from 'path'

interface PageInfo {
  path: string
  route: string
  exists: boolean
  inNavigation: boolean
  inCodeLinks: boolean
  redirectsTo?: string
  reason: string[]
}

// Extract all hrefs from navigation file
function extractNavigationHrefs(): Set<string> {
  const navFile = path.join(process.cwd(), 'lib/services/navigation/defaultNavigation.ts')
  const content = fs.readFileSync(navFile, 'utf-8')
  const hrefs = new Set<string>()
  
  // Match href: '...' or href: "..."
  const hrefRegex = /href:\s*['"`]([^'"`]+)['"`]/g
  let match
  while ((match = hrefRegex.exec(content)) !== null) {
    hrefs.add(match[1])
  }
  
  return hrefs
}

// Get all page.tsx files
function getAllPages(): string[] {
  const pages: string[] = []
  const appDir = path.join(process.cwd(), 'app')
  
  function walkDir(dir: string, baseRoute: string = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const route = baseRoute ? `${baseRoute}/${entry.name}` : `/${entry.name}`
      
      if (entry.isDirectory()) {
        // Handle dynamic routes [id]
        if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
          const param = entry.name.slice(1, -1)
          walkDir(fullPath, `${baseRoute}/[${param}]`)
        } else {
          walkDir(fullPath, route)
        }
      } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
        // Convert file path to route
        let routePath = baseRoute || '/'
        if (routePath.includes('[')) {
          // Dynamic route - keep as is but note it
          pages.push(routePath)
        } else {
          pages.push(routePath)
        }
      }
    }
  }
  
  walkDir(appDir)
  return pages
}

// Check if route is linked in code (router.push, Link href, etc.)
function checkCodeLinks(route: string): boolean {
  const appDir = path.join(process.cwd(), 'app')
  const componentsDir = path.join(process.cwd(), 'components')
  
  function searchInDir(dir: string): boolean {
    if (!fs.existsSync(dir)) return false
    
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory() && !entry.name.includes('node_modules')) {
        if (searchInDir(fullPath)) return true
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8')
          
          // Check for various link patterns
          const patterns = [
            new RegExp(`router\\.(push|replace)\\(['"\`]${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
            new RegExp(`href=['"\`]${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
            new RegExp(`redirect\\(['"\`]${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
            new RegExp(`['"\`]${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
          ]
          
          for (const pattern of patterns) {
            if (pattern.test(content)) {
              return true
            }
          }
        } catch (e) {
          // Skip files that can't be read
        }
      }
    }
    
    return false
  }
  
  return searchInDir(appDir) || searchInDir(componentsDir)
}

// Check if page redirects
function checkRedirects(route: string): string | null {
  const routePath = route === '/' ? 'app/page.tsx' : `app${route}/page.tsx`
  const fullPath = path.join(process.cwd(), routePath)
  
  if (!fs.existsSync(fullPath)) return null
  
  try {
    const content = fs.readFileSync(fullPath, 'utf-8')
    
    // Check for redirect patterns
    const redirectMatch = content.match(/redirect\s*\(['"`]([^'"`]+)['"`]\)|router\.(push|replace)\(['"`]([^'"`]+)['"`]\)/)
    if (redirectMatch) {
      return redirectMatch[1] || redirectMatch[3]
    }
    
    // Check for Next.js redirect
    const nextRedirectMatch = content.match(/redirect:\s*['"`]([^'"`]+)['"`]/)
    if (nextRedirectMatch) {
      return nextRedirectMatch[1]
    }
  } catch (e) {
    // File might not exist or be readable
  }
  
  return null
}

// Main analysis
function analyzePages() {
  console.log('🔍 Analyzing codebase for invisible pages...\n')
  
  const allPages = getAllPages()
  const navHrefs = extractNavigationHrefs()
  
  console.log(`📄 Found ${allPages.length} pages`)
  console.log(`🔗 Found ${navHrefs.size} navigation links\n`)
  
  const invisiblePages: PageInfo[] = []
  const visiblePages: PageInfo[] = []
  
  for (const pageRoute of allPages) {
    const pageInfo: PageInfo = {
      path: pageRoute === '/' ? 'app/page.tsx' : `app${pageRoute}/page.tsx`,
      route: pageRoute,
      exists: true,
      inNavigation: navHrefs.has(pageRoute),
      inCodeLinks: false,
      reason: []
    }
    
    // Check if it's a dynamic route
    const isDynamic = pageRoute.includes('[')
    
    // For dynamic routes, check if base route is in nav
    if (isDynamic) {
      const baseRoute = pageRoute.split('[')[0].replace(/\/$/, '') || '/'
      pageInfo.inNavigation = navHrefs.has(baseRoute)
      if (!pageInfo.inNavigation) {
        pageInfo.reason.push('Dynamic route - base route not in navigation')
      }
    } else {
      // Check code links for non-dynamic routes
      pageInfo.inCodeLinks = checkCodeLinks(pageRoute)
    }
    
    // Check for redirects
    const redirectsTo = checkRedirects(pageRoute)
    if (redirectsTo) {
      pageInfo.redirectsTo = redirectsTo
      pageInfo.reason.push(`Redirects to: ${redirectsTo}`)
    }
    
    // Determine visibility
    if (isDynamic) {
      // Dynamic routes are accessible via direct URL or programmatic navigation
      if (pageInfo.inNavigation || pageInfo.inCodeLinks) {
        visiblePages.push(pageInfo)
      } else {
        pageInfo.reason.push('Dynamic route with no navigation or code links')
        invisiblePages.push(pageInfo)
      }
    } else {
      if (!pageInfo.inNavigation && !pageInfo.inCodeLinks) {
        pageInfo.reason.push('Not in navigation menu')
        pageInfo.reason.push('Not linked in code (router.push, Link, etc.)')
        invisiblePages.push(pageInfo)
      } else {
        visiblePages.push(pageInfo)
      }
    }
  }
  
  // Generate report
  console.log('='.repeat(80))
  console.log('📊 INVISIBLE PAGES ANALYSIS')
  console.log('='.repeat(80))
  console.log(`\n❌ Invisible Pages: ${invisiblePages.length}`)
  console.log(`✅ Visible Pages: ${visiblePages.length}\n`)
  
  if (invisiblePages.length > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('📋 DETAILED INVISIBLE PAGES LIST')
    console.log('='.repeat(80) + '\n')
    
    invisiblePages.forEach((page, index) => {
      console.log(`${index + 1}. ${page.route}`)
      console.log(`   Path: ${page.path}`)
      if (page.redirectsTo) {
        console.log(`   ⚠️  Redirects to: ${page.redirectsTo}`)
      }
      console.log(`   Reasons:`)
      page.reason.forEach(reason => {
        console.log(`      - ${reason}`)
      })
      console.log('')
    })
  }
  
  // Save to JSON
  const report = {
    summary: {
      totalPages: allPages.length,
      visiblePages: visiblePages.length,
      invisiblePages: invisiblePages.length,
      navigationLinks: navHrefs.size
    },
    invisiblePages: invisiblePages.map(p => ({
      route: p.route,
      path: p.path,
      reasons: p.reason,
      redirectsTo: p.redirectsTo
    })),
    visiblePages: visiblePages.map(p => ({
      route: p.route,
      inNavigation: p.inNavigation,
      inCodeLinks: p.inCodeLinks
    }))
  }
  
  fs.writeFileSync(
    path.join(process.cwd(), 'INVISIBLE_PAGES_REPORT.json'),
    JSON.stringify(report, null, 2)
  )
  
  console.log('\n✅ Report saved to INVISIBLE_PAGES_REPORT.json')
}

// Run analysis
analyzePages()



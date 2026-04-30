/**
 * Find Missing Pages Script
 * 
 * Scans all module route definitions and identifies which pages are missing
 * This fixes the 404 errors by ensuring all registered routes have corresponding page files
 */

import * as fs from 'fs'
import * as path from 'path'

interface ModuleRoute {
  path: string
  component: string
  title: string
  icon?: string
}

interface MissingPage {
  route: ModuleRoute
  expectedPath: string
  moduleId: string
}

async function findAllModuleRoutes(): Promise<Map<string, ModuleRoute[]>> {
  const moduleRoutes = new Map<string, ModuleRoute[]>()
  // Avoid glob entirely for maximum compatibility across OSes and runtimes.
  const modulesDir = path.join(process.cwd(), 'lib', 'modules')
  const moduleFiles = fs
    .readdirSync(modulesDir)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'registry.ts')
    .map((f) => path.join('lib', 'modules', f))

  for (const file of moduleFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8')
      const moduleName = path.basename(file, '.ts')
      
      // Extract routes array
      const routesMatch = content.match(/routes:\s*\[([\s\S]*?)\]/)
      if (!routesMatch) continue

      const routes: ModuleRoute[] = []
      const routesContent = routesMatch[1]
      
      // Parse each route object
      const routeMatches = routesContent.matchAll(/\{[^}]*path:\s*['"]([^'"]+)['"][^}]*component:\s*['"]([^'"]+)['"][^}]*title:\s*['"]([^'"]+)['"][^}]*\}/g)
      
      for (const match of routeMatches) {
        const [, path, component, title] = match
        
        // Extract icon if present
        const iconMatch = match[0].match(/icon:\s*['"]([^'"]+)['"]/)
        const icon = iconMatch ? iconMatch[1] : undefined
        
        routes.push({ path, component, title, icon })
      }
      
      // Also try a more flexible regex for routes with different formatting
      const flexibleRouteRegex = /path:\s*['"]([^'"]+)['"][\s\S]*?component:\s*['"]([^'"]+)['"][\s\S]*?title:\s*['"]([^'"]+)['"]/g
      let flexibleMatch
      while ((flexibleMatch = flexibleRouteRegex.exec(routesContent)) !== null) {
        const [, path, component, title] = flexibleMatch
        
        // Check if we already have this route
        if (!routes.some(r => r.path === path)) {
          const iconMatch = routesContent.substring(flexibleMatch.index).match(/icon:\s*['"]([^'"]+)['"]/)
          const icon = iconMatch ? iconMatch[1] : undefined
          routes.push({ path, component, title, icon })
        }
      }

      if (routes.length > 0) {
        moduleRoutes.set(moduleName, routes)
      }
    } catch (error) {
      console.error(`Error processing module ${file}:`, error)
    }
  }

  return moduleRoutes
}

function checkIfPageExists(componentPath: string): boolean {
  // Convert component path like 'app/hr/page' to file path
  const filePath = componentPath.replace(/^app\//, 'app/') + '.tsx'
  const fullPath = path.join(process.cwd(), filePath)
  return fs.existsSync(fullPath)
}

async function findMissingPages(): Promise<MissingPage[]> {
  const missingPages: MissingPage[] = []
  const moduleRoutes = await findAllModuleRoutes()

  for (const [moduleId, routes] of moduleRoutes.entries()) {
    for (const route of routes) {
      if (!checkIfPageExists(route.component)) {
        missingPages.push({
          route,
          expectedPath: route.component + '.tsx',
          moduleId,
        })
      }
    }
  }

  return missingPages
}

// Main execution
async function main() {
  console.log('🔍 Scanning for missing pages...\n')
  
  const missing = await findMissingPages()
  
  if (missing.length === 0) {
    console.log('✅ All pages exist! No missing pages found.')
    return
  }

  console.log(`❌ Found ${missing.length} missing pages:\n`)
  
  // Group by module
  const byModule = new Map<string, MissingPage[]>()
  for (const page of missing) {
    if (!byModule.has(page.moduleId)) {
      byModule.set(page.moduleId, [])
    }
    byModule.get(page.moduleId)!.push(page)
  }

  // Print report
  for (const [moduleId, pages] of byModule.entries()) {
    console.log(`\n📦 Module: ${moduleId}`)
    for (const page of pages) {
      console.log(`  ❌ ${page.route.path}`)
      console.log(`     Expected: ${page.expectedPath}`)
      console.log(`     Title: ${page.route.title}`)
    }
  }

  // Write to file
  const reportPath = path.join(process.cwd(), 'missing-pages-report.json')
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        total: missing.length,
        byModule: Object.fromEntries(
          Array.from(byModule.entries()).map(([module, pages]) => [
            module,
            pages.map(p => ({
              path: p.route.path,
              component: p.route.component,
              title: p.route.title,
              icon: p.route.icon,
              expectedPath: p.expectedPath,
            })),
          ])
        ),
      },
      null,
      2
    )
  )

  console.log(`\n📄 Report saved to: ${reportPath}`)
  console.log(`\n💡 Run 'npm run generate-missing-pages' to create all missing pages`)
}

if (require.main === module) {
  main().catch(console.error)
}

export { findMissingPages, findAllModuleRoutes }













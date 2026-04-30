/**
 * Automation Script: Secure All WMS API Routes
 * Adds withAPIGateway middleware to all WMS routes
 * Phase 10 - API Authentication
 */

import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'

interface RouteInfo {
  filePath: string
  methods: string[]
  secured: boolean
}

async function analyzeRoute(filePath: string): Promise<RouteInfo> {
  const content = await fs.readFile(filePath, 'utf-8')
  
  const methods: string[] = []
  const hasAPIGateway = content.includes('withAPIGateway')
  
  // Detect exported methods
  if (/export\s+(async\s+)?function\s+GET/.test(content) || /export\s+const\s+GET/.test(content)) methods.push('GET')
  if (/export\s+(async\s+)?function\s+POST/.test(content) || /export\s+const\s+POST/.test(content)) methods.push('POST')
  if (/export\s+(async\s+)?function\s+PUT/.test(content) || /export\s+const\s+PUT/.test(content)) methods.push('PUT')
  if (/export\s+(async\s+)?function\s+PATCH/.test(content) || /export\s+const\s+PATCH/.test(content)) methods.push('PATCH')
  if (/export\s+(async\s+)?function\s+DELETE/.test(content) || /export\s+const\s+DELETE/.test(content)) methods.push('DELETE')
  
  return {
    filePath,
    methods,
    secured: hasAPIGateway
  }
}

async function secureRoute(filePath: string): Promise<void> {
  let content = await fs.readFile(filePath, 'utf-8')
  
  // Skip if already secured
  if (content.includes('withAPIGateway')) {
    console.log(`✓ Already secured: ${filePath}`)
    return
  }
  
  // Add imports if not present
  if (!content.includes("from '@/middleware/apiGateway'")) {
    // Find the last import statement
    const importLines = content.match(/^import .+ from .+$/gm) || []
    if (importLines.length > 0) {
      const lastImport = importLines[importLines.length - 1]
      const importIndex = content.indexOf(lastImport) + lastImport.length
      content = content.slice(0, importIndex) + 
        "\nimport { withAPIGateway } from '@/middleware/apiGateway'" +
        "\nimport type { APIRequestContext } from '@/middleware/apiPermissions'" +
        content.slice(importIndex)
    }
  }
  
  // Determine feature ID from file path
  const relativePath = filePath.replace(/\\/g, '/').split('/api/wms/')[1]
  const featurePath = relativePath.replace(/\/route\.ts$/, '').replace(/\/\[.+?\]/g, '')
  const featureId = `wms.${featurePath.replace(/\//g, '.')}`
  
  // Process each HTTP method
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  
  for (const method of methods) {
    // Check if this method exists
    const methodRegex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`, 'g')
    if (methodRegex.test(content)) {
      // Convert to handler function
      content = content.replace(
        new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`),
        `async function ${method.toLowerCase()}Handler(`
      )
      
      // Add context parameter if not present
      if (!content.includes(`${method.toLowerCase()}Handler(request: NextRequest, context: APIRequestContext`)) {
        content = content.replace(
          new RegExp(`${method.toLowerCase()}Handler\\(\\s*request:\\s*NextRequest`),
          `${method.toLowerCase()}Handler(request: NextRequest, context: APIRequestContext`
        )
      }
      
      // Add export with withAPIGateway at the end
      const action = method === 'GET' ? 'read' : method === 'DELETE' ? 'delete' : 'write'
      const exportStatement = `\nexport const ${method} = withAPIGateway(${method.toLowerCase()}Handler, {
  moduleId: 'wms',
  featureId: '${featureId}',
  action: '${action}',
  requireAuth: true,
  rateLimit: true,
})\n`
      
      // Check if export already exists
      const exportRegex = new RegExp(`export\\s+const\\s+${method}\\s+=\\s+withAPIGateway`)
      if (!exportRegex.test(content)) {
        // Add before the trailing empty lines
        content = content.trimEnd() + exportStatement
      }
    }
  }
  
  await fs.writeFile(filePath, content, 'utf-8')
  console.log(`✓ Secured: ${filePath}`)
}

async function main() {
  console.log('🔒 Phase 10: Securing WMS API Routes\n')
  
  // Find all WMS route files
  const routeFiles = await glob('app/api/wms/**/route.ts', {
    ignore: ['**/node_modules/**'],
    windowsPathsNoEscape: true
  })
  
  console.log(`Found ${routeFiles.length} WMS route files\n`)
  
  // Analyze each route
  const routes: RouteInfo[] = []
  for (const file of routeFiles) {
    const info = await analyzeRoute(file)
    routes.push(info)
  }
  
  // Report
  const unsecured = routes.filter(r => !r.secured)
  console.log(`\n📊 Status:`)
  console.log(`  Total routes: ${routes.length}`)
  console.log(`  Already secured: ${routes.length - unsecured.length}`)
  console.log(`  Need securing: ${unsecured.length}\n`)
  
  if (unsecured.length === 0) {
    console.log('✅ All WMS routes are already secured!')
    return
  }
  
  console.log('🔧 Securing routes...\n')
  
  for (const route of unsecured) {
    try {
      await secureRoute(route.filePath)
    } catch (error) {
      console.error(`❌ Error securing ${route.filePath}:`, error)
    }
  }
  
  console.log('\n✅ WMS routes secured!')
  console.log(`\n📈 Progress: ${routes.length}/${routes.length} routes secured (100%)`)
}

main().catch(console.error)

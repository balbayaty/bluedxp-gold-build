/**
 * Navigation Reality Audit
 *
 * Goal: Produce an authoritative, reproducible report that answers:
 * - Which routes exist as Next.js pages (app/** /page.tsx)
 * - Which routes are linked in default navigation (lib/services/navigation/defaultNavigation.ts)
 * - Which routes are declared in module registry (lib/modules/*.ts routes[])
 * - Which pages are "generated placeholders" (Auto-generated page for ...)
 *
 * Output:
 * - NAVIGATION_REALITY_AUDIT.json
 * - NAVIGATION_REALITY_AUDIT.md
 *
 * Notes:
 * - Avoids glob to stay compatible on Windows and across runtimes.
 */
import * as fs from 'fs'
import * as path from 'path'

type ModuleRoute = { path: string; component: string; title: string; icon?: string; requiresAuth?: boolean; roles?: string[] }

function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

function exists(p: string): boolean {
  return fs.existsSync(p)
}

function walkFiles(rootDir: string, predicate: (fileName: string) => boolean): string[] {
  const results: string[] = []
  const stack: string[] = [rootDir]

  while (stack.length) {
    const current = stack.pop()!
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue
        stack.push(fullPath)
      } else if (entry.isFile()) {
        if (predicate(entry.name)) results.push(fullPath)
      }
    }
  }

  return results
}

function fileToRoute(appDir: string, pageFile: string): string {
  // appDir is absolute path to /app
  const rel = path.relative(appDir, pageFile).replace(/\\/g, '/')
  // rel examples:
  // - "page.tsx" => "/"
  // - "hr/employees/page.tsx" => "/hr/employees"
  if (rel === 'page.tsx') return '/'
  const noSuffix = rel.replace(/\/page\.tsx$/, '')
  return '/' + noSuffix
}

function extractNavigationHrefs(navContent: string): string[] {
  const hrefRegex = /href:\s*['"]([^'"]+)['"]/g
  const hrefs: string[] = []
  let match: RegExpExecArray | null
  while ((match = hrefRegex.exec(navContent)) !== null) {
    hrefs.push(match[1])
  }
  return hrefs
}

function readModuleRouteDeclarations(): { moduleId: string; routes: ModuleRoute[] }[] {
  const modulesDir = path.join(process.cwd(), 'lib', 'modules')
  if (!exists(modulesDir)) return []

  const moduleFiles = fs
    .readdirSync(modulesDir)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'registry.ts')
    .map((f) => path.join(modulesDir, f))

  const results: { moduleId: string; routes: ModuleRoute[] }[] = []

  for (const file of moduleFiles) {
    const content = readText(file)
    const moduleId = path.basename(file, '.ts')

    // This parser is intentionally simple: it finds "path:", "component:", "title:" within the routes array text.
    // If a module has unusual formatting, it will still likely match due to non-greedy / flexible regex.
    const routesBlockMatch = content.match(/routes:\s*\[([\s\S]*?)\]\s*,/m) || content.match(/routes:\s*\[([\s\S]*?)\]/m)
    if (!routesBlockMatch) continue

    const routesBlock = routesBlockMatch[1]
    const routeRegex = /\{[\s\S]*?path:\s*['"]([^'"]+)['"][\s\S]*?component:\s*['"]([^'"]+)['"][\s\S]*?title:\s*['"]([^'"]+)['"][\s\S]*?\}/g
    const routes: ModuleRoute[] = []

    let rm: RegExpExecArray | null
    while ((rm = routeRegex.exec(routesBlock)) !== null) {
      const [obj, routePath, component, title] = rm
      const iconMatch = obj.match(/icon:\s*['"]([^'"]+)['"]/)
      const requiresAuthMatch = obj.match(/requiresAuth:\s*(true|false)/)
      const rolesMatch = obj.match(/roles:\s*\[([^\]]*)\]/)

      const roles =
        rolesMatch?.[1]
          ?.split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean) ?? undefined

      routes.push({
        path: routePath,
        component,
        title,
        icon: iconMatch?.[1],
        requiresAuth: requiresAuthMatch ? requiresAuthMatch[1] === 'true' : undefined,
        roles,
      })
    }

    if (routes.length) results.push({ moduleId, routes })
  }

  return results
}

function isGeneratedPlaceholder(pageContent: string): boolean {
  return pageContent.includes('Auto-generated page for') && pageContent.includes('This page is ready for implementation')
}

function main() {
  const appDir = path.join(process.cwd(), 'app')
  const navFile = path.join(process.cwd(), 'lib', 'services', 'navigation', 'defaultNavigation.ts')

  if (!exists(appDir)) throw new Error('app/ directory not found')
  if (!exists(navFile)) throw new Error('defaultNavigation.ts not found')

  const pageFiles = walkFiles(appDir, (name) => name === 'page.tsx')
  const pageRoutes = pageFiles.map((f) => fileToRoute(appDir, f))

  const navContent = readText(navFile)
  const navHrefs = extractNavigationHrefs(navContent).filter((h) => h.startsWith('/'))
  const navHrefSet = new Set(navHrefs)

  const moduleDecls = readModuleRouteDeclarations()
  const moduleRouteSet = new Set<string>()
  const moduleRouteIndex: Record<string, { moduleId: string; title: string; component: string }[]> = {}

  for (const mod of moduleDecls) {
    for (const r of mod.routes) {
      moduleRouteSet.add(r.path)
      moduleRouteIndex[r.path] = moduleRouteIndex[r.path] || []
      moduleRouteIndex[r.path].push({ moduleId: mod.moduleId, title: r.title, component: r.component })
    }
  }

  const pageInfo = pageFiles.map((file, i) => {
    const route = pageRoutes[i]
    const relFile = path.relative(process.cwd(), file).replace(/\\/g, '/')
    const content = readText(file)

    return {
      route,
      file: relFile,
      inNavigation: navHrefSet.has(route),
      inModuleRegistry: moduleRouteSet.has(route),
      moduleRegistryEntries: moduleRouteIndex[route] || [],
      isGeneratedPlaceholder: isGeneratedPlaceholder(content),
    }
  })

  const pagesNotInNavigation = pageInfo.filter((p) => !p.inNavigation)
  const navWithoutPages = Array.from(navHrefSet).filter((href) => {
    if (href === '/') return !pageInfo.some((p) => p.route === '/')
    return !pageInfo.some((p) => p.route === href)
  })

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPages: pageInfo.length,
      totalNavLinks: navHrefSet.size,
      pagesInNavigation: pageInfo.filter((p) => p.inNavigation).length,
      pagesNotInNavigation: pagesNotInNavigation.length,
      navLinksWithoutPages: navWithoutPages.length,
      generatedPlaceholderPages: pageInfo.filter((p) => p.isGeneratedPlaceholder).length,
      pagesNotInNavButInModuleRegistry: pagesNotInNavigation.filter((p) => p.inModuleRegistry).length,
    },
    pagesNotInNavigation: pagesNotInNavigation,
    navLinksWithoutPages: navWithoutPages.sort(),
  }

  const reportsDir = path.join(process.cwd(), 'docs', 'reports')
  if (!exists(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  const outJson = path.join(reportsDir, 'NAVIGATION_REALITY_AUDIT.json')
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf-8')

  const mdLines: string[] = []
  mdLines.push(`# Navigation Reality Audit`)
  mdLines.push(``)
  mdLines.push(`**Generated:** ${report.generatedAt}`)
  mdLines.push(``)
  mdLines.push(`## Summary`)
  mdLines.push(`- Total pages: ${report.summary.totalPages}`)
  mdLines.push(`- Total nav links: ${report.summary.totalNavLinks}`)
  mdLines.push(`- Pages in navigation: ${report.summary.pagesInNavigation}`)
  mdLines.push(`- Pages NOT in navigation: ${report.summary.pagesNotInNavigation}`)
  mdLines.push(`- Nav links WITHOUT pages: ${report.summary.navLinksWithoutPages}`)
  mdLines.push(`- Generated placeholder pages: ${report.summary.generatedPlaceholderPages}`)
  mdLines.push(`- Pages not in nav BUT declared in module registry: ${report.summary.pagesNotInNavButInModuleRegistry}`)
  mdLines.push(``)

  mdLines.push(`## Pages NOT in navigation (top 100)`)
  for (const p of report.pagesNotInNavigation.slice(0, 100)) {
    const flags = [
      p.isGeneratedPlaceholder ? 'placeholder' : undefined,
      p.inModuleRegistry ? `module:${p.moduleRegistryEntries.map((e) => e.moduleId).join(',') || 'yes'}` : undefined,
    ]
      .filter(Boolean)
      .join(', ')
    mdLines.push(`- \`${p.route}\` — \`${p.file}\`${flags ? ` (${flags})` : ''}`)
  }
  if (report.pagesNotInNavigation.length > 100) {
    mdLines.push(`- ... and ${report.pagesNotInNavigation.length - 100} more`)
  }
  mdLines.push(``)

  mdLines.push(`## Navigation links without pages`)
  for (const href of report.navLinksWithoutPages) {
    mdLines.push(`- \`${href}\``)
  }
  mdLines.push(``)

  const outMd = path.join(reportsDir, 'NAVIGATION_REALITY_AUDIT.md')
  fs.writeFileSync(outMd, mdLines.join('\n'), 'utf-8')

  console.log(`✅ Wrote docs/reports/${path.basename(outJson)} and docs/reports/${path.basename(outMd)}`)
  console.log(`Summary:`)
  console.log(report.summary)
}

if (require.main === module) {
  main()
}



/**
 * API Authentication Audit Script
 * Scans all API routes and identifies which need authentication
 * 
 * FEATURES:
 * - Scans app/api directory
 * - Identifies routes with/without withAPIGateway
 * - Generates comprehensive report
 * - Prioritizes critical routes
 * 
 * USAGE: npx ts-node scripts/audit-api-authentication.ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface RouteInfo {
  path: string
  file: string
  hasAuth: boolean
  methods: string[]
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  module: string
}

interface AuditReport {
  totalRoutes: number
  authenticated: number
  unauthenticated: number
  byPriority: Record<string, number>
  byModule: Record<string, { total: number; authenticated: number }>
  routes: RouteInfo[]
}

class APIAuthenticationAuditor {
  private report: AuditReport = {
    totalRoutes: 0,
    authenticated: 0,
    unauthenticated: 0,
    byPriority: {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    },
    byModule: {},
    routes: [],
  }

  async audit(): Promise<AuditReport> {
    const apiDir = path.join(process.cwd(), 'app', 'api')
    await this.scanDirectory(apiDir, '/api')
    
    // Calculate statistics
    this.report.totalRoutes = this.report.routes.length
    this.report.authenticated = this.report.routes.filter(r => r.hasAuth).length
    this.report.unauthenticated = this.report.routes.filter(r => !r.hasAuth).length

    return this.report
  }

  private async scanDirectory(dir: string, routePath: string): Promise<void> {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          // Handle dynamic routes [id], [slug], etc.
          const isDynamicRoute = entry.name.startsWith('[') && entry.name.endsWith(']')
          const newRoutePath = isDynamicRoute
            ? `${routePath}/${entry.name}`
            : `${routePath}/${entry.name}`

          await this.scanDirectory(fullPath, newRoutePath)
        } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
          await this.analyzeRoute(fullPath, routePath)
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error)
    }
  }

  private async analyzeRoute(filePath: string, routePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')

      // Check for withAPIGateway
      const hasAuth = content.includes('withAPIGateway') || content.includes('withTransportationAPI')

      // Extract HTTP methods
      const methods: string[] = []
      if (content.includes('export async function GET') || content.includes('export const GET')) methods.push('GET')
      if (content.includes('export async function POST') || content.includes('export const POST')) methods.push('POST')
      if (content.includes('export async function PUT') || content.includes('export const PUT')) methods.push('PUT')
      if (content.includes('export async function DELETE') || content.includes('export const DELETE')) methods.push('DELETE')
      if (content.includes('export async function PATCH') || content.includes('export const PATCH')) methods.push('PATCH')

      // Determine module from path
      const pathParts = routePath.split('/').filter(Boolean)
      const module = pathParts[1] || 'unknown'

      // Determine priority
      const priority = this.determinePriority(routePath, module, methods)

      const routeInfo: RouteInfo = {
        path: routePath,
        file: filePath.replace(process.cwd(), ''),
        hasAuth,
        methods,
        priority,
        module,
      }

      this.report.routes.push(routeInfo)

      // Update by module stats
      if (!this.report.byModule[module]) {
        this.report.byModule[module] = { total: 0, authenticated: 0 }
      }
      this.report.byModule[module].total++
      if (hasAuth) {
        this.report.byModule[module].authenticated++
      }

      // Update by priority
      if (!hasAuth) {
        this.report.byPriority[priority]++
      }
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error)
    }
  }

  private determinePriority(
    routePath: string,
    module: string,
    methods: string[]
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    // Critical: Auth, payment, admin routes
    if (routePath.includes('/auth/') || routePath.includes('/admin/') || routePath.includes('/payment/')) {
      return 'CRITICAL'
    }

    // Critical: Write operations on core modules
    if ((methods.includes('POST') || methods.includes('PUT') || methods.includes('DELETE')) &&
        ['wms', 'tms', 'proposals', 'facility', 'qhse'].includes(module)) {
      return 'CRITICAL'
    }

    // High: Read operations on core modules
    if (methods.includes('GET') && ['wms', 'tms', 'proposals', 'facility', 'qhse'].includes(module)) {
      return 'HIGH'
    }

    // High: All write operations
    if (methods.includes('POST') || methods.includes('PUT') || methods.includes('DELETE')) {
      return 'HIGH'
    }

    // Medium: All GET operations
    if (methods.includes('GET')) {
      return 'MEDIUM'
    }

    return 'LOW'
  }

  generateReport(): string {
    const { totalRoutes, authenticated, unauthenticated, byPriority, byModule, routes } = this.report

    let report = '# API Authentication Audit Report\n\n'
    report += `**Date:** ${new Date().toISOString()}\n\n`
    report += '## Summary\n\n'
    report += `- **Total Routes:** ${totalRoutes}\n`
    report += `- **Authenticated:** ${authenticated} (${((authenticated / totalRoutes) * 100).toFixed(1)}%)\n`
    report += `- **Unauthenticated:** ${unauthenticated} (${((unauthenticated / totalRoutes) * 100).toFixed(1)}%)\n\n`

    report += '## By Priority (Unauthenticated Only)\n\n'
    report += '| Priority | Count |\n'
    report += '|----------|-------|\n'
    Object.entries(byPriority).forEach(([priority, count]) => {
      report += `| ${priority} | ${count} |\n`
    })
    report += '\n'

    report += '## By Module\n\n'
    report += '| Module | Total | Authenticated | Unauthenticated | % Secure |\n'
    report += '|--------|-------|---------------|-----------------|----------|\n'
    Object.entries(byModule).forEach(([module, stats]) => {
      const pct = ((stats.authenticated / stats.total) * 100).toFixed(1)
      report += `| ${module} | ${stats.total} | ${stats.authenticated} | ${stats.total - stats.authenticated} | ${pct}% |\n`
    })
    report += '\n'

    report += '## Unauthenticated Routes (Need Attention)\n\n'
    const unauthRoutes = routes.filter(r => !r.hasAuth).sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    unauthRoutes.forEach(route => {
      report += `### ${route.path}\n`
      report += `- **Priority:** ${route.priority}\n`
      report += `- **Module:** ${route.module}\n`
      report += `- **Methods:** ${route.methods.join(', ')}\n`
      report += `- **File:** \`${route.file}\`\n\n`
    })

    return report
  }
}

// Run audit
async function main() {
  console.log('🔍 Starting API Authentication Audit...\n')

  const auditor = new APIAuthenticationAuditor()
  const report = await auditor.audit()

  console.log('📊 Audit Complete!\n')
  console.log(`Total Routes: ${report.totalRoutes}`)
  console.log(`Authenticated: ${report.authenticated}`)
  console.log(`Unauthenticated: ${report.unauthenticated}`)
  console.log(`\nBy Priority (Unauthenticated):`)
  console.log(`  CRITICAL: ${report.byPriority.CRITICAL}`)
  console.log(`  HIGH: ${report.byPriority.HIGH}`)
  console.log(`  MEDIUM: ${report.byPriority.MEDIUM}`)
  console.log(`  LOW: ${report.byPriority.LOW}`)

  // Generate markdown report
  const reportText = auditor.generateReport()
  const reportPath = path.join(process.cwd(), 'docs', 'API_AUTHENTICATION_AUDIT.md')
  fs.writeFileSync(reportPath, reportText)

  console.log(`\n📄 Report saved to: docs/API_AUTHENTICATION_AUDIT.md`)
}

// Execute
main().catch(console.error)

export { APIAuthenticationAuditor }

/**
 * Generate a prioritized backlog from reports/APP_PAGE_SCORECARD.json
 *
 * Output:
 * - reports/APP_PAGE_BACKLOG.md
 *
 * This is designed for non-technical planning: it converts the audit into an execution list.
 */

import * as fs from 'fs'
import * as path from 'path'

type ScorecardPage = {
  path: string
  readiness: number
  dataSource: string
  databaseIntegration: string
  issues: string[]
  warnings: string[]
  registeredRoutes?: Array<{
    moduleId: string
    routePath: string
    title: string
    requiresAuth?: boolean
    roles?: string[]
  }>
}

type ScorecardModule = {
  moduleName: string
  pages: ScorecardPage[]
  totalReadiness: number
}

type Scorecard = {
  timestamp: string
  totalPages: number
  pagesAudited: number
  overallReadiness: number
  modules: ScorecardModule[]
  coverage?: {
    registeredPageCount: number
    unregisteredPageCount: number
    moduleRouteCount: number
    moduleRoutesMissingPages: number
  }
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

function loadScorecard(filePath: string): Scorecard {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as Scorecard
}

function main() {
  const scorecardPath = path.join(process.cwd(), 'reports', 'APP_PAGE_SCORECARD.json')
  if (!fs.existsSync(scorecardPath)) {
    console.error(`Missing scorecard: ${scorecardPath}`)
    console.error(`Run: npm run audit:pages`)
    process.exit(1)
  }

  const scorecard = loadScorecard(scorecardPath)
  const allPages = scorecard.modules.flatMap((m) => m.pages.map((p) => ({ module: m.moduleName, page: p })))

  const issueCounts = new Map<string, number>()
  for (const { page } of allPages) {
    for (const i of page.issues || []) issueCounts.set(i, (issueCounts.get(i) || 0) + 1)
  }
  const topIssues = [...issueCounts.entries()].sort((a, b) => b[1] - a[1])

  const lowestReadiness = [...allPages].sort((a, b) => a.page.readiness - b.page.readiness).slice(0, 100)

  const registeredButAuthGap = allPages
    .filter(({ page }) =>
      (page.issues || []).includes('Route requires auth (per module definition) but page does not appear to enforce auth/redirect')
    )
    .sort((a, b) => a.page.readiness - b.page.readiness)

  const mockDataPages = allPages
    .filter(({ page }) => page.dataSource === 'mock')
    .sort((a, b) => a.page.readiness - b.page.readiness)

  const outputDir = path.join(process.cwd(), 'reports')
  ensureDir(outputDir)
  const outPath = path.join(outputDir, 'APP_PAGE_BACKLOG.md')

  const md: string[] = []
  md.push(`# BlueDXP - Page Backlog (from scorecard)`)
  md.push(``)
  md.push(`Generated from: \`reports/APP_PAGE_SCORECARD.json\``)
  md.push(`- Timestamp: ${scorecard.timestamp}`)
  md.push(`- Pages audited: ${scorecard.pagesAudited}`)
  md.push(`- Overall readiness: ${scorecard.overallReadiness.toFixed(1)}%`)
  if (scorecard.coverage) {
    md.push(`- Coverage: ${scorecard.coverage.registeredPageCount} registered, ${scorecard.coverage.unregisteredPageCount} unregistered`)
  }
  md.push(``)

  md.push(`## Top issue types (counts)`)
  md.push(``)
  for (const [issue, count] of topIssues.slice(0, 20)) {
    md.push(`- ${count}× ${issue}`)
  }
  md.push(``)

  md.push(`## Priority Queue A — Auth gaps on routes marked requiresAuth`)
  md.push(`These should be fixed early because they block safe production.`)
  md.push(``)
  md.push(`| Module | Page | Score | Registered routes |`)
  md.push(`|---|---|---:|---|`)
  for (const row of registeredButAuthGap.slice(0, 50)) {
    const routes = (row.page.registeredRoutes || [])
      .map((r) => `${r.routePath} (${r.moduleId})`)
      .slice(0, 3)
      .join(', ') || '—'
    md.push(`| ${row.module} | \`${row.page.path}\` | ${row.page.readiness} | ${routes} |`)
  }
  md.push(``)

  md.push(`## Priority Queue B — Mock data pages`)
  md.push(`These need service + API integration before replacing mock data.`)
  md.push(``)
  md.push(`| Module | Page | Score | Notes |`)
  md.push(`|---|---|---:|---|`)
  for (const row of mockDataPages.slice(0, 50)) {
    const notes = (row.page.issues || []).slice(0, 2).join('; ') || 'mock data'
    md.push(`| ${row.module} | \`${row.page.path}\` | ${row.page.readiness} | ${notes} |`)
  }
  md.push(``)

  md.push(`## Priority Queue C — Lowest readiness pages (top 100)`)
  md.push(``)
  md.push(`| Module | Page | Score | Key issues |`)
  md.push(`|---|---|---:|---|`)
  for (const row of lowestReadiness) {
    const issues = (row.page.issues || []).slice(0, 2).join('; ') || '—'
    md.push(`| ${row.module} | \`${row.page.path}\` | ${row.page.readiness} | ${issues} |`)
  }
  md.push(``)

  fs.writeFileSync(outPath, md.join('\n'))
  console.log(`✅ Backlog saved: ${outPath}`)
}

if (require.main === module) {
  main()
}



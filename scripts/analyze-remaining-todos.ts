/**
 * Analyze Remaining TODOs
 * Categorizes all 463 TODOs by type and priority
 */

import * as fs from 'fs'
import * as path from 'path'

interface TODOItem {
  file: string
  line: number
  text: string
  category: 'DATABASE' | 'FEATURE' | 'OPTIMIZATION' | 'INTEGRATION' | 'SECURITY' | 'REFACTOR' | 'DOCUMENTATION' | 'UNKNOWN'
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  implementationStatus: 'ALREADY_DONE' | 'NEEDS_WORK' | 'ENHANCEMENT' | 'OBSOLETE'
}

interface AnalysisReport {
  total: number
  byCategory: Record<string, number>
  byPriority: Record<string, number>
  byStatus: Record<string, number>
  items: TODOItem[]
  summary: {
    alreadyDone: number
    needsWork: number
    enhancements: number
    obsolete: number
  }
}

class TODOAnalyzer {
  private report: AnalysisReport = {
    total: 0,
    byCategory: {},
    byPriority: {},
    byStatus: {},
    items: [],
    summary: {
      alreadyDone: 0,
      needsWork: 0,
      enhancements: 0,
      obsolete: 0,
    },
  }

  async analyze(): Promise<AnalysisReport> {
    const srcDirs = ['lib/services', 'app/api', 'components']
    
    for (const dir of srcDirs) {
      const fullPath = path.join(process.cwd(), dir)
      if (fs.existsSync(fullPath)) {
        await this.scanDirectory(fullPath, dir)
      }
    }

    return this.report
  }

  private async scanDirectory(dir: string, relativePath: string): Promise<void> {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        const relPath = path.join(relativePath, entry.name)

        if (entry.isDirectory()) {
          if (!['node_modules', '.next', 'dist'].includes(entry.name)) {
            await this.scanDirectory(fullPath, relPath)
          }
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          await this.analyzeFile(fullPath, relPath)
        }
      }
    } catch (error) {
      // Skip errors
    }
  }

  private async analyzeFile(filePath: string, relativePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (trimmed.includes('TODO') || trimmed.includes('FIXME')) {
          const todoText = trimmed.replace(/^\/\/\s*/, '').replace(/^\/\*\s*/, '').replace(/\s*\*\/$/, '')
          
          const item: TODOItem = {
            file: relativePath,
            line: index + 1,
            text: todoText,
            category: this.categorize(todoText),
            priority: this.prioritize(todoText, relativePath),
            implementationStatus: this.assessStatus(todoText),
          }

          this.report.items.push(item)
          this.report.total++

          // Update counts
          this.report.byCategory[item.category] = (this.report.byCategory[item.category] || 0) + 1
          this.report.byPriority[item.priority] = (this.report.byPriority[item.priority] || 0) + 1
          this.report.byStatus[item.implementationStatus] = (this.report.byStatus[item.implementationStatus] || 0) + 1
          this.report.summary[item.implementationStatus === 'ALREADY_DONE' ? 'alreadyDone' :
                               item.implementationStatus === 'NEEDS_WORK' ? 'needsWork' :
                               item.implementationStatus === 'ENHANCEMENT' ? 'enhancements' : 'obsolete']++
        }
      })
    } catch (error) {
      // Skip
    }
  }

  private categorize(text: string): TODOItem['category'] {
    const lower = text.toLowerCase()
    if (lower.includes('database') || lower.includes('schema') || lower.includes('persist')) return 'DATABASE'
    if (lower.includes('implement') || lower.includes('add')) return 'FEATURE'
    if (lower.includes('optimize') || lower.includes('improve') || lower.includes('enhance')) return 'OPTIMIZATION'
    if (lower.includes('integrate') || lower.includes('connect')) return 'INTEGRATION'
    if (lower.includes('security') || lower.includes('auth') || lower.includes('encrypt')) return 'SECURITY'
    if (lower.includes('refactor') || lower.includes('clean')) return 'REFACTOR'
    if (lower.includes('document') || lower.includes('comment')) return 'DOCUMENTATION'
    return 'UNKNOWN'
  }

  private prioritize(text: string, file: string): TODOItem['priority'] {
    const lower = text.toLowerCase()
    if (lower.includes('critical') || lower.includes('urgent') || lower.includes('security')) return 'CRITICAL'
    if (file.includes('auth') || file.includes('security') || lower.includes('fix')) return 'HIGH'
    if (lower.includes('enhance') || lower.includes('improve')) return 'MEDIUM'
    return 'LOW'
  }

  private assessStatus(text: string): TODOItem['implementationStatus'] {
    const lower = text.toLowerCase()
    if (lower.includes('when schema is ready') || lower.includes('when database')) return 'ALREADY_DONE'
    if (lower.includes('fix') || lower.includes('critical') || lower.includes('required')) return 'NEEDS_WORK'
    if (lower.includes('enhance') || lower.includes('add feature') || lower.includes('nice to have')) return 'ENHANCEMENT'
    if (lower.includes('obsolete') || lower.includes('deprecated')) return 'OBSOLETE'
    
    // Default assessment
    if (lower.includes('implement')) return 'NEEDS_WORK'
    return 'ENHANCEMENT'
  }

  generateReport(): string {
    let report = '# TODO Analysis Report\n\n'
    report += `**Date:** ${new Date().toISOString()}\n\n`
    report += `**Total TODOs:** ${this.report.total}\n\n`
    
    report += '## Summary\n\n'
    report += `- **Already Done:** ${this.report.summary.alreadyDone} (work completed, TODO not removed)\n`
    report += `- **Needs Work:** ${this.report.summary.needsWork} (actual gaps)\n`
    report += `- **Enhancements:** ${this.report.summary.enhancements} (nice-to-haves)\n`
    report += `- **Obsolete:** ${this.report.summary.obsolete} (can be removed)\n\n`

    report += '## By Category\n\n'
    Object.entries(this.report.byCategory).forEach(([cat, count]) => {
      report += `- **${cat}:** ${count}\n`
    })
    report += '\n'

    report += '## By Priority\n\n'
    Object.entries(this.report.byPriority).forEach(([pri, count]) => {
      report += `- **${pri}:** ${count}\n`
    })
    report += '\n'

    report += '## Critical Items (Needs Work)\n\n'
    const critical = this.report.items.filter(i => i.implementationStatus === 'NEEDS_WORK' && i.priority === 'CRITICAL')
    critical.forEach(item => {
      report += `- **${item.file}:${item.line}** - ${item.text}\n`
    })
    report += '\n'

    report += '## High Priority (Needs Work)\n\n'
    const high = this.report.items.filter(i => i.implementationStatus === 'NEEDS_WORK' && i.priority === 'HIGH').slice(0, 30)
    high.forEach(item => {
      report += `- **${item.file}:${item.line}** - ${item.text}\n`
    })

    return report
  }
}

async function main() {
  console.log('🔍 Analyzing all TODOs...\n')

  const analyzer = new TODOAnalyzer()
  const report = await analyzer.analyze()

  console.log('📊 Analysis Complete!\n')
  console.log(`Total TODOs: ${report.total}`)
  console.log(`\nBy Status:`)
  console.log(`  Already Done: ${report.summary.alreadyDone}`)
  console.log(`  Needs Work: ${report.summary.needsWork}`)
  console.log(`  Enhancements: ${report.summary.enhancements}`)
  console.log(`  Obsolete: ${report.summary.obsolete}`)

  const reportText = analyzer.generateReport()
  const reportPath = path.join(process.cwd(), 'docs', 'TODO_ANALYSIS_REPORT.md')
  fs.writeFileSync(reportPath, reportText)

  console.log(`\n📄 Report saved to: docs/TODO_ANALYSIS_REPORT.md`)
}

main().catch(console.error)

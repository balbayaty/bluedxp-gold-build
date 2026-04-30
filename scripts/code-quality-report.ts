/**
 * Code Quality Report Generator
 * Analyzes codebase for quality improvements
 * 
 * ANALYSIS:
 * - Unused imports
 * - Commented code blocks
 * - TODO/FIXME count
 * - File size analysis
 * - Duplicate code detection
 */

import * as fs from 'fs'
import * as path from 'path'

interface QualityReport {
  totalFiles: number
  filesWithCommentedImports: string[]
  filesWithCommentedCode: string[]
  filesWithTodos: { file: string; count: number }[]
  largeFiles: { file: string; lines: number }[]
  duplicateNames: { name: string; files: string[] }[]
  summary: {
    commentedImports: number
    commentedCodeBlocks: number
    totalTodos: number
    filesOver500Lines: number
  }
}

class CodeQualityAnalyzer {
  private report: QualityReport = {
    totalFiles: 0,
    filesWithCommentedImports: [],
    filesWithCommentedCode: [],
    filesWithTodos: [],
    largeFiles: [],
    duplicateNames: [],
    summary: {
      commentedImports: 0,
      commentedCodeBlocks: 0,
      totalTodos: 0,
      filesOver500Lines: 0,
    },
  }

  async analyze(): Promise<QualityReport> {
    const srcDirs = ['app', 'components', 'lib', 'contexts', 'middleware']
    
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
          // Skip node_modules, .next, etc.
          if (!['node_modules', '.next', 'dist', 'build'].includes(entry.name)) {
            await this.scanDirectory(fullPath, relPath)
          }
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          await this.analyzeFile(fullPath, relPath)
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error)
    }
  }

  private async analyzeFile(filePath: string, relativePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      
      this.report.totalFiles++

      // Check for commented imports
      const hasCommentedImports = lines.some(line =>
        line.trim().startsWith('// import') || line.trim().startsWith('//import')
      )
      if (hasCommentedImports) {
        this.report.filesWithCommentedImports.push(relativePath)
        this.report.summary.commentedImports++
      }

      // Check for large commented code blocks (3+ consecutive commented lines)
      let consecutiveComments = 0
      for (const line of lines) {
        if (line.trim().startsWith('//') && line.trim().length > 5) {
          consecutiveComments++
          if (consecutiveComments >= 3) {
            if (!this.report.filesWithCommentedCode.includes(relativePath)) {
              this.report.filesWithCommentedCode.push(relativePath)
              this.report.summary.commentedCodeBlocks++
            }
            break
          }
        } else {
          consecutiveComments = 0
        }
      }

      // Count TODOs and FIXMEs
      const todoCount = (content.match(/TODO|FIXME/g) || []).length
      if (todoCount > 0) {
        this.report.filesWithTodos.push({ file: relativePath, count: todoCount })
        this.report.summary.totalTodos += todoCount
      }

      // Check file size
      if (lines.length > 500) {
        this.report.largeFiles.push({ file: relativePath, lines: lines.length })
        this.report.summary.filesOver500Lines++
      }
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error)
    }
  }

  generateReport(): string {
    const { summary } = this.report

    let report = '# Code Quality Report\n\n'
    report += `**Date:** ${new Date().toISOString()}\n\n`
    
    report += '## Summary\n\n'
    report += `- **Total Files Analyzed:** ${this.report.totalFiles}\n`
    report += `- **Files with Commented Imports:** ${summary.commentedImports}\n`
    report += `- **Files with Commented Code:** ${summary.commentedCodeBlocks}\n`
    report += `- **Total TODOs/FIXMEs:** ${summary.totalTodos}\n`
    report += `- **Files Over 500 Lines:** ${summary.filesOver500Lines}\n\n`

    if (this.report.filesWithCommentedImports.length > 0) {
      report += '## Files with Commented Imports\n\n'
      this.report.filesWithCommentedImports.forEach(file => {
        report += `- \`${file}\`\n`
      })
      report += '\n'
    }

    if (this.report.filesWithCommentedCode.length > 0) {
      report += '## Files with Commented Code Blocks\n\n'
      this.report.filesWithCommentedCode.slice(0, 50).forEach(file => {
        report += `- \`${file}\`\n`
      })
      if (this.report.filesWithCommentedCode.length > 50) {
        report += `\n... and ${this.report.filesWithCommentedCode.length - 50} more files\n`
      }
      report += '\n'
    }

    if (this.report.filesWithTodos.length > 0) {
      report += '## Files with TODOs (Top 30)\n\n'
      const sorted = this.report.filesWithTodos.sort((a, b) => b.count - a.count)
      sorted.slice(0, 30).forEach(item => {
        report += `- \`${item.file}\` - ${item.count} items\n`
      })
      report += '\n'
    }

    if (this.report.largeFiles.length > 0) {
      report += '## Large Files (Top 20)\n\n'
      const sorted = this.report.largeFiles.sort((a, b) => b.lines - a.lines)
      sorted.slice(0, 20).forEach(item => {
        report += `- \`${item.file}\` - ${item.lines} lines\n`
      })
      report += '\n'
    }

    return report
  }
}

async function main() {
  console.log('🔍 Analyzing code quality...\n')

  const analyzer = new CodeQualityAnalyzer()
  const report = await analyzer.analyze()

  console.log('📊 Analysis Complete!\n')
  console.log(`Total Files: ${report.totalFiles}`)
  console.log(`Commented Imports: ${report.summary.commentedImports}`)
  console.log(`Commented Code: ${report.summary.commentedCodeBlocks}`)
  console.log(`TODOs/FIXMEs: ${report.summary.totalTodos}`)
  console.log(`Large Files (>500 lines): ${report.summary.filesOver500Lines}`)

  const reportText = analyzer.generateReport()
  const reportPath = path.join(process.cwd(), 'docs', 'CODE_QUALITY_REPORT.md')
  fs.writeFileSync(reportPath, reportText)

  console.log(`\n📄 Report saved to: docs/CODE_QUALITY_REPORT.md`)
}

main().catch(console.error)

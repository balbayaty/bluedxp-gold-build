/**
 * Duplication Guard
 *
 * Purpose:
 * - Prevent "pasted file twice" issues (duplicate exports/imports within the same file)
 * - Fail fast in CI before `next build`
 *
 * What it checks:
 * - Duplicate exported symbol names (export const/function/class/interface/type/enum) per file
 * - Duplicate identical import lines per file (common paste symptom)
 *
 * Usage:
 * - `npm run check:duplication`
 */

import * as fs from 'fs'
import * as path from 'path'

const ROOT = process.cwd()
const TARGET_DIRS = [
  'app',
  'lib',
  'types',
  'middleware',
]

const EXTENSIONS = new Set(['.ts', '.tsx'])
const IGNORE_DIR_NAMES = new Set(['node_modules', '.next', 'dist', 'build', 'out', 'coverage', '.vercel'])

function walk(dir: string, acc: string[]) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIR_NAMES.has(entry.name)) continue
      walk(path.join(dir, entry.name), acc)
      continue
    }
    if (!entry.isFile()) continue
    const ext = path.extname(entry.name)
    if (!EXTENSIONS.has(ext)) continue
    acc.push(path.join(dir, entry.name))
  }
}

function getExportedNames(fileText: string): string[] {
  const names: string[] = []

  const patterns: RegExp[] = [
    /export\s+async\s+function\s+([A-Za-z0-9_]+)\s*\(/g,
    /export\s+function\s+([A-Za-z0-9_]+)\s*\(/g,
    /export\s+class\s+([A-Za-z0-9_]+)\s*/g,
    /export\s+const\s+([A-Za-z0-9_]+)\s*=/g,
    /export\s+let\s+([A-Za-z0-9_]+)\s*=/g,
    /export\s+var\s+([A-Za-z0-9_]+)\s*=/g,
    /export\s+interface\s+([A-Za-z0-9_]+)\s*/g,
    /export\s+type\s+([A-Za-z0-9_]+)\s*=/g,
    /export\s+enum\s+([A-Za-z0-9_]+)\s*/g,
  ]

  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(fileText))) {
      names.push(m[1])
    }
  }

  return names
}

function getImportLines(fileText: string): string[] {
  return fileText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('import ') && l.includes(' from '))
}

function run(): number {
  const files: string[] = []
  for (const d of TARGET_DIRS) walk(path.join(ROOT, d), files)

  const problems: string[] = []

  for (const file of files) {
    const rel = path.relative(ROOT, file)
    const text = fs.readFileSync(file, 'utf8')

    // Check duplicate exports
    const exported = getExportedNames(text)
    const exportCounts = new Map<string, number>()
    for (const name of exported) exportCounts.set(name, (exportCounts.get(name) || 0) + 1)
    for (const [name, count] of exportCounts.entries()) {
      if (count > 1) problems.push(`${rel}: duplicate exported symbol "${name}" (${count}x)`)
    }

    // Check duplicate import lines (exact duplicates)
    const imports = getImportLines(text)
    const importCounts = new Map<string, number>()
    for (const line of imports) importCounts.set(line, (importCounts.get(line) || 0) + 1)
    for (const [line, count] of importCounts.entries()) {
      if (count > 1) problems.push(`${rel}: duplicate import line (${count}x): ${line}`)
    }
  }

  if (problems.length > 0) {
    // eslint-disable-next-line no-console
    console.error('\n❌ Duplication guard failed. Fix these issues:\n')
    for (const p of problems.slice(0, 200)) {
      // eslint-disable-next-line no-console
      console.error(`- ${p}`)
    }
    if (problems.length > 200) {
      // eslint-disable-next-line no-console
      console.error(`\n... and ${problems.length - 200} more`)
    }
    // eslint-disable-next-line no-console
    console.error('\nTip: this usually means a file got pasted/merged twice.\n')
    return 1
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Duplication guard passed (${files.length} files checked).`)
  return 0
}

process.exit(run())



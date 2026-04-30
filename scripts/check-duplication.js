/**
 * Duplication Guard (CommonJS)
 *
 * This is a JS wrapper so it can run in environments where ts-node is configured
 * for ESM/bundler and `.ts` scripts can error with ERR_UNKNOWN_FILE_EXTENSION.
 */

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const TARGET_DIRS = ['app', 'lib', 'types', 'middleware']
const EXTENSIONS = new Set(['.ts', '.tsx'])
const IGNORE_DIR_NAMES = new Set(['node_modules', '.next', 'dist', 'build', 'out', 'coverage', '.vercel'])

function walk(dir, acc) {
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

function getExportedNames(text) {
  const names = []
  const patterns = [
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
    let m
    while ((m = re.exec(text))) names.push(m[1])
  }
  return names
}

function getImportLines(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('import ') && l.includes(' from '))
}

function run() {
  const files = []
  for (const d of TARGET_DIRS) walk(path.join(ROOT, d), files)

  const problems = []
  for (const file of files) {
    const rel = path.relative(ROOT, file)
    const text = fs.readFileSync(file, 'utf8')

    const exported = getExportedNames(text)
    const exportCounts = new Map()
    for (const name of exported) exportCounts.set(name, (exportCounts.get(name) || 0) + 1)
    for (const [name, count] of exportCounts.entries()) {
      if (count > 1) problems.push(`${rel}: duplicate exported symbol "${name}" (${count}x)`)
    }

    const imports = getImportLines(text)
    const importCounts = new Map()
    for (const line of imports) importCounts.set(line, (importCounts.get(line) || 0) + 1)
    for (const [line, count] of importCounts.entries()) {
      if (count > 1) problems.push(`${rel}: duplicate import line (${count}x): ${line}`)
    }
  }

  if (problems.length) {
    console.error('\n❌ Duplication guard failed. Fix these issues:\n')
    for (const p of problems.slice(0, 200)) console.error(`- ${p}`)
    if (problems.length > 200) console.error(`\n... and ${problems.length - 200} more`)
    console.error('\nTip: this usually means a file got pasted/merged twice.\n')
    return 1
  }

  console.log(`✅ Duplication guard passed (${files.length} files checked).`)
  return 0
}

process.exit(run())



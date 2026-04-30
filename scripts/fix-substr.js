/**
 * Script to replace all .substr() calls with .substring()
 * This fixes deprecated .substr() method usage
 * 
 * Run with: node scripts/fix-substr.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Find all TypeScript files with .substr(
const findFiles = () => {
  try {
    const result = execSync('grep -r "\\.substr(" --include="*.ts" --include="*.tsx" .', { 
      encoding: 'utf-8',
      cwd: process.cwd()
    })
    return result.split('\n').filter(line => line.trim())
  } catch (error) {
    return []
  }
}

// Replace .substr(2, 9) with .substring(2, 11)
// Replace .substr(2, 16) with .substring(2, 18)
// Replace other patterns as needed
const fixFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    let modified = false
    
    // Common patterns
    const replacements = [
      [/.substr\(2, 9\)/g, '.substring(2, 11)'],
      [/.substr\(2, 16\)/g, '.substring(2, 18)'],
      [/.substr\(36\)\.substr\(2, 9\)/g, '.substring(2, 11)'], // Fix double substr bug
    ]
    
    replacements.forEach(([pattern, replacement]) => {
      if (content.match(pattern)) {
        content = content.replace(pattern, replacement)
        modified = true
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8')
      console.log(`✅ Fixed: ${filePath}`)
      return true
    }
    return false
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message)
    return false
  }
}

// Main execution
console.log('🔍 Finding files with .substr()...')
const files = findFiles()
const filePaths = [...new Set(files.map(line => line.split(':')[0]))].filter(Boolean)

console.log(`📝 Found ${filePaths.length} files to check`)
console.log('🔧 Fixing files...\n')

let fixedCount = 0
filePaths.forEach(filePath => {
  if (fixFile(filePath)) {
    fixedCount++
  }
})

console.log(`\n✅ Fixed ${fixedCount} files`)
console.log('✨ Done!')







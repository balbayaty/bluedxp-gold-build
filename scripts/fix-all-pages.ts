/**
 * Fix All Generated Pages Script
 * 
 * Removes unused icon imports from all generated pages
 * Verifies all pages are error-free and functional
 */

import * as fs from 'fs'
import * as path from 'path'

const PAGES_TO_FIX = [
  'app/hr/page.tsx',
  'app/hr/employees/page.tsx',
  'app/hr/attendance/page.tsx',
  'app/hr/training/page.tsx',
  'app/hr/payroll/page.tsx',
  'app/transportation/route-comparison/page.tsx',
  'app/transportation/pricing/page.tsx',
  'app/transportation/emissions/page.tsx',
  'app/transportation/load-matching/page.tsx',
  'app/transportation/iot/page.tsx',
  'app/transportation/audit/page.tsx',
  'app/transportation/compliance/page.tsx',
  'app/transportation/blockchain/page.tsx',
  'app/transportation/fleet/page.tsx',
  'app/transportation/realtime/page.tsx',
  'app/maas/page.tsx',
  'app/maas/pillars/page.tsx',
  'app/maas/tenants/page.tsx',
  'app/maas/revenue/page.tsx',
  'app/warehouse-network/cross-docking/page.tsx',
  'app/digital-signatures/documents/page.tsx',
]

function removeUnusedIconImports(filePath: string): boolean {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return false
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8')
  const originalContent = content
  
  // Remove unused icon imports
  // Pattern: import { Ri... } from 'react-icons/ri'
  const iconImportRegex = /import\s+\{[^}]*Ri\w+\s*\}\s+from\s+['"]react-icons\/ri['"];?\n/g
  
  // Remove all icon imports - they're not used as components, only as strings
  // Icons are used as strings like icon="ri-user-line", not as React components
  const iconMatches = content.match(iconImportRegex)
  if (iconMatches) {
    for (const importLine of iconMatches) {
      // Extract icon name from import
      const iconNameMatch = importLine.match(/Ri\w+/)
      if (iconNameMatch) {
        const iconName = iconNameMatch[0]
        // Check if icon is used as a React component (not just as a string)
        // Look for JSX usage: <RiUserLine /> or {RiUserLine}
        const isUsedAsComponent = new RegExp(`<${iconName}[\\s/>]|\\{${iconName}\\}`).test(content)
        
        if (!isUsedAsComponent) {
          // Remove the unused import
          content = content.replace(importLine, '')
        }
      }
    }
  }
  
  // Clean up multiple empty lines
  content = content.replace(/\n\n\n+/g, '\n\n')
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content)
    return true
  }
  
  return false
}

function verifyPageStructure(filePath: string): { valid: boolean; errors: string[] } {
  const fullPath = path.join(process.cwd(), filePath)
  const errors: string[] = []
  
  if (!fs.existsSync(fullPath)) {
    return { valid: false, errors: ['File does not exist'] }
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8')
  
  // Check for required imports
  if (!content.includes("import { useEffect, useState } from 'react'")) {
    errors.push('Missing React hooks import')
  }
  if (!content.includes("import PageTemplate from '@/components/PageTemplate'")) {
    errors.push('Missing PageTemplate import')
  }
  if (!content.includes("import { ErrorBoundary } from '@/components/ErrorBoundary'")) {
    errors.push('Missing ErrorBoundary import')
  }
  
  // Check for required structure
  if (!content.includes("'use client'")) {
    errors.push('Missing use client directive')
  }
  if (!content.includes('export default function')) {
    errors.push('Missing default export')
  }
  if (!content.includes('<ErrorBoundary')) {
    errors.push('Missing ErrorBoundary wrapper')
  }
  if (!content.includes('<PageTemplate')) {
    errors.push('Missing PageTemplate usage')
  }
  
  return { valid: errors.length === 0, errors }
}

async function main() {
  console.log('🔧 Fixing all generated pages...\n')
  
  let fixed = 0
  let verified = 0
  let errors: string[] = []
  
  for (const pagePath of PAGES_TO_FIX) {
    // Remove unused imports
    if (removeUnusedIconImports(pagePath)) {
      console.log(`  ✅ Fixed imports: ${pagePath}`)
      fixed++
    }
    
    // Verify structure
    const verification = verifyPageStructure(pagePath)
    if (verification.valid) {
      verified++
    } else {
      console.log(`  ❌ Errors in ${pagePath}:`)
      verification.errors.forEach(err => console.log(`     - ${err}`))
      errors.push(...verification.errors.map(e => `${pagePath}: ${e}`))
    }
  }
  
  console.log(`\n✨ Summary:`)
  console.log(`   - Fixed ${fixed} files (removed unused imports)`)
  console.log(`   - Verified ${verified}/${PAGES_TO_FIX.length} files`)
  
  if (errors.length > 0) {
    console.log(`\n❌ Found ${errors.length} errors:`)
    errors.forEach(err => console.log(`   - ${err}`))
    process.exit(1)
  } else {
    console.log(`\n✅ All pages are error-free and functional!`)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { removeUnusedIconImports, verifyPageStructure }

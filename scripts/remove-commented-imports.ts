/**
 * Remove Commented Imports Script
 * Automatically removes commented import statements
 * 
 * SAFE: Only removes lines that start with "// import"
 * PRESERVES: TODO comments and intentional documentation
 */

import * as fs from 'fs'
import * as path from 'path'

const filesToClean = [
  'app/api/ai/logistics-debug/route.ts',
  'components/copilot/HazalyzeCopilotWidget.tsx',
  'components/InboundPage.tsx',
  'components/qhse/RealTimeQHSEDashboard.tsx',
  'lib/services/finance/fixedAssetsService.ts',
  'lib/services/finance/multiCurrencyService.ts',
  'lib/services/marketplace/marketplaceRecommendationService.ts',
]

function cleanCommentedImports(filePath: string): { removed: number; preserved: number } {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`)
      return { removed: 0, preserved: 0 }
    }

    const content = fs.readFileSync(fullPath, 'utf-8')
    const lines = content.split('\n')
    
    let removed = 0
    let preserved = 0
    
    const cleanedLines = lines.filter(line => {
      const trimmed = line.trim()
      
      // Remove simple commented imports (not part of TODO)
      if (trimmed.startsWith('// import ') && !line.includes('TODO') && !line.includes('FIXME')) {
        removed++
        return false
      }
      
      // Preserve everything else
      if (trimmed.startsWith('// import')) {
        preserved++
      }
      return true
    })

    if (removed > 0) {
      fs.writeFileSync(fullPath, cleanedLines.join('\n'))
      console.log(`✅ ${filePath}: Removed ${removed} commented imports, preserved ${preserved}`)
    } else {
      console.log(`ℹ️  ${filePath}: No simple commented imports found`)
    }

    return { removed, preserved }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error)
    return { removed: 0, preserved: 0 }
  }
}

async function main() {
  console.log('🧹 Cleaning commented imports...\n')

  let totalRemoved = 0
  let totalPreserved = 0

  for (const file of filesToClean) {
    const result = cleanCommentedImports(file)
    totalRemoved += result.removed
    totalPreserved += result.preserved
  }

  console.log(`\n📊 Summary:`)
  console.log(`  Removed: ${totalRemoved} commented imports`)
  console.log(`  Preserved: ${totalPreserved} (TODO/FIXME annotated)`)
  console.log(`  Files Processed: ${filesToClean.length}`)
}

main().catch(console.error)

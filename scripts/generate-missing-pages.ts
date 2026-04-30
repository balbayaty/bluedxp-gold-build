/**
 * Generate Missing Pages Script
 * 
 * Creates all missing page files based on module route definitions
 * This permanently fixes 404 errors by ensuring all registered routes have pages
 */

import * as fs from 'fs'
import * as path from 'path'
import { findMissingPages } from './find-missing-pages'

const PAGE_TEMPLATE = `/**
 * {TITLE}
 * 
 * Auto-generated page for {PATH}
 * Module: {MODULE_ID}
 */

'use client'

import { useEffect, useState } from 'react'
import PageTemplate from '@/components/PageTemplate'
import { ErrorBoundary } from '@/components/ErrorBoundary'
{ICON_IMPORT}

function {COMPONENT_NAME}Content() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    // TODO: Implement data fetching
    // Example: fetchData('/api/{API_PATH}')
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <PageTemplate 
        title="{TITLE}" 
        description="{DESCRIPTION}"
        icon="{ICON}"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">Loading...</span>
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate 
      title="{TITLE}" 
      description="{DESCRIPTION}"
      icon="{ICON}"
    >
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">{TITLE}</h2>
          <p className="text-gray-400">
            This page is ready for implementation. Connect it to your services and components.
          </p>
        </div>
      </div>
    </PageTemplate>
  )
}

export default function {COMPONENT_NAME}Page() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate 
          title="{TITLE}" 
          description="{DESCRIPTION}"
          icon="{ICON}"
        >
          <div className="text-center py-12">
            <p className="text-red-600">Something went wrong. Please refresh the page.</p>
          </div>
        </PageTemplate>
      }
    >
      <{COMPONENT_NAME}Content />
    </ErrorBoundary>
  )
}
`

function toPascalCase(str: string): string {
  return str
    .split(/[-/]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function getComponentName(routePath: string): string {
  const parts = routePath.split('/').filter(Boolean)
  return parts.map(part => toPascalCase(part)).join('') + 'Page'
}

function getApiPath(routePath: string): string {
  return routePath.replace(/^\//, '').replace(/\//g, '/')
}

function getIconImport(icon?: string): string {
  if (!icon) return ''
  // Check if it's a remixicon
  if (icon.startsWith('ri-')) {
    // Convert ri-user-line to RiUserLine (PascalCase)
    // Example: ri-leaf-line -> leaf-line -> ['leaf', 'line'] -> ['Leaf', 'Line'] -> 'LeafLine' -> 'RiLeafLine'
    const iconName = icon
      .replace('ri-', '')
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('')
    return `import { Ri${iconName} } from 'react-icons/ri'`
  }
  return ''
}

function getIconComponent(icon?: string): string {
  if (!icon) return 'ri-file-line'
  return icon
}

async function generatePage(missingPage: any) {
  const { route, expectedPath, moduleId } = missingPage
  
  const fullPath = path.join(process.cwd(), expectedPath)
  const dir = path.dirname(fullPath)
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  // Skip if file already exists
  if (fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipping (already exists): ${expectedPath}`)
    return false
  }
  
  const componentName = getComponentName(route.path)
  const apiPath = getApiPath(route.path)
  const iconImport = getIconImport(route.icon)
  const icon = getIconComponent(route.icon)
  
  const content = PAGE_TEMPLATE
    .replace(/{TITLE}/g, route.title)
    .replace(/{PATH}/g, route.path)
    .replace(/{MODULE_ID}/g, moduleId)
    .replace(/{COMPONENT_NAME}/g, componentName)
    .replace(/{API_PATH}/g, apiPath)
    .replace(/{ICON_IMPORT}/g, iconImport || '')
    .replace(/{ICON}/g, icon)
    .replace(/{DESCRIPTION}/g, `${route.title} - ${moduleId} module`)
  
  fs.writeFileSync(fullPath, content)
  return true
}

async function main() {
  console.log('🚀 Generating missing pages...\n')
  
  const missing = await findMissingPages()
  
  if (missing.length === 0) {
    console.log('✅ All pages exist! Nothing to generate.')
    return
  }
  
  console.log(`📝 Found ${missing.length} missing pages to generate\n`)
  
  let generated = 0
  let skipped = 0
  
  // Group by module for better output
  const byModule = new Map<string, typeof missing>()
  for (const page of missing) {
    if (!byModule.has(page.moduleId)) {
      byModule.set(page.moduleId, [])
    }
    byModule.get(page.moduleId)!.push(page)
  }
  
  for (const [moduleId, pages] of byModule.entries()) {
    console.log(`\n📦 Module: ${moduleId}`)
    for (const page of pages) {
      const created = await generatePage(page)
      if (created) {
        console.log(`  ✅ Created: ${page.expectedPath}`)
        generated++
      } else {
        skipped++
      }
    }
  }
  
  console.log(`\n✨ Done! Generated ${generated} pages, skipped ${skipped} existing pages.`)
  console.log(`\n💡 Next steps:`)
  console.log(`   1. Review the generated pages`)
  console.log(`   2. Connect them to your services and APIs`)
  console.log(`   3. Add proper components and functionality`)
  console.log(`   4. Test all routes to ensure they work`)
}

if (require.main === module) {
  main().catch(console.error)
}

export { generatePage }














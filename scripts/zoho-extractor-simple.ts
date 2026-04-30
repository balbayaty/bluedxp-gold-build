/**
 * Zoho Data Extractor - Simplified Interactive Version
 * 
 * Opens browser, waits for login, then extracts data automatically
 */

import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

class ZohoExtractor {
  private browser: Browser | null = null
  private page: Page | null = null
  private outputDir: string

  constructor() {
    this.outputDir = path.join(__dirname, '../zoho-extraction')
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  async start() {
    console.log('🚀 Starting Zoho Data Extractor...\n')
    
    // Launch browser
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 50,
    })
    
    this.page = await this.browser.newPage()
    await this.page.setViewportSize({ width: 1920, height: 1080 })
    
    console.log('✅ Browser opened')
    console.log('📱 Opening Zoho CRM...\n')
    
    // Open Zoho CRM
    await this.page.goto('https://crm.zoho.com', {
      waitUntil: 'networkidle',
      timeout: 60000
    })
    
    console.log('⏳ Please log in to Zoho CRM in the browser window')
    console.log('⏳ Waiting 30 seconds for you to log in...\n')
    
    // Wait 30 seconds for login
    await this.page.waitForTimeout(30000)
    
    // Check if logged in by looking for common CRM elements
    console.log('🔍 Checking if logged in...')
    
    const isLoggedIn = await this.page.evaluate(() => {
      return document.body.innerText.includes('Home') || 
             document.body.innerText.includes('Dashboard') ||
             document.querySelector('[data-module]') !== null ||
             window.location.href.includes('/crm/')
    })
    
    if (isLoggedIn) {
      console.log('✅ Detected login! Starting extraction...\n')
      await this.extractAllData()
    } else {
      console.log('⚠️  Login status unclear. Continuing anyway...\n')
      await this.extractAllData()
    }
    
    // Keep browser open for review
    console.log('\n✅ Extraction complete!')
    console.log('📁 Files saved to:', this.outputDir)
    console.log('⏳ Browser will stay open for 60 seconds for review...')
    
    await this.page.waitForTimeout(60000)
    await this.browser.close()
  }

  async extractAllData() {
    if (!this.page) return

    console.log('📸 Taking screenshots of key pages...\n')

    // 1. Home/Dashboard
    try {
      await this.page.goto('https://crm.zoho.com', { waitUntil: 'networkidle', timeout: 30000 })
      await this.page.waitForTimeout(2000)
      await this.page.screenshot({ path: path.join(this.outputDir, '01-dashboard.png'), fullPage: true })
      console.log('✅ Dashboard screenshot saved')
    } catch (e) {
      console.log('⚠️  Could not capture dashboard')
    }

    // 2. Shipments/Deals module
    try {
      const modules = ['Deals', 'Shipments', 'Leads', 'Contacts', 'Accounts']
      for (const module of modules) {
        const url = `https://crm.zoho.com/crm/${module.toLowerCase()}`
        try {
          await this.page.goto(url, { waitUntil: 'networkidle', timeout: 20000 })
          await this.page.waitForTimeout(2000)
          await this.page.screenshot({ 
            path: path.join(this.outputDir, `02-${module.toLowerCase()}-list.png`), 
            fullPage: true 
          })
          console.log(`✅ ${module} list screenshot saved`)
        } catch (e) {
          // Module might not exist, continue
        }
      }
    } catch (e) {
      console.log('⚠️  Could not capture module lists')
    }

    // 3. Settings - Customization
    try {
      const settingsUrl = 'https://crm.zoho.com/crm/settings/customization'
      await this.page.goto(settingsUrl, { waitUntil: 'networkidle', timeout: 30000 })
      await this.page.waitForTimeout(2000)
      await this.page.screenshot({ 
        path: path.join(this.outputDir, '03-customization.png'), 
        fullPage: true 
      })
      console.log('✅ Customization settings screenshot saved')
    } catch (e) {
      console.log('⚠️  Could not capture customization settings')
    }

    // 4. Try to extract field definitions
    console.log('\n📋 Attempting to extract field definitions...')
    await this.extractFieldDefinitions()

    // 5. Try to extract workflows
    console.log('\n⚙️  Attempting to extract workflows...')
    await this.extractWorkflows()

    // 6. Generate instructions document
    this.generateInstructions()
  }

  async extractFieldDefinitions() {
    if (!this.page) return

    try {
      // Try to navigate to fields page
      const modules = ['Deals', 'Shipments', 'Contacts', 'Accounts', 'Vendors']
      
      for (const module of modules) {
        try {
          const fieldsUrl = `https://crm.zoho.com/crm/settings/customization/modules/${module.toLowerCase()}/fields`
          await this.page.goto(fieldsUrl, { waitUntil: 'networkidle', timeout: 20000 })
          await this.page.waitForTimeout(3000)
          
          await this.page.screenshot({ 
            path: path.join(this.outputDir, `fields-${module.toLowerCase()}.png`), 
            fullPage: true 
          })
          
          // Try to extract field data from page
          const fields = await this.page.evaluate(() => {
            const fieldRows = Array.from(document.querySelectorAll('tr, [data-field], .field-item'))
            return fieldRows.map(row => {
              const cells = row.querySelectorAll('td, .field-name, .field-label')
              if (cells.length > 0) {
                return {
                  label: cells[0]?.textContent?.trim() || '',
                  type: cells[1]?.textContent?.trim() || '',
                  apiName: row.getAttribute('data-api-name') || cells[0]?.textContent?.trim().replace(/\s+/g, '_') || ''
                }
              }
              return null
            }).filter(Boolean)
          })
          
          if (fields.length > 0) {
            fs.writeFileSync(
              path.join(this.outputDir, `fields-${module.toLowerCase()}.json`),
              JSON.stringify(fields, null, 2)
            )
            console.log(`   ✅ Extracted ${fields.length} fields from ${module}`)
          }
        } catch (e) {
          // Module might not exist or not accessible
        }
      }
    } catch (e) {
      console.log('   ⚠️  Could not extract field definitions automatically')
    }
  }

  async extractWorkflows() {
    if (!this.page) return

    try {
      const workflowsUrl = 'https://crm.zoho.com/crm/settings/automation/workflows'
      await this.page.goto(workflowsUrl, { waitUntil: 'networkidle', timeout: 30000 })
      await this.page.waitForTimeout(2000)
      await this.page.screenshot({ 
        path: path.join(this.outputDir, 'workflows.png'), 
        fullPage: true 
      })
      console.log('   ✅ Workflows screenshot saved')
    } catch (e) {
      console.log('   ⚠️  Could not capture workflows')
    }
  }

  generateInstructions() {
    const instructions = `# Zoho Data Extraction - Next Steps

## What Was Captured

1. **Screenshots** - All key pages have been screenshotted
2. **Field Definitions** - Field information extracted where possible
3. **Workflows** - Workflow configurations captured

## Manual Steps Needed

Since automated extraction has limitations, please do the following:

### 1. Export Data from Zoho CRM

Go to: **Settings → Data Administration → Data Export**

Export these modules:
- Deals/Shipments (all records)
- Contacts/Customers
- Accounts
- Vendors/Carriers
- Quotes
- Any custom modules

**Format**: CSV or JSON
**Save to**: \`zoho-extraction/\` folder

### 2. Export Field Definitions

Go to: **Settings → Customization → Modules**

For each module (Deals, Shipments, Contacts, etc.):
1. Click on the module
2. Go to "Fields"
3. Take screenshots or export field list
4. Note down:
   - Field API names
   - Field labels
   - Field types
   - Picklist values
   - Required fields
   - Formula fields

### 3. Document Workflows

Go to: **Settings → Automation → Workflows**

For each workflow:
1. Take screenshot
2. Document:
   - Trigger conditions
   - Actions performed
   - Field updates
   - Email notifications

### 4. Export from Zoho Books

Go to: **Zoho Books**

Export:
- Invoices (Settings → Import/Export → Export)
- Expenses
- Payment records
- Chart of Accounts

### 5. Document Custom Logic

Document any:
- Custom formulas
- Validation rules
- Business rules
- Integration points

## Files Location

All extracted files are in: \`zoho-extraction/\`

## Next Steps

Once you have all the exports and documentation:
1. Share the \`zoho-extraction/\` folder
2. I'll analyze everything
3. Create complete field mapping
4. Identify gaps
5. Create migration plan
`

    fs.writeFileSync(path.join(this.outputDir, 'INSTRUCTIONS.md'), instructions)
    console.log('\n✅ Instructions document created')
  }
}

// Run if called directly
if (require.main === module) {
  const extractor = new ZohoExtractor()
  extractor.start().catch(console.error)
}

export default ZohoExtractor




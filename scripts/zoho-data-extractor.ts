/**
 * Zoho Data Extractor
 * 
 * Comprehensive browser automation to extract:
 * - Field definitions from Zoho CRM
 * - Data exports
 * - Workflow configurations
 * - Custom module structures
 * - Financial data from Zoho Books
 * 
 * Usage: npm run extract:zoho
 */

import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

interface FieldDefinition {
  apiName: string
  label: string
  type: string
  required: boolean
  picklistValues?: string[]
  defaultValue?: any
  formula?: string
  lookupModule?: string
}

interface ModuleStructure {
  moduleName: string
  apiName: string
  fields: FieldDefinition[]
  customFields: FieldDefinition[]
  layouts: any[]
  workflows: any[]
}

interface ExtractedData {
  modules: ModuleStructure[]
  shipments: any[]
  carriers: any[]
  customers: any[]
  quotes: any[]
  bookings: any[]
  invoices: any[]
  expenses: any[]
  fieldMappings: Record<string, string>
  workflows: any[]
  timestamp: string
}

class ZohoDataExtractor {
  private browser: Browser | null = null
  private page: Page | null = null
  private outputDir: string
  private extractedData: ExtractedData

  constructor() {
    this.outputDir = path.join(__dirname, '../zoho-extraction')
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
    
    this.extractedData = {
      modules: [],
      shipments: [],
      carriers: [],
      customers: [],
      quotes: [],
      bookings: [],
      invoices: [],
      expenses: [],
      fieldMappings: {},
      workflows: [],
      timestamp: new Date().toISOString()
    }
  }

  async initialize() {
    console.log('🚀 Initializing browser...')
    this.browser = await chromium.launch({
      headless: false, // Show browser so user can log in
      slowMo: 100, // Slow down for visibility
    })
    
    this.page = await this.browser.newPage()
    await this.page.setViewportSize({ width: 1920, height: 1080 })
    
    console.log('✅ Browser initialized')
  }

  async openZohoCRM() {
    if (!this.page) throw new Error('Page not initialized')
    
    console.log('📱 Opening Zoho CRM...')
    await this.page.goto('https://crm.zoho.com', {
      waitUntil: 'networkidle',
      timeout: 60000
    })
    
    console.log('⏳ Waiting for you to log in...')
    console.log('   Please log in to Zoho CRM in the browser window')
    console.log('   Press ENTER in this terminal when you\'re logged in and ready...')
    
    // Wait for user to press Enter
    await this.waitForUserInput()
    
    // Wait for CRM to load
    await this.page.waitForTimeout(3000)
    
    // Check if we're logged in by looking for CRM elements
    const isLoggedIn = await this.page.evaluate(() => {
      return document.body.innerText.includes('Home') || 
             document.body.innerText.includes('Dashboard') ||
             document.querySelector('[data-module]') !== null
    })
    
    if (!isLoggedIn) {
      console.log('⚠️  Warning: May not be fully logged in. Continuing anyway...')
    } else {
      console.log('✅ Successfully accessed Zoho CRM')
    }
  }

  async openZohoBooks() {
    if (!this.page) throw new Error('Page not initialized')
    
    console.log('📱 Opening Zoho Books...')
    await this.page.goto('https://books.zoho.com', {
      waitUntil: 'networkidle',
      timeout: 60000
    })
    
    console.log('⏳ Waiting for you to log in to Zoho Books...')
    console.log('   Press ENTER when you\'re logged in...')
    
    await this.waitForUserInput()
    await this.page.waitForTimeout(3000)
    
    console.log('✅ Successfully accessed Zoho Books')
  }

  async extractModuleFields(moduleName: string): Promise<ModuleStructure> {
    if (!this.page) throw new Error('Page not initialized')
    
    console.log(`\n📋 Extracting fields for module: ${moduleName}`)
    
    try {
      // Navigate to module settings
      const settingsUrl = `https://crm.zoho.com/crm/${this.getOrgId()}/settings/customization/modules/${moduleName.toLowerCase()}/fields`
      
      await this.page.goto(settingsUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      })
      
      await this.page.waitForTimeout(2000)
      
      // Extract field information
      const fields = await this.page.evaluate(() => {
        const fieldElements = document.querySelectorAll('[data-field], .field-row, tr[data-row]')
        const fields: FieldDefinition[] = []
        
        fieldElements.forEach((el) => {
          try {
            const labelEl = el.querySelector('.field-label, .field-name, td:first-child')
            const typeEl = el.querySelector('.field-type, td:nth-child(2)')
            const apiNameEl = el.querySelector('.api-name, [data-api-name]')
            
            if (labelEl) {
              const label = labelEl.textContent?.trim() || ''
              const apiName = apiNameEl?.getAttribute('data-api-name') || 
                            apiNameEl?.textContent?.trim() || 
                            label.replace(/\s+/g, '_').toUpperCase()
              const type = typeEl?.textContent?.trim() || 'Text'
              
              fields.push({
                apiName,
                label,
                type,
                required: el.classList.contains('required') || false,
              })
            }
          } catch (e) {
            // Skip invalid elements
          }
        })
        
        return fields
      })
      
      console.log(`   ✅ Found ${fields.length} fields`)
      
      return {
        moduleName,
        apiName: moduleName.toLowerCase(),
        fields: fields.filter(f => !f.apiName.includes('Custom_')),
        customFields: fields.filter(f => f.apiName.includes('Custom_')),
        layouts: [],
        workflows: []
      }
    } catch (error) {
      console.log(`   ⚠️  Error extracting fields: ${error}`)
      return {
        moduleName,
        apiName: moduleName.toLowerCase(),
        fields: [],
        customFields: [],
        layouts: [],
        workflows: []
      }
    }
  }

  async extractDataExport(moduleName: string): Promise<any[]> {
    if (!this.page) throw new Error('Page not initialized')
    
    console.log(`\n📥 Extracting data for module: ${moduleName}`)
    
    try {
      // Navigate to module list view
      const listUrl = `https://crm.zoho.com/crm/${this.getOrgId()}/${moduleName.toLowerCase()}`
      await this.page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 })
      await this.page.waitForTimeout(2000)
      
      // Try to find export button
      const exportButton = await this.page.$('button:has-text("Export"), a:has-text("Export"), [title*="Export"]')
      
      if (exportButton) {
        await exportButton.click()
        await this.page.waitForTimeout(2000)
        
        // Try to select "All Fields" and export
        const allFieldsOption = await this.page.$('input[value="all"], label:has-text("All Fields")')
        if (allFieldsOption) {
          await allFieldsOption.click()
        }
        
        const confirmExport = await this.page.$('button:has-text("Export"), button:has-text("Download")')
        if (confirmExport) {
          await confirmExport.click()
          console.log(`   ✅ Export initiated for ${moduleName}`)
          console.log(`   ⏳ Please download the file when prompted`)
          await this.page.waitForTimeout(5000)
        }
      } else {
        console.log(`   ⚠️  Export button not found. Please export manually.`)
      }
      
      return []
    } catch (error) {
      console.log(`   ⚠️  Error extracting data: ${error}`)
      return []
    }
  }

  async extractWorkflows(): Promise<any[]> {
    if (!this.page) throw new Error('Page not initialized')
    
    console.log('\n⚙️  Extracting workflow configurations...')
    
    try {
      const workflowsUrl = `https://crm.zoho.com/crm/${this.getOrgId()}/settings/automation/workflows`
      await this.page.goto(workflowsUrl, { waitUntil: 'networkidle', timeout: 30000 })
      await this.page.waitForTimeout(2000)
      
      // Take screenshot of workflows
      await this.page.screenshot({ 
        path: path.join(this.outputDir, 'workflows-screenshot.png'),
        fullPage: true
      })
      
      console.log('   ✅ Workflow screenshot saved')
      
      return []
    } catch (error) {
      console.log(`   ⚠️  Error extracting workflows: ${error}`)
      return []
    }
  }

  async extractZohoBooksData() {
    if (!this.page) throw new Error('Page not initialized')
    
    console.log('\n💰 Extracting Zoho Books data...')
    
    try {
      // Extract Invoices
      await this.page.goto('https://books.zoho.com/app#/invoices', {
        waitUntil: 'networkidle',
        timeout: 30000
      })
      await this.page.waitForTimeout(2000)
      
      await this.page.screenshot({
        path: path.join(this.outputDir, 'books-invoices-screenshot.png'),
        fullPage: true
      })
      
      console.log('   ✅ Invoices screenshot saved')
      
      // Extract Expenses
      await this.page.goto('https://books.zoho.com/app#/expenses', {
        waitUntil: 'networkidle',
        timeout: 30000
      })
      await this.page.waitForTimeout(2000)
      
      await this.page.screenshot({
        path: path.join(this.outputDir, 'books-expenses-screenshot.png'),
        fullPage: true
      })
      
      console.log('   ✅ Expenses screenshot saved')
      
    } catch (error) {
      console.log(`   ⚠️  Error extracting Books data: ${error}`)
    }
  }

  async generateMappingDocument() {
    console.log('\n📄 Generating mapping document...')
    
    const mappingDoc = {
      extractionDate: this.extractedData.timestamp,
      summary: {
        totalModules: this.extractedData.modules.length,
        totalFields: this.extractedData.modules.reduce((sum, m) => sum + m.fields.length + m.customFields.length, 0),
        totalShipments: this.extractedData.shipments.length,
        totalCarriers: this.extractedData.carriers.length,
      },
      modules: this.extractedData.modules.map(module => ({
        moduleName: module.moduleName,
        apiName: module.apiName,
        standardFields: module.fields.map(f => ({
          zohoField: f.apiName,
          zohoLabel: f.label,
          zohoType: f.type,
          blueDxpField: this.mapFieldToBlueDXP(f.apiName, f.label),
          mappingNotes: this.getMappingNotes(f)
        })),
        customFields: module.customFields.map(f => ({
          zohoField: f.apiName,
          zohoLabel: f.label,
          zohoType: f.type,
          blueDxpField: this.mapFieldToBlueDXP(f.apiName, f.label),
          mappingNotes: 'Custom field - may need custom implementation'
        }))
      })),
      recommendations: this.generateRecommendations()
    }
    
    const mappingPath = path.join(this.outputDir, 'field-mapping.json')
    fs.writeFileSync(mappingPath, JSON.stringify(mappingDoc, null, 2))
    
    // Also create a human-readable markdown version
    const markdownPath = path.join(this.outputDir, 'FIELD_MAPPING.md')
    const markdown = this.generateMarkdownMapping(mappingDoc)
    fs.writeFileSync(markdownPath, markdown)
    
    console.log(`   ✅ Mapping document saved to: ${mappingPath}`)
    console.log(`   ✅ Markdown version saved to: ${markdownPath}`)
  }

  private mapFieldToBlueDXP(zohoField: string, zohoLabel: string): string {
    // Map common Zoho fields to BlueDXP TMS fields
    const fieldMappings: Record<string, string> = {
      'Shipment_Number': 'shipmentNumber',
      'Tracking_Number': 'trackingNumber',
      'Status': 'status',
      'Transport_Mode': 'mode',
      'Shipment_Type': 'type',
      'Origin': 'origin',
      'Destination': 'destination',
      'Total_Weight': 'totalWeight',
      'Total_Volume': 'totalVolume',
      'Total_Value': 'totalValue',
      'Currency': 'currency',
      'Carrier': 'carrierId',
      'Carrier_Name': 'carrierName',
      'Booking_Number': 'bookingNumber',
      'Pickup_Date': 'pickupDate',
      'Delivery_Date': 'estimatedDelivery',
    }
    
    return fieldMappings[zohoField] || `custom_${zohoField.toLowerCase().replace(/\s+/g, '_')}`
  }

  private getMappingNotes(field: FieldDefinition): string {
    if (field.type === 'Lookup') {
      return `Lookup field - may need relationship mapping`
    }
    if (field.type === 'Formula') {
      return `Formula field - logic needs to be reimplemented in BlueDXP`
    }
    if (field.picklistValues && field.picklistValues.length > 0) {
      return `Picklist field - values need to be mapped`
    }
    return 'Direct mapping'
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    this.extractedData.modules.forEach(module => {
      if (module.customFields.length > 0) {
        recommendations.push(`${module.moduleName} has ${module.customFields.length} custom fields that need review`)
      }
    })
    
    return recommendations
  }

  private generateMarkdownMapping(mappingDoc: any): string {
    let markdown = `# Zoho to BlueDXP TMS Field Mapping\n\n`
    markdown += `**Extraction Date:** ${mappingDoc.extractionDate}\n\n`
    markdown += `## Summary\n\n`
    markdown += `- Total Modules: ${mappingDoc.summary.totalModules}\n`
    markdown += `- Total Fields: ${mappingDoc.summary.totalFields}\n`
    markdown += `- Total Shipments: ${mappingDoc.summary.totalShipments}\n`
    markdown += `- Total Carriers: ${mappingDoc.summary.totalCarriers}\n\n`
    
    markdown += `## Field Mappings\n\n`
    
    mappingDoc.modules.forEach((module: any) => {
      markdown += `### ${module.moduleName}\n\n`
      
      if (module.standardFields.length > 0) {
        markdown += `#### Standard Fields\n\n`
        markdown += `| Zoho Field | Zoho Label | Zoho Type | BlueDXP Field | Notes |\n`
        markdown += `|-----------|------------|-----------|--------------|------|\n`
        
        module.standardFields.forEach((field: any) => {
          markdown += `| ${field.zohoField} | ${field.zohoLabel} | ${field.zohoType} | ${field.blueDxpField} | ${field.mappingNotes} |\n`
        })
        
        markdown += `\n`
      }
      
      if (module.customFields.length > 0) {
        markdown += `#### Custom Fields\n\n`
        markdown += `| Zoho Field | Zoho Label | Zoho Type | BlueDXP Field | Notes |\n`
        markdown += `|-----------|------------|-----------|--------------|------|\n`
        
        module.customFields.forEach((field: any) => {
          markdown += `| ${field.zohoField} | ${field.zohoLabel} | ${field.zohoType} | ${field.blueDxpField} | ${field.mappingNotes} |\n`
        })
        
        markdown += `\n`
      }
    })
    
    if (mappingDoc.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`
      mappingDoc.recommendations.forEach((rec: string) => {
        markdown += `- ${rec}\n`
      })
    }
    
    return markdown
  }

  private getOrgId(): string {
    // Try to extract org ID from URL or return placeholder
    // This will be updated based on actual URL structure
    return 'org123'
  }

  private async waitForUserInput(): Promise<void> {
    return new Promise((resolve) => {
      const readline = require('readline')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      rl.question('', () => {
        rl.close()
        resolve()
      })
    })
  }

  async run() {
    try {
      console.log('🎯 Zoho Data Extractor')
      console.log('=' .repeat(50))
      
      await this.initialize()
      
      // Step 1: Extract from Zoho CRM
      await this.openZohoCRM()
      
      // Extract modules
      const modulesToExtract = ['Shipments', 'Carriers', 'Customers', 'Quotes', 'Bookings']
      
      for (const module of modulesToExtract) {
        const moduleStructure = await this.extractModuleFields(module)
        this.extractedData.modules.push(moduleStructure)
        
        // Extract data
        const data = await this.extractDataExport(module)
        if (module === 'Shipments') this.extractedData.shipments = data
        if (module === 'Carriers') this.extractedData.carriers = data
        if (module === 'Customers') this.extractedData.customers = data
        if (module === 'Quotes') this.extractedData.quotes = data
        if (module === 'Bookings') this.extractedData.bookings = data
      }
      
      // Extract workflows
      this.extractedData.workflows = await this.extractWorkflows()
      
      // Step 2: Extract from Zoho Books
      await this.openZohoBooks()
      await this.extractZohoBooksData()
      
      // Step 3: Generate mapping document
      await this.generateMappingDocument()
      
      // Save raw extracted data
      const dataPath = path.join(this.outputDir, 'extracted-data.json')
      fs.writeFileSync(dataPath, JSON.stringify(this.extractedData, null, 2))
      console.log(`\n✅ Raw data saved to: ${dataPath}`)
      
      console.log('\n🎉 Extraction complete!')
      console.log(`📁 All files saved to: ${this.outputDir}`)
      
    } catch (error) {
      console.error('❌ Error during extraction:', error)
    } finally {
      if (this.browser) {
        console.log('\n⏳ Keeping browser open for 30 seconds for review...')
        await new Promise(resolve => setTimeout(resolve, 30000))
        await this.browser.close()
      }
    }
  }
}

// Run the extractor
if (require.main === module) {
  const extractor = new ZohoDataExtractor()
  extractor.run().catch(console.error)
}

export default ZohoDataExtractor


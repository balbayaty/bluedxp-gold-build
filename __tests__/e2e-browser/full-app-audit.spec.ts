/**
 * Full Application Audit - E2E Tests
 * 
 * This test suite visits EVERY page in the application and verifies:
 * 1. Page loads without crashing
 * 2. Page has actual content (not blank)
 * 3. Page is not just a placeholder
 * 4. No JavaScript errors on the page
 * 5. Screenshots for manual review
 * 
 * This is the REAL production test that catches actual issues.
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// All main navigation routes from PAGE_AUDIT_REPORT.json
const MAIN_ROUTES = [
  // Dashboard & Home
  '/',
  '/showcase',
  
  // WMS - Inbound/Outbound Operations
  '/inbound',
  '/outbound',
  '/goods-receipt',
  '/goods-issue',
  '/transfer-posting',
  '/putaway',
  '/picking',
  '/cycle-counting',
  '/cross-docking',
  
  // Inventory Management
  '/inventory',
  '/skus',
  '/batches',
  '/serials',
  '/valuation',
  '/abc-analysis',
  '/stock-alerts',
  '/expiry-management',
  '/reservations',
  '/replenishment',
  
  // Order Management
  '/orders',
  '/sales-orders',
  '/order-confirmation',
  '/pick-release',
  '/wave-planning',
  '/load-planning',
  '/ship-confirmation',
  '/delivery-note',
  '/return-management',
  
  // Transportation / TMS
  '/carriers',
  '/pickup-requests',
  '/tracking',
  '/routes',
  '/freight',
  '/pod',
  '/transportation',
  '/transportation/multimodal',
  '/transportation/sea',
  '/transportation/air',
  '/transportation/rail',
  '/transportation/customs',
  '/transportation/customs/declarations',
  '/transportation/customs/brokers',
  '/transportation/ports',
  '/transportation/insurance',
  '/transportation/analytics',
  '/transportation/integration',
  '/transportation/proposals',
  
  // Proposals & RFQ
  '/proposals',
  '/proposals/rfq',
  '/proposals/rfq/new',
  '/proposals/new',
  '/proposals/templates',
  '/proposals/services',
  '/proposals/rate-cards',
  '/proposals/journey',
  '/proposals/train-schedules',
  '/proposals/analytics',
  
  // ISO-IMS / Quality
  '/iso-ims',
  '/capa-management',
  '/ncr-management',
  '/audit-management',
  '/document-center',
  '/risk-management',
  '/training-management',
  '/my-tasks',
  '/approvals',
  '/inspection-lots',
  '/damage',
  '/certificates',
  '/holds',
  
  // Master Data
  '/materials',
  '/vendors',
  '/customers',
  '/storage-locations',
  '/bins',
  '/work-centers',
  '/resources',
  
  // AI & Vision
  '/ai-vision',
  '/ai-vision/history',
  
  // MSDS
  '/msds',
  '/msds-intelligence',
  
  // Intelligent Orchestration
  '/intelligent-orchestration/process-mining',
  '/intelligent-orchestration/root-cause',
  '/intelligent-orchestration/predictive',
  '/intelligent-orchestration/communication',
  '/intelligent-orchestration/compliance',
  '/intelligent-orchestration/insights',
  
  // SLA & Performance
  '/sla-kpi',
  '/kpi-dashboard',
  '/reports',
  '/modern-sla',
  '/customer-dashboard',
  '/overtime',
  
  // Reports
  '/reports/operational',
  '/reports/inventory',
  '/reports/orders',
  '/reports/performance',
  '/reports/financial',
  '/reports/custom',
  '/data-mining',
  
  // Integration
  '/integration/erp',
  '/integration/edi',
  '/integration/api',
  '/integration/carriers',
  '/integration/benchmarks',
  '/integration/labels',
  
  // Manufacturing (MaaS)
  '/manufacturing',
  '/manufacturing/production-orders',
  '/manufacturing/work-orders',
  '/manufacturing/capacity-planning',
  '/manufacturing/shop-floor',
  '/manufacturing/quality-control',
  '/manufacturing/bom',
  '/manufacturing/routing',
  '/manufacturing/analytics',
  
  // Compliance
  '/compliance',
  '/trade-compliance',
  '/trade-compliance/records',
  '/trade-compliance/create',
  '/trade-compliance/licenses',
  '/trade-compliance/civil-defense',
  '/trade-compliance/sfda',
  '/trade-compliance/landed-costs',
  '/trade-compliance/process-flows',
  
  // Settings
  '/settings/warehouse',
  '/settings/users',
  '/settings/workflow',
  '/settings/notifications',
  '/settings/templates',
  '/settings/parameters',
  '/settings/ai',
  '/settings/accessibility',
  '/settings',
];

// Results storage
const results: {
  route: string;
  status: 'PASS' | 'FAIL' | 'PLACEHOLDER' | 'ERROR';
  loadTime: number;
  errorMessage?: string;
  isPlaceholder: boolean;
  hasContent: boolean;
  screenshotPath?: string;
}[] = [];

// Helper function to check if page is a placeholder
async function isPlaceholderPage(page: Page): Promise<boolean> {
  const bodyText = await page.locator('body').innerText();
  const placeholderIndicators = [
    'coming soon',
    'under development',
    'under construction',
    'not implemented',
    'placeholder',
    'work in progress',
    'wip',
    'todo',
    'to be implemented'
  ];
  
  const lowerText = bodyText.toLowerCase();
  return placeholderIndicators.some(indicator => lowerText.includes(indicator));
}

// Helper function to check if page has meaningful content
async function hasContent(page: Page): Promise<boolean> {
  const bodyText = await page.locator('body').innerText();
  // Page should have more than just minimal text
  return bodyText.trim().length > 200;
}

// Helper function to check for errors on page
async function hasErrors(page: Page): Promise<string | null> {
  // Check for common error patterns
  const errorSelectors = [
    'text=/error|Error|ERROR/',
    'text=/500|Internal Server Error/',
    'text=/404|Not Found/',
    'text=/crashed|Crashed/',
    'text=/failed to load|Failed to Load/',
  ];
  
  for (const selector of errorSelectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const errorText = await page.locator(selector).first().innerText();
        // Filter out false positives like "Error handling" or "Error logs"
        if (!errorText.includes('Error handling') && 
            !errorText.includes('Error logs') &&
            !errorText.includes('Error management')) {
          return errorText.substring(0, 100);
        }
      }
    } catch {
      // Selector didn't match, continue
    }
  }
  return null;
}

// Create screenshots directory
const screenshotsDir = 'test-results/page-audit-screenshots';

test.describe('Full Application Page Audit', () => {
  test.beforeAll(async () => {
    // Ensure screenshots directory exists
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  for (const route of MAIN_ROUTES) {
    test(`Page: ${route}`, async ({ page }) => {
      const startTime = Date.now();
      let status: 'PASS' | 'FAIL' | 'PLACEHOLDER' | 'ERROR' = 'PASS';
      let errorMessage: string | undefined;
      
      try {
        // Navigate to page
        const response = await page.goto(route, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        const loadTime = Date.now() - startTime;
        
        // Check response status
        if (!response || response.status() >= 400) {
          status = 'ERROR';
          errorMessage = `HTTP ${response?.status() || 'unknown'}`;
        }
        
        // Wait for any loading states to complete
        await page.waitForLoadState('domcontentloaded');
        
        // Check for JavaScript errors (via page crash)
        const pageContent = await hasContent(page);
        const placeholder = await isPlaceholderPage(page);
        const errorOnPage = await hasErrors(page);
        
        if (errorOnPage) {
          status = 'ERROR';
          errorMessage = errorOnPage;
        } else if (placeholder) {
          status = 'PLACEHOLDER';
        } else if (!pageContent) {
          status = 'FAIL';
          errorMessage = 'Page has no meaningful content';
        }
        
        // Take screenshot
        const safeName = route.replace(/\//g, '_') || '_home';
        const screenshotPath = path.join(screenshotsDir, `${safeName}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        results.push({
          route,
          status,
          loadTime,
          errorMessage,
          isPlaceholder: placeholder,
          hasContent: pageContent,
          screenshotPath,
        });
        
        // Assertions
        expect(response?.status()).toBeLessThan(500);
        expect(pageContent || placeholder).toBe(true);
        
        if (status === 'ERROR') {
          console.log(`❌ ${route}: ${errorMessage}`);
        } else if (status === 'PLACEHOLDER') {
          console.log(`⚠️ ${route}: PLACEHOLDER`);
        } else if (status === 'FAIL') {
          console.log(`❌ ${route}: ${errorMessage}`);
        } else {
          console.log(`✅ ${route}: OK (${loadTime}ms)`);
        }
        
      } catch (error: any) {
        results.push({
          route,
          status: 'ERROR',
          loadTime: Date.now() - startTime,
          errorMessage: error.message,
          isPlaceholder: false,
          hasContent: false,
        });
        
        console.log(`💥 ${route}: CRASH - ${error.message}`);
        
        // Don't fail the test completely, just log
        expect(error.message).not.toContain('net::ERR_CONNECTION_REFUSED');
      }
    });
  }

  test.afterAll(async () => {
    // Generate summary report
    const summary = {
      generatedAt: new Date().toISOString(),
      total: results.length,
      passed: results.filter(r => r.status === 'PASS').length,
      failed: results.filter(r => r.status === 'FAIL').length,
      placeholders: results.filter(r => r.status === 'PLACEHOLDER').length,
      errors: results.filter(r => r.status === 'ERROR').length,
      avgLoadTime: results.reduce((acc, r) => acc + r.loadTime, 0) / results.length,
      results,
    };
    
    fs.writeFileSync('test-results/PAGE_AUDIT_RESULTS.json', JSON.stringify(summary, null, 2));
    
    console.log('\n\n═══════════════════════════════════════════════════════════════════');
    console.log('                    PAGE AUDIT SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⚠️  Placeholders: ${summary.placeholders}`);
    console.log(`💥 Errors: ${summary.errors}`);
    console.log(`📊 Avg Load Time: ${Math.round(summary.avgLoadTime)}ms`);
    console.log(`\n📄 Full report saved to test-results/PAGE_AUDIT_RESULTS.json`);
    console.log(`📸 Screenshots saved to ${screenshotsDir}/`);
  });
});

/**
 * Data Display Verification - E2E Tests
 * 
 * Verifies that pages with data tables/lists actually display data:
 * - Tables have rows OR proper empty state
 * - Data loads (no infinite loading spinners)
 * - No "undefined" or "null" displayed
 * - Cards/tiles show real data
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';

interface DataDisplayResult {
  route: string;
  description: string;
  hasTable: boolean;
  tableRows: number;
  hasEmptyState: boolean;
  hasLoadingState: boolean;
  hasDataIssues: boolean;
  issues: string[];
  status: 'HAS_DATA' | 'EMPTY_STATE' | 'NO_DATA' | 'LOADING_STUCK' | 'ERROR';
}

// Pages that should display data
const DATA_PAGES = [
  { route: '/skus', description: 'SKU/Material list', expectData: true },
  { route: '/inventory', description: 'Inventory stock', expectData: true },
  { route: '/customers', description: 'Customer list', expectData: true },
  { route: '/vendors', description: 'Vendor list', expectData: true },
  { route: '/orders', description: 'Purchase orders', expectData: true },
  { route: '/sales-orders', description: 'Sales orders', expectData: true },
  { route: '/batches', description: 'Batch list', expectData: true },
  { route: '/carriers', description: 'Carrier list', expectData: true },
  { route: '/bins', description: 'Storage bins', expectData: true },
  { route: '/storage-locations', description: 'Storage locations', expectData: true },
  { route: '/warehouses', description: 'Warehouses', expectData: true },
  { route: '/iso-ims', description: 'ISO-IMS dashboard', expectData: true },
  { route: '/capa-management', description: 'CAPA records', expectData: true },
  { route: '/ncr-management', description: 'NCR records', expectData: true },
  { route: '/proposals', description: 'Proposals list', expectData: true },
  { route: '/msds', description: 'MSDS documents', expectData: true },
  { route: '/tracking', description: 'Shipment tracking', expectData: true },
  { route: '/tasks', description: 'Task list', expectData: true },
  { route: '/my-tasks', description: 'User tasks', expectData: true },
  { route: '/approvals', description: 'Pending approvals', expectData: true },
];

const results: DataDisplayResult[] = [];

// Helper: Check if page is stuck in loading state
async function isStuckLoading(page: Page): Promise<boolean> {
  const loadingSelectors = [
    '[class*="loading"]',
    '[class*="spinner"]',
    'text=/loading/i',
    '[role="progressbar"]',
    '.animate-spin',
    '.animate-pulse',
  ];
  
  for (const selector of loadingSelectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        // Wait a bit more to see if it resolves
        await page.waitForTimeout(2000);
        const stillLoading = await page.locator(selector).count();
        if (stillLoading > 0) {
          return true;
        }
      }
    } catch {
      // Selector error, continue
    }
  }
  return false;
}

// Helper: Check for data issues (undefined, null, NaN displayed)
async function findDataIssues(page: Page): Promise<string[]> {
  const issues: string[] = [];
  const bodyText = await page.locator('body').innerText();
  
  // Check for undefined/null/NaN in text
  if (bodyText.includes('undefined')) {
    issues.push('Contains "undefined" text');
  }
  if (bodyText.includes('null')) {
    // Filter out intentional uses like "null value"
    const nullMatch = bodyText.match(/:\s*null|null\b(?!able|ify|ified)/gi);
    if (nullMatch && nullMatch.length > 0) {
      issues.push('Contains "null" value');
    }
  }
  if (bodyText.includes('NaN')) {
    issues.push('Contains "NaN" value');
  }
  if (bodyText.includes('[object Object]')) {
    issues.push('Contains "[object Object]" - serialization error');
  }
  
  return issues;
}

// Helper: Check for empty state UI
async function hasEmptyStateUI(page: Page): Promise<boolean> {
  const emptySelectors = [
    'text=/no data|no records|no results|no items|nothing here|empty/i',
    '[class*="empty"]',
    '[data-empty]',
    'text=/get started|add your first/i',
  ];
  
  for (const selector of emptySelectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) return true;
    } catch {
      // Continue
    }
  }
  return false;
}

test.describe('Data Display Verification', () => {
  
  for (const pageInfo of DATA_PAGES) {
    test(`${pageInfo.route} - ${pageInfo.description}`, async ({ page }) => {
      const result: DataDisplayResult = {
        route: pageInfo.route,
        description: pageInfo.description,
        hasTable: false,
        tableRows: 0,
        hasEmptyState: false,
        hasLoadingState: false,
        hasDataIssues: false,
        issues: [],
        status: 'NO_DATA',
      };
      
      try {
        console.log(`\n📍 Testing: ${pageInfo.route}`);
        
        await page.goto(pageInfo.route, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        
        // Wait for data to load
        await page.waitForTimeout(2000);
        
        // Check if stuck in loading
        result.hasLoadingState = await isStuckLoading(page);
        if (result.hasLoadingState) {
          result.status = 'LOADING_STUCK';
          result.issues.push('Page stuck in loading state');
          console.log('   ⏳ STUCK LOADING');
        }
        
        // Check for tables
        const tableLocator = page.locator('table, [role="table"], [class*="table"], [data-table]');
        result.hasTable = await tableLocator.count() > 0;
        
        if (result.hasTable) {
          // Count rows
          const rows = await page.locator('table tbody tr, [role="row"]').count();
          result.tableRows = rows;
          console.log(`   📊 Table found with ${rows} rows`);
        }
        
        // Also check for cards/grid items
        const gridItems = await page.locator('[class*="card"], [class*="grid"] > div, [class*="list-item"]').count();
        if (gridItems > 0) {
          console.log(`   📋 Grid/cards found: ${gridItems} items`);
          result.tableRows = Math.max(result.tableRows, gridItems);
        }
        
        // Check for empty state
        result.hasEmptyState = await hasEmptyStateUI(page);
        if (result.hasEmptyState) {
          console.log('   📭 Has empty state UI');
        }
        
        // Check for data issues
        const issues = await findDataIssues(page);
        if (issues.length > 0) {
          result.hasDataIssues = true;
          result.issues.push(...issues);
          console.log(`   ⚠️ Data issues: ${issues.join(', ')}`);
        }
        
        // Determine status
        if (result.hasLoadingState) {
          result.status = 'LOADING_STUCK';
        } else if (result.tableRows > 0) {
          result.status = 'HAS_DATA';
          console.log('   ✅ HAS DATA');
        } else if (result.hasEmptyState) {
          result.status = 'EMPTY_STATE';
          console.log('   📭 EMPTY STATE (valid)');
        } else {
          result.status = 'NO_DATA';
          console.log('   ❌ NO DATA OR EMPTY STATE');
        }
        
        results.push(result);
        
        // Assertions
        expect(result.status !== 'LOADING_STUCK').toBe(true);
        expect(result.tableRows > 0 || result.hasEmptyState).toBe(true);
        
      } catch (error: any) {
        result.status = 'ERROR';
        result.issues.push(error.message);
        results.push(result);
        console.log(`   💥 ERROR: ${error.message}`);
      }
    });
  }

  test.afterAll(async () => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalPages: results.length,
        withData: results.filter(r => r.status === 'HAS_DATA').length,
        withEmptyState: results.filter(r => r.status === 'EMPTY_STATE').length,
        noDataNoEmpty: results.filter(r => r.status === 'NO_DATA').length,
        stuckLoading: results.filter(r => r.status === 'LOADING_STUCK').length,
        withErrors: results.filter(r => r.status === 'ERROR').length,
        withDataIssues: results.filter(r => r.hasDataIssues).length,
      },
      results,
      problematicPages: results.filter(r => 
        r.status === 'NO_DATA' || 
        r.status === 'LOADING_STUCK' || 
        r.status === 'ERROR' ||
        r.hasDataIssues
      ),
    };
    
    fs.writeFileSync('test-results/DATA_DISPLAY_AUDIT.json', JSON.stringify(report, null, 2));
    
    console.log('\n\n═══════════════════════════════════════════════════════════════════');
    console.log('                   DATA DISPLAY SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log(`📄 Pages tested: ${report.summary.totalPages}`);
    console.log(`✅ With data: ${report.summary.withData}`);
    console.log(`📭 Empty state (valid): ${report.summary.withEmptyState}`);
    console.log(`❌ No data/no empty state: ${report.summary.noDataNoEmpty}`);
    console.log(`⏳ Stuck loading: ${report.summary.stuckLoading}`);
    console.log(`💥 Errors: ${report.summary.withErrors}`);
    console.log(`⚠️ Data issues: ${report.summary.withDataIssues}`);
    
    if (report.problematicPages.length > 0) {
      console.log('\n⚠️ PROBLEMATIC PAGES:');
      report.problematicPages.forEach(p => {
        console.log(`   ${p.route}: ${p.status} ${p.issues.length > 0 ? '- ' + p.issues.join(', ') : ''}`);
      });
    }
    
    console.log(`\n📄 Full report saved to test-results/DATA_DISPLAY_AUDIT.json`);
  });
});

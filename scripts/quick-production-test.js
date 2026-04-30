/**
 * Quick Production Test - No Dependencies Required
 * 
 * Run this script to get an instant reality check on your app
 * 
 * Usage: node scripts/quick-production-test.js [base-url]
 * 
 * Example: 
 *   node scripts/quick-production-test.js http://localhost:3002
 *   node scripts/quick-production-test.js https://your-production.com
 */

const http = require('http');
const https = require('https');
const fs = require('fs');

const BASE_URL = process.argv[2] || 'http://localhost:3002';
const isHttps = BASE_URL.startsWith('https');
const httpModule = isHttps ? https : http;

// Critical routes to test
const ROUTES = [
  // Core pages
  { path: '/', name: 'Home Dashboard', critical: true },
  { path: '/showcase', name: 'Showcase', critical: false },
  
  // WMS Core
  { path: '/inbound', name: 'Inbound Operations', critical: true },
  { path: '/outbound', name: 'Outbound Operations', critical: true },
  { path: '/goods-receipt', name: 'Goods Receipt', critical: true },
  { path: '/goods-issue', name: 'Goods Issue', critical: true },
  { path: '/inventory', name: 'Inventory', critical: true },
  { path: '/skus', name: 'SKU Management', critical: true },
  { path: '/batches', name: 'Batch Management', critical: true },
  { path: '/putaway', name: 'Putaway', critical: true },
  { path: '/picking', name: 'Picking', critical: true },
  
  // Orders
  { path: '/orders', name: 'Purchase Orders', critical: true },
  { path: '/sales-orders', name: 'Sales Orders', critical: true },
  
  // Master Data
  { path: '/customers', name: 'Customers', critical: true },
  { path: '/vendors', name: 'Vendors', critical: true },
  { path: '/carriers', name: 'Carriers', critical: true },
  { path: '/warehouses', name: 'Warehouses', critical: true },
  { path: '/bins', name: 'Storage Bins', critical: true },
  { path: '/storage-locations', name: 'Storage Locations', critical: true },
  
  // TMS
  { path: '/transportation', name: 'TMS Dashboard', critical: true },
  { path: '/tracking', name: 'Shipment Tracking', critical: true },
  { path: '/routes', name: 'Routes', critical: false },
  
  // ISO-IMS / Quality
  { path: '/iso-ims', name: 'ISO-IMS Dashboard', critical: true },
  { path: '/capa-management', name: 'CAPA Management', critical: true },
  { path: '/ncr-management', name: 'NCR Management', critical: true },
  { path: '/audit-management', name: 'Audit Management', critical: true },
  
  // Proposals
  { path: '/proposals', name: 'Proposals', critical: true },
  { path: '/proposals/rfq', name: 'RFQ Management', critical: true },
  
  // MSDS & AI
  { path: '/msds', name: 'MSDS Management', critical: true },
  { path: '/ai-vision', name: 'AI Vision', critical: true },
  
  // Manufacturing
  { path: '/manufacturing', name: 'Manufacturing', critical: true },
  
  // Compliance
  { path: '/compliance', name: 'Compliance', critical: true },
  { path: '/trade-compliance', name: 'Trade Compliance', critical: true },
  
  // Reports & Analytics
  { path: '/reports', name: 'Reports', critical: true },
  { path: '/kpi-dashboard', name: 'KPI Dashboard', critical: true },
  { path: '/sla-kpi', name: 'SLA Management', critical: true },
  
  // Settings
  { path: '/settings', name: 'Settings', critical: true },
  { path: '/settings/users', name: 'User Management', critical: true },
  
  // Tasks
  { path: '/tasks', name: 'Tasks', critical: true },
  { path: '/my-tasks', name: 'My Tasks', critical: true },
  { path: '/approvals', name: 'Approvals', critical: true },
];

// Test results
const results = {
  passed: [],
  failed: [],
  redirected: [],
  slow: [],
};

function testRoute(route) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${route.path}`;
    const startTime = Date.now();
    
    const req = httpModule.get(url, { 
      timeout: 30000,
      headers: {
        'User-Agent': 'BlueDXP-Production-Test/1.0'
      }
    }, (res) => {
      const loadTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = {
          ...route,
          statusCode: res.statusCode,
          loadTime,
          hasContent: data.length > 1000,
          isPlaceholder: data.toLowerCase().includes('coming soon') || 
                         data.toLowerCase().includes('under development'),
          hasError: data.toLowerCase().includes('error') && 
                    res.statusCode >= 400,
        };
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (loadTime > 5000) {
            results.slow.push(result);
          }
          results.passed.push(result);
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
          results.redirected.push(result);
        } else {
          results.failed.push(result);
        }
        
        resolve(result);
      });
    });
    
    req.on('error', (err) => {
      results.failed.push({
        ...route,
        statusCode: 0,
        loadTime: Date.now() - startTime,
        error: err.message,
      });
      resolve(null);
    });
    
    req.on('timeout', () => {
      req.destroy();
      results.failed.push({
        ...route,
        statusCode: 0,
        loadTime: 30000,
        error: 'Timeout',
      });
      resolve(null);
    });
  });
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           BLUEDXP QUICK PRODUCTION TEST                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`🌐 Testing: ${BASE_URL}`);
  console.log(`📋 Routes to test: ${ROUTES.length}\n`);
  console.log('─────────────────────────────────────────────────────────────────\n');
  
  // Test routes sequentially (to avoid overwhelming the server)
  for (const route of ROUTES) {
    const result = await testRoute(route);
    
    if (result) {
      const status = result.statusCode >= 200 && result.statusCode < 300 ? '✅' :
                     result.statusCode >= 300 && result.statusCode < 400 ? '↪️' : '❌';
      const placeholder = result.isPlaceholder ? ' ⚠️PLACEHOLDER' : '';
      const slow = result.loadTime > 5000 ? ' 🐢SLOW' : '';
      
      console.log(`${status} ${route.path} (${result.statusCode}) - ${result.loadTime}ms${placeholder}${slow}`);
    } else {
      console.log(`💥 ${route.path} - FAILED`);
    }
  }
  
  // Print summary
  console.log('\n\n═══════════════════════════════════════════════════════════════════');
  console.log('                         TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  console.log(`✅ Passed: ${results.passed.length}/${ROUTES.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`↪️ Redirected: ${results.redirected.length}`);
  console.log(`🐢 Slow (>5s): ${results.slow.length}`);
  console.log(`⚠️ Placeholders: ${results.passed.filter(r => r.isPlaceholder).length}`);
  
  // List critical failures
  const criticalFailures = results.failed.filter(r => r.critical);
  if (criticalFailures.length > 0) {
    console.log('\n🔴 CRITICAL FAILURES:');
    criticalFailures.forEach(r => {
      console.log(`   ${r.path} - ${r.name}: ${r.error || 'Status ' + r.statusCode}`);
    });
  }
  
  // List placeholders
  const placeholders = results.passed.filter(r => r.isPlaceholder);
  if (placeholders.length > 0) {
    console.log('\n⚠️ PLACEHOLDER PAGES (not production-ready):');
    placeholders.forEach(r => {
      console.log(`   ${r.path} - ${r.name}`);
    });
  }
  
  // List slow pages
  if (results.slow.length > 0) {
    console.log('\n🐢 SLOW PAGES (>5 seconds):');
    results.slow.forEach(r => {
      console.log(`   ${r.path} - ${r.name}: ${r.loadTime}ms`);
    });
  }
  
  // Save report
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: ROUTES.length,
      passed: results.passed.length,
      failed: results.failed.length,
      redirected: results.redirected.length,
      slow: results.slow.length,
      placeholders: results.passed.filter(r => r.isPlaceholder).length,
    },
    results: {
      passed: results.passed,
      failed: results.failed,
      redirected: results.redirected,
      slow: results.slow,
    },
  };
  
  fs.writeFileSync('QUICK_PRODUCTION_TEST_RESULTS.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Full report saved to QUICK_PRODUCTION_TEST_RESULTS.json');
  
  // Exit with error code if critical failures
  if (criticalFailures.length > 0) {
    console.log('\n❌ TEST FAILED - Critical pages are broken!');
    process.exit(1);
  } else if (results.failed.length > 0) {
    console.log('\n⚠️ TEST PARTIALLY PASSED - Some non-critical pages failed');
    process.exit(0);
  } else {
    console.log('\n✅ ALL TESTS PASSED!');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

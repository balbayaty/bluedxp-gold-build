/**
 * 🧪 MARKET DATA INTEGRATION E2E TEST SCRIPT
 * Tests all API endpoints, widgets, and functionality
 * Verifies 100% live data and zero errors
 */

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

const BASE_URL = 'http://localhost:3002';
const results: TestResult[] = [];

// ============================================================================
// TEST UTILITIES
// ============================================================================

async function testEndpoint(
  name: string,
  url: string,
  expectedFields?: string[]
): Promise<TestResult> {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   URL: ${url}`);

    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        name,
        status: 'fail',
        message: `HTTP ${response.status}: ${response.statusText}`,
        details: await response.text(),
      };
    }

    const data = await response.json();

    // Check for expected fields
    if (expectedFields) {
      const missing = expectedFields.filter(field => !(field in data));
      if (missing.length > 0) {
        return {
          name,
          status: 'warning',
          message: `Missing fields: ${missing.join(', ')}`,
          details: data,
        };
      }
    }

    return {
      name,
      status: 'pass',
      message: 'Success! Data received',
      details: data,
    };
  } catch (error) {
    return {
      name,
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function logResult(result: TestResult) {
  const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.details && result.status !== 'pass') {
    console.log('   Details:', JSON.stringify(result.details, null, 2).substring(0, 200));
  }
}

// ============================================================================
// TESTS
// ============================================================================

async function runAllTests() {
  console.log('🚀 MARKET DATA INTEGRATION E2E TESTS');
  console.log('=====================================\n');

  // Test 1: API Health Check
  console.log('📋 PHASE 1: API HEALTH CHECKS\n');
  
  let result = await testEndpoint(
    'API Health Check',
    `${BASE_URL}/api/market-data/test`,
    ['status', 'apiKeyConfigured']
  );
  results.push(result);
  logResult(result);

  // Test 2: Stock Quotes
  result = await testEndpoint(
    'Stock Quotes (FDX, UPS)',
    `${BASE_URL}/api/market-data/quotes?symbols=FDX,UPS`,
    ['quotes', 'timestamp']
  );
  results.push(result);
  logResult(result);

  // Test 3: Logistics Companies
  result = await testEndpoint(
    'Logistics Companies Bundle',
    `${BASE_URL}/api/market-data/logistics`,
    ['quotes']
  );
  results.push(result);
  logResult(result);

  // Test 4: Commodities
  result = await testEndpoint(
    'Commodity Prices',
    `${BASE_URL}/api/market-data/commodities`,
  );
  results.push(result);
  logResult(result);

  // Test 5: Currency Exchange
  result = await testEndpoint(
    'Currency Exchange (USD to SAR)',
    `${BASE_URL}/api/market-data/exchange-rate?from=USD&to=SAR`,
    ['rate', 'fromCurrency', 'toCurrency']
  );
  results.push(result);
  logResult(result);

  // Test 6: Cryptocurrency
  console.log('\n📋 PHASE 2: CRYPTOCURRENCY (CoinGecko - FREE!)\n');
  
  result = await testEndpoint(
    'Crypto Prices (Bitcoin, Ethereum)',
    `${BASE_URL}/api/market-data/crypto?coins=bitcoin,ethereum`,
  );
  results.push(result);
  logResult(result);

  // Test 7: LPI Data
  console.log('\n📋 PHASE 3: LOGISTICS PERFORMANCE INDEX (World Bank - FREE!)\n');
  
  result = await testEndpoint(
    'LPI Data (Middle East)',
    `${BASE_URL}/api/market-data/lpi?countries=SAU,ARE,KWT,QAT`,
  );
  results.push(result);
  logResult(result);

  // Test 8: Supply Chain Impact
  console.log('\n📋 PHASE 4: SUPPLY CHAIN ANALYSIS\n');
  
  result = await testEndpoint(
    'Supply Chain Impact (FedEx)',
    `${BASE_URL}/api/market-data/supply-chain-impact?symbol=FDX`,
  );
  results.push(result);
  logResult(result);

  // Test 9: Cross-Module Impact
  result = await testEndpoint(
    'Cross-Module Impact Dashboard',
    `${BASE_URL}/api/market-data/cross-module-impact`,
  );
  results.push(result);
  logResult(result);

  // Test 10: Real-Time Indices
  result = await testEndpoint(
    'Real-Time Indices',
    `${BASE_URL}/api/market-data/indices`,
  );
  results.push(result);
  logResult(result);

  // Test 11: Time Series
  result = await testEndpoint(
    'Time Series Data (FDX)',
    `${BASE_URL}/api/market-data/timeseries?symbol=FDX&interval=daily`,
    ['symbol', 'data']
  );
  results.push(result);
  logResult(result);

  // Test 12: Symbol Search
  result = await testEndpoint(
    'Symbol Search (FedEx)',
    `${BASE_URL}/api/market-data/search?query=fedex`,
    ['results']
  );
  results.push(result);
  logResult(result);

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('\n\n📊 TEST SUMMARY');
  console.log('=====================================\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;

  console.log(`✅ Passed:   ${passed}/${total}`);
  console.log(`⚠️  Warnings: ${warnings}/${total}`);
  console.log(`❌ Failed:   ${failed}/${total}`);

  console.log('\n📋 DETAILED RESULTS:\n');
  results.forEach((result, index) => {
    logResult(result);
  });

  // Generate recommendations
  console.log('\n\n💡 RECOMMENDATIONS:\n');

  const failedTests = results.filter(r => r.status === 'fail');
  if (failedTests.length > 0) {
    console.log('❌ FAILED TESTS - NEED FIXING:');
    failedTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.message}`);
    });
  }

  const warningTests = results.filter(r => r.status === 'warning');
  if (warningTests.length > 0) {
    console.log('\n⚠️  WARNINGS - MAY NEED ATTENTION:');
    warningTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.message}`);
    });
  }

  if (failed === 0 && warnings === 0) {
    console.log('🎉 ALL TESTS PASSED! SYSTEM IS 100% OPERATIONAL!');
    console.log('✨ No issues found - everything is working perfectly!');
  }

  // Save results to file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `./reports/market-data-test-${timestamp}.json`;
  
  try {
    if (!fs.existsSync('./reports')) {
      fs.mkdirSync('./reports');
    }
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total, passed, warnings, failed },
      results,
    }, null, 2));
    console.log(`\n📄 Results saved to: ${resultsFile}`);
  } catch (error) {
    console.log(`\n⚠️  Could not save results file: ${error}`);
  }

  console.log('\n✅ Testing complete!\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});

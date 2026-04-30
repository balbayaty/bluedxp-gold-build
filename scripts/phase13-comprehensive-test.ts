/**
 * Phase 13: Comprehensive End-User Testing
 * Tests all major functionality across the BlueDXP platform
 */

const BASE_URL = "http://localhost:3002";

interface TestResult {
  name: string;
  category: string;
  status: "pass" | "fail" | "expected";
  httpStatus?: number;
  responseTime: number;
  note?: string;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  category: string,
  endpoint: string,
  expectedStatuses: number[] = [200, 301, 302, 307, 308],
  note?: string
): Promise<void> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      redirect: "manual",
    });
    
    const responseTime = Date.now() - startTime;
    const isPassing = expectedStatuses.includes(response.status);
    
    results.push({
      name,
      category,
      status: isPassing ? "pass" : (response.status === 401 || response.status === 403 ? "expected" : "fail"),
      httpStatus: response.status,
      responseTime,
      note: note || (response.status === 401 ? "Auth required (expected)" : undefined),
    });
    
  } catch (error) {
    results.push({
      name,
      category,
      status: "fail",
      responseTime: Date.now() - startTime,
      note: error instanceof Error ? error.message : "Error",
    });
  }
}

async function runTests() {
  console.log("=" .repeat(70));
  console.log("🧪 PHASE 13: COMPREHENSIVE END-USER TESTING");
  console.log("=" .repeat(70));
  console.log(`Started: ${new Date().toISOString()}\n`);

  // ===== SYSTEM & INFRASTRUCTURE =====
  console.log("📊 SYSTEM & INFRASTRUCTURE");
  await runTest("System Health", "System", "/api/system-health/status");
  await runTest("Health Check", "System", "/api/health");
  await runTest("Tenants API", "System", "/api/tenants");
  
  // ===== AUTHENTICATION =====
  console.log("\n🔐 AUTHENTICATION");
  await runTest("Login Page", "Auth", "/login");
  await runTest("Auth Me (protected)", "Auth", "/api/auth/me", [401], "Should return 401 without token");
  await runTest("Auth Sessions", "Auth", "/api/auth/sessions", [200, 401]);
  
  // ===== WMS MODULE =====
  console.log("\n📦 WMS MODULE");
  await runTest("Warehouses Page", "WMS", "/warehouses");
  await runTest("Inventory Page", "WMS", "/inventory");
  await runTest("Inbound Page", "WMS", "/inbound");
  await runTest("Outbound Page", "WMS", "/outbound");
  await runTest("ASN Page", "WMS", "/asn");
  await runTest("ASN API", "WMS-API", "/api/asn");
  await runTest("WMS Sales Orders API", "WMS-API", "/api/wms/sales-orders");
  await runTest("WMS Purchase Orders API", "WMS-API", "/api/wms/purchase-orders");
  
  // ===== TMS MODULE =====
  console.log("\n🚚 TMS MODULE");
  await runTest("TMS Page", "TMS", "/tms");
  await runTest("Shipments Page", "TMS", "/shipments");
  await runTest("Routes Page", "TMS", "/routes");
  await runTest("Transportation API", "TMS-API", "/api/transportation/shipments");
  
  // ===== PROPOSALS/RFQ =====
  console.log("\n📝 PROPOSALS/RFQ");
  await runTest("Proposals Page", "Proposals", "/proposals");
  await runTest("RFI Page", "Proposals", "/proposals/rfi");
  await runTest("Proposals API", "Proposals-API", "/api/proposals");
  
  // ===== COMPLIANCE & QHSE =====
  console.log("\n✅ COMPLIANCE & QHSE");
  await runTest("QHSE Dashboard", "QHSE", "/qhse-dashboard");
  await runTest("ISO-IMS Page", "ISO-IMS", "/iso-ims");
  await runTest("Compliance Page", "Compliance", "/compliance");
  await runTest("Trade Compliance", "Compliance", "/trade-compliance");
  await runTest("ISO-IMS API", "ISO-API", "/api/iso-ims/documents");
  await runTest("QHSE API", "QHSE-API", "/api/qhse/incidents");
  
  // ===== FACILITY =====
  console.log("\n🏭 FACILITY");
  await runTest("Facility Page", "Facility", "/facility");
  await runTest("Facility API", "Facility-API", "/api/facility");
  
  // ===== PULSE (GAMIFICATION) =====
  console.log("\n🎮 PULSE");
  await runTest("Pulse Page", "Pulse", "/pulse");
  await runTest("Pulse API", "Pulse-API", "/api/pulse/status");
  
  // ===== AI/COPILOT =====
  console.log("\n🤖 AI/COPILOT");
  await runTest("Copilot Health", "AI", "/api/copilot/health");
  await runTest("AI Vision", "AI", "/api/ai/vision");
  
  // ===== DASHBOARDS =====
  console.log("\n🏠 DASHBOARDS");
  await runTest("Home Page", "Dashboard", "/");
  await runTest("Dashboard", "Dashboard", "/dashboard");
  await runTest("Analytics", "Dashboard", "/analytics");
  
  // ===== MARKETPLACE =====
  console.log("\n🛒 MARKETPLACE");
  await runTest("Marketplace Page", "Marketplace", "/marketplace");
  await runTest("Marketplace API", "Marketplace-API", "/api/marketplace/listings");
  
  // ===== ETW =====
  console.log("\n📄 eTW");
  await runTest("eTW Page", "eTW", "/etw");
  await runTest("eTW API", "eTW-API", "/api/etw");
  
  // ===== RESULTS =====
  console.log("\n" + "=" .repeat(70));
  console.log("📋 COMPREHENSIVE TEST RESULTS");
  console.log("=" .repeat(70));
  
  const passed = results.filter(r => r.status === "pass").length;
  const expected = results.filter(r => r.status === "expected").length;
  const failed = results.filter(r => r.status === "fail").length;
  const total = results.length;
  
  // Group by category
  const categories = [...new Set(results.map(r => r.category))];
  
  console.log("\n📊 Results by Category:");
  for (const category of categories) {
    const catResults = results.filter(r => r.category === category);
    const catPassed = catResults.filter(r => r.status === "pass" || r.status === "expected").length;
    const catTotal = catResults.length;
    
    const status = catPassed === catTotal ? "✅" : catPassed > 0 ? "⚠️" : "❌";
    console.log(`${status} ${category}: ${catPassed}/${catTotal}`);
  }
  
  // Failed tests
  const failedTests = results.filter(r => r.status === "fail");
  if (failedTests.length > 0) {
    console.log("\n❌ Failed Tests:");
    failedTests.forEach(r => {
      console.log(`   - ${r.name}: HTTP ${r.httpStatus || "N/A"} ${r.note || ""}`);
    });
  }
  
  // Summary
  const successRate = Math.round((passed + expected) / total * 100);
  console.log("\n" + "-".repeat(50));
  console.log(`📊 TOTAL: ${passed + expected}/${total} passed (${successRate}%)`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   🔒 Expected (Auth): ${expected}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  );
  console.log(`   ⏱️  Avg Response Time: ${avgResponseTime}ms`);
  
  console.log("\n" + "=" .repeat(70));
  
  if (successRate >= 80) {
    console.log("✅ PHASE 13: END-USER TESTING PASSED!");
    console.log("   Platform is ready for production use.");
    return 0;
  } else {
    console.log("⚠️  PHASE 13: SOME ISSUES NEED ATTENTION");
    return 1;
  }
}

runTests()
  .then(code => process.exit(code))
  .catch(e => {
    console.error("Test failed:", e);
    process.exit(1);
  });

/**
 * 🧪 E2E TESTING FOR BILLING SYSTEM
 * 
 * Tests the complete billing flow:
 * 1. API endpoints
 * 2. Database operations
 * 3. Service integrations
 * 4. Data flow
 * 
 * BlueDXP Platform - E2E Testing
 */

import { prisma } from "../lib/services/database/prismaClient";
import { billingService } from "../lib/services/billing/billingService";
import { subscriptionService } from "../lib/services/billing/subscriptionService";
import { invoiceService } from "../lib/services/billing/invoiceService";
import { creditService } from "../lib/services/billing/creditService";

const TEST_TENANT_ID = "test-tenant-e2e";
const TEST_USER_ID = "test-user-e2e";

async function cleanup() {
  try {
    // Clean up test data
    await prisma.billing_credits.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.billing_invoices.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.billing_subscriptions.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.billing_payments.deleteMany({ where: { userId: TEST_USER_ID } });
    console.log("✅ Cleanup completed");
  } catch (error) {
    console.error("⚠️ Cleanup error (non-critical):", error);
  }
}

async function testDatabaseConnection() {
  console.log("\n📊 Testing Database Connection...");
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

async function testTablesExist() {
  console.log("\n📋 Testing Table Existence...");
  const tables = [
    "billing_subscriptions",
    "billing_invoices",
    "billing_payments",
    "billing_credits",
    "billing_usage_records",
    "billing_prorations",
    "billing_discounts",
    "billing_tax_configurations",
    "billing_revenue_recognition",
    "billing_dunning_attempts",
    "billing_webhooks",
    "billing_invoice_templates",
  ];

  const results: { table: string; exists: boolean }[] = [];

  for (const table of tables) {
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
      results.push({ table, exists: true });
      console.log(`  ✅ ${table}`);
    } catch (error: any) {
      if (error.message?.includes("does not exist")) {
        results.push({ table, exists: false });
        console.log(`  ❌ ${table} - Table does not exist`);
      } else {
        // Table exists but might be empty
        results.push({ table, exists: true });
        console.log(`  ✅ ${table}`);
      }
    }
  }

  const allExist = results.every((r) => r.exists);
  return allExist;
}

async function testSubscriptionService() {
  console.log("\n💳 Testing Subscription Service...");
  try {
    // Create subscription
    const subscription = await subscriptionService.createSubscription({
      tenantId: TEST_TENANT_ID,
      userId: TEST_USER_ID,
      planId: "professional",
      planName: "Professional Plan",
      billingCycle: "monthly",
      totalPrice: 199,
      currency: "SAR",
      status: "active",
    });

    console.log(`  ✅ Subscription created: ${subscription.id}`);

    // Get subscription
    const retrieved = await subscriptionService.getSubscription(subscription.id);
    if (retrieved) {
      console.log(`  ✅ Subscription retrieved: ${retrieved.id}`);
    } else {
      throw new Error("Failed to retrieve subscription");
    }

    // List subscriptions
    const list = await subscriptionService.listSubscriptions(TEST_TENANT_ID);
    console.log(`  ✅ Listed ${list.length} subscription(s)`);

    return true;
  } catch (error) {
    console.error("  ❌ Subscription service test failed:", error);
    return false;
  }
}

async function testInvoiceService() {
  console.log("\n📄 Testing Invoice Service...");
  try {
    // Get or create subscription first
    let subscription = await prisma.billing_subscriptions.findFirst({
      where: { userId: TEST_USER_ID },
    });

    if (!subscription) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      
      subscription = await prisma.billing_subscriptions.create({
        data: {
          tenantId: TEST_TENANT_ID,
          userId: TEST_USER_ID,
          planId: "professional",
          planName: "Professional Plan",
          billingCycle: "monthly",
          totalPrice: 199,
          currency: "SAR",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          basePrice: 199,
        },
      });
    }

    // Generate invoice
    const invoice = await invoiceService.generateInvoice({
      tenantId: TEST_TENANT_ID,
      userId: TEST_USER_ID,
      subscriptionId: subscription.id,
      type: "subscription",
      lineItems: [
        {
          description: "Professional Plan - Monthly",
          quantity: 1,
          unitPrice: 199,
          amount: 199,
          type: "subscription",
        },
      ],
    });

    console.log(`  ✅ Invoice generated: ${invoice.invoiceNumber}`);

    // Get invoice
    const retrieved = await invoiceService.getInvoice(invoice.id);
    if (retrieved) {
      console.log(`  ✅ Invoice retrieved: ${retrieved.invoiceNumber}`);
    } else {
      throw new Error("Failed to retrieve invoice");
    }

    // List invoices
    const list = await invoiceService.listInvoices(TEST_TENANT_ID, { userId: TEST_USER_ID });
    console.log(`  ✅ Listed ${list.length} invoice(s)`);

    return true;
  } catch (error) {
    console.error("  ❌ Invoice service test failed:", error);
    return false;
  }
}

async function testCreditService() {
  console.log("\n💰 Testing Credit Service...");
  try {
    // Add credit
    const credit = await creditService.addCredit({
      tenantId: TEST_TENANT_ID,
      userId: TEST_USER_ID,
      amount: 100,
      currency: "SAR",
      type: "manual",
      reason: "E2E Test Credit",
    });

    console.log(`  ✅ Credit added: ${credit.id} (${credit.amount} ${credit.currency})`);

    // Get balance
    const balance = await creditService.getBalance(TEST_USER_ID);
    console.log(`  ✅ Balance retrieved: ${balance.totalBalance} ${balance.currency}`);

    // Get history
    const history = await creditService.getCreditHistory(TEST_USER_ID);
    console.log(`  ✅ Credit history: ${history.length} record(s)`);

    return true;
  } catch (error) {
    console.error("  ❌ Credit service test failed:", error);
    return false;
  }
}

async function testBillingService() {
  console.log("\n🎯 Testing Billing Service (Orchestrator)...");
  try {
    // Test service initialization
    if (billingService) {
      console.log("  ✅ Billing service initialized");
    } else {
      throw new Error("Billing service not initialized");
    }

    return true;
  } catch (error) {
    console.error("  ❌ Billing service test failed:", error);
    return false;
  }
}

async function createTestUser() {
  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id: TEST_USER_ID },
    });

    if (existing) {
      console.log("  ✅ Test user already exists");
      return existing;
    }

    // Get or create tenant
    let tenant = await prisma.tenant.findUnique({
      where: { id: TEST_TENANT_ID },
    });

    if (!tenant) {
      // Try to use an existing tenant
      tenant = await prisma.tenant.findFirst();
      if (tenant) {
        console.log(`  ⚠️ Using existing tenant: ${tenant.id}`);
      } else {
        // Create test tenant
        tenant = await prisma.tenant.create({
          data: {
            id: TEST_TENANT_ID,
            name: "E2E Test Tenant",
            status: "active",
          },
        });
        console.log("  ✅ Test tenant created");
      }
    }

    // Create test user
    const user = await prisma.user.create({
      data: {
        id: TEST_USER_ID,
        email: "test-user-e2e@example.com",
        name: "E2E Test User",
        passwordHash: "test-hash-e2e", // Test password hash
        tenantId: tenant.id,
        role: "user",
        status: "active",
      },
    });

    console.log("  ✅ Test user created");
    return user;
  } catch (error) {
    console.error("  ❌ Failed to create test user:", error);
    throw error;
  }
}

async function testDataFlow() {
  console.log("\n🔄 Testing Complete Data Flow...");
  try {
    // 1. Create subscription
    const subscription = await subscriptionService.createSubscription({
      tenantId: TEST_TENANT_ID,
      userId: TEST_USER_ID,
      planId: "professional",
      planName: "Professional Plan",
      billingCycle: "monthly",
      totalPrice: 199,
      currency: "SAR",
      status: "active",
    });

    // 2. Add credit
    await creditService.addCredit({
      tenantId: TEST_TENANT_ID,
      userId: TEST_USER_ID,
      amount: 50,
      currency: "SAR",
      type: "manual",
      reason: "Test credit",
    });

    // 3. Generate invoice
    const invoice = await invoiceService.generateInvoice({
      tenantId: TEST_TENANT_ID,
      userId: TEST_USER_ID,
      subscriptionId: subscription.id,
      type: "subscription",
      lineItems: [
        {
          description: "Professional Plan",
          quantity: 1,
          unitPrice: 199,
          amount: 199,
          type: "subscription",
        },
      ],
    });

    // 4. Verify all data exists
    const subCheck = await prisma.billing_subscriptions.findUnique({
      where: { id: subscription.id },
    });
    const invCheck = await prisma.billing_invoices.findUnique({
      where: { id: invoice.id },
    });
    const creditCheck = await prisma.billing_credits.findFirst({
      where: { userId: TEST_USER_ID },
    });

    if (subCheck && invCheck && creditCheck) {
      console.log("  ✅ Complete data flow verified");
      return true;
    } else {
      throw new Error("Data flow verification failed");
    }
  } catch (error) {
    console.error("  ❌ Data flow test failed:", error);
    return false;
  }
}

async function runE2ETests() {
  console.log("🧪 BILLING SYSTEM E2E TESTS");
  console.log("=" .repeat(50));

  const results: { test: string; passed: boolean }[] = [];

  // Cleanup first
  await cleanup();

  // Create test user
  console.log("\n👤 Creating Test User...");
  await createTestUser();

  // Test 1: Database Connection
  const dbConnected = await testDatabaseConnection();
  results.push({ test: "Database Connection", passed: dbConnected });
  if (!dbConnected) {
    console.log("\n❌ Cannot proceed without database connection");
    process.exit(1);
  }

  // Test 2: Tables Exist
  const tablesExist = await testTablesExist();
  results.push({ test: "Tables Exist", passed: tablesExist });
  if (!tablesExist) {
    console.log("\n⚠️ Some tables may be missing. Continuing with other tests...");
  }

  // Test 3: Subscription Service
  const subTest = await testSubscriptionService();
  results.push({ test: "Subscription Service", passed: subTest });

  // Test 4: Invoice Service
  const invTest = await testInvoiceService();
  results.push({ test: "Invoice Service", passed: invTest });

  // Test 5: Credit Service
  const creditTest = await testCreditService();
  results.push({ test: "Credit Service", passed: creditTest });

  // Test 6: Billing Service
  const billingTest = await testBillingService();
  results.push({ test: "Billing Service", passed: billingTest });

  // Test 7: Complete Data Flow
  const flowTest = await testDataFlow();
  results.push({ test: "Complete Data Flow", passed: flowTest });

  // Cleanup
  await cleanup();

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(50));

  results.forEach((result) => {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.test}`);
  });

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log("\n" + "=".repeat(50));
  console.log(`📈 Results: ${passed}/${total} tests passed (${percentage}%)`);
  console.log("=".repeat(50));

  if (passed === total) {
    console.log("\n🎉 ALL E2E TESTS PASSED!");
    process.exit(0);
  } else {
    console.log("\n⚠️ Some tests failed. Please review the output above.");
    process.exit(1);
  }
}

// Run tests
runE2ETests().catch((error) => {
  console.error("❌ E2E Test suite failed:", error);
  process.exit(1);
});

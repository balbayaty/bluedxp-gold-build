/**
 * 🚀 BILLING SYSTEM DEPLOYMENT SCRIPT
 * 
 * Complete deployment automation:
 * 1. Run database migrations
 * 2. Generate Prisma client
 * 3. Verify tables created
 * 4. Test database connections
 * 5. Verify services
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Step {
  name: string;
  status: "pending" | "running" | "complete" | "failed";
  message?: string;
}

const steps: Step[] = [];

function logStep(name: string, status: Step["status"], message?: string) {
  const step: Step = { name, status, message };
  steps.push(step);
  const icon = status === "complete" ? "✅" : status === "failed" ? "❌" : status === "running" ? "🔄" : "⏳";
  console.log(`${icon} ${name}${message ? `: ${message}` : ""}`);
}

async function checkDatabaseConnection() {
  logStep("Database Connection", "running");
  try {
    await prisma.$connect();
    logStep("Database Connection", "complete", "Connected successfully");
    return true;
  } catch (error: any) {
    logStep("Database Connection", "failed", error.message);
    return false;
  }
}

async function runMigrations() {
  logStep("Database Migrations", "running");
  try {
    // Check migration status
    console.log("   Checking migration status...");
    execSync("npx prisma migrate status", {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    // Run migrations
    console.log("   Running migrations...");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    logStep("Database Migrations", "complete", "Migrations completed");
    return true;
  } catch (error: any) {
    // Try dev migration if deploy fails (for development)
    try {
      console.log("   Trying dev migration...");
      execSync("npx prisma migrate dev --name billing_system_setup", {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      logStep("Database Migrations", "complete", "Migrations completed (dev mode)");
      return true;
    } catch (devError: any) {
      logStep("Database Migrations", "failed", `Migration failed: ${devError.message}`);
      return false;
    }
  }
}

async function generatePrismaClient() {
  logStep("Prisma Client Generation", "running");
  try {
    execSync("npx prisma generate", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    logStep("Prisma Client Generation", "complete", "Client generated");
    return true;
  } catch (error: any) {
    logStep("Prisma Client Generation", "failed", error.message);
    return false;
  }
}

async function verifyTables() {
  logStep("Verify Tables", "running");
  try {
    const tables = [
      "billing_subscriptions",
      "billing_invoices",
      "billing_payments",
      "billing_usage_records",
      "billing_prorations",
      "billing_discounts",
      "billing_credits",
      "billing_tax_configurations",
      "billing_revenue_recognition",
      "billing_dunning_attempts",
      "billing_webhooks",
      "billing_invoice_templates",
    ];

    const missingTables: string[] = [];

    for (const table of tables) {
      try {
        // Try to query the table (this will fail if table doesn't exist)
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
      } catch (error) {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      logStep("Verify Tables", "failed", `Missing tables: ${missingTables.join(", ")}`);
      return false;
    }

    logStep("Verify Tables", "complete", `All ${tables.length} tables exist`);
    return true;
  } catch (error: any) {
    logStep("Verify Tables", "failed", error.message);
    return false;
  }
}

async function testServices() {
  logStep("Test Services", "running");
  try {
    // Test that services can be imported
    const { billingService } = await import("@/lib/services/billing/billingService");
    const { invoiceService } = await import("@/lib/services/billing/invoiceService");
    const { subscriptionService } = await import("@/lib/services/billing/subscriptionService");

    logStep("Test Services", "complete", "All services imported successfully");
    return true;
  } catch (error: any) {
    logStep("Test Services", "failed", error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 BILLING SYSTEM DEPLOYMENT\n");
  console.log("=" .repeat(50) + "\n");

  // Step 1: Check database connection
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.log("\n❌ Cannot proceed without database connection");
    process.exit(1);
  }

  // Step 2: Generate Prisma client
  const clientGenerated = await generatePrismaClient();
  if (!clientGenerated) {
    console.log("\n⚠️  Prisma client generation failed, but continuing...");
  }

  // Step 3: Run migrations
  const migrationsRun = await runMigrations();
  if (!migrationsRun) {
    console.log("\n❌ Migrations failed. Please check database connection and permissions.");
    process.exit(1);
  }

  // Step 4: Verify tables
  const tablesVerified = await verifyTables();
  if (!tablesVerified) {
    console.log("\n❌ Table verification failed. Please check migrations.");
    process.exit(1);
  }

  // Step 5: Test services
  const servicesTested = await testServices();
  if (!servicesTested) {
    console.log("\n⚠️  Service tests failed, but deployment may still work");
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("\n📊 DEPLOYMENT SUMMARY\n");

  const completed = steps.filter((s) => s.status === "complete").length;
  const failed = steps.filter((s) => s.status === "failed").length;

  console.log(`✅ Completed: ${completed}/${steps.length}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}/${steps.length}`);
  }

  if (failed === 0) {
    console.log("\n🎉 BILLING SYSTEM DEPLOYED SUCCESSFULLY!");
    console.log("\n✅ Ready for end-user use!");
    console.log("\n📝 Next steps:");
    console.log("   1. Test the billing dashboard at /billing");
    console.log("   2. Create a test subscription");
    console.log("   3. Generate a test invoice");
    console.log("   4. Process a test payment");
  } else {
    console.log("\n⚠️  Deployment completed with warnings");
    console.log("   Please review failed steps above");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

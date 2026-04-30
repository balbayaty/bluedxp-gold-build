/**
 * 🔄 BILLING SYSTEMS CONSOLIDATION SCRIPT
 * 
 * Migrates data from old billing_info to new comprehensive billing system
 * Ensures no data loss and maintains backward compatibility
 * 
 * BlueDXP Platform - Enterprise-Grade Billing
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MigrationStats {
  billingInfoRecords: number;
  subscriptionsCreated: number;
  errors: string[];
}

async function consolidateBillingSystems(): Promise<void> {
  console.log("🔄 Starting Billing Systems Consolidation...\n");

  const stats: MigrationStats = {
    billingInfoRecords: 0,
    subscriptionsCreated: 0,
    errors: [],
  };

  try {
    // Step 1: Get all billing_info records
    console.log("📊 Step 1: Fetching billing_info records...");
    const billingInfoRecords = await prisma.billing_info.findMany({
      include: {
        user: {
          select: {
            id: true,
            tenantId: true,
          },
        },
      },
    });

    stats.billingInfoRecords = billingInfoRecords.length;
    console.log(`   Found ${billingInfoRecords.length} billing_info records\n`);

    // Step 2: Migrate each record to billing_subscriptions
    console.log("🔄 Step 2: Migrating to billing_subscriptions...");
    for (const billingInfo of billingInfoRecords) {
      try {
        // Check if subscription already exists
        const existingSubscription = await prisma.billing_subscriptions.findFirst({
          where: {
            userId: billingInfo.userId,
            status: {
              not: "canceled",
            },
          },
        });

        if (existingSubscription) {
          console.log(`   ⏭️  Skipping ${billingInfo.userId} - subscription already exists`);
          continue;
        }

        // Map billing_info to billing_subscriptions
        const subscriptionData = {
          tenantId: billingInfo.tenantId,
          userId: billingInfo.userId,
          planId: billingInfo.plan || "FREE",
          planName: billingInfo.planDisplayName || "Free Plan",
          status: mapStatus(billingInfo.status),
          billingCycle: mapBillingCycle(billingInfo.billingCycle),
          currentPeriodStart: billingInfo.currentPeriodStart || new Date(),
          currentPeriodEnd: billingInfo.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          basePrice: billingInfo.nextInvoiceAmount || 0,
          totalPrice: billingInfo.nextInvoiceAmount || 0,
          currency: billingInfo.currency || "SAR",
          paymentMethodId: billingInfo.paymentMethodId,
          autoRenew: billingInfo.autoRenew ?? true,
          cancelAtPeriodEnd: billingInfo.status === "CANCELLED",
          canceledAt: billingInfo.cancelledAt,
          cancelReason: billingInfo.cancelReason,
          metadata: billingInfo.metadata || {},
        };

        // Create subscription
        const subscription = await prisma.billing_subscriptions.create({
          data: subscriptionData,
        });

        stats.subscriptionsCreated++;
        console.log(`   ✅ Migrated ${billingInfo.userId} → subscription ${subscription.id}`);

        // If there's a payment method, we could create a payment record
        // But for now, we'll just migrate the subscription
      } catch (error: any) {
        const errorMsg = `Failed to migrate ${billingInfo.userId}: ${error.message}`;
        stats.errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    // Step 3: Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION SUMMARY\n");
    console.log(`Total billing_info records: ${stats.billingInfoRecords}`);
    console.log(`Subscriptions created: ${stats.subscriptionsCreated}`);
    console.log(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log("\n⚠️  ERRORS:");
      stats.errors.forEach((error) => console.log(`   - ${error}`));
    }

    if (stats.subscriptionsCreated === stats.billingInfoRecords) {
      console.log("\n✅ Migration completed successfully!");
      console.log("\n📝 Next steps:");
      console.log("   1. Verify subscriptions in database");
      console.log("   2. Test API endpoints");
      console.log("   3. Update UI components");
      console.log("   4. Mark billing_info as deprecated");
    } else {
      console.log("\n⚠️  Migration completed with errors");
      console.log("   Please review errors above");
    }
  } catch (error: any) {
    console.error("\n❌ Fatal error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function mapStatus(oldStatus: string): string {
  const statusMap: Record<string, string> = {
    ACTIVE: "active",
    PAST_DUE: "past_due",
    CANCELLED: "canceled",
    SUSPENDED: "suspended",
  };
  return statusMap[oldStatus] || "active";
}

function mapBillingCycle(oldCycle: string): string {
  const cycleMap: Record<string, string> = {
    MONTHLY: "monthly",
    ANNUAL: "annual",
    QUARTERLY: "quarterly",
  };
  return cycleMap[oldCycle] || "monthly";
}

// Run migration
consolidateBillingSystems()
  .then(() => {
    console.log("\n✅ Consolidation script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Consolidation script failed:", error);
    process.exit(1);
  });

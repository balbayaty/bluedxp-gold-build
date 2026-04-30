/**
 * 🧪 E2E TESTING FOR EMPLOYEE ONBOARDING & COMPANY BILLING
 * 
 * Tests the complete employee onboarding flow:
 * 1. Admin creates invitation
 * 2. Admin approves invitation
 * 3. Employee accepts invitation
 * 4. Employee linked to company subscription
 * 5. Billing integration
 * 
 * BlueDXP Platform - E2E Testing
 */

import { prisma } from "../lib/services/database/prismaClient";
import { employeeInvitationService } from "../lib/services/billing/employeeInvitationService";
import { subscriptionService } from "../lib/services/billing/subscriptionService";

const TEST_TENANT_ID = "test-tenant-onboarding";
const TEST_ADMIN_ID = "test-admin-onboarding";
const TEST_EMPLOYEE_EMAIL = "employee-test@example.com";

async function cleanup() {
  try {
    await prisma.employee_approvals.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.employee_invitations.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.billing_subscriptions.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.user.deleteMany({ where: { tenantId: TEST_TENANT_ID } });
    await prisma.tenant.deleteMany({ where: { id: TEST_TENANT_ID } });
    console.log("✅ Cleanup completed");
  } catch (error) {
    console.error("⚠️ Cleanup error (non-critical):", error);
  }
}

async function createTestData() {
  try {
    // Create tenant
    let tenant = await prisma.tenant.findUnique({ where: { id: TEST_TENANT_ID } });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          id: TEST_TENANT_ID,
          name: "E2E Test Company",
          slug: "e2e-test-company",
          status: "ACTIVE",
        },
      });
      console.log("  ✅ Test tenant created");
    }

    // Create admin user
    let admin = await prisma.user.findUnique({ where: { id: TEST_ADMIN_ID } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          id: TEST_ADMIN_ID,
          email: "admin-test@example.com",
          name: "Test Admin",
          passwordHash: "test-hash",
          tenantId: TEST_TENANT_ID,
          role: "admin",
          status: "ACTIVE",
        },
      });
      console.log("  ✅ Test admin created");
    }

    return { tenant, admin };
  } catch (error) {
    console.error("  ❌ Failed to create test data:", error);
    throw error;
  }
}

async function testCompanySubscriptionCreation() {
  console.log("\n🏢 Testing Company Subscription Creation...");
  try {
    const subscription = await subscriptionService.createCompanySubscription({
      tenantId: TEST_TENANT_ID,
      planId: "professional",
      billingCycle: "monthly",
      assignedUserIds: [TEST_ADMIN_ID],
    });

    console.log(`  ✅ Company subscription created: ${subscription.id}`);
    return subscription;
  } catch (error) {
    console.error("  ❌ Company subscription creation failed:", error);
    throw error;
  }
}

async function testEmployeeInvitation() {
  console.log("\n👤 Testing Employee Invitation...");
  try {
    // Use unique email to avoid conflicts
    const uniqueEmail = `employee-invite-${Date.now()}@example.com`;
    const invitation = await employeeInvitationService.createInvitation({
      tenantId: TEST_TENANT_ID,
      invitedBy: TEST_ADMIN_ID,
      email: uniqueEmail,
      name: "Test Employee",
      role: "user",
      department: "Sales",
      jobTitle: "Manager",
    });

    console.log(`  ✅ Invitation created: ${invitation.id} (status: ${invitation.status})`);
    return invitation;
  } catch (error) {
    console.error("  ❌ Employee invitation failed:", error);
    throw error;
  }
}

async function testAdminApproval(invitationId: string, companySubscriptionId: string) {
  console.log("\n✅ Testing Admin Approval...");
  try {
    const invitation = await employeeInvitationService.approveInvitation({
      invitationId,
      approverId: TEST_ADMIN_ID,
      companySubscriptionId,
    });

    console.log(`  ✅ Invitation approved: ${invitation.id}`);
    return invitation;
  } catch (error) {
    console.error("  ❌ Admin approval failed:", error);
    throw error;
  }
}

async function testEmployeeAcceptance(invitationToken: string) {
  console.log("\n🎉 Testing Employee Acceptance...");
  try {
    const result = await employeeInvitationService.acceptInvitation(invitationToken, {
      name: "Test Employee",
      passwordHash: "hashed-password",
      phone: "+1234567890",
      department: "Sales",
      jobTitle: "Manager",
    });

    console.log(`  ✅ Employee account created: ${result.userId}`);
    console.log(`  ✅ Invitation accepted: ${result.invitation.id}`);

    // Verify user was added to company subscription
    const subscription = await prisma.billing_subscriptions.findFirst({
      where: {
        tenantId: TEST_TENANT_ID,
        isCompanyWide: true,
      },
    });

    if (subscription) {
      const assignedUserIds = ((subscription.assignedUserIds as any) || []) as string[];
      if (assignedUserIds.includes(result.userId)) {
        console.log("  ✅ Employee linked to company subscription");
      } else {
        throw new Error("Employee not linked to company subscription");
      }
    }

    return result;
  } catch (error) {
    console.error("  ❌ Employee acceptance failed:", error);
    throw error;
  }
}

async function testCompleteWorkflow() {
  console.log("\n🔄 Testing Complete Workflow...");
  try {
    // 1. Create company subscription
    const subscription = await testCompanySubscriptionCreation();

    // 2. Create invitation (with unique email to avoid conflicts)
    const uniqueEmail = `employee-${Date.now()}@example.com`;
    const invitation = await employeeInvitationService.createInvitation({
      tenantId: TEST_TENANT_ID,
      invitedBy: TEST_ADMIN_ID,
      email: uniqueEmail,
      name: "Test Employee",
      role: "user",
      department: "Sales",
      jobTitle: "Manager",
      companySubscriptionId: subscription.id,
    });
    console.log(`  ✅ Invitation created: ${invitation.id}`);

    // 3. Check if approval is needed (invitation might be auto-approved if approval disabled)
    let approved = invitation;
    if (invitation.status === "pending") {
      // Approve invitation
      approved = await testAdminApproval(invitation.id, subscription.id);
    } else {
      console.log("  ℹ️ Invitation auto-approved (approval disabled in settings)");
    }

    // 4. Employee accepts
    const accepted = await testEmployeeAcceptance(invitation.invitationToken);

    console.log("  ✅ Complete workflow verified");
    return { subscription, invitation, approved, accepted };
  } catch (error) {
    console.error("  ❌ Complete workflow failed:", error);
    throw error;
  }
}

async function runE2ETests() {
  console.log("🧪 EMPLOYEE ONBOARDING E2E TESTS");
  console.log("=".repeat(50));

  const results: { test: string; passed: boolean }[] = [];

  // Cleanup
  await cleanup();

  // Create test data
  console.log("\n📊 Setting Up Test Data...");
  await createTestData();

  // Test 1: Company Subscription
  try {
    await testCompanySubscriptionCreation();
    results.push({ test: "Company Subscription Creation", passed: true });
  } catch (error) {
    results.push({ test: "Company Subscription Creation", passed: false });
  }

  // Test 2: Employee Invitation
  try {
    await testEmployeeInvitation();
    results.push({ test: "Employee Invitation", passed: true });
  } catch (error) {
    results.push({ test: "Employee Invitation", passed: false });
  }

  // Test 3: Complete Workflow
  try {
    await testCompleteWorkflow();
    results.push({ test: "Complete Workflow", passed: true });
  } catch (error) {
    results.push({ test: "Complete Workflow", passed: false });
  }

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

/**
 * TEST ENDPOINT - Direct test of simple-create functionality
 * This bypasses all middleware to test the core functionality
 */

import { NextRequest, NextResponse } from "next/server";
import { proposalDatabaseService } from "@/lib/services/proposals/proposalDatabaseService";

export async function POST(request: NextRequest) {
  console.log("[TEST] ===== TESTING SIMPLE CREATE =====");

  try {
    const body = await request.json();
    console.log("[TEST] Request body:", body);

    const { title, customerName } = body;

    if (!title || !customerName) {
      return NextResponse.json(
        { success: false, error: "Title and customer name required" },
        { status: 400 },
      );
    }

    // Test database connection
    console.log("[TEST] Testing database connection...");
    try {
      await proposalDatabaseService.getProposal("test-id-that-does-not-exist");
      console.log("[TEST] ✅ Database connection works");
    } catch (error: any) {
      if (error.code === "P2002" || error.message?.includes("not found")) {
        console.log(
          "[TEST] ✅ Database connection works (expected error for non-existent ID)",
        );
      } else {
        console.error("[TEST] ❌ Database connection failed:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Database connection failed",
            details: error?.message,
          },
          { status: 500 },
        );
      }
    }

    // Create test proposal
    const proposalId = `test-prop-${Date.now()}`;
    const proposalNumber = `TEST-${Date.now()}`;

    console.log("[TEST] Creating test proposal...");
    const dbProposal = await proposalDatabaseService.createProposal({
      id: proposalId,
      tenantId: "default",
      proposalNumber,
      title,
      customerName,
      description: "Test proposal",
      proposalType: "CUSTOM",
      status: "DRAFT",
      sections: [
        {
          id: "test-section",
          type: "TEXT",
          title: "Test Section",
          content: "Test content",
          order: 1,
          visible: true,
        },
      ],
      pricing: {},
      createdBy: "test-user",
    });

    console.log("[TEST] ✅ Proposal created:", dbProposal.id);

    // Clean up - delete test proposal
    try {
      await proposalDatabaseService.deleteProposal(proposalId);
      console.log("[TEST] ✅ Test proposal cleaned up");
    } catch (error) {
      console.warn("[TEST] ⚠️ Could not clean up test proposal:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Test passed! Database connection and proposal creation work.",
      proposalId: dbProposal.id,
    });
  } catch (error: any) {
    console.error("[TEST] ❌ Test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Test failed",
        stack:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 },
    );
  }
}

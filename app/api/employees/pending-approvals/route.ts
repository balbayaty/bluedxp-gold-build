/**
 * 📋 PENDING APPROVALS API
 * 
 * Get pending employee approvals for admin
 * 
 * BlueDXP Platform - Enterprise Employee Onboarding
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { employeeInvitationService } from "@/lib/services/billing/employeeInvitationService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = ["admin", "super_admin", "tenant_admin"].includes(session.user.role || "");
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can view pending approvals" },
        { status: 403 }
      );
    }

    // Get pending approvals
    const approvals = await employeeInvitationService.getPendingApprovals(
      session.user.id,
      session.user.tenantId
    );

    return NextResponse.json({
      success: true,
      data: approvals,
      count: approvals.length,
    });
  } catch (error: any) {
    console.error("[Pending Approvals] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pending approvals" },
      { status: 500 }
    );
  }
}

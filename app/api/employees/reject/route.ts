/**
 * ❌ EMPLOYEE REJECTION API
 * 
 * Reject employee invitation
 * Admin rejects pending employee request
 * 
 * BlueDXP Platform - Enterprise Employee Onboarding
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { employeeInvitationService } from "@/lib/services/billing/employeeInvitationService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invitationId, reason } = body;

    if (!invitationId) {
      return NextResponse.json(
        { error: "Invitation ID is required" },
        { status: 400 }
      );
    }

    // Check if user is admin
    const isAdmin = ["admin", "super_admin", "tenant_admin"].includes(session.user.role || "");
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can reject invitations" },
        { status: 403 }
      );
    }

    // Reject invitation
    const invitation = await employeeInvitationService.rejectInvitation(
      invitationId,
      session.user.id,
      reason
    );

    return NextResponse.json({
      success: true,
      data: invitation,
      message: "Invitation rejected",
    });
  } catch (error: any) {
    console.error("[Employee Rejection] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject invitation" },
      { status: 500 }
    );
  }
}

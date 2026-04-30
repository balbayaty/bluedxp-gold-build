/**
 * 🔗 INVITATION DETAILS API
 * 
 * Get invitation details by token
 * Used when employee clicks invitation link
 * 
 * BlueDXP Platform - Enterprise Employee Onboarding
 */

import { NextRequest, NextResponse } from "next/server";
import { employeeInvitationService } from "@/lib/services/billing/employeeInvitationService";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    // Get invitation
    const invitation = await employeeInvitationService.getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation token" },
        { status: 404 }
      );
    }

    // Don't expose sensitive data
    const { invitationToken, ...safeInvitation } = invitation;

    return NextResponse.json({
      success: true,
      data: safeInvitation,
    });
  } catch (error: any) {
    console.error("[Invitation Details] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}

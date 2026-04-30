/**
 * ✅ EMPLOYEE ACCEPTANCE API
 * 
 * Employee accepts invitation and completes signup
 * Links employee to company subscription
 * 
 * BlueDXP Platform - Enterprise Employee Onboarding
 */

import { NextRequest, NextResponse } from "next/server";
import { employeeInvitationService } from "@/lib/services/billing/employeeInvitationService";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationToken, name, password, phone, department, jobTitle } = body;

    if (!invitationToken || !name || !password) {
      return NextResponse.json(
        { error: "Invitation token, name, and password are required" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Accept invitation
    const result = await employeeInvitationService.acceptInvitation(invitationToken, {
      name,
      passwordHash,
      phone,
      department,
      jobTitle,
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: result.userId,
        invitation: result.invitation,
      },
      message: "Account created successfully. You can now sign in.",
    });
  } catch (error: any) {
    console.error("[Employee Acceptance] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

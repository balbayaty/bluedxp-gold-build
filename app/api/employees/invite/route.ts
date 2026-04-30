/**
 * 👥 EMPLOYEE INVITATION API
 * 
 * Create employee invitation
 * Admin sends invitation to employee
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
    const { email, name, role, department, jobTitle, companySubscriptionId } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user is admin
    const isAdmin = ["admin", "super_admin", "tenant_admin"].includes(session.user.role || "");
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can invite employees" },
        { status: 403 }
      );
    }

    // Create invitation
    const invitation = await employeeInvitationService.createInvitation({
      tenantId: session.user.tenantId || "default-tenant",
      invitedBy: session.user.id,
      email,
      name,
      role: role || "user",
      department,
      jobTitle,
      companySubscriptionId,
    });

    return NextResponse.json({
      success: true,
      data: invitation,
      message: `Invitation sent to ${email}`,
    });
  } catch (error: any) {
    console.error("[Employee Invitation] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invitation" },
      { status: 500 }
    );
  }
}

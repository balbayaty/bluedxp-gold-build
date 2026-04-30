/**
 * 📋 PENDING ACCESS REQUESTS API
 * 
 * Get pending requests for approvers
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { accessRequestService } from "@/lib/services/auth/accessRequestService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user can approve (managers and admins)
    const canApprove = [
      "super_admin",
      "platform_admin",
      "tenant_admin",
      "manager",
    ].includes(session.user.role as string);

    if (!canApprove) {
      return NextResponse.json(
        { error: "Forbidden - You cannot approve requests" },
        { status: 403 }
      );
    }

    const requests = await accessRequestService.getPendingRequests(session.user.id);

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("[Access Request] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending requests" },
      { status: 500 }
    );
  }
}

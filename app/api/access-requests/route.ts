/**
 * 📋 ACCESS REQUESTS API
 * 
 * Create and list access requests
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { accessRequestService } from "@/lib/services/auth/accessRequestService";

// POST - Create new access request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, moduleId, featureId, actions, apiKeyScopes, justification, urgency } = body;

    if (!type || !justification) {
      return NextResponse.json(
        { error: "Type and justification are required" },
        { status: 400 }
      );
    }

    const accessRequest = await accessRequestService.createRequest(
      session.user.id,
      session.user.name || "Unknown",
      session.user.email,
      type,
      { moduleId, featureId, actions, apiKeyScopes },
      justification,
      urgency || "medium"
    );

    return NextResponse.json({
      success: true,
      data: accessRequest,
    });
  } catch (error) {
    console.error("[Access Request] Error:", error);
    return NextResponse.json(
      { error: "Failed to create access request" },
      { status: 500 }
    );
  }
}

// GET - List user's own requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const requests = await accessRequestService.getUserRequests(session.user.id);

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("[Access Request] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch access requests" },
      { status: 500 }
    );
  }
}

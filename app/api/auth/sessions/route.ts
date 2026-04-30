/**
 * 🔒 SESSIONS API
 * 
 * Manage user sessions
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sessionService } from "@/lib/services/auth/sessionService";

// GET - List all active sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Use session user or fallback for demo
    const userId = session?.user?.id || "demo-user";

    const sessions = await sessionService.getUserSessions(userId);

    return NextResponse.json({
      success: true,
      data: sessions.map((s) => ({
        ...s,
        token: undefined, // Never expose token
      })),
    });
  } catch (error) {
    console.error("[Sessions] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// DELETE - Revoke session(s)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Use session user or fallback for demo
    const userId = session?.user?.id || "demo-user";

    const body = await request.json();
    const { sessionId, revokeAll } = body;

    if (revokeAll) {
      // Revoke all other sessions
      const count = await sessionService.revokeAllOtherSessions(
        userId,
        "current" // Pass current session ID
      );

      return NextResponse.json({
        success: true,
        message: `Revoked ${count} session(s)`,
        revokedCount: count,
      });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    await sessionService.revokeSession(sessionId, userId);

    return NextResponse.json({
      success: true,
      message: "Session revoked",
    });
  } catch (error) {
    console.error("[Sessions] Error:", error);
    return NextResponse.json(
      { error: "Failed to revoke session" },
      { status: 500 }
    );
  }
}

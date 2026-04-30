/**
 * Logout API Endpoint
 * POST /api/auth/logout
 *
 * Revokes session and clears authentication cookies
 */

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth/authService";
import { verifyToken } from "@/lib/services/auth/jwtService";
import { extractTokenFromHeader } from "@/lib/services/auth/jwtService";

export async function POST(request: NextRequest) {
  try {
    // Get session ID from token or request body
    const authHeader = request.headers.get("authorization");
    const token =
      extractTokenFromHeader(authHeader) ||
      request.cookies.get("auth-token")?.value;
    const { sessionId, revokeAll } = await request.json().catch(() => ({}));

    if (!token && !sessionId) {
      // Clear cookies anyway
      const response = NextResponse.json({
        success: true,
        message: "Logged out",
      });
      response.cookies.delete("auth-token");
      response.cookies.delete("refresh-token");
      return response;
    }

    let actualSessionId = sessionId;
    let userId: string | undefined;

    // If token provided, verify and get session
    if (token) {
      try {
        const payload = await verifyToken(token);
        userId = payload.userId as string;

        // Find session by token hash
        const { prisma } = await import("@/lib/services/database/prismaClient");
        const { hashToken } = await import("@/lib/services/auth/jwtService");
        const tokenHash = hashToken(token);

        const session = await prisma.session.findFirst({
          where: { tokenHash, isActive: true },
        });

        if (session) {
          actualSessionId = session.id;
        }
      } catch (error) {
        // Token invalid, but still clear cookies
      }
    }

    // Revoke session(s)
    if (actualSessionId && userId) {
      if (revokeAll) {
        await authService.revokeAllSessions(userId, actualSessionId);
      } else {
        await authService.revokeSession(actualSessionId, userId, "User logout");
      }
    }

    // Clear cookies
    const response = NextResponse.json({
      success: true,
      message: revokeAll ? "All sessions revoked" : "Logged out successfully",
    });

    response.cookies.delete("auth-token");
    response.cookies.delete("refresh-token");
    response.cookies.delete("session");

    return response;
  } catch (error) {
    console.error("Logout API error:", error);

    // Clear cookies even on error
    const response = NextResponse.json({
      success: true,
      message: "Logged out",
    });
    response.cookies.delete("auth-token");
    response.cookies.delete("refresh-token");
    response.cookies.delete("session");

    return response;
  }
}

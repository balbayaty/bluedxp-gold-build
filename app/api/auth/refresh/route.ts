/**
 * Refresh Token API Endpoint
 * POST /api/auth/refresh
 *
 * Refreshes access token using refresh token
 */

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth/authService";

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or body
    const refreshToken =
      request.cookies.get("refresh-token")?.value ||
      (await request.json()).refreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "Refresh token required" },
        { status: 401 },
      );
    }

    // Refresh token
    const result = await authService.refreshAccessToken(refreshToken);

    if (!result.success) {
      // Clear invalid refresh token
      const errorResponse = NextResponse.json(
        { success: false, error: result.error },
        { status: 401 },
      );
      errorResponse.cookies.delete("auth-token");
      errorResponse.cookies.delete("refresh-token");
      return errorResponse;
    }

    // Set new access token cookie
    const response = NextResponse.json({
      success: true,
      accessToken: result.accessToken,
    });

    response.cookies.set("auth-token", result.accessToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });

    // Update refresh token if new one provided
    if (result.refreshToken) {
      response.cookies.set("refresh-token", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error("Refresh token API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to refresh token" },
      { status: 500 },
    );
  }
}

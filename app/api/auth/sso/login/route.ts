/**
 * 🔐 SSO LOGIN API
 * 
 * Initiate SSO authentication flow
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { NextRequest, NextResponse } from "next/server";
import { ssoService } from "@/lib/services/auth/ssoService";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("provider");

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUrl = `${baseUrl}/api/auth/sso/callback?provider=${providerId}`;

    const { redirectUrl: ssoUrl, state } = await ssoService.initiateLogin(
      providerId,
      redirectUrl
    );

    // Store state in cookie for verification
    const response = NextResponse.json({
      success: true,
      redirectUrl: ssoUrl,
    });

    response.cookies.set("sso_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
    });

    return response;
  } catch (error: any) {
    console.error("[SSO Login] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate SSO" },
      { status: 500 }
    );
  }
}

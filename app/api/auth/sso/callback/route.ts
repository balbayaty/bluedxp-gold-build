/**
 * 🔐 SSO CALLBACK API
 * 
 * Handle SSO authentication callbacks
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
        { error: "Provider not specified" },
        { status: 400 }
      );
    }

    // Get form data (SAML sends POST form)
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const { user, session } = await ssoService.handleCallback(providerId, params);

    // Redirect to app with session token
    const redirectUrl = new URL("/dashboard", request.url);
    
    // In production, create actual session and set cookies
    // For now, redirect with success message
    redirectUrl.searchParams.set("sso_success", "true");

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[SSO Callback] Error:", error);
    
    const errorUrl = new URL("/login", request.url);
    errorUrl.searchParams.set("error", "sso_failed");
    
    return NextResponse.redirect(errorUrl);
  }
}

// Handle GET for OIDC code flow
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      const errorUrl = new URL("/login", request.url);
      errorUrl.searchParams.set("error", error);
      return NextResponse.redirect(errorUrl);
    }

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // In production, validate state and exchange code
    // For now, redirect to dashboard
    const redirectUrl = new URL("/dashboard", request.url);
    redirectUrl.searchParams.set("sso_success", "true");

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[SSO Callback] Error:", error);
    
    const errorUrl = new URL("/login", request.url);
    errorUrl.searchParams.set("error", "sso_failed");
    
    return NextResponse.redirect(errorUrl);
  }
}

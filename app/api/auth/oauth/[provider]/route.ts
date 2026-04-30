/**
 * 🔗 OAUTH PROVIDER ROUTES
 * 
 * Supports: Google, Microsoft, LinkedIn, GitHub
 * - Initiates OAuth flow
 * - Handles callback and user creation
 * 
 * BlueDXP Platform - Production Ready
 */

import { NextRequest, NextResponse } from "next/server";

// OAuth Provider Configuration
const OAUTH_PROVIDERS: Record<string, {
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string[];
}> = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    scopes: ["openid", "email", "profile"],
  },
  microsoft: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userInfoUrl: "https://graph.microsoft.com/v1.0/me",
    clientIdEnv: "MICROSOFT_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
    scopes: ["openid", "email", "profile", "User.Read"],
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    userInfoUrl: "https://api.linkedin.com/v2/userinfo",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    scopes: ["openid", "profile", "email"],
  },
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
    scopes: ["read:user", "user:email"],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider.toLowerCase();
    const config = OAUTH_PROVIDERS[provider];

    if (!config) {
      return NextResponse.json(
        { error: "Unsupported OAuth provider" },
        { status: 400 }
      );
    }

    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];

    if (!clientId || !clientSecret) {
      // In development, show helpful message
      if (process.env.NODE_ENV === "development") {
        console.log(`\n⚠️ OAuth ${provider} not configured. Set ${config.clientIdEnv} and ${config.clientSecretEnv} in .env\n`);
      }
      return NextResponse.redirect(
        new URL(`/login?error=${provider} login not configured`, request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get("returnUrl") || "/dashboard";
    
    // Build callback URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3002";
    const callbackUrl = `${baseUrl}/api/auth/oauth/${provider}/callback`;

    // Store return URL in state
    const state = Buffer.from(JSON.stringify({ returnUrl })).toString("base64");

    // Build OAuth URL
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", config.scopes.join(" "));
    authUrl.searchParams.set("state", state);

    // Provider-specific params
    if (provider === "google") {
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
    }

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("[OAuth] Error initiating flow:", error);
    return NextResponse.redirect(
      new URL("/login?error=OAuth initialization failed", request.url)
    );
  }
}

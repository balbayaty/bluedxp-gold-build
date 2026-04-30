/**
 * 🔗 OAUTH CALLBACK HANDLER
 * 
 * Handles OAuth provider callbacks:
 * - Exchanges code for tokens
 * - Fetches user info
 * - Creates/updates user
 * - Creates session
 * 
 * BlueDXP Platform - Production Ready
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import crypto from "crypto";

const OAUTH_PROVIDERS: Record<string, {
  tokenUrl: string;
  userInfoUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
}> = {
  google: {
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  microsoft: {
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userInfoUrl: "https://graph.microsoft.com/v1.0/me",
    clientIdEnv: "MICROSOFT_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
  },
  linkedin: {
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    userInfoUrl: "https://api.linkedin.com/v2/userinfo",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
  },
  github: {
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
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
      return NextResponse.redirect(
        new URL("/login?error=Unknown OAuth provider", request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${error}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/login?error=No authorization code received", request.url)
      );
    }

    // Decode state
    let returnUrl = "/dashboard";
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, "base64").toString());
        returnUrl = stateData.returnUrl || "/dashboard";
      } catch (e) {
        // Ignore state parsing errors
      }
    }

    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3002";
    const callbackUrl = `${baseUrl}/api/auth/oauth/${provider}/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return NextResponse.redirect(
        new URL("/login?error=Failed to authenticate", request.url)
      );
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // Fetch user info
    const userInfoResponse = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        new URL("/login?error=Failed to get user info", request.url)
      );
    }

    const userInfo = await userInfoResponse.json();

    // Normalize user data across providers
    let email: string;
    let name: string;
    let avatar: string | null = null;

    switch (provider) {
      case "google":
        email = userInfo.email;
        name = userInfo.name;
        avatar = userInfo.picture;
        break;
      case "microsoft":
        email = userInfo.mail || userInfo.userPrincipalName;
        name = userInfo.displayName;
        break;
      case "linkedin":
        email = userInfo.email;
        name = userInfo.name;
        avatar = userInfo.picture;
        break;
      case "github":
        email = userInfo.email;
        name = userInfo.name || userInfo.login;
        avatar = userInfo.avatar_url;
        // GitHub may not return email, need to fetch it separately
        if (!email) {
          const emailsResponse = await fetch("https://api.github.com/user/emails", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          });
          if (emailsResponse.ok) {
            const emails = await emailsResponse.json();
            const primaryEmail = emails.find((e: any) => e.primary);
            email = primaryEmail?.email || emails[0]?.email;
          }
        }
        break;
      default:
        email = userInfo.email;
        name = userInfo.name;
    }

    if (!email) {
      return NextResponse.redirect(
        new URL("/login?error=No email received from provider", request.url)
      );
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    const defaultTenantId = process.env.BOOTSTRAP_TENANT_ID || "default-tenant";

    if (!user) {
      // Create new user from OAuth
      user = await prisma.user.create({
        data: {
          id: `user_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
          tenantId: defaultTenantId,
          email: email.toLowerCase(),
          name,
          passwordHash: "", // OAuth users don't have passwords
          role: "USER",
          status: "ACTIVE",
          emailVerified: true, // OAuth emails are verified
          emailVerifiedAt: new Date(),
          avatar: avatar || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      // Update existing user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          loginCount: { increment: 1 },
          avatar: avatar || user.avatar,
        },
      });
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.sessions.create({
      data: {
        id: `session_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId: user.id,
        tenantId: user.tenantId,
        token: sessionToken,
        tokenHash: crypto.createHash("sha256").update(sessionToken).digest("hex"),
        expiresAt: sessionExpires,
        isActive: true,
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId: user.id,
        tenantId: user.tenantId,
        eventType: "OAUTH_LOGIN",
        eventCategory: "AUTHENTICATION",
        action: "LOGIN",
        resource: "session",
        description: `OAuth login via ${provider}`,
        metadata: { provider },
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
        status: "SUCCESS",
      },
    });

    // Redirect with session cookie
    const response = NextResponse.redirect(new URL(returnUrl, request.url));
    
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionExpires,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[OAuth Callback] Error:", error);
    return NextResponse.redirect(
      new URL("/login?error=Authentication failed", request.url)
    );
  }
}

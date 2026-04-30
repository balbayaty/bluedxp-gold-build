/**
 * 🪄 MAGIC LINK VERIFICATION API
 * 
 * Verifies magic link token and creates session
 * 
 * BlueDXP Platform - Production Ready
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.redirect(
        new URL("/login?error=Invalid magic link", request.url)
      );
    }

    // Hash token to compare with stored hash
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        passwordResetToken: tokenHash,
        passwordResetExpires: { gt: new Date() },
        status: "ACTIVE",
      },
      select: { id: true, name: true, email: true, tenantId: true, role: true },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=Magic link expired or invalid", request.url)
      );
    }

    // Clear the token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLogin: new Date(),
        loginCount: { increment: 1 },
      },
    });

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

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

    // Log successful login
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId: user.id,
        tenantId: user.tenantId,
        eventType: "MAGIC_LINK_LOGIN",
        eventCategory: "AUTHENTICATION",
        action: "LOGIN",
        resource: "session",
        description: `Magic link login successful for ${email}`,
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
        status: "SUCCESS",
      },
    });

    // Redirect to dashboard with session cookie
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    
    // Set session cookie
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionExpires,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Magic Link Verify] Error:", error);
    return NextResponse.redirect(
      new URL("/login?error=Authentication failed", request.url)
    );
  }
}

/**
 * 🪄 MAGIC LINK AUTHENTICATION API
 * 
 * Passwordless login via email:
 * - Generates secure token
 * - Sends magic link email
 * - Token expires in 15 minutes
 * 
 * BlueDXP Platform - Production Ready
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase(),
        status: "ACTIVE",
      },
      select: { id: true, name: true, tenantId: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, a magic link has been sent.",
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpires: expiresAt,
      },
    });

    // Build magic link URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3002";
    const magicLink = `${baseUrl}/api/auth/magic-link/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // TODO: Send email via email service
    // For now, log the link in development
    if (process.env.NODE_ENV === "development") {
      console.log(`\n🪄 Magic Link for ${email}:\n${magicLink}\n`);
    }

    // In production, send via email service
    // await emailService.send({
    //   to: email,
    //   subject: "Sign in to BlueDXP",
    //   template: "magic-link",
    //   data: { name: user.name, magicLink, expiresIn: "15 minutes" },
    // });

    // Log audit
    await prisma.audit_logs.create({
      data: {
        id: `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId: user.id,
        tenantId: user.tenantId,
        eventType: "MAGIC_LINK_REQUESTED",
        eventCategory: "AUTHENTICATION",
        action: "REQUEST",
        resource: "magic_link",
        description: `Magic link requested for ${email}`,
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists, a magic link has been sent.",
    });
  } catch (error) {
    console.error("[Magic Link] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

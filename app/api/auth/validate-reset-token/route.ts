/**
 * 🔍 VALIDATE RESET TOKEN API
 * 
 * Validates password reset tokens
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

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Hash token to compare
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Check if token exists and is not expired
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: { gt: new Date() },
        status: "ACTIVE",
      },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, error: "Token is invalid or expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email
    });
  } catch (error) {
    console.error("[Validate Reset Token] Error:", error);
    return NextResponse.json(
      { valid: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}

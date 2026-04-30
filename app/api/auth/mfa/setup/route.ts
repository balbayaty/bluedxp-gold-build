/**
 * 🔐 MFA SETUP API
 * 
 * Initialize MFA enrollment for a user
 * Returns secret and QR code URL
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { mfaService } from "@/lib/services/auth/mfaService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Use session user or fallback for demo
    const userId = session?.user?.id || "demo-user";
    const email = session?.user?.email || "demo@bluedxp.com";

    // Initialize MFA setup
    const setup = await mfaService.setupMFA(userId, email);

    // Return setup data (secret shown only once)
    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl: setup.qrCodeUrl,
        secretBase32: setup.secretBase32,
        backupCodes: setup.backupCodes,
        issuer: setup.issuer,
        accountName: setup.accountName,
      },
    });
  } catch (error) {
    console.error("[MFA Setup] Error:", error);
    return NextResponse.json(
      { error: "Failed to setup MFA" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Use session user or fallback for demo
    const userId = session?.user?.id || "demo-user";

    // Get MFA status
    const status = await mfaService.getMFAStatus(userId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("[MFA Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to get MFA status" },
      { status: 500 }
    );
  }
}

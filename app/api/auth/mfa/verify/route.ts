/**
 * 🔐 MFA VERIFY API
 * 
 * Verify MFA code and enable/validate
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { mfaService } from "@/lib/services/auth/mfaService";

// POST - Verify code during MFA enrollment (to enable MFA)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Use session user or fallback for demo
    const userId = session?.user?.id || "demo-user";

    const body = await request.json();
    const { token, secretBase32, action } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Enable MFA after initial verification
    if (action === "enable" && secretBase32) {
      const result = await mfaService.verifyAndEnableMFA(
        userId,
        token,
        secretBase32
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Invalid code" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "MFA enabled successfully",
      });
    }

    // Verify code during login
    if (action === "verify" && secretBase32) {
      const result = await mfaService.verifyMFA(userId, token, secretBase32);

      if (!result.valid) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        usedBackupCode: result.usedBackupCode,
        remainingBackupCodes: result.remainingBackupCodes,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[MFA Verify] Error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}

// DELETE - Disable MFA
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Use session user or fallback for demo
    const userId = session?.user?.id || "demo-user";

    const body = await request.json();
    const { token, secretBase32 } = body;

    // Require current MFA code to disable
    if (token && secretBase32) {
      const verifyResult = await mfaService.verifyMFA(
        userId,
        token,
        secretBase32
      );

      if (!verifyResult.valid) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 }
        );
      }
    }

    await mfaService.disableMFA(userId);

    return NextResponse.json({
      success: true,
      message: "MFA disabled",
    });
  } catch (error) {
    console.error("[MFA Disable] Error:", error);
    return NextResponse.json(
      { error: "Failed to disable MFA" },
      { status: 500 }
    );
  }
}

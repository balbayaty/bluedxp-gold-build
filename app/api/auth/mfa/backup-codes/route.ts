/**
 * 🔐 MFA BACKUP CODES API
 * 
 * Regenerate backup codes
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { mfaService } from "@/lib/services/auth/mfaService";

// POST - Regenerate backup codes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token, secretBase32 } = body;

    // Require MFA verification to regenerate codes
    if (token && secretBase32) {
      const verifyResult = await mfaService.verifyMFA(
        session.user.id,
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

    const newCodes = await mfaService.regenerateBackupCodes(session.user.id);

    return NextResponse.json({
      success: true,
      backupCodes: newCodes,
      message: "Backup codes regenerated. Store these safely!",
    });
  } catch (error) {
    console.error("[MFA Backup Codes] Error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate backup codes" },
      { status: 500 }
    );
  }
}

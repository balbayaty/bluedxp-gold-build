/**
 * 🔐 AVAILABLE SSO PROVIDERS API
 * 
 * Get enabled SSO providers for login page (public)
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { NextRequest, NextResponse } from "next/server";
import { ssoService } from "@/lib/services/auth/ssoService";

export async function GET(request: NextRequest) {
  try {
    const providers = await ssoService.getProviders();

    // Only return enabled providers with minimal info
    const publicProviders = providers
      .filter((p) => p.enabled)
      .map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
      }));

    return NextResponse.json({
      success: true,
      data: publicProviders,
    });
  } catch (error) {
    console.error("[SSO Available] Error:", error);
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}

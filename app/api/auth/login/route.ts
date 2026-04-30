/**
 * Login API Endpoint
 * POST /api/auth/login
 *
 * Comprehensive authentication with device tracking, security features, and audit logging
 */

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/services/auth/authService";
import {
  generateDeviceFingerprint,
  parseUserAgent,
  getDeviceName,
} from "@/lib/utils/deviceFingerprint";
import { validatePasswordStrength } from "@/lib/services/auth/passwordService";
import { rateLimiter } from "@/lib/services/auth/rateLimiter";
import { securityMonitor } from "@/lib/services/auth/securityMonitor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, deviceName, rememberMe } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Validate password strength (optional - can be removed if not needed)
    const passwordValidation = validatePasswordStrength(password);
    if (
      !passwordValidation.valid &&
      process.env.ENFORCE_PASSWORD_STRENGTH === "true"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Password does not meet security requirements",
          issues: passwordValidation.issues,
          suggestions: passwordValidation.suggestions,
        },
        { status: 400 },
      );
    }

    // Extract device information
    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const deviceId = generateDeviceFingerprint(userAgent);
    const deviceInfo = parseUserAgent(userAgent);

    // Get location (optional - can be enhanced with IP geolocation service)
    const location = {
      // In production, use a geolocation service like MaxMind, IPStack, etc.
    };

    // Rate limiting check
    const rateLimitResult = await rateLimiter.checkRateLimit(
      email.toLowerCase(),
      "/api/auth/login",
      undefined,
      ipAddress,
    );

    if (!rateLimitResult.allowed) {
      // Record security event for rate limit violation
      await securityMonitor.recordSecurityEvent({
        userId: undefined,
        tenantId: "system",
        eventType: "RATE_LIMIT_EXCEEDED",
        severity: "MEDIUM",
        riskScore: 40,
        description: `Rate limit exceeded for login attempt from ${ipAddress}`,
        metadata: {
          email: email.toLowerCase(),
          ipAddress,
          userAgent,
        },
        ipAddress,
        userAgent,
        location,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            rateLimitResult.reason ||
            "Too many login attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "900",
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toISOString(),
          },
        },
      );
    }

    // Attempt login
    const result = await authService.login(
      {
        email: email.toLowerCase().trim(),
        password,
        deviceId,
        deviceName: deviceName || getDeviceName(userAgent),
        rememberMe: rememberMe === true,
      },
      {
        deviceId,
        deviceName: deviceName || getDeviceName(userAgent),
        deviceType: deviceInfo.deviceType,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        ipAddress,
        userAgent,
        location,
      },
    );

    if (!result.success) {
      // Record failed login security event
      if (
        result.error?.includes("Invalid") ||
        result.error?.includes("password")
      ) {
        await securityMonitor.recordSecurityEvent({
          userId: undefined, // We don't know the user yet
          tenantId: "system",
          eventType: "MULTIPLE_FAILED_LOGINS",
          severity: "MEDIUM",
          riskScore: 30,
          description: `Failed login attempt for ${email}`,
          metadata: {
            email: email.toLowerCase(),
            ipAddress,
            userAgent,
          },
          ipAddress,
          userAgent,
          location,
        });

        // Increment threat count for rate limiting
        await rateLimiter.incrementThreatCount(`failed:${email.toLowerCase()}`);
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          requiresTwoFactor: result.requiresTwoFactor,
          lockedUntil: result.lockedUntil,
        },
        { status: result.lockedUntil ? 423 : 401 }, // 423 = Locked
      );
    }

    // Set HTTP-only cookies for security
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name,
        role: result.user?.role,
        // Don't send sensitive data
      },
      sessionId: result.sessionId,
    });

    // Set secure cookies
    const cookieOptions = {
      httpOnly: true,
      // Secure only if HTTPS or not localhost (allow http://localhost in production for testing)
      secure: process.env.NODE_ENV === "production" && !request.url.includes("localhost"),
      sameSite: "lax" as const,
      path: "/",
    };

    // Access token cookie (short-lived)
    response.cookies.set("auth-token", result.accessToken!, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    });

    // Refresh token cookie (long-lived)
    if (result.refreshToken) {
      response.cookies.set("refresh-token", result.refreshToken, {
        ...cookieOptions,
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 days or 1 day
      });
    }

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during login" },
      { status: 500 },
    );
  }
}

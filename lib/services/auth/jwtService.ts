/**
 * JWT Service
 * Comprehensive JWT token generation and verification
 * Uses jose library for industry-standard JWT handling
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { prisma } from "@/lib/services/database/prismaClient";
import crypto from "crypto";

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_ISSUER = process.env.JWT_ISSUER || "bluedxp-platform";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "bluedxp-client";
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

// Get secret key (convert string to Uint8Array for jose)
function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Generate access token (short-lived)
 */
export async function generateAccessToken(payload: {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  permissions?: string[];
  roles?: string[];
}): Promise<string> {
  const secret = getSecretKey();

  const jwt = await new SignJWT({
    userId: payload.userId,
    tenantId: payload.tenantId,
    email: payload.email,
    role: payload.role,
    permissions: payload.permissions || [],
    roles: payload.roles || [payload.role],
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setSubject(payload.userId)
    .sign(secret);

  return jwt;
}

/**
 * Generate refresh token (long-lived)
 */
export async function generateRefreshToken(payload: {
  userId: string;
  tenantId: string;
  sessionId: string;
}): Promise<string> {
  const secret = getSecretKey();

  const jwt = await new SignJWT({
    userId: payload.userId,
    tenantId: payload.tenantId,
    sessionId: payload.sessionId,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setSubject(payload.userId)
    .sign(secret);

  return jwt;
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string): Promise<
  JWTPayload & {
    userId?: string;
    tenantId?: string;
    email?: string;
    role?: string;
    permissions?: string[];
    roles?: string[];
    type?: "access" | "refresh";
    sessionId?: string;
  }
> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return payload as any;
  } catch (error) {
    throw new Error(
      `Token verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Hash token for storage (SHA-256)
 * We store hashed tokens in database for security
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Verify token against stored hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  const tokenHash = hashToken(token);
  return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(
  authHeader: string | null,
): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(expiry: string): Date {
  const now = new Date();
  const match = expiry.match(/(\d+)([mhd])/);
  if (!match) return new Date(now.getTime() + 15 * 60 * 1000); // Default 15 minutes

  const value = parseInt(match[1]);
  const unit = match[2];

  let milliseconds = 0;
  switch (unit) {
    case "m":
      milliseconds = value * 60 * 1000;
      break;
    case "h":
      milliseconds = value * 60 * 60 * 1000;
      break;
    case "d":
      milliseconds = value * 24 * 60 * 60 * 1000;
      break;
  }

  return new Date(now.getTime() + milliseconds);
}

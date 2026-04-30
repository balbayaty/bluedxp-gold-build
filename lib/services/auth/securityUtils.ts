/**
 * Security Utilities
 *
 * Comprehensive security utility functions for:
 * - Input sanitization and validation
 * - XSS prevention
 * - SQL injection prevention
 * - CSRF token generation
 * - Secure random generation
 * - Hash comparison (timing-safe)
 * - Token generation
 *
 * Industry Standard: OWASP Security Best Practices
 */

import crypto from "crypto";

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return String(input);
  }

  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate IP address format
 */
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// ============================================================================
// CRYPTOGRAPHIC UTILITIES
// ============================================================================

/**
 * Generate cryptographically secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate secure token (base64url encoded)
 */
export function generateSecureToken(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
    .substring(0, length);
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

/**
 * Hash string using SHA-256
 */
export function hashSHA256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Hash string using SHA-512
 */
export function hashSHA512(data: string): string {
  return crypto.createHash("sha512").update(data).digest("hex");
}

/**
 * HMAC-SHA256
 */
export function hmacSHA256(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return generateSecureToken(32);
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, expected: string): boolean {
  return timingSafeEqual(token, expected);
}

// ============================================================================
// PASSWORD UTILITIES
// ============================================================================

/**
 * Check if password is in common passwords list
 */
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    "password",
    "12345678",
    "123456789",
    "1234567890",
    "qwerty",
    "abc123",
    "password123",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "1234567",
    "sunshine",
    "princess",
    "dragon",
    "passw0rd",
    "master",
    "hello",
    "freedom",
    "whatever",
    "qazwsx",
    "trustno1",
    "654321",
    "jordan23",
    "harley",
    "password1",
    "welcome123",
  ];

  const lowerPassword = password.toLowerCase();
  return commonPasswords.some((common) => lowerPassword.includes(common));
}

/**
 * Calculate password entropy
 */
export function calculatePasswordEntropy(password: string): number {
  let charsetSize = 0;

  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32; // Common special chars

  const entropy = password.length * Math.log2(charsetSize);
  return Math.round(entropy * 100) / 100;
}

// ============================================================================
// RATE LIMITING UTILITIES
// ============================================================================

/**
 * Generate rate limit key
 */
export function generateRateLimitKey(
  identifier: string,
  endpoint: string,
  prefix: string = "ratelimit",
): string {
  return `${prefix}:${endpoint}:${identifier}`;
}

/**
 * Parse rate limit headers
 */
export function parseRateLimitHeaders(headers: Headers): {
  limit?: number;
  remaining?: number;
  reset?: Date;
} {
  return {
    limit: headers.get("X-RateLimit-Limit")
      ? parseInt(headers.get("X-RateLimit-Limit")!)
      : undefined,
    remaining: headers.get("X-RateLimit-Remaining")
      ? parseInt(headers.get("X-RateLimit-Remaining")!)
      : undefined,
    reset: headers.get("X-RateLimit-Reset")
      ? new Date(headers.get("X-RateLimit-Reset")!)
      : undefined,
  };
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Get security headers for responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  };
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate CUID format
 */
export function isValidCUID(cuid: string): boolean {
  // CUID format: c + 25 alphanumeric characters
  const cuidRegex = /^c[a-z0-9]{25}$/;
  return cuidRegex.test(cuid);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove common formatting
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  // Check if it's all digits and reasonable length
  return /^\d{10,15}$/.test(cleaned);
}

// ============================================================================
// ENCODING UTILITIES
// ============================================================================

/**
 * Base64 URL-safe encode
 */
export function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Base64 URL-safe decode
 */
export function base64UrlDecode(encoded: string): string {
  // Add padding if needed
  let padded = encoded;
  while (padded.length % 4) {
    padded += "=";
  }

  return Buffer.from(
    padded.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  ).toString("utf-8");
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

/**
 * Get current timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Check if timestamp is expired
 */
export function isTimestampExpired(
  timestamp: number,
  expirySeconds: number,
): boolean {
  const now = getCurrentTimestamp();
  return now > timestamp + expirySeconds;
}

/**
 * Format expiry time
 */
export function formatExpiryTime(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  return "Expired";
}

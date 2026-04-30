/**
 * Password Service
 * Secure password hashing and verification using bcryptjs
 * Industry-standard security practices
 * Using bcryptjs (pure JS) for cross-platform compatibility
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12; // Industry standard for bcrypt (balance between security and performance)

/**
 * Hash a password using bcrypt
 * Returns a hashed password that can be safely stored in database
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error("Password cannot be empty");
  }

  // Validate password strength (optional but recommended)
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * Returns true if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

/**
 * Check if password needs rehashing (if salt rounds changed)
 */
export async function needsRehash(hash: string): Promise<boolean> {
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds < SALT_ROUNDS;
  } catch {
    return true; // If we can't determine, assume it needs rehashing
  }
}

/**
 * Rehash a password (useful when upgrading security)
 */
export async function rehashPassword(
  password: string,
  oldHash: string,
): Promise<string | null> {
  const isValid = await verifyPassword(password, oldHash);
  if (!isValid) {
    return null;
  }

  return await hashPassword(password);
}

/**
 * Generate a secure random password
 * Useful for password reset tokens or temporary passwords
 */
export function generateSecureToken(length: number = 32): string {
  const crypto = require("crypto");
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Validate password strength
 * Returns validation result with suggestions
 */
export interface PasswordValidation {
  valid: boolean;
  score: number; // 0-4 (0=weak, 4=very strong)
  issues: string[];
  suggestions: string[];
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    issues.push("Password must be at least 8 characters long");
  } else if (password.length >= 12) {
    score += 1;
  } else {
    suggestions.push("Use at least 12 characters for better security");
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    issues.push("Password must contain at least one uppercase letter");
    suggestions.push("Add uppercase letters");
  } else {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    issues.push("Password must contain at least one lowercase letter");
    suggestions.push("Add lowercase letters");
  } else {
    score += 1;
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    issues.push("Password must contain at least one number");
    suggestions.push("Add numbers");
  } else {
    score += 1;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push("Password must contain at least one special character");
    suggestions.push("Add special characters (!@#$%^&*)");
  } else {
    score += 1;
  }

  // Common password check (basic)
  const commonPasswords = [
    "password",
    "12345678",
    "qwerty",
    "abc123",
    "password123",
  ];
  if (
    commonPasswords.some((common) => password.toLowerCase().includes(common))
  ) {
    issues.push("Password is too common");
    suggestions.push("Avoid common passwords");
    score = Math.max(0, score - 1);
  }

  return {
    valid: issues.length === 0 && score >= 3,
    score: Math.min(4, score),
    issues,
    suggestions,
  };
}

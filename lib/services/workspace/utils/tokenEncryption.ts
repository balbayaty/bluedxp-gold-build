/**
 * Token Encryption Service
 *
 * Secure encryption for OAuth tokens, passwords, and sensitive credentials
 * Uses AES-256-GCM encryption (same as file encryption service)
 *
 * Security Features:
 * - AES-256-GCM encryption (authenticated encryption)
 * - Environment-based encryption key
 * - IV (Initialization Vector) for each encryption
 * - Authentication tag for integrity verification
 * - Secure key derivation from environment variable
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment variable
 * Falls back to a default key if not set (for development)
 * In production, MUST set WORKSPACE_ENCRYPTION_KEY environment variable
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.WORKSPACE_ENCRYPTION_KEY;

  if (!envKey) {
    // Development fallback - WARNING: Not secure for production
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "WORKSPACE_ENCRYPTION_KEY environment variable must be set in production. " +
          "Generate a secure 32-byte key: openssl rand -base64 32",
      );
    }

    // Use a default key for development (not secure, but functional)
    console.warn(
      "⚠️  WARNING: Using default encryption key. " +
        "Set WORKSPACE_ENCRYPTION_KEY environment variable for production.",
    );
    return scryptSync(
      "default-workspace-key-change-in-production",
      "salt",
      KEY_LENGTH,
    );
  }

  // Derive key from environment variable
  // If env key is base64, decode it; otherwise use it directly
  try {
    const decoded = Buffer.from(envKey, "base64");
    if (decoded.length === KEY_LENGTH) {
      return decoded;
    }
  } catch {
    // Not base64, use scrypt to derive key
  }

  return scryptSync(envKey, "workspace-salt", KEY_LENGTH);
}

/**
 * Encrypt sensitive text (tokens, passwords, etc.)
 *
 * Format: IV (16 bytes) + AuthTag (16 bytes) + EncryptedData (variable)
 *
 * @param text - Plain text to encrypt
 * @returns Base64-encoded encrypted string
 */
export function encryptToken(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt text
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV + AuthTag + EncryptedData
    const combined = Buffer.concat([iv, authTag, encrypted]);

    // Return as base64 for database storage
    return combined.toString("base64");
  } catch (error) {
    console.error("[TokenEncryption] Encryption error:", error);
    throw new Error(
      `Failed to encrypt token. This may indicate a configuration issue with the encryption key or algorithm.`,
    );
  }
}

/**
 * Decrypt encrypted token
 *
 * @param encryptedText - Base64-encoded encrypted string
 * @returns Decrypted plain text
 */
export function decryptToken(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedText, "base64");

    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("[TokenEncryption] Decryption error:", error);
    throw new Error(
      "Failed to decrypt token - may be corrupted or encrypted with different key",
    );
  }
}

/**
 * Check if a string is encrypted (basic check)
 * Useful for migration scenarios
 */
export function isEncrypted(text: string): boolean {
  try {
    // Try to decode as base64
    const buffer = Buffer.from(text, "base64");
    // Encrypted strings should be at least IV + AuthTag length
    return buffer.length >= IV_LENGTH + AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Migrate old base64-encoded tokens to encrypted format
 * Use this when upgrading from base64 to proper encryption
 */
export function migrateToEncrypted(oldBase64: string): string {
  try {
    // If already encrypted, return as-is
    if (isEncrypted(oldBase64)) {
      // Try to decrypt to verify it's valid encrypted data
      try {
        decryptToken(oldBase64);
        return oldBase64; // Already encrypted
      } catch {
        // Not encrypted, continue migration
      }
    }

    // Decode old base64 and encrypt properly
    const plaintext = Buffer.from(oldBase64, "base64").toString("utf8");
    return encryptToken(plaintext);
  } catch (error) {
    console.error("[TokenEncryption] Migration error:", error);
    throw new Error("Failed to migrate token to encrypted format");
  }
}

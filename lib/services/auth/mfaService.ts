/**
 * 🔐 MFA SERVICE
 * 
 * Multi-Factor Authentication with:
 * - TOTP (Time-based One-Time Password)
 * - Backup codes
 * - QR code generation
 * - Verification
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { randomBytes, createHmac } from "crypto";

// ============================================================================
// TYPES
// ============================================================================

export interface MFASetup {
  secret: string;
  secretBase32: string;
  qrCodeUrl: string;
  backupCodes: string[];
  issuer: string;
  accountName: string;
}

export interface MFAVerificationResult {
  valid: boolean;
  usedBackupCode?: boolean;
  remainingBackupCodes?: number;
}

export interface MFAStatus {
  enabled: boolean;
  method: "totp" | "sms" | "email" | null;
  enrolledAt?: Date | string;
  lastUsedAt?: Date | string;
  backupCodesRemaining: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ISSUER = "BlueDXP";
const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

// Base32 alphabet for encoding
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a cryptographically secure random secret
 */
function generateSecret(length: number = 20): Buffer {
  return randomBytes(length);
}

/**
 * Encode bytes to Base32
 */
function toBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decode Base32 to bytes
 */
function fromBase32(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const index = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate HMAC-based OTP
 */
function generateHOTP(secret: Buffer, counter: number): string {
  // Convert counter to 8-byte buffer (big-endian)
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  // Generate HMAC-SHA1
  const hmac = createHmac("sha1", secret);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  // Generate OTP
  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

/**
 * Generate Time-based OTP
 */
function generateTOTP(secret: Buffer, time: number = Date.now()): string {
  const counter = Math.floor(time / 1000 / TOTP_PERIOD);
  return generateHOTP(secret, counter);
}

/**
 * Verify TOTP with time window tolerance
 */
function verifyTOTP(
  secret: Buffer,
  token: string,
  window: number = 1
): boolean {
  const now = Date.now();

  // Check current and adjacent time windows
  for (let i = -window; i <= window; i++) {
    const time = now + i * TOTP_PERIOD * 1000;
    if (generateTOTP(secret, time) === token) {
      return true;
    }
  }

  return false;
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count: number = BACKUP_CODE_COUNT): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(BACKUP_CODE_LENGTH / 2);
    const code = bytes.toString("hex").toUpperCase();
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

/**
 * Generate otpauth:// URL for QR code
 */
function generateOTPAuthURL(
  secret: string,
  accountName: string,
  issuer: string = ISSUER
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

// ============================================================================
// MFA SERVICE
// ============================================================================

export const mfaService = {
  /**
   * Initialize MFA setup for a user
   */
  async setupMFA(userId: string, email: string): Promise<MFASetup> {
    // Generate secret
    const secretBuffer = generateSecret();
    const secretBase32 = toBase32(secretBuffer);
    
    // Generate backup codes
    const backupCodes = generateBackupCodes();
    
    // Generate QR code URL
    const qrCodeUrl = generateOTPAuthURL(secretBase32, email);

    // Store encrypted secret and hashed backup codes in database
    // In production, encrypt the secret before storing
    // await prisma.userMFA.upsert({
    //   where: { userId },
    //   create: {
    //     userId,
    //     secret: encrypt(secretBase32),
    //     backupCodes: backupCodes.map(code => hash(code)),
    //     enabled: false,
    //   },
    //   update: {
    //     secret: encrypt(secretBase32),
    //     backupCodes: backupCodes.map(code => hash(code)),
    //     enabled: false,
    //   },
    // });

    console.log(`[MFA] Setup initiated for user ${userId}`);

    return {
      secret: secretBuffer.toString("hex"),
      secretBase32,
      qrCodeUrl,
      backupCodes,
      issuer: ISSUER,
      accountName: email,
    };
  },

  /**
   * Verify TOTP code and enable MFA
   */
  async verifyAndEnableMFA(
    userId: string,
    token: string,
    secretBase32: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const secretBuffer = fromBase32(secretBase32);
      const isValid = verifyTOTP(secretBuffer, token);

      if (!isValid) {
        return { success: false, error: "Invalid verification code" };
      }

      // Enable MFA in database
      // await prisma.userMFA.update({
      //   where: { userId },
      //   data: {
      //     enabled: true,
      //     enrolledAt: new Date(),
      //   },
      // });

      console.log(`[MFA] Enabled for user ${userId}`);

      return { success: true };
    } catch (error) {
      console.error("[MFA] Verification error:", error);
      return { success: false, error: "Verification failed" };
    }
  },

  /**
   * Verify MFA code during login
   */
  async verifyMFA(
    userId: string,
    token: string,
    secretBase32: string,
    backupCodes?: string[]
  ): Promise<MFAVerificationResult> {
    // First, try TOTP verification
    const secretBuffer = fromBase32(secretBase32);
    if (verifyTOTP(secretBuffer, token)) {
      // Update last used timestamp
      // await prisma.userMFA.update({
      //   where: { userId },
      //   data: { lastUsedAt: new Date() },
      // });

      return { valid: true, usedBackupCode: false };
    }

    // Try backup code verification
    if (backupCodes && backupCodes.length > 0) {
      const normalizedToken = token.toUpperCase().replace(/[^A-F0-9]/g, "");
      const formattedToken = normalizedToken.length === 8 
        ? `${normalizedToken.slice(0, 4)}-${normalizedToken.slice(4)}`
        : token.toUpperCase();

      const codeIndex = backupCodes.findIndex(
        (code) => code === formattedToken
      );

      if (codeIndex !== -1) {
        // Remove used backup code
        const remainingCodes = backupCodes.filter((_, i) => i !== codeIndex);

        // Update in database
        // await prisma.userMFA.update({
        //   where: { userId },
        //   data: {
        //     backupCodes: remainingCodes.map(code => hash(code)),
        //     lastUsedAt: new Date(),
        //   },
        // });

        console.log(`[MFA] Backup code used for user ${userId}`);

        return {
          valid: true,
          usedBackupCode: true,
          remainingBackupCodes: remainingCodes.length,
        };
      }
    }

    return { valid: false };
  },

  /**
   * Disable MFA for a user
   */
  async disableMFA(userId: string): Promise<{ success: boolean }> {
    // await prisma.userMFA.update({
    //   where: { userId },
    //   data: {
    //     enabled: false,
    //     secret: null,
    //     backupCodes: [],
    //   },
    // });

    console.log(`[MFA] Disabled for user ${userId}`);

    return { success: true };
  },

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const newCodes = generateBackupCodes();

    // Update in database
    // await prisma.userMFA.update({
    //   where: { userId },
    //   data: {
    //     backupCodes: newCodes.map(code => hash(code)),
    //   },
    // });

    console.log(`[MFA] Backup codes regenerated for user ${userId}`);

    return newCodes;
  },

  /**
   * Get MFA status for a user
   */
  async getMFAStatus(userId: string): Promise<MFAStatus> {
    // In production, fetch from database
    // const mfa = await prisma.userMFA.findUnique({ where: { userId } });

    // Mock response
    return {
      enabled: false,
      method: null,
      backupCodesRemaining: 0,
    };
  },

  /**
   * Generate current TOTP for testing (DO NOT USE IN PRODUCTION)
   */
  _generateTestTOTP(secretBase32: string): string {
    const secretBuffer = fromBase32(secretBase32);
    return generateTOTP(secretBuffer);
  },
};

export default mfaService;

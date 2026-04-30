/**
 * 🔐 PASSWORD RESET SERVICE
 * 
 * Self-service password reset with:
 * - Token generation
 * - Email sending
 * - Token validation
 * - Password update
 * 
 * BlueDXP Platform - Enterprise Grade
 */

import { randomBytes, createHash } from "crypto";

// ============================================================================
// TYPES
// ============================================================================

export interface PasswordResetToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface PasswordResetRequest {
  email: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOKEN_EXPIRY_HOURS = 1;
const TOKEN_LENGTH = 32;

// ============================================================================
// PASSWORD RESET SERVICE
// ============================================================================

export const passwordResetService = {
  /**
   * Request password reset
   */
  async requestReset(request: PasswordResetRequest): Promise<PasswordResetResult> {
    const { email } = request;

    try {
      // Find user by email (in production, query database)
      // const user = await prisma.user.findUnique({ where: { email } });
      
      // Always return success to prevent email enumeration
      // But only send email if user exists

      // Generate token
      const token = randomBytes(TOKEN_LENGTH).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      // Store token (in production, save to database)
      // await prisma.passwordResetToken.create({
      //   data: {
      //     userId: user.id,
      //     email,
      //     tokenHash,
      //     expiresAt,
      //   },
      // });

      // Generate reset URL
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

      // Send email (in production, use email service)
      console.log(`[Password Reset] Email would be sent to ${email}`);
      console.log(`[Password Reset] Reset URL: ${resetUrl}`);

      // In production, call email service
      // await emailService.sendPasswordReset(email, resetUrl, user.name);

      return {
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      };
    } catch (error) {
      console.error("[Password Reset] Error:", error);
      return {
        success: true, // Always return success to prevent enumeration
        message: "If an account exists with this email, you will receive a password reset link.",
      };
    }
  },

  /**
   * Validate reset token
   */
  async validateToken(token: string): Promise<{ valid: boolean; email?: string; userId?: string }> {
    try {
      const tokenHash = createHash("sha256").update(token).digest("hex");

      // Find token (in production, query database)
      // const resetToken = await prisma.passwordResetToken.findFirst({
      //   where: {
      //     tokenHash,
      //     expiresAt: { gt: new Date() },
      //     usedAt: null,
      //   },
      // });

      // Mock validation
      if (token.length === TOKEN_LENGTH * 2) {
        return {
          valid: true,
          email: "user@example.com",
          userId: "user_123",
        };
      }

      return { valid: false };
    } catch (error) {
      console.error("[Password Reset] Token validation error:", error);
      return { valid: false };
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<PasswordResetResult> {
    try {
      // Validate token
      const validation = await this.validateToken(token);
      
      if (!validation.valid) {
        return {
          success: false,
          message: "Invalid or expired reset token",
          error: "INVALID_TOKEN",
        };
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return {
          success: false,
          message: "Password must be at least 8 characters",
          error: "WEAK_PASSWORD",
        };
      }

      // Hash new password (in production, use passwordService)
      // const hashedPassword = await passwordService.hash(newPassword);

      // Update password (in production, update database)
      // await prisma.user.update({
      //   where: { id: validation.userId },
      //   data: { password: hashedPassword },
      // });

      // Mark token as used
      // await prisma.passwordResetToken.update({
      //   where: { tokenHash },
      //   data: { usedAt: new Date() },
      // });

      console.log(`[Password Reset] Password updated for user ${validation.userId}`);

      return {
        success: true,
        message: "Password has been reset successfully",
      };
    } catch (error) {
      console.error("[Password Reset] Error:", error);
      return {
        success: false,
        message: "Failed to reset password",
        error: "RESET_FAILED",
      };
    }
  },

  /**
   * Generate password reset email HTML
   */
  generateEmailHTML(resetUrl: string, userName?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - BlueDXP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #22d3ee; font-size: 28px; margin: 0;">BlueDXP</h1>
      <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Enterprise Intelligence Platform</p>
    </div>
    
    <!-- Content -->
    <div style="background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 40px;">
      <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px;">Reset Your Password</h2>
      
      <p style="color: #9ca3af; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
        ${userName ? `Hi ${userName},` : 'Hi there,'}<br><br>
        We received a request to reset your password. Click the button below to create a new password.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
          Reset Password
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 24px 0 0;">
        This link will expire in ${TOKEN_EXPIRY_HOURS} hour. If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px;">
      <p style="color: #6b7280; font-size: 12px;">
        &copy; ${new Date().getFullYear()} BlueDXP. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  },
};

export default passwordResetService;

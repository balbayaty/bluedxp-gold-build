/**
 * Email Verification Service
 *
 * Enterprise-grade email verification with:
 * - Secure verification token generation
 * - Time-limited verification links
 * - Single-use tokens
 * - Resend functionality with rate limiting
 * - Audit logging
 * - Integration with email delivery services
 *
 * Industry Standard: Email Verification Best Practices
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { generateSecureToken } from "./passwordService";
import crypto from "crypto";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EmailVerificationRequest {
  userId: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface EmailVerificationResult {
  success: boolean;
  token?: string;
  expiresAt?: Date;
  error?: string;
  message?: string;
}

export interface EmailVerificationValidation {
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
  expired?: boolean;
  alreadyVerified?: boolean;
}

// ============================================================================
// EMAIL VERIFICATION SERVICE
// ============================================================================

class EmailVerificationService {
  private readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_RESENDS_PER_HOUR = 3;
  private readonly MAX_RESENDS_PER_DAY = 5;
  private readonly TOKEN_LENGTH = 32;

  /**
   * Generate and send verification email
   */
  async requestVerification(
    request: EmailVerificationRequest,
  ): Promise<EmailVerificationResult> {
    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      // Check if already verified
      if (user.emailVerified) {
        return {
          success: false,
          error: "Email is already verified",
        };
      }

      // Check if email matches
      if (user.email.toLowerCase() !== request.email.toLowerCase()) {
        return {
          success: false,
          error: "Email does not match user account",
        };
      }

      // Rate limit verification requests
      const rateLimitResult = await this.checkRateLimit(user.id);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error:
            rateLimitResult.error ||
            "Too many verification requests. Please try again later.",
        };
      }

      // Generate verification token
      const verificationToken = generateSecureToken(this.TOKEN_LENGTH);
      const tokenHash = this.hashToken(verificationToken);
      const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY);

      // Store verification token (we'll use a custom field or separate table)
      // For now, we'll store in a JSON field or create a separate VerificationToken model
      // This is a simplified version - in production, use a separate table
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // Store token hash in a custom field (you may want to create a separate table)
          // For now, we'll use passwordResetToken field as temporary storage
          // In production, create a separate EmailVerificationToken model
          passwordResetToken: tokenHash, // Temporary - create proper model
          passwordResetExpires: expiresAt, // Temporary
        },
      });

      // Record audit log
      await this.recordAuditLog({
        userId: user.id,
        tenantId: user.tenantId,
        eventType: "EMAIL_VERIFICATION_REQUESTED",
        eventCategory: "AUTHENTICATION",
        action: "REQUEST_EMAIL_VERIFICATION",
        resource: "USER",
        resourceId: user.id,
        description: `Email verification requested for ${user.email}`,
        status: "SUCCESS",
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
      });

      // Send verification email
      await this.sendVerificationEmail(
        user.email,
        verificationToken,
        expiresAt,
        user.tenantId,
      );

      // For development, return token
      if (process.env.NODE_ENV === "development") {
        console.log(
          "📧 Email Verification Token (DEV ONLY):",
          verificationToken,
        );
        console.log(
          "🔗 Verification Link: /verify-email?token=" + verificationToken,
        );
      }

      return {
        success: true,
        token:
          process.env.NODE_ENV === "development"
            ? verificationToken
            : undefined,
        expiresAt,
        message: "Verification email sent. Please check your inbox.",
      };
    } catch (error) {
      console.error("Email verification request error:", error);
      return {
        success: false,
        error: "An error occurred. Please try again later.",
      };
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<EmailVerificationResult> {
    try {
      if (!token || token.length !== this.TOKEN_LENGTH * 2) {
        return {
          success: false,
          error: "Invalid verification token format",
        };
      }

      const tokenHash = this.hashToken(token);

      // Find user with this verification token
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: tokenHash, // Temporary - use proper model
          passwordResetExpires: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        return {
          success: false,
          error: "Invalid or expired verification token",
        };
      }

      // Check if already verified
      if (user.emailVerified) {
        return {
          success: false,
          error: "Email is already verified",
        };
      }

      // Mark email as verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          passwordResetToken: null, // Clear token
          passwordResetExpires: null,
        },
      });

      // Record audit log
      await this.recordAuditLog({
        userId: user.id,
        tenantId: user.tenantId,
        eventType: "EMAIL_VERIFIED",
        eventCategory: "AUTHENTICATION",
        action: "VERIFY_EMAIL",
        resource: "USER",
        resourceId: user.id,
        description: `Email verified for ${user.email}`,
        status: "SUCCESS",
        ipAddress,
        userAgent,
      });

      return {
        success: true,
        message: "Email verified successfully",
      };
    } catch (error) {
      console.error("Email verification error:", error);
      return {
        success: false,
        error: "An error occurred during verification",
      };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerification(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<EmailVerificationResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return await this.requestVerification({
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Check rate limit for verification requests
   */
  private async checkRateLimit(
    userId: string,
  ): Promise<{ allowed: boolean; error?: string }> {
    try {
      // Check requests in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentRequests = await prisma.auditLog.count({
        where: {
          userId,
          eventType: "EMAIL_VERIFICATION_REQUESTED",
          timestamp: {
            gte: oneHourAgo,
          },
        },
      });

      if (recentRequests >= this.MAX_RESENDS_PER_HOUR) {
        return {
          allowed: false,
          error: `Too many verification requests. Maximum ${this.MAX_RESENDS_PER_HOUR} requests per hour allowed.`,
        };
      }

      // Check requests in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dailyRequests = await prisma.auditLog.count({
        where: {
          userId,
          eventType: "EMAIL_VERIFICATION_REQUESTED",
          timestamp: {
            gte: oneDayAgo,
          },
        },
      });

      if (dailyRequests >= this.MAX_RESENDS_PER_DAY) {
        return {
          allowed: false,
          error: `Too many verification requests. Maximum ${this.MAX_RESENDS_PER_DAY} requests per day allowed.`,
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error("Rate limit check error:", error);
      return { allowed: true }; // Fail open
    }
  }

  /**
   * Hash verification token
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Send verification email
   */
  private async sendVerificationEmail(
    email: string,
    token: string,
    expiresAt: Date,
    tenantId: string,
  ): Promise<void> {
    const { emailService } = await import("@/lib/services/email/emailService");

    const verificationLink = `${process.env.APP_URL || "http://localhost:3000"}/verify-email?token=${token}`;

    const result = await emailService.sendEmail({
      id: `email-verification-${Date.now()}`,
      tenantId,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for signing up! Please verify your email address by clicking the link below:</p>
          <p><a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${verificationLink}</p>
          <p><strong>This link will expire on:</strong> ${expiresAt.toLocaleString()}</p>
          <p>If you did not create an account, please ignore this email.</p>
        </div>
      `,
      text: `Verify Your Email Address\n\nClick this link to verify: ${verificationLink}\n\nThis link expires on: ${expiresAt.toLocaleString()}\n\nIf you did not create an account, please ignore this email.`,
      tags: ["email-verification", "onboarding"],
    });

    if (!result.success) {
      console.error("Failed to send verification email:", result.error);
      throw new Error(`Failed to send verification email: ${result.error}`);
    }
  }

  /**
   * Record audit log
   */
  private async recordAuditLog(data: {
    userId: string;
    tenantId: string;
    eventType: string;
    eventCategory: string;
    action: string;
    resource: string;
    resourceId: string;
    description: string;
    status: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          tenantId: data.tenantId,
          eventType: data.eventType,
          eventCategory: data.eventCategory,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          description: data.description,
          status: data.status,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error("Failed to record audit log:", error);
    }
  }
}

// Export singleton instance
export const emailVerificationService = new EmailVerificationService();

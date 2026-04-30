/**
 * Authentication Service Module
 *
 * Comprehensive authentication system with:
 * - Password-based authentication
 * - JWT token management
 * - Session management
 * - Device tracking
 * - Security features
 * - Audit logging
 * - Rate limiting
 * - Password reset
 * - Email verification
 * - Security monitoring
 *
 * Exports all authentication-related services and utilities
 */

// Core Services
export { authService } from "./authService";
export { rateLimiter } from "./rateLimiter";
export { passwordResetService } from "./passwordResetService";
export { emailVerificationService } from "./emailVerificationService";
export { securityMonitor } from "./securityMonitor";

// Password Service
export {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateSecureToken as generatePasswordToken,
  type PasswordValidation,
} from "./passwordService";

// JWT Service
export {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashToken,
  extractTokenFromHeader,
  getTokenExpiration,
} from "./jwtService";

// Security Utilities
export * from "./securityUtils";

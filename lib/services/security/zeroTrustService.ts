/**
 * Zero-Trust Security Service
 *
 * Implements zero-trust security architecture:
 * - Continuous verification (not just at connection time)
 * - Least privilege access
 * - Network segmentation
 * - Service-to-service mTLS
 * - Identity verification
 */

import { NextRequest } from "next/server";

export interface VerificationResult {
  verified: boolean;
  reason?: string;
  confidence: number; // 0-1
  metadata?: Record<string, any>;
}

export interface ServiceIdentity {
  serviceId: string;
  certificate: string;
  publicKey: string;
  metadata: Record<string, any>;
}

export interface NetworkSegment {
  id: string;
  name: string;
  allowedServices: string[];
  allowedPorts: number[];
  rules: SegmentRule[];
}

export interface SegmentRule {
  source: string;
  target: string;
  allowed: boolean;
  conditions?: Record<string, any>;
}

class ZeroTrustService {
  private serviceIdentities: Map<string, ServiceIdentity> = new Map();
  private networkSegments: Map<string, NetworkSegment> = new Map();
  private verificationCache: Map<
    string,
    { result: VerificationResult; expiresAt: number }
  > = new Map();

  /**
   * Verify service identity using mTLS certificate
   */
  async verifyServiceIdentity(
    serviceId: string,
    certificate: string,
  ): Promise<VerificationResult> {
    // Check cache first
    const cacheKey = `${serviceId}:${certificate.substring(0, 50)}`;
    const cached = this.verificationCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    try {
      // Get registered service identity
      const registeredIdentity = this.serviceIdentities.get(serviceId);
      if (!registeredIdentity) {
        return {
          verified: false,
          reason: "Service not registered",
          confidence: 0,
        };
      }

      // Verify certificate matches registered identity
      const certificateHash = await this.hashCertificate(certificate);
      const registeredHash = await this.hashCertificate(
        registeredIdentity.certificate,
      );

      if (certificateHash !== registeredHash) {
        return {
          verified: false,
          reason: "Certificate mismatch",
          confidence: 0,
        };
      }

      // Verify certificate is not expired
      const certInfo = await this.parseCertificate(certificate);
      if (certInfo.expiresAt && certInfo.expiresAt < new Date()) {
        return {
          verified: false,
          reason: "Certificate expired",
          confidence: 0,
        };
      }

      const result: VerificationResult = {
        verified: true,
        confidence: 1.0,
        metadata: {
          serviceId,
          certificateIssuer: certInfo.issuer,
          certificateExpiresAt: certInfo.expiresAt,
        },
      };

      // Cache result for 5 minutes
      this.verificationCache.set(cacheKey, {
        result,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      return result;
    } catch (error: any) {
      return {
        verified: false,
        reason: error.message || "Verification failed",
        confidence: 0,
      };
    }
  }

  /**
   * Verify request with zero-trust principles
   * Continuous verification, not just at connection time
   */
  async verifyRequest(request: NextRequest): Promise<VerificationResult> {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";
    const authHeader = request.headers.get("authorization");

    // Check for cookie-based authentication (for client-side requests)
    const authTokenCookie = request.cookies.get("auth-token");
    const hasAuth = authHeader || authTokenCookie;

    // Extract tenant and user from request
    const tenantId =
      request.headers.get("x-tenant-id") ||
      this.extractTenantFromToken(authHeader) ||
      this.extractTenantFromToken(authTokenCookie?.value || null);
    const userId =
      request.headers.get("x-user-id") ||
      this.extractUserFromToken(authHeader) ||
      this.extractUserFromToken(authTokenCookie?.value || null);

    // Verify authentication - accept either Authorization header or cookie
    if (!hasAuth) {
      // In development OR localhost production, allow requests without auth at this layer
      // The actual auth check happens in apiAuthMiddleware
      const host = request.headers.get("host") || "";
      const isLocalhost = request.url.includes("localhost") || request.url.includes("127.0.0.1") || 
                          host.includes("localhost") || host.includes("127.0.0.1");
      if (process.env.NODE_ENV === "development" || isLocalhost) {
        return {
          verified: true,
          confidence: 0.5, // Lower confidence for dev/localhost mode
          metadata: {
            ip,
            tenantId: tenantId || "dev-tenant",
            userId: userId || "dev-user",
            userAgent,
            verifiedAt: new Date().toISOString(),
            devMode: process.env.NODE_ENV === "development",
            localhost: isLocalhost,
          },
        };
      }

      return {
        verified: false,
        reason: "No authentication provided",
        confidence: 0,
      };
    }

    // Verify IP address (if IP whitelist is configured)
    const ipAllowed = await this.verifyIPAddress(ip, tenantId);
    if (!ipAllowed.allowed) {
      return {
        verified: false,
        reason: ipAllowed.reason || "IP address not allowed",
        confidence: 0,
      };
    }

    // Verify user agent (detect suspicious patterns)
    const uaVerification = this.verifyUserAgent(userAgent);
    if (!uaVerification.verified) {
      return {
        verified: false,
        reason: uaVerification.reason || "Suspicious user agent",
        confidence: 0.3, // Lower confidence but not blocking
      };
    }

    // Verify request rate (DDoS protection)
    const rateCheck = await this.checkRequestRate(ip, userId);
    if (!rateCheck.allowed) {
      return {
        verified: false,
        reason: rateCheck.reason || "Rate limit exceeded",
        confidence: 0,
      };
    }

    // All checks passed
    return {
      verified: true,
      confidence: 0.95,
      metadata: {
        ip,
        tenantId,
        userId,
        userAgent,
        verifiedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Enforce least privilege access
   */
  async enforceLeastPrivilege(
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, any>,
  ): Promise<boolean> {
    // Get user permissions
    const permissions = await this.getUserPermissions(userId);

    // Check if user has exact permission needed
    const hasPermission = permissions.some(
      (p) => p.resource === resource && p.actions.includes(action),
    );

    if (!hasPermission) {
      return false;
    }

    // Check resource-level restrictions
    const resourceRestrictions = await this.getResourceRestrictions(
      resource,
      userId,
    );
    if (resourceRestrictions.blocked) {
      return false;
    }

    // Check context-based restrictions
    if (context) {
      const contextCheck = await this.checkContextRestrictions(
        userId,
        resource,
        action,
        context,
      );
      if (!contextCheck.allowed) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate network segment access
   */
  async validateNetworkSegment(
    source: string,
    target: string,
  ): Promise<boolean> {
    // Find segments for source and target
    const sourceSegment = this.findSegmentForService(source);
    const targetSegment = this.findSegmentForService(target);

    if (!sourceSegment || !targetSegment) {
      return false;
    }

    // Check if segments allow communication
    const rule = sourceSegment.rules.find(
      (r) => r.source === source && r.target === target,
    );

    if (!rule) {
      return false;
    }

    return rule.allowed;
  }

  /**
   * Register service identity
   */
  async registerServiceIdentity(identity: ServiceIdentity): Promise<void> {
    this.serviceIdentities.set(identity.serviceId, identity);
  }

  /**
   * Create network segment
   */
  async createNetworkSegment(segment: NetworkSegment): Promise<void> {
    this.networkSegments.set(segment.id, segment);
  }

  // Private helper methods

  private async hashCertificate(certificate: string): Promise<string> {
    // Use crypto to hash certificate
    const crypto = await import("crypto");
    return crypto.createHash("sha256").update(certificate).digest("hex");
  }

  private async parseCertificate(certificate: string): Promise<{
    issuer: string;
    subject: string;
    expiresAt?: Date;
  }> {
    // Simplified certificate parsing
    // In production, use proper certificate parsing library
    return {
      issuer: "self-signed",
      subject: "bluedxp-service",
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    return forwarded?.split(",")[0] || realIP || "unknown";
  }

  private extractTenantFromToken(token: string | null): string | null {
    if (!token) return null;
    try {
      // Handle Bearer token format
      const tokenValue = token.startsWith("Bearer ")
        ? token.substring(7)
        : token;
      // Extract from JWT token (simplified)
      const parts = tokenValue.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
      return payload.tenantId || payload.tid || payload.tenant || null;
    } catch {
      return null;
    }
  }

  private extractUserFromToken(token: string | null): string | null {
    if (!token) return null;
    try {
      // Handle Bearer token format
      const tokenValue = token.startsWith("Bearer ")
        ? token.substring(7)
        : token;
      const parts = tokenValue.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
      return payload.sub || payload.userId || payload.uid || null;
    } catch {
      return null;
    }
  }

  private async verifyIPAddress(
    ip: string,
    tenantId: string | null,
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Check IP whitelist for tenant
    // In production, check against database
    return { allowed: true };
  }

  private verifyUserAgent(userAgent: string): {
    verified: boolean;
    reason?: string;
  } {
    // Check for suspicious patterns
    const suspiciousPatterns = [/bot/i, /crawler/i, /scraper/i, /^$/];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        return {
          verified: false,
          reason: "Suspicious user agent pattern detected",
        };
      }
    }

    return { verified: true };
  }

  private async checkRequestRate(
    ip: string,
    userId: string | null,
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Rate limiting check
    // In production, use Redis for distributed rate limiting
    return { allowed: true };
  }

  private async getUserPermissions(userId: string): Promise<
    Array<{
      resource: string;
      actions: string[];
    }>
  > {
    // Get from database
    // Simplified for now
    return [];
  }

  private async getResourceRestrictions(
    resource: string,
    userId: string,
  ): Promise<{ blocked: boolean }> {
    // Check resource-level restrictions
    return { blocked: false };
  }

  private async checkContextRestrictions(
    userId: string,
    resource: string,
    action: string,
    context: Record<string, any>,
  ): Promise<{ allowed: boolean }> {
    // Check context-based restrictions
    return { allowed: true };
  }

  private findSegmentForService(serviceId: string): NetworkSegment | undefined {
    for (const segment of this.networkSegments.values()) {
      if (segment.allowedServices.includes(serviceId)) {
        return segment;
      }
    }
    return undefined;
  }
}

export const zeroTrustService = new ZeroTrustService();

/**
 * API Security Gateway
 *
 * Comprehensive API security with:
 * - WAF (Web Application Firewall) rules
 * - DDoS protection
 * - Rate limiting per endpoint
 * - API key rotation
 * - Request signing verification
 * - Security monitoring
 */

import { NextRequest, NextResponse } from "next/server";

export interface WAFResult {
  allowed: boolean;
  blocked: boolean;
  reason?: string;
  ruleId?: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface DDoSResult {
  allowed: boolean;
  blocked: boolean;
  reason?: string;
  attackType?: string;
  mitigation?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  reason?: string;
}

export interface RotatedKey {
  keyId: string;
  newKey: string;
  expiresAt: Date;
  rotatedAt: Date;
}

class APISecurityGateway {
  private wafRules: WAFRule[] = [];
  private ddosThresholds: Map<string, DDoSThreshold> = new Map();
  private rateLimitStore: Map<string, RateLimitState> = new Map();
  private apiKeys: Map<string, APIKeyInfo> = new Map();

  /**
   * Check WAF rules
   */
  async checkWAFRules(request: NextRequest): Promise<WAFResult> {
    const url = request.url;
    const method = request.method;
    const headers = Object.fromEntries(request.headers.entries());
    const body = await this.getRequestBody(request);

    // Check against WAF rules
    for (const rule of this.wafRules) {
      if (!rule.enabled) continue;

      const match = this.checkRule(rule, { url, method, headers, body });
      if (match.matched) {
        return {
          allowed: !rule.block,
          blocked: rule.block,
          reason: rule.description,
          ruleId: rule.id,
          severity: rule.severity,
        };
      }
    }

    return {
      allowed: true,
      blocked: false,
      severity: "low",
    };
  }

  /**
   * Check DDoS protection
   */
  async checkDDoSProtection(ip: string, endpoint: string): Promise<DDoSResult> {
    const key = `${ip}:${endpoint}`;
    const threshold =
      this.ddosThresholds.get(endpoint) || this.getDefaultThreshold();

    // Get current request count
    const state = this.rateLimitStore.get(key) || {
      count: 0,
      windowStart: Date.now(),
    };

    const now = Date.now();
    const windowMs = threshold.windowSeconds * 1000;

    // Reset window if expired
    if (now - state.windowStart > windowMs) {
      state.count = 0;
      state.windowStart = now;
    }

    // Increment count
    state.count++;

    // Check thresholds
    if (state.count > threshold.maxRequests) {
      // Potential DDoS attack
      const attackType = this.detectAttackType(state.count, threshold);

      this.rateLimitStore.set(key, state);

      return {
        allowed: false,
        blocked: true,
        reason: `DDoS protection: ${state.count} requests in ${threshold.windowSeconds}s`,
        attackType,
        mitigation: "Rate limiting applied",
      };
    }

    this.rateLimitStore.set(key, state);

    return {
      allowed: true,
      blocked: false,
    };
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(
    userId: string,
    apiKeyId: string | null,
    endpoint: string,
  ): Promise<RateLimitResult> {
    const identifier = apiKeyId || userId;
    const key = `${identifier}:${endpoint}`;

    // Get rate limit config
    const limit = apiKeyId
      ? this.apiKeys.get(apiKeyId)?.rateLimit
      : this.getDefaultRateLimit();

    if (!limit) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: Date.now() + 60000,
      };
    }

    // Get current state
    const state = this.rateLimitStore.get(key) || {
      count: 0,
      windowStart: Date.now(),
    };

    const now = Date.now();
    const windowMs = limit.windowSeconds * 1000;

    // Reset window if expired
    if (now - state.windowStart > windowMs) {
      state.count = 0;
      state.windowStart = now;
    }

    // Check limit
    if (state.count >= limit.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: state.windowStart + windowMs,
        reason: "Rate limit exceeded",
      };
    }

    // Increment count
    state.count++;
    this.rateLimitStore.set(key, state);

    return {
      allowed: true,
      remaining: limit.maxRequests - state.count,
      resetAt: state.windowStart + windowMs,
    };
  }

  /**
   * Rotate API key
   */
  async rotateAPIKey(
    keyId: string,
    rotationPolicy?: {
      keepOldKeyFor?: number; // seconds
      notifyUser?: boolean;
    },
  ): Promise<RotatedKey> {
    const oldKey = this.apiKeys.get(keyId);
    if (!oldKey) {
      throw new Error(`API key ${keyId} not found`);
    }

    // Generate new key
    const newKey = await this.generateAPIKey();
    const expiresAt = new Date(
      Date.now() + (oldKey.expiresIn || 90 * 24 * 60 * 60 * 1000),
    );

    // Create new key info
    const newKeyInfo: APIKeyInfo = {
      ...oldKey,
      key: newKey,
      rotatedAt: new Date(),
      expiresAt,
    };

    // Keep old key for grace period if specified
    if (rotationPolicy?.keepOldKeyFor) {
      oldKey.expiresAt = new Date(
        Date.now() + rotationPolicy.keepOldKeyFor * 1000,
      );
      oldKey.status = "DEPRECATED";
    } else {
      oldKey.status = "REVOKED";
    }

    // Update store
    this.apiKeys.set(keyId, newKeyInfo);

    // Notify user if requested
    if (rotationPolicy?.notifyUser) {
      await this.notifyKeyRotation(keyId, oldKey.userId);
    }

    return {
      keyId,
      newKey,
      expiresAt,
      rotatedAt: new Date(),
    };
  }

  /**
   * Verify request signature
   */
  async verifyRequestSignature(request: NextRequest): Promise<boolean> {
    const signature = request.headers.get("x-signature");
    const timestamp = request.headers.get("x-timestamp");
    const apiKeyId = request.headers.get("x-api-key-id");

    if (!signature || !timestamp || !apiKeyId) {
      return false;
    }

    // Check timestamp (prevent replay attacks)
    const requestTime = parseInt(timestamp);
    const now = Date.now();
    const timeDiff = Math.abs(now - requestTime);

    if (timeDiff > 5 * 60 * 1000) {
      // Request too old (more than 5 minutes)
      return false;
    }

    // Get API key
    const apiKey = this.apiKeys.get(apiKeyId);
    if (!apiKey || apiKey.status !== "ACTIVE") {
      return false;
    }

    // Verify signature
    const expectedSignature = await this.generateSignature(
      request,
      apiKey.secret,
      timestamp,
    );

    return signature === expectedSignature;
  }

  /**
   * Add WAF rule
   */
  addWAFRule(rule: WAFRule): void {
    this.wafRules.push(rule);
  }

  /**
   * Set DDoS threshold for endpoint
   */
  setDDoSThreshold(endpoint: string, threshold: DDoSThreshold): void {
    this.ddosThresholds.set(endpoint, threshold);
  }

  // Private helper methods

  private async getRequestBody(request: NextRequest): Promise<string> {
    try {
      const clone = request.clone();
      return await clone.text();
    } catch {
      return "";
    }
  }

  private checkRule(
    rule: WAFRule,
    request: {
      url: string;
      method: string;
      headers: Record<string, string>;
      body: string;
    },
  ): { matched: boolean } {
    // Check URL patterns
    if (rule.urlPattern && !new RegExp(rule.urlPattern).test(request.url)) {
      return { matched: false };
    }

    // Check method
    if (rule.methods && !rule.methods.includes(request.method)) {
      return { matched: false };
    }

    // Check header patterns
    if (rule.headerPatterns) {
      for (const [header, pattern] of Object.entries(rule.headerPatterns)) {
        const value = request.headers[header.toLowerCase()];
        if (!value || !new RegExp(pattern).test(value)) {
          return { matched: false };
        }
      }
    }

    // Check body patterns
    if (rule.bodyPatterns) {
      for (const pattern of rule.bodyPatterns) {
        if (!new RegExp(pattern).test(request.body)) {
          return { matched: false };
        }
      }
    }

    return { matched: true };
  }

  private detectAttackType(count: number, threshold: DDoSThreshold): string {
    if (count > threshold.maxRequests * 10) {
      return "volumetric";
    } else if (count > threshold.maxRequests * 5) {
      return "protocol";
    } else {
      return "application";
    }
  }

  private getDefaultThreshold(): DDoSThreshold {
    return {
      maxRequests: 100,
      windowSeconds: 60,
    };
  }

  private getDefaultRateLimit() {
    return {
      maxRequests: 1000,
      windowSeconds: 60,
    };
  }

  private async generateAPIKey(): Promise<string> {
    const crypto = await import("crypto");
    return `sk_live_${crypto.randomBytes(32).toString("hex")}`;
  }

  private async generateSignature(
    request: NextRequest,
    secret: string,
    timestamp: string,
  ): Promise<string> {
    const crypto = await import("crypto");
    const method = request.method;
    const path = new URL(request.url).pathname;
    const body = await this.getRequestBody(request);

    const message = `${method}${path}${timestamp}${body}`;
    return crypto.createHmac("sha256", secret).update(message).digest("hex");
  }

  private async notifyKeyRotation(
    keyId: string,
    userId: string,
  ): Promise<void> {
    // Send notification (email, webhook, etc.)
    console.log(`Notifying user ${userId} about API key ${keyId} rotation`);
  }
}

// Types

interface WAFRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  block: boolean;
  severity: "low" | "medium" | "high" | "critical";
  urlPattern?: string;
  methods?: string[];
  headerPatterns?: Record<string, string>;
  bodyPatterns?: string[];
}

interface DDoSThreshold {
  maxRequests: number;
  windowSeconds: number;
}

interface RateLimitState {
  count: number;
  windowStart: number;
}

interface APIKeyInfo {
  keyId: string;
  userId: string;
  key: string;
  secret: string;
  status: "ACTIVE" | "INACTIVE" | "REVOKED" | "DEPRECATED";
  rateLimit?: {
    maxRequests: number;
    windowSeconds: number;
  };
  expiresAt?: Date;
  expiresIn?: number;
  rotatedAt?: Date;
}

export const apiSecurityGateway = new APISecurityGateway();

// Initialize default WAF rules
apiSecurityGateway.addWAFRule({
  id: "sql-injection",
  name: "SQL Injection Protection",
  description: "Block SQL injection patterns",
  enabled: true,
  block: true,
  severity: "critical",
  bodyPatterns: [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /('.*OR.*'.*=.*')/i,
  ],
});

apiSecurityGateway.addWAFRule({
  id: "xss",
  name: "XSS Protection",
  description: "Block XSS patterns",
  enabled: true,
  block: true,
  severity: "high",
  bodyPatterns: [/<script[^>]*>.*?<\/script>/gi, /javascript:/i, /on\w+\s*=/i],
});

apiSecurityGateway.addWAFRule({
  id: "path-traversal",
  name: "Path Traversal Protection",
  description: "Block path traversal patterns",
  enabled: true,
  block: true,
  severity: "high",
  urlPattern: /\.\.\/|\.\.\\/,
});

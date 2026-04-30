/**
 * Truth Engine Security & Validation
 * Input validation, sanitization, and security checks
 */

import {
  TruthEvent,
  DecisionObject,
  ReviewContext,
} from "@/types/truth-engine";

/**
 * Validate Truth Event input
 */
export function validateTruthEvent(event: Partial<TruthEvent>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!event.eventType) {
    errors.push("eventType is required");
  }

  if (!event.tenantId) {
    errors.push("tenantId is required");
  }

  if (!event.happenedAt) {
    errors.push("happenedAt is required");
  }

  if (!event.actor) {
    errors.push("actor is required");
  } else {
    if (!event.actor.type) {
      errors.push("actor.type is required");
    }
  }

  if (event.confidenceScore !== undefined) {
    if (
      typeof event.confidenceScore !== "number" ||
      event.confidenceScore < 0 ||
      event.confidenceScore > 1
    ) {
      errors.push("confidenceScore must be a number between 0 and 1");
    }
  }

  if (event.evidenceLinks && !Array.isArray(event.evidenceLinks)) {
    errors.push("evidenceLinks must be an array");
  }

  // Validate entity refs
  if (event.entityRefs) {
    for (const [key, value] of Object.entries(event.entityRefs)) {
      if (value && typeof value !== "string") {
        errors.push(`entityRefs.${key} must be a string`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize Truth Event input
 */
export function sanitizeTruthEvent(
  event: Partial<TruthEvent>,
): Partial<TruthEvent> {
  const sanitized = { ...event };

  // Sanitize strings
  if (sanitized.confidenceReason) {
    sanitized.confidenceReason = sanitized.confidenceReason
      .trim()
      .substring(0, 1000);
  }

  // Sanitize metadata
  if (sanitized.metadata) {
    // Remove any potentially dangerous keys
    const dangerousKeys = ["__proto__", "constructor", "prototype"];
    dangerousKeys.forEach((key) => {
      delete (sanitized.metadata as any)[key];
    });
  }

  // Ensure evidence links is an array
  if (sanitized.evidenceLinks && !Array.isArray(sanitized.evidenceLinks)) {
    sanitized.evidenceLinks = [];
  }

  // Ensure tags is an array
  if (sanitized.tags && !Array.isArray(sanitized.tags)) {
    sanitized.tags = [];
  }

  return sanitized;
}

/**
 * Validate Decision Object
 */
export function validateDecisionObject(decision: Partial<DecisionObject>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!decision.type) {
    errors.push("decision.type is required");
  }

  if (!decision.id) {
    errors.push("decision.id is required");
  }

  if (!decision.data) {
    errors.push("decision.data is required");
  }

  // Validate data is an object
  if (decision.data && typeof decision.data !== "object") {
    errors.push("decision.data must be an object");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Review Context
 */
export function validateReviewContext(context: Partial<ReviewContext>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!context.tenantId) {
    errors.push("context.tenantId is required");
  }

  if (
    context.relatedTruthEvents &&
    !Array.isArray(context.relatedTruthEvents)
  ) {
    errors.push("relatedTruthEvents must be an array");
  }

  if (context.relatedEvidence && !Array.isArray(context.relatedEvidence)) {
    errors.push("relatedEvidence must be an array");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check for SQL injection patterns
 */
export function checkSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
    /(--|#|\/\*|\*\/|;)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"])/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function checkXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*=.*javascript:/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "");

  // Remove script tags
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Trim
  sanitized = sanitized.trim();

  return sanitized;
}

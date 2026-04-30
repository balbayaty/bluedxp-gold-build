/**
 * Vision Module Validation Utilities
 * Input validation and sanitization
 */

import { VisionValidationError } from "./errorHandling";

/**
 * Validate and sanitize context string
 */
export function validateContext(context?: string): string | undefined {
  if (!context) return undefined;

  if (typeof context !== "string") {
    throw new VisionValidationError("Context must be a string", "context");
  }

  // Sanitize: remove potential script tags and limit length
  const sanitized = context
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .substring(0, 5000); // Max 5000 characters

  return sanitized.trim() || undefined;
}

/**
 * Validate module name
 */
export function validateModule(module?: string): string | undefined {
  if (!module) return undefined;

  const validModules = ["wms", "qhse", "iso-ims", "tms", "msds", "general"];
  if (!validModules.includes(module.toLowerCase())) {
    throw new VisionValidationError(
      `Invalid module: ${module}. Valid: ${validModules.join(", ")}`,
      "module",
    );
  }

  return module.toLowerCase();
}

/**
 * Validate priority
 */
export function validatePriority(
  priority?: string,
): "low" | "medium" | "high" | "urgent" {
  if (!priority) return "medium";

  const validPriorities = ["low", "medium", "high", "urgent"];
  if (!validPriorities.includes(priority.toLowerCase())) {
    throw new VisionValidationError(
      `Invalid priority: ${priority}. Valid: ${validPriorities.join(", ")}`,
      "priority",
    );
  }

  return priority.toLowerCase() as "low" | "medium" | "high" | "urgent";
}

/**
 * Validate confidence score
 */
export function validateConfidence(confidence?: number): number | undefined {
  if (confidence === undefined || confidence === null) return undefined;

  if (typeof confidence !== "number" || isNaN(confidence)) {
    throw new VisionValidationError(
      "Confidence must be a number",
      "confidence",
    );
  }

  if (confidence < 0 || confidence > 100) {
    throw new VisionValidationError(
      "Confidence must be between 0 and 100",
      "confidence",
    );
  }

  return confidence;
}

/**
 * Validate task type
 */
export function validateTaskType(
  type: string,
):
  | "analysis"
  | "pattern_learning"
  | "feedback_processing"
  | "automated_decision"
  | "quality_improvement" {
  const validTypes = [
    "analysis",
    "pattern_learning",
    "feedback_processing",
    "automated_decision",
    "quality_improvement",
  ];

  if (!validTypes.includes(type)) {
    throw new VisionValidationError(
      `Invalid task type: ${type}. Valid: ${validTypes.join(", ")}`,
      "type",
    );
  }

  return type as any;
}

/**
 * Validate feedback type
 */
export function validateFeedbackType(
  type: string,
): "approval" | "correction" | "validation" | "escalation" {
  const validTypes = ["approval", "correction", "validation", "escalation"];

  if (!validTypes.includes(type)) {
    throw new VisionValidationError(
      `Invalid feedback type: ${type}. Valid: ${validTypes.join(", ")}`,
      "type",
    );
  }

  return type as any;
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .trim();
  }

  if (typeof input === "object" && input !== null) {
    const sanitized: any = Array.isArray(input) ? [] : {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

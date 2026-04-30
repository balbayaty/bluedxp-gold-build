/**
 * Emotional Intelligence Validation Schemas
 *
 * Zod schemas for validating all emotional intelligence API inputs
 *
 * @module emotional-intelligence
 */

import { z } from "zod";

// Entity Types
export const EntityTypeSchema = z.enum([
  "CUSTOMER",
  "VENDOR",
  "EMPLOYEE",
  "SUPPLIER",
  "CARRIER",
  "AUDITOR",
  "DRIVER",
  "CLIENT",
  "GOVERNMENT_AGENCY",
  "CUSTOMS_OFFICER",
]);

// Emotional States
export const EmotionalStateSchema = z.enum([
  "POSITIVE",
  "NEUTRAL",
  "NEGATIVE",
  "STRESSED",
  "FRUSTRATED",
  "SATISFIED",
  "ENGAGED",
  "DISENGAGED",
]);

// Sentiment Analysis Request
export const SentimentAnalysisRequestSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .max(50000, "Text must be less than 50,000 characters")
    .refine(
      (text) => {
        // Basic sanitization check - no script tags
        return !/<script/i.test(text);
      },
      { message: "Text contains invalid content" },
    ),
  entityId: z.string().min(1, "Entity ID is required").max(255),
  entityType: EntityTypeSchema,
  language: z.enum(["ar", "en", "auto"]).optional().default("auto"),
  includeCulturalContext: z.boolean().optional().default(true),
});

// Behavioral Prediction Request
export const BehavioralPredictionRequestSchema = z.object({
  entityId: z.string().min(1, "Entity ID is required").max(255),
  entityType: EntityTypeSchema,
  context: z.record(z.any()).optional(),
});

// Relationship Health Request
export const RelationshipHealthRequestSchema = z.object({
  entityId1: z.string().min(1, "Entity ID 1 is required").max(255),
  entityType1: EntityTypeSchema,
  entityId2: z.string().min(1, "Entity ID 2 is required").max(255),
  entityType2: EntityTypeSchema,
});

// Emotional Insights Request
export const EmotionalInsightsRequestSchema = z.object({
  entityId: z.string().min(1, "Entity ID is required").max(255),
  entityType: EntityTypeSchema,
  insightType: z
    .enum(["ROOT_CAUSE", "PREDICTIVE", "TREND", "ANOMALY", "RISK"])
    .optional(),
  timeRange: z
    .object({
      start: z.string().datetime().or(z.date()),
      end: z.string().datetime().or(z.date()),
    })
    .optional(),
});

// Intervention Recommendation Request
export const InterventionRecommendationRequestSchema = z.object({
  entityId: z.string().min(1, "Entity ID is required").max(255),
  entityType: EntityTypeSchema,
  currentEmotionalState: EmotionalStateSchema.optional(),
  context: z.record(z.any()).optional(),
});

// Track Emotional State Request
export const TrackEmotionalStateRequestSchema = z.object({
  entityId: z.string().min(1, "Entity ID is required").max(255),
  entityType: EntityTypeSchema,
  state: EmotionalStateSchema,
  sentiment: z.object({
    sentiment: z.enum(["positive", "negative", "neutral", "mixed"]),
    emotionalState: EmotionalStateSchema,
    confidence: z.number().min(0).max(1),
    intensity: z.number().min(0).max(1),
    indicators: z.array(z.string()).optional(),
    culturalContext: z.any().optional(),
    commitmentLevel: z
      .enum([
        "highly_committed",
        "committed",
        "neutral",
        "uncertain",
        "highly_uncertain",
      ])
      .optional(),
    timestamp: z.date(),
  }),
  context: z.string().max(1000).optional(),
});

// Utility function to sanitize text
export function sanitizeText(text: string): string {
  // Remove script tags
  let sanitized = text.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove dangerous HTML
  sanitized = sanitized.replace(/<[^>]+>/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

// Utility function to validate entity ID format
export function validateEntityId(entityId: string): boolean {
  // Allow alphanumeric, hyphens, underscores, and dots
  return /^[a-zA-Z0-9._-]+$/.test(entityId) && entityId.length <= 255;
}

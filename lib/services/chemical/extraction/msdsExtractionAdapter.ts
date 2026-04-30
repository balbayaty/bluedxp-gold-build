/**
 * MSDS Extraction Adapter (integration-first, swappable)
 *
 * Why: we want to swap extraction engines (rules-only, OpenAI, Anthropic, on-prem OCR/LLM, etc)
 * without changing MSDS domain/APIs.
 */

import type { ExtractedMSDSData } from "@/types/chemical";

export type MSDSExtractionOptions = {
  tenantId: string;
  language?: string;
  openaiKey?: string | null;
  anthropicKey?: string | null;
};

export type MSDSExtractionIssue = {
  code: string;
  message: string;
  field?: keyof ExtractedMSDSData | string;
  severity: "info" | "warning" | "error";
};

export type MSDSExtractionResult = {
  extractedData: ExtractedMSDSData;
  confidence: number; // 0-100
  issues: MSDSExtractionIssue[];
  parsed?: unknown;
};

export interface MSDSExtractionAdapter {
  id: string;
  name: string;
  extractFromText(
    text: string,
    options: MSDSExtractionOptions,
  ): Promise<MSDSExtractionResult>;
}
